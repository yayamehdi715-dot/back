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
            quality: 'auto:best',
            fetch_format: 'auto',
            transformation: [
              {
                width: 1200,
                crop: 'limit',
                quality: 'auto:best',
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

module.exports = router