// routes/productRoutes.js
const express = require('express')
const router = express.Router()
const Product = require('../models/Product')
const cloudinary = require('../config/cloudinary')
const { authenticateAdmin } = require('../middleware/auth')

// Extrait le public_id Cloudinary depuis une URL
// Ex: https://res.cloudinary.com/demo/image/upload/v123/lamode28/abc.jpg → lamode28/abc
function getPublicId(url) {
  try {
    const parts = url.split('/')
    const uploadIndex = parts.indexOf('upload')
    // Ignore la version (v123) si présente
    const startIndex = parts[uploadIndex + 1]?.startsWith('v')
      ? uploadIndex + 2
      : uploadIndex + 1
    const filePart = parts.slice(startIndex).join('/')
    // Retire l'extension
    return filePart.replace(/\.[^/.]+$/, '')
  } catch {
    return null
  }
}

// GET tous les produits (public)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query
    const filter = category ? { category } : {}
    const products = await Product.find(filter).sort({ createdAt: -1 })
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// GET un produit par ID (public)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' })
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// POST créer un produit (admin uniquement)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const product = new Product(req.body)
    const newProduct = await product.save()
    res.status(201).json(newProduct)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// PUT modifier un produit (admin uniquement)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' })
    res.json(product)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// DELETE supprimer un produit + ses images Cloudinary (admin uniquement)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' })

    // Supprimer les images Cloudinary
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map((url) => {
        const publicId = getPublicId(url)
        if (publicId) {
          return cloudinary.uploader.destroy(publicId)
        }
        return Promise.resolve()
      })
      await Promise.all(deletePromises)
    }

    await Product.findByIdAndDelete(req.params.id)
    res.json({ message: 'Produit et images supprimés' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router