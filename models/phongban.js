const mongoose = require('mongoose');

const phongbanSchema = new mongoose.Schema({
    TenPhongBan: { type: String, required: true },
    MoTa: { type: String },
    SoNhanVien: { type: Number, default: 0 }
});

module.exports = mongoose.model('PhongBan', phongbanSchema);