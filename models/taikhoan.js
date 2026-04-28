const mongoose = require('mongoose');

const taikhoanSchema = new mongoose.Schema({
    HoVaTen: { type: String, required: true },
    Email: { type: String, required: true },
    TenDangNhap: { type: String, unique: true, required: true },
    MatKhau: { type: String, required: true },
    QuyenHan: { type: String, default: 'user' },
    PhongBan: { type: mongoose.Schema.Types.ObjectId, ref: 'PhongBan' }
});

module.exports = mongoose.model('TaiKhoan', taikhoanSchema);