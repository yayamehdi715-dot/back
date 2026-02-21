const express = require('express')
const router  = express.Router()
const Supplement = require('../models/Supplement')
const { authenticateAdmin } = require('../middleware/auth')

const DEFAULT_SUPPLEMENTS = [
  { name: 'Petite couronne',    price: 100 },
  { name: 'Couronne royale',    price: 100 },
  { name: 'Papillon doré',      price: 100 },
  { name: "Papillon d'argent",  price: 100 },
  { name: 'Lettre',             price: 100 },
  { name: 'Prénom complet',     price: 100 },
  { name: 'Écriture sur ruban', price: 100 },
  { name: 'Lumière blanche',    price: 100 },
  { name: 'Lumière jaune',      price: 100 },
]

// Seed les suppléments par défaut s'ils n'existent pas
async function seedDefaults() {
  const count = await Supplement.countDocuments()
  if (count === 0) {
    await Supplement.insertMany(DEFAULT_SUPPLEMENTS)
  }
}
seedDefaults().catch(console.error)

// GET tous les suppléments (public)
router.get('/', async (req, res) => {
  try {
    const supplements = await Supplement.find().sort({ name: 1 })
    res.json(supplements)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST créer un supplément (admin)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, price } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Nom requis' })
    const sup = new Supplement({ name: name.trim(), price: Number(price) || 100 })
    await sup.save()
    res.status(201).json(sup)
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Ce supplément existe déjà' })
    res.status(400).json({ message: err.message })
  }
})

// PUT modifier un supplément (admin)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, price } = req.body
    const sup = await Supplement.findByIdAndUpdate(
      req.params.id,
      { name: name?.trim(), price: Number(price) },
      { new: true, runValidators: true }
    )
    if (!sup) return res.status(404).json({ message: 'Supplément introuvable' })
    res.json(sup)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// DELETE supprimer un supplément (admin)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const sup = await Supplement.findByIdAndDelete(req.params.id)
    if (!sup) return res.status(404).json({ message: 'Supplément introuvable' })
    res.json({ message: 'Supplément supprimé' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router