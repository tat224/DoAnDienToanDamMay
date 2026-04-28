const mongoose = require('mongoose');

const thongbaoSchema = new mongoose.Schema({
    TieuDe: { type: String, required: true },
    NoiDung: { type: String, required: true },
    NgayTao: { type: Date, default: Date.now } // Tự động lưu ngày giờ đăng
});

module.exports = mongoose.model('ThongBao', thongbaoSchema);