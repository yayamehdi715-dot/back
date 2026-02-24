const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: [
        'Bouquets Géants',
        'Bouquets de Mariage',
        'Bouquets Papillon',
        'Bouquets Anniversaire',
        'Bouquets Fiançailles',
        'Bouquet Classique',
        'Décoration',
        'Mini Bouquet',
        'Pipe Cleaner',
        'Soutenance',
        'Promotion',
      ],
    },
    price:  { type: Number, required: true, min: 0 },
    stock:  { type: Number, required: true, min: 0, default: 0 },
    purchaseCount: { type: Number, default: 0, min: 0 },
    images: [{ type: String }],
    supplements: [{ type: String, trim: true }],
    colors: [{ type: String, trim: true }],
  },
  { timestamps: true }
)

module.exports = mongoose.model('Product', productSchema)
