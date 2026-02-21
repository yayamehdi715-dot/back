const mongoose = require('mongoose')

const supplementSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true, unique: true },
  price: { type: Number, required: true, min: 0, default: 100 },
}, { timestamps: true })

module.exports = mongoose.model('Supplement', supplementSchema)