// routes/uploadRoutes.js
const express = require('express')
const router = express.Router()
const multer = require('multer')
const cloudinary = require('../config/cloudinary')
const { authenticateAdmin } = require('../middleware/auth')

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Seules les images sont autorisées'), false)
  },
})

router.post('/', authenticateAdmin, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Aucune image fournie' })
    }

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'lamode28',
            quality: 'auto:good',   // ✅ 'auto:good' = qualité imperceptible, ~30% moins de stockage
            fetch_format: 'auto',   // ✅ Livre WebP/AVIF automatiquement selon le navigateur
            transformation: [
              {
                width: 1000,        // ✅ 1000px suffit (vs 1200px), économise stockage et bande passante
                crop: 'limit',
                quality: 'auto:good',
              },
            ],
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result.secure_url)
          }
        )
        uploadStream.end(file.buffer)
      })
    })

    const imageUrls = await Promise.all(uploadPromises)
    res.json({ message: 'Images uploadées avec succès', urls: imageUrls })
  } catch (error) {
    console.error('❌ Upload error:', error)
    res.status(500).json({ message: error.message, detail: error.http_code || error.toString() })
  }
})



// ✅ DELETE /api/upload — Supprime une image Cloudinary orpheline (admin uniquement)
// Appelé quand l'admin retire une image du formulaire avant de sauvegarder
router.delete('/', authenticateAdmin, async (req, res) => {
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ message: 'URL manquante' })

    const parts = url.split('/')
    const uploadIndex = parts.indexOf('upload')
    const startIndex = parts[uploadIndex + 1]?.startsWith('v') ? uploadIndex + 2 : uploadIndex + 1
    const filePart = parts.slice(startIndex).join('/')
    const publicId = filePart.replace(/\.[^/.]+$/, '')

    await cloudinary.uploader.destroy(publicId)
    res.json({ message: 'Image supprimée' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
// ✅ DELETE /api/upload — Supprime une image Cloudinary orpheline (admin uniquement)
