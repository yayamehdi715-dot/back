// models/AdminCredentials.js
const mongoose = require('mongoose')

const adminCredentialsSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true }, // toujours stocké hashé avec bcrypt
}, { timestamps: true })

module.exports = mongoose.model('AdminCredentials', adminCredentialsSchema)
