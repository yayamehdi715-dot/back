// routes/authRoutes.js
const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const AdminCredentials = require('../models/AdminCredentials')
const { authenticateAdmin } = require('../middleware/auth')

// ── Fonction utilitaire : récupère ou crée les credentials depuis .env ──
async function getAdmin() {
  let admin = await AdminCredentials.findOne()
  if (!admin) {
    // Première fois : hash manuel du mot de passe .env avant création
    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || 'admin123',
      10
    )
    admin = await AdminCredentials.create({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: hashedPassword,
    })
  }
  return admin
}

// ── POST /api/auth/login ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: 'Username et mot de passe requis' })
    }

    const admin = await getAdmin()

    if (admin.username !== username) {
      return res.status(401).json({ message: 'Identifiants incorrects' })
    }

    const valid = await bcrypt.compare(password, admin.password)
    if (!valid) {
      return res.status(401).json({ message: 'Identifiants incorrects' })
    }

    const token = jwt.sign(
      { username: admin.username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      message: 'Connexion réussie',
      admin: { username: admin.username },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: err.message || 'Erreur serveur' })
  }
})

// ── GET /api/auth/verify ──────────────────────────────────────────────────
router.get('/verify', (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ valid: false, message: 'Token manquant' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role !== 'admin') {
      return res.status(403).json({ valid: false, message: 'Accès refusé' })
    }

    res.json({ valid: true, admin: decoded })
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Token invalide ou expiré' })
  }
})

// ── PUT /api/auth/credentials ─────────────────────────────────────────────
router.put('/credentials', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body

    if (!currentPassword) {
      return res.status(400).json({ message: 'Mot de passe actuel requis' })
    }

    const admin = await getAdmin()

    // Vérifier le mot de passe actuel
    const valid = await bcrypt.compare(currentPassword, admin.password)
    if (!valid) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' })
    }

    // Appliquer les changements
    if (newUsername && newUsername.trim() !== '') {
      admin.username = newUsername.trim()
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit faire au moins 6 caractères' })
      }
      admin.password = await bcrypt.hash(newPassword, 10)
    }

    // Sauvegarder sans déclencher le pre-save hook (on a déjà hashé)
    await AdminCredentials.findByIdAndUpdate(admin._id, {
      username: admin.username,
      password: admin.password,
    })

    // Générer un nouveau token
    const newToken = jwt.sign(
      { username: admin.username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      message: 'Identifiants mis à jour avec succès',
      token: newToken,
      admin: { username: admin.username },
    })
  } catch (err) {
    console.error('Credentials update error:', err)
    res.status(500).json({ message: err.message || 'Erreur serveur' })
  }
})

module.exports = router
