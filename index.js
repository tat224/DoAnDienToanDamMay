var express = require('express');
var app = express();
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs'); // Thư viện mã hóa mật khẩu
var session = require('express-session'); // Thư viện ghi nhớ đăng nhập
var ThongBao = require('./models/thongbao');

// Gọi Models
var TaiKhoan = require('./models/taikhoan');
var PhongBan = require('./models/phongban');

// 1. KẾT NỐI DATABASE
var uri = 'mongodb://DOANDTDM:t22042006@ac-n86ecck-shard-00-01.9pbsvp2.mongodb.net:27017/trangtin?ssl=true&authSource=admin';
mongoose.connect(uri)
  .then(() => console.log('Đã kết nối thành công tới MongoDB.'))
  .catch(err => console.log(err));

// 2. CẤU HÌNH HỆ THỐNG
app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cấu hình Session
app.use(session({
    secret: 'leminhstudio_secret_key',
    resave: false,
    saveUninitialized: true
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// ==========================================
// TRANG CHỦ & XÁC THỰC (Đăng nhập, Đăng ký)
// ==========================================

app.get('/', async (req, res) => {
    // Sắp xếp -1 để thông báo mới nhất hiện lên trên cùng
    const danhSachTB = await ThongBao.find().sort({ NgayTao: -1 });
    res.render('index', { title: 'THÔNG BÁOOO!!', danhSachTB });
});
app.get('/thongbao/them', (req, res) => {
    if (!req.session.user) return res.redirect('/dangnhap');
    res.render('them_thongbao', { title: 'Tạo thông báo mới' });
});
app.post('/thongbao/them', async (req, res) => {
    try {
        await ThongBao.create({
            TieuDe: req.body.TieuDe,
            NoiDung: req.body.NoiDung
        });
        res.redirect('/'); // Lưu xong thì quay về trang chủ để xem
    } catch (error) {
        res.send('Lỗi lưu thông báo!');
    }
});
// XỬ LÝ XÓA THÔNG BÁO
app.get('/thongbao/xoa/:id', async (req, res) => {
    if (!req.session.user) return res.redirect('/dangnhap'); // Chặn người lạ
    try {
        await ThongBao.findByIdAndDelete(req.params.id);
        res.redirect('/'); // Xóa xong load lại trang chủ
    } catch (error) {
        res.send('Lỗi không thể xóa thông báo!');
    }
});
app.get('/dangky', (req, res) => {
    res.render('dangky', { title: 'Đăng ký thành viên' });
});

app.post('/dangky', async (req, res) => {
    try {
        const { HoVaTen, Email, TenDangNhap, MatKhau, XacNhanMatKhau } = req.body;
        if (MatKhau !== XacNhanMatKhau) {
            return res.send('<script>alert("Mật khẩu xác nhận không khớp!"); window.history.back();</script>');
        }
        const userExists = await TaiKhoan.findOne({ TenDangNhap });
        if (userExists) {
            return res.send('<script>alert("Tên đăng nhập đã tồn tại!"); window.history.back();</script>');
        }
        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(MatKhau, salt);
        
        await TaiKhoan.create({
            HoVaTen, Email, TenDangNhap,
            MatKhau: hashPassword
        });
        res.redirect('/dangnhap');
    } catch (error) {
        res.status(500).send('Lỗi hệ thống khi đăng ký.');
    }
});

app.get('/dangnhap', (req, res) => {
    res.render('dangnhap', { title: 'Đăng nhập hệ thống' });
});

app.post('/dangnhap', async (req, res) => {
    try {
        const { TenDangNhap, MatKhau } = req.body;
        const user = await TaiKhoan.findOne({ TenDangNhap });
        if (user && bcrypt.compareSync(MatKhau, user.MatKhau)) {
            req.session.user = user;
            res.redirect('/');
        } else {
            res.send('<script>alert("Sai tài khoản hoặc mật khẩu!"); window.history.back();</script>');
        }
    } catch (error) {
        res.send('Lỗi đăng nhập.');
    }
});

app.get('/dangxuat', (req, res) => {
    req.session.destroy();
    res.redirect('/dangnhap');
});

// ==========================================
// QUẢN LÝ PHÒNG BAN (CRUD)
// ==========================================

app.get('/phongban', async (req, res) => {
    if (!req.session.user) return res.redirect('/dangnhap');
    const danhSachPB = await PhongBan.find(); 
    res.render('phongban', { title: 'Quản lý Phòng ban', danhSachPB });
});

app.get('/phongban/them', (req, res) => {
    if (!req.session.user) return res.redirect('/dangnhap');
    res.render('them_phongban', { title: 'Thêm Phòng Ban' });
});

app.post('/phongban/them', async (req, res) => {
    try {
        await PhongBan.create({
            TenPhongBan: req.body.TenPhongBan,
            MoTa: req.body.MoTa,
            SoNhanVien: req.body.SoNhanVien || 0
        });
        res.redirect('/phongban');
    } catch (error) {
        res.send('Lỗi thêm phòng ban!');
    }
});

app.get('/phongban/sua/:id', async (req, res) => {
    if (!req.session.user) return res.redirect('/dangnhap');
    const pb = await PhongBan.findById(req.params.id);
    res.render('sua_phongban', { title: 'Sửa Phòng Ban', pb });
});

app.post('/phongban/sua/:id', async (req, res) => {
    try {
        await PhongBan.findByIdAndUpdate(req.params.id, {
            TenPhongBan: req.body.TenPhongBan,
            MoTa: req.body.MoTa,
            SoNhanVien: req.body.SoNhanVien
        });
        res.redirect('/phongban');
    } catch (error) {
        res.send('Lỗi cập nhật phòng ban!');
    }
});

app.get('/phongban/xoa/:id', async (req, res) => {
    if (!req.session.user) return res.redirect('/dangnhap');
    await PhongBan.findByIdAndDelete(req.params.id);
    res.redirect('/phongban');
});

// ==========================================
// QUẢN LÝ NHÂN VIÊN (CRUD TÀI KHOẢN)
// ==========================================

// 1. HIỂN THỊ DANH SÁCH (Dùng populate để kéo tên phòng ban sang)
app.get('/taikhoan', async (req, res) => {
    if (!req.session.user) return res.redirect('/dangnhap');
    // .populate('PhongBan') giúp dịch ID phòng ban thành nguyên cái cục dữ liệu của phòng ban đó
    const danhSachNV = await TaiKhoan.find().populate('PhongBan'); 
    res.render('nhanvien', { title: 'Hồ sơ nhân viên', danhSachNV });
});

// 2. MỞ FORM THÊM MỚI (Cần gửi thêm danh sách Phòng ban sang để chọn)
app.get('/taikhoan/them', async (req, res) => {
    if (!req.session.user) return res.redirect('/dangnhap');
    const danhSachPB = await PhongBan.find(); // Kéo danh sách phòng ban
    res.render('them_nhanvien', { title: 'Thêm Nhân Viên', danhSachPB });
});

// 3. XỬ LÝ LƯU THÊM MỚI
app.post('/taikhoan/them', async (req, res) => {
    try {
        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(req.body.MatKhau, salt);
        await TaiKhoan.create({
            HoVaTen: req.body.HoVaTen,
            Email: req.body.Email,
            TenDangNhap: req.body.TenDangNhap,
            MatKhau: hashPassword,
            QuyenHan: req.body.QuyenHan,
            PhongBan: req.body.PhongBan // Lưu ID phòng ban được chọn
        });
        res.redirect('/taikhoan'); 
    } catch (error) {
        res.send('<script>alert("Lỗi hoặc trùng tên đăng nhập!"); window.history.back();</script>');
    }
});

// 4. MỞ FORM SỬA (Gửi cả data nhân viên + danh sách phòng ban)
app.get('/taikhoan/sua/:id', async (req, res) => {
    if (!req.session.user) return res.redirect('/dangnhap');
    const nv = await TaiKhoan.findById(req.params.id);
    const danhSachPB = await PhongBan.find();
    res.render('sua_nhanvien', { title: 'Sửa Hồ Sơ', nv, danhSachPB });
});

// 5. XỬ LÝ LƯU SỬA ĐỔI
app.post('/taikhoan/sua/:id', async (req, res) => {
    try {
        await TaiKhoan.findByIdAndUpdate(req.params.id, {
            HoVaTen: req.body.HoVaTen,
            Email: req.body.Email,
            QuyenHan: req.body.QuyenHan,
            PhongBan: req.body.PhongBan // Cập nhật lại ID phòng ban
        });
        res.redirect('/taikhoan');
    } catch (error) {
        res.send('Lỗi cập nhật!');
    }
});

app.get('/taikhoan/xoa/:id', async (req, res) => {
    if (!req.session.user) return res.redirect('/dangnhap');
    await TaiKhoan.findByIdAndDelete(req.params.id);
    res.redirect('/taikhoan'); 
});


// ==========================================
// KHỞI ĐỘNG SERVER
// ==========================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);

});