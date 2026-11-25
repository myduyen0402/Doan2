// Kiểm thử trực tiếp mã nghiệp vụ dùng trên trình duyệt, không cần backend.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {randomUUID} = require('node:crypto');
const jsRoot = path.resolve(__dirname, '../dist/assets/js');
const plain = value => JSON.parse(JSON.stringify(value));
const tables = ['NguoiDung','Kenh','Video','DangKyKenh','BinhLuan','TuongTac','LichSuXem'];

class MemoryStorage {
  constructor() { this.values = new Map(); this.blockRead = false; this.blockWrite = false; }
  getItem(key) { if(this.blockRead) throw new Error('Blocked'); return this.values.get(key) ?? null; }
  setItem(key,value) { if(this.blockWrite) throw new Error('QuotaExceededError'); this.values.set(key,String(value)); }
  removeItem(key) { if(this.blockWrite) throw new Error('Blocked'); this.values.delete(key); }
}
function app() {
  const localStorage = new MemoryStorage(), sessionStorage = new MemoryStorage();
  const window = {localStorage,sessionStorage,crypto:{randomUUID},location:{href:'https://demo.example/index.html'}};
  const sandbox = vm.createContext({window,URL,URLSearchParams,console,document:{body:{dataset:{depth:'0'}}}});
  for(const file of ['du-lieu-mau.js','luu-tru.js','nghiep-vu.js']) vm.runInContext(fs.readFileSync(path.join(jsRoot,file),'utf8'),sandbox,{filename:file});
  const V = window.VideoShare; V.KhoDuLieu.doc();
  return {V,localStorage,sessionStorage,sandbox,window,read:()=>plain(V.KhoDuLieu.doc()),raw:()=>localStorage.getItem(V.KhoDuLieu.khoa),login:(name='vudemo',pw='Video123',admin=false)=>V.XuLyTaiKhoan.dangNhap(name,pw,admin)};
}
function unchanged(a,operation,code) { const before=a.raw(); assert.throws(operation,e=>e.code===code); assert.equal(a.raw(),before,'Lỗi không được lưu một phần thay đổi'); }
const registration = extra => ({tenDangNhap:'sinhvien',hoTen:'Sinh Viên',email:'sinhvien@example.com',matKhau:'Demo12345',xacNhanMatKhau:'Demo12345',...extra});
const metadata = extra => ({tieuDe:'Video thử nghiệm',moTa:'Mô tả',danhMuc:'Học tập',anhThuNho:'',tenTepGoc:'thu-nghiem.mp4',...extra});
const profile = extra => ({hoTen:'Nguyễn Vũ',email:'vu@example.com',tenKenh:'Kênh của Vũ',moTa:'',anhDaiDien:'',anhKenh:'',...extra});

test('Đồng bộ video sửa trong code, giữ tài khoản, video tự thêm và tương tác',()=>{
  const a=app();a.login();
  const personal=a.V.XuLyVideo.taiLen(metadata()),seed=a.V.duLieuMau(),sample=seed.Video[0].maVideo;
  a.V.XuLyVideo.moXem(sample);a.V.XuLyTuongTac.binhLuan(sample,'Giữ bình luận');
  const before=a.read();seed.Video[0].tieuDe='Tiêu đề sửa trong code';seed.Video[0].duongDanVideo='https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';
  a.V.duLieuMau=()=>plain(seed);
  const after=a.read(),updated=after.Video.find(v=>v.maVideo===sample);
  assert.equal(updated.tieuDe,'Tiêu đề sửa trong code');assert.equal(updated.duongDanVideo,seed.Video[0].duongDanVideo);
  assert.equal(updated.luotXem,before.Video.find(v=>v.maVideo===sample).luotXem);
  assert.deepEqual(after.NguoiDung,before.NguoiDung);assert.deepEqual(after.BinhLuan,before.BinhLuan);assert.ok(after.Video.some(v=>v.maVideo===personal));
  const raw=a.raw();a.read();assert.equal(a.raw(),raw,'Không ghi lại khi code không đổi');
});

test('Thêm/bỏ video trong code được áp dụng sau tải lại, giữ bản ghi video cũ ở trạng thái ẩn',()=>{
  const a=app(),seed=a.V.duLieuMau(),oldId=seed.Video[0].maVideo;
  seed.Video=[{...seed.Video[0],maVideo:'VD_MOI_CODE',tieuDe:'Video mới'}];a.V.duLieuMau=()=>plain(seed);
  const data=a.read();assert.ok(data.Video.some(v=>v.maVideo==='VD_MOI_CODE'&&v.trangThai==='HIEN_THI'));
  assert.equal(data.Video.find(v=>v.maVideo===oldId).trangThai,'AN');
});

test('Dữ liệu trình duyệt cũ được đồng bộ một lần; lỗi ghi không làm mất dữ liệu',()=>{
  const a=app(),old=a.read(),seed=a.V.duLieuMau();delete old.videoMau;
  old.Video=[{...seed.Video[0],maVideo:'VD_BUNNY'},{...seed.Video[0],maVideo:'VD_TU_THEM'}];
  a.localStorage.setItem(a.V.KhoDuLieu.khoa,JSON.stringify(old));const before=a.raw();
  a.localStorage.blockWrite=true;assert.throws(()=>a.read(),e=>e.code==='STORAGE');assert.equal(a.raw(),before);a.localStorage.blockWrite=false;
  const data=a.read();assert.ok(data.Video.some(v=>v.maVideo===seed.Video[0].maVideo));
  assert.equal(data.Video.find(v=>v.maVideo==='VD_BUNNY').trangThai,'AN');assert.equal(data.Video.find(v=>v.maVideo==='VD_TU_THEM').trangThai,'HIEN_THI');
});

test('Dữ liệu đầu có 7 thực thể; mỗi tài khoản có đúng một kênh; ẩn video khỏi danh sách công khai',()=>{
  const a=app(),d=a.read(); for(const name of tables)assert.ok(Array.isArray(d[name]));
  for(const u of d.NguoiDung)assert.equal(d.Kenh.filter(k=>k.maNguoiDung===u.maNguoiDung).length,1);
  assert.equal(a.V.XuLyVideo.danhSach().length,50); assert.ok(!a.V.XuLyVideo.danhSach().some(v=>v.maVideo==='VD_AN'));
  assert.equal(a.V.KhoDuLieu.kiemTra(d),d);
});
test('Bộ video Việt có đủ 50 link đã xác minh, 10 danh mục và ảnh bìa đúng mã video',async()=>{
  const a=app(),data=a.read(),catalog=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../scripts/video-viet-da-xac-minh.json'),'utf8'));
  const playback=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../scripts/ket-qua-phat-nhung.json'),'utf8'));
  assert.equal(data.Video.length,50);assert.equal(new Set(data.Video.map(v=>v.maVideo)).size,50);
  assert.equal(new Set(data.Video.map(v=>v.duongDanVideo)).size,50);
  assert.equal(new Set(data.Video.map(v=>v.danhMuc)).size,10);
  for(const category of a.V.DANH_MUC)assert.equal(data.Video.filter(v=>v.danhMuc===category).length,5);
  for(const v of data.Video){
    const id=v.duongDanVideo.split('/').at(-1),original=catalog.find(item=>item.youtubeId===id);
    assert.ok(original);assert.equal(v.tieuDe,original.title);assert.equal(v.kenhYouTube,original.author);
    assert.ok(playback.some(result=>result.youtubeId===id&&result.playable===true&&result.state==='PLAYING'),'Video phải được kiểm tra phát thật thành công: '+id);
    assert.equal(v.urlKenhYouTube,original.authorUrl);assert.equal(v.danhMuc,original.category);
    assert.equal(v.anhThuNho,'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg');assert.equal(v.trangThai,'HIEN_THI');
  }
  let requests=0;a.window.fetch=async()=>{requests++;throw new Error('Không cần tải tiêu đề mẫu');};
  await a.V.XuLyVideo.dongBoTieuDe();assert.equal(requests,0,'Tiêu đề có sẵn, không làm chậm trang bằng 50 yêu cầu mạng');
});

test('Mỗi nguồn video có tài khoản và kênh riêng; chỉ hiển thị 5 video đúng chủ đề',()=>{
  const a=app(),data=a.read(),ids=new Set(data.Video.map(v=>v.maKenh));assert.equal(ids.size,10);
  for(const id of ids){
    const channel=data.Kenh.find(k=>k.maKenh===id),owner=data.NguoiDung.find(u=>u.maNguoiDung===channel.maNguoiDung),items=data.Video.filter(v=>v.maKenh===id);
    assert.ok(owner);assert.equal(owner.hoTen,channel.tenKenh);assert.equal(items.length,5);
    assert.equal(new Set(items.map(v=>v.danhMuc)).size,1);
    for(const video of items)assert.equal(video.kenhYouTube,channel.tenKenh);
  }
  assert.equal(data.Video.filter(v=>v.maKenh==='K_PHIM').length,0);
});

test('Dữ liệu gộp kênh cũ được chuyển sang 10 kênh riêng, giữ video cá nhân và tương tác',()=>{
  const a=app();a.login();const personal=a.V.XuLyVideo.taiLen(metadata()),before=a.read();
  before.Video.filter(v=>v.maVideo!==personal).forEach(v=>v.maKenh='K_PHIM');
  before.videoMau.forEach(v=>v.maKenh='K_PHIM');
  before.Kenh=before.Kenh.filter(k=>!k.maKenh.startsWith('K_YT_'));before.NguoiDung=before.NguoiDung.filter(u=>!u.maNguoiDung.startsWith('ND_YT_'));
  before.Video[0].luotXem=7;before.BinhLuan.push({maBinhLuan:'BL_GIU',maNguoiDung:'ND_VU',maVideo:before.Video[0].maVideo,noiDung:'Giữ bình luận',ngayTao:'2026-10-27'});
  a.localStorage.setItem(a.V.KhoDuLieu.khoa,JSON.stringify(before));
  const after=a.read();assert.equal(new Set(after.Video.filter(v=>v.maVideo!==personal).map(v=>v.maKenh)).size,10);
  assert.equal(after.Video.find(v=>v.maVideo===personal).maKenh,'K_VU');assert.equal(after.Video[0].luotXem,7);assert.deepEqual(after.BinhLuan,before.BinhLuan);
  assert.equal(after.NguoiDung.length,before.NguoiDung.length+10);assert.equal(after.Kenh.length,before.Kenh.length+10);
  const raw=a.raw();a.read();assert.equal(a.raw(),raw);
});

test('Đăng ký tạo đồng thời User và kênh, bỏ qua vai trò và định danh do đầu vào gửi lên',()=>{
  const a=app(),before=a.read(),id=a.V.XuLyTaiKhoan.dangKy(registration({vaiTro:'admin',maNguoiDung:'ND_ADMIN'})),d=a.read(),u=d.NguoiDung.find(r=>r.maNguoiDung===id);
  assert.equal(d.NguoiDung.length,before.NguoiDung.length+1); assert.equal(d.Kenh.length,before.Kenh.length+1); assert.equal(u.vaiTro,'user'); assert.equal(u.trangThai,'HOAT_DONG'); assert.notEqual(id,'ND_ADMIN');
  assert.equal(a.V.XuLyTaiKhoan.hienTai(),null); a.login('SINHVIEN','Demo12345'); assert.equal(a.V.XuLyTaiKhoan.hienTai().maNguoiDung,id);
});
test('Đăng ký chặn tên/email trùng kể cả tài khoản khóa, thông tin sai và mật khẩu không khớp',()=>{
  const a=app(); for(const input of [{tenDangNhap:'VUDEMO'},{email:'KHOA@EXAMPLE.COM'},{tenDangNhap:'có dấu'},{email:'sai-email'},{matKhau:'123'},{xacNhanMatKhau:'khac'},{hoTen:'   '}]) unchanged(a,()=>a.V.XuLyTaiKhoan.dangKy(registration(input)),'VALIDATION');
});
test('Hết dung lượng khi đăng ký không tạo tài khoản hoặc kênh dở dang',()=>{
  const a=app(),before=a.read(); a.localStorage.blockWrite=true; unchanged(a,()=>a.V.XuLyTaiKhoan.dangKy(registration()),'STORAGE'); a.localStorage.blockWrite=false;
  assert.equal(a.read().NguoiDung.length,before.NguoiDung.length); assert.equal(a.read().Kenh.length,before.Kenh.length);
});
test('Đăng nhập kiểm tra mật khẩu, trạng thái và vai trò quản trị; đăng xuất xóa phiên',()=>{
  const a=app(); assert.throws(()=>a.login('vudemo','sai'),e=>e.code==='VALIDATION'); assert.throws(()=>a.login('taikhoankhoa'),e=>e.code==='FORBIDDEN'); assert.throws(()=>a.login('vudemo','Video123',true),e=>e.code==='FORBIDDEN');
  assert.equal(a.V.KhoDuLieu.sessionId(),null); a.login(' VU@EXAMPLE.COM '); assert.equal(a.V.XuLyTaiKhoan.hienTai().maNguoiDung,'ND_VU');
  a.V.XuLyTaiKhoan.dangXuat(); assert.equal(a.V.XuLyTaiKhoan.hienTai(),null); a.login('admin','Admin123',true); assert.equal(a.V.XuLyQuanTri.kiemTra().vaiTro,'admin');
});
test('Không báo đăng nhập thành công khi trình duyệt chặn lưu phiên',()=>{
  const a=app(); a.sessionStorage.blockWrite=true; assert.throws(()=>a.login(),e=>e.code==='STORAGE'); assert.equal(a.V.XuLyTaiKhoan.hienTai(),null);
});
test('Khách mở video công khai tăng lượt mở nhưng không ghi lịch sử hoặc cho tương tác',()=>{
  const a=app(),before=a.read(); a.V.XuLyVideo.moXem('VD_FLOWER'); const after=a.read();
  assert.equal(after.Video.find(v=>v.maVideo==='VD_FLOWER').luotXem,before.Video.find(v=>v.maVideo==='VD_FLOWER').luotXem+1); assert.deepEqual(after.LichSuXem,before.LichSuXem);
  unchanged(a,()=>a.V.XuLyTuongTac.danhGia('VD_FLOWER','THICH'),'AUTH'); unchanged(a,()=>a.V.XuLyVideo.moXem('VD_AN'),'NOT_FOUND');
});
test('Mở lại video cập nhật một lịch sử và giữ tiến độ HTML5 đã biết',()=>{
  const a=app(); a.login(); a.V.bayGio=()=> '2026-10-24T12:00:00.000Z'; a.V.XuLyVideo.moXem('VD_FLOWER'); a.V.XuLyVideo.luuTienDo('VD_FLOWER',12.25);
  a.V.bayGio=()=> '2026-10-24T13:00:00.000Z'; a.V.XuLyVideo.moXem('VD_FLOWER'); const rows=a.read().LichSuXem.filter(r=>r.maNguoiDung==='ND_VU'&&r.maVideo==='VD_FLOWER');
  assert.equal(rows.length,1); assert.equal(rows[0].tienDoXem,12.25); assert.equal(rows[0].thoiGianXem,'2026-10-24T13:00:00.000Z');
  const before=a.raw(); a.V.XuLyVideo.luuTienDo('VD_FLOWER',NaN); a.V.XuLyVideo.luuTienDo('VD_FLOWER',-1); assert.equal(a.raw(),before);
});
test('Thích và không thích loại trừ nhau; xem sau hoạt động độc lập',()=>{
  const a=app(); a.login(); a.V.XuLyTuongTac.danhGia('VD_BUNNY','KHONG_THICH');
  let rows=a.read().TuongTac.filter(r=>r.maNguoiDung==='ND_VU'&&r.maVideo==='VD_BUNNY'); assert.deepEqual(rows.map(r=>r.loaiTuongTac).sort(),['KHONG_THICH','XEM_SAU']);
  a.V.XuLyTuongTac.danhGia('VD_BUNNY','KHONG_THICH'); rows=a.read().TuongTac.filter(r=>r.maNguoiDung==='ND_VU'&&r.maVideo==='VD_BUNNY'); assert.deepEqual(rows.map(r=>r.loaiTuongTac),['XEM_SAU']);
  a.V.XuLyTuongTac.xemSau('VD_BUNNY'); assert.equal(a.read().TuongTac.filter(r=>r.maNguoiDung==='ND_VU'&&r.maVideo==='VD_BUNNY').length,0);
});
test('Video ẩn chặn tương tác mới và sửa/xóa bình luận; cho bỏ thích cũ của chính mình',()=>{
  const a=app(); a.login('admin','Admin123',true); a.V.XuLyQuanTri.video('VD_FLOWER','an'); a.login();
  unchanged(a,()=>a.V.XuLyTuongTac.danhGia('VD_FLOWER','THICH'),'NOT_FOUND'); unchanged(a,()=>a.V.XuLyTuongTac.xemSau('VD_FLOWER'),'NOT_FOUND'); unchanged(a,()=>a.V.XuLyTuongTac.binhLuan('VD_FLOWER','Mới'),'NOT_FOUND'); unchanged(a,()=>a.V.XuLyTuongTac.xoaBinhLuan('BL3'),'NOT_FOUND');
  a.V.XuLyTuongTac.bo('VD_FLOWER','THICH'); assert.ok(!a.read().TuongTac.some(r=>r.maNguoiDung==='ND_VU'&&r.maVideo==='VD_FLOWER'&&r.loaiTuongTac==='THICH')); assert.ok(a.read().TuongTac.some(r=>r.maNguoiDung==='ND_PHIM'&&r.maVideo==='VD_FLOWER'));
});
test('Bình luận kiểm tra rỗng, giới hạn và quyền tác giả khi thêm/sửa/xóa',()=>{
  const a=app(); a.login(); for(const text of ['   ','a'.repeat(1001)])unchanged(a,()=>a.V.XuLyTuongTac.binhLuan('VD_BUNNY',text),'VALIDATION');
  unchanged(a,()=>a.V.XuLyTuongTac.binhLuan('VD_BUNNY','Sửa người khác','BL2'),'FORBIDDEN'); unchanged(a,()=>a.V.XuLyTuongTac.xoaBinhLuan('BL2'),'FORBIDDEN');
  a.V.XuLyTuongTac.binhLuan('VD_BUNNY','  Cảm ơn  ','BL1'); assert.equal(a.read().BinhLuan.find(r=>r.maBinhLuan==='BL1').noiDung,'Cảm ơn');
  a.V.XuLyTuongTac.binhLuan('VD_BUNNY','<img src=x onerror=alert(1)>'); assert.ok(a.read().BinhLuan.some(r=>r.noiDung==='<img src=x onerror=alert(1)>'));
  a.V.XuLyTuongTac.xoaBinhLuan('BL1'); assert.ok(!a.read().BinhLuan.some(r=>r.maBinhLuan==='BL1'));
});
test('Đăng ký kênh không trùng, không tự đăng ký và hủy không ảnh hưởng người khác',()=>{
  const a=app(); a.login(); a.V.XuLyKenh.dangKy('K_PHIM'); a.V.XuLyKenh.dangKy('K_PHIM'); assert.equal(a.read().DangKyKenh.filter(r=>r.maNguoiDung==='ND_VU'&&r.maKenh==='K_PHIM').length,1);
  unchanged(a,()=>a.V.XuLyKenh.dangKy('K_VU'),'FORBIDDEN'); a.V.XuLyKenh.huy('K_PHIM'); assert.ok(!a.read().DangKyKenh.some(r=>r.maNguoiDung==='ND_VU'&&r.maKenh==='K_PHIM')); assert.ok(a.read().DangKyKenh.some(r=>r.maNguoiDung==='ND_MAU'&&r.maKenh==='K_PHIM'));
});
test('Tải video chỉ lưu metadata, không lưu File/blob URL và không nhận quyền do đầu vào gửi lên',()=>{
  const a=app(); a.login(); const id=a.V.XuLyVideo.taiLen(metadata({maKenh:'K_ADMIN',duongDanVideo:'blob:temporary',trangThai:'AN',luotXem:999})),r=a.read().Video.find(v=>v.maVideo===id);
  assert.equal(r.maKenh,'K_VU'); assert.equal(r.duongDanVideo,''); assert.equal(r.loaiNguon,'CUC_BO'); assert.equal(r.kieuPhat,'MP4'); assert.equal(r.trangThai,'HIEN_THI'); assert.equal(r.luotXem,0); assert.equal(r.tenTepGoc,'thu-nghiem.mp4'); assert.ok(!a.raw().includes('blob:temporary'));
  unchanged(a,()=>a.V.XuLyVideo.taiLen(metadata({tenTepGoc:'a.exe'})),'VALIDATION'); unchanged(a,()=>a.V.XuLyVideo.taiLen(metadata({tieuDe:'',danhMuc:'Sai'})),'VALIDATION');
});
test('Thêm link YouTube chuẩn hóa các dạng URL và lưu nguồn nhúng để phát lại',()=>{
  const a=app(); a.login();
  const links=['https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=test','https://youtu.be/dQw4w9WgXcQ?si=share','youtube.com/shorts/dQw4w9WgXcQ','https://m.youtube.com/watch?v=dQw4w9WgXcQ','https://www.youtube.com/live/dQw4w9WgXcQ','https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'];
  for(const linkYouTube of links){
    const id=a.V.XuLyVideo.taiLen(metadata({nguonVideo:'YOUTUBE',linkYouTube,maKenh:'K_ADMIN',trangThai:'AN'})),row=a.read().Video.find(v=>v.maVideo===id);
    assert.equal(row.duongDanVideo,'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    assert.equal(row.loaiNguon,'TRUC_TUYEN');assert.equal(row.kieuPhat,'NHUNG');assert.equal(row.tenTepGoc,'');assert.equal(row.maKenh,'K_VU');assert.equal(row.trangThai,'HIEN_THI');
    a.V.XuLyVideo.moXem(id);assert.ok(a.read().LichSuXem.some(r=>r.maVideo===id));
  }
});

test('Ảnh bìa YouTube tự lấy từ mã video, ưu tiên ảnh riêng và giữ được khi sửa thông tin',()=>{
  const a=app();a.login();
  const image='https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg';
  const id=a.V.XuLyVideo.taiLen(metadata({nguonVideo:'YOUTUBE',linkYouTube:'https://youtu.be/dQw4w9WgXcQ'}));
  assert.equal(a.read().Video.find(v=>v.maVideo===id).anhThuNho,image);
  a.V.XuLyVideo.sua(id,metadata({anhThuNho:image,tieuDe:'Sửa tiêu đề'}));assert.equal(a.read().Video.find(v=>v.maVideo===id).anhThuNho,image);
  const custom=a.V.XuLyVideo.taiLen(metadata({nguonVideo:'YOUTUBE',linkYouTube:'https://youtu.be/dQw4w9WgXcQ',anhThuNho:'assets/img/flower.svg'}));
  assert.equal(a.read().Video.find(v=>v.maVideo===custom).anhThuNho,'assets/img/flower.svg');
  vm.runInContext(fs.readFileSync(path.join(jsRoot,'giao-dien.js'),'utf8'),a.sandbox);
  assert.equal(a.V.UI.imageSrc('', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'),image);
  assert.equal(a.V.UI.imageSrc('assets/img/default.svg', 'https://www.youtube.com/embed/dQw4w9WgXcQ'),image);
  assert.equal(a.V.UI.imageSrc(image),image);
  assert.equal(a.V.UI.imageSrc('https://i.ytimg.com.evil.example/vi/dQw4w9WgXcQ/hqdefault.jpg'),'https://demo.example/assets/img/default.svg');
  assert.equal(a.V.anhBiaYouTube('https://evil.example/embed/dQw4w9WgXcQ'),'');
  const sample=a.V.duLieuMau().Video[0];assert.equal(sample.anhThuNho,a.V.anhBiaYouTube(sample.duongDanVideo));
});

test('Tiêu đề YouTube được lấy, lưu lại và không gọi mạng lần nữa khi đã có tiêu đề',async()=>{
  const a=app();Object.assign(a.window,{AbortController,setTimeout,clearTimeout});let requests=0;
  const automatic=a.V.duLieuMau();automatic.Video[0].tuDongTieuDe=true;automatic.Video[0].tieuDe='Video YouTube';a.V.duLieuMau=()=>plain(automatic);a.read();
  a.window.fetch=async(url)=>{requests++;assert.equal(new URL(url).origin,'https://www.youtube.com');return{ok:true,json:async()=>({title:'  Tiêu đề chính thức từ YouTube  '})};};
  await a.V.XuLyVideo.dongBoTieuDe();
  assert.equal(a.read().Video[0].tieuDe,'Tiêu đề chính thức từ YouTube');assert.equal(requests,1);
  await a.V.XuLyVideo.dongBoTieuDe();assert.equal(requests,1);
  const seed=a.V.duLieuMau();seed.Video[0].danhMuc='Học tập';a.V.duLieuMau=()=>plain(seed);
  assert.equal(a.read().Video[0].tieuDe,'Tiêu đề chính thức từ YouTube');
  assert.equal(await a.V.XuLyVideo.layTieuDeYouTube('https://youtu.be/dQw4w9WgXcQ'),'Tiêu đề chính thức từ YouTube');
});

test('Mất mạng hoặc video YouTube không có tiêu đề vẫn giữ được dữ liệu và cho mở trang',async()=>{
  const a=app();Object.assign(a.window,{AbortController,setTimeout,clearTimeout});
  const automatic=a.V.duLieuMau();automatic.Video[0].tuDongTieuDe=true;automatic.Video[0].tieuDe='Video YouTube';a.V.duLieuMau=()=>plain(automatic);a.read();const before=a.raw();
  a.window.fetch=async()=>{throw new Error('Offline');};
  await a.V.XuLyVideo.dongBoTieuDe();assert.equal(a.raw(),before);
  await assert.rejects(()=>a.V.XuLyVideo.layTieuDeYouTube('https://youtu.be/dQw4w9WgXcQ'),e=>e.code==='NETWORK');
  a.window.fetch=async()=>({ok:true,json:async()=>({title:''})});
  await assert.rejects(()=>a.V.XuLyVideo.layTieuDeYouTube('https://youtu.be/dQw4w9WgXcQ'),e=>e.code==='NETWORK');
});

test('Từ chối link YouTube sai hoặc giả mạo, không lưu video dở dang',()=>{
  const a=app();a.login();
  for(const linkYouTube of ['', 'https://youtube.com/playlist?list=abc','https://youtube.com/watch?v=abc','https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ','https://evil.example/dQw4w9WgXcQ','javascript:alert(1)','https://user:pass@youtube.com/watch?v=dQw4w9WgXcQ','https://youtu.be/dQw4w9WgXcQ/extra']){
    unchanged(a,()=>a.V.XuLyVideo.taiLen(metadata({nguonVideo:'YOUTUBE',linkYouTube})),'VALIDATION');
  }
  unchanged(a,()=>a.V.XuLyVideo.taiLen(metadata({nguonVideo:'KHAC'})),'VALIDATION');
  a.V.XuLyTaiKhoan.dangXuat();unchanged(a,()=>a.V.XuLyVideo.taiLen(metadata({nguonVideo:'YOUTUBE',linkYouTube:'https://youtu.be/dQw4w9WgXcQ'})),'AUTH');
});

test('Đăng MP4 lưu cả tệp, metadata tham chiếu đúng tệp và xóa video dọn tệp',async()=>{
  const a=app();a.login();const files=new Map();
  a.V.KhoTepVideo={luu:async(id,file)=>files.set(id,file),doc:async id=>files.get(id),xoa:async id=>files.delete(id)};
  const file={name:'video.mp4',type:'video/mp4',size:1024},id=await a.V.XuLyVideo.taiLenCoTep(metadata(),file);
  const row=a.read().Video.find(v=>v.maVideo===id);assert.ok(row.maTep);assert.equal(files.get(row.maTep),file);assert.equal(row.tenTepGoc,'video.mp4');assert.equal(row.duongDanVideo,'');
  a.V.XuLyVideo.xoa(id);assert.equal(files.size,0);
});

test('Lỗi lưu tệp không tạo metadata dở dang; lỗi metadata dọn tệp vừa lưu',async()=>{
  const a=app();a.login();const file={name:'video.mp4',type:'video/mp4',size:1024},before=a.raw();
  a.V.KhoTepVideo={luu:async()=>{throw new a.V.LoiUngDung('Đầy bộ nhớ','STORAGE');},xoa:async()=>{}};
  await assert.rejects(()=>a.V.XuLyVideo.taiLenCoTep(metadata(),file),e=>e.code==='STORAGE');assert.equal(a.raw(),before);
  const files=new Map();a.V.KhoTepVideo={luu:async(id,file)=>{files.set(id,file);a.localStorage.blockWrite=true;},xoa:async id=>files.delete(id)};
  await assert.rejects(()=>a.V.XuLyVideo.taiLenCoTep(metadata(),file),e=>e.code==='STORAGE');assert.equal(files.size,0);assert.equal(a.raw(),before);
});

test('Sửa video kiểm tra chủ sở hữu, chỉ sửa metadata và giữ trạng thái ẩn của Admin',()=>{
  const a=app(); a.login('admin','Admin123',true); a.V.XuLyQuanTri.video('VD_CUC_BO','an'); a.login(); unchanged(a,()=>a.V.XuLyVideo.sua('VD_BUNNY',metadata()),'FORBIDDEN');
  const before=a.read().Video.find(v=>v.maVideo==='VD_CUC_BO'); a.V.XuLyVideo.sua('VD_CUC_BO',metadata({tieuDe:'Tiêu đề mới',maKenh:'K_ADMIN',luotXem:9999,trangThai:'HIEN_THI',duongDanVideo:'https://x.example/a.mp4'})); const after=a.read().Video.find(v=>v.maVideo==='VD_CUC_BO');
  assert.equal(after.tieuDe,'Tiêu đề mới'); for(const key of ['maVideo','maKenh','trangThai','luotXem','ngayDang','duongDanVideo','tenTepGoc'])assert.equal(after[key],before[key]);
});
test('Chủ video xóa toàn bộ tham chiếu của các tài khoản và giữ video khác',()=>{
  const a=app(); a.login(); a.V.XuLyVideo.moXem('VD_CUC_BO'); a.V.XuLyTuongTac.binhLuan('VD_CUC_BO','Thử'); a.V.XuLyTuongTac.xemSau('VD_CUC_BO');
  a.login('videomau'); a.V.XuLyVideo.moXem('VD_CUC_BO'); a.V.XuLyTuongTac.danhGia('VD_CUC_BO','THICH'); a.V.XuLyTuongTac.binhLuan('VD_CUC_BO','Khác'); unchanged(a,()=>a.V.XuLyVideo.xoa('VD_CUC_BO'),'FORBIDDEN');
  a.login(); a.V.XuLyVideo.xoa('VD_CUC_BO'); const d=a.read(); for(const name of ['Video','BinhLuan','TuongTac','LichSuXem'])assert.ok(!d[name].some(r=>r.maVideo==='VD_CUC_BO')); assert.ok(d.Video.some(v=>v.maVideo==='VD_BUNNY'));
});
test('Hồ sơ cập nhật hai ảnh độc lập, không đổi định danh, mật khẩu và vai trò',()=>{
  const a=app(); a.login(); const old=a.read().NguoiDung.find(u=>u.maNguoiDung==='ND_VU');
  a.V.XuLyTaiKhoan.capNhat(profile({hoTen:'Vũ mới',email:'VU@EXAMPLE.COM',anhDaiDien:'assets/img/flower.svg',anhKenh:'assets/img/bunny.svg',vaiTro:'admin',matKhau:'changed',tenDangNhap:'changed'}));
  const d=a.read(),u=d.NguoiDung.find(u=>u.maNguoiDung==='ND_VU'),k=d.Kenh.find(k=>k.maNguoiDung==='ND_VU'); assert.equal(u.hoTen,'Vũ mới'); assert.equal(u.email,'vu@example.com'); assert.equal(u.anhDaiDien,'assets/img/flower.svg'); assert.equal(k.anhDaiDien,'assets/img/bunny.svg');
  for(const key of ['maNguoiDung','tenDangNhap','matKhau','vaiTro','trangThai'])assert.equal(u[key],old[key]);
});
test('Email trùng, ảnh sai hoặc hết dung lượng khiến cả hồ sơ và kênh không đổi',()=>{
  const a=app(); a.login(); unchanged(a,()=>a.V.XuLyTaiKhoan.capNhat(profile({hoTen:'Đổi tên',tenKenh:'Đổi kênh',email:'khoa@example.com'})),'VALIDATION'); unchanged(a,()=>a.V.XuLyTaiKhoan.capNhat(profile({anhKenh:'javascript:alert(1)'})),'VALIDATION');
  a.localStorage.blockWrite=true; unchanged(a,()=>a.V.XuLyTaiKhoan.capNhat(profile({hoTen:'Chưa lưu'})),'STORAGE');
});
test('Xóa lịch sử cá nhân không ảnh hưởng tài khoản khác hoặc số lượt mở video',()=>{
  const a=app(); a.login('videomau'); a.V.XuLyVideo.moXem('VD_FLOWER'); a.login(); const views=a.read().Video.map(v=>v.luotXem);
  a.V.XuLyLichSu.xoa('VD_FLOWER'); assert.ok(!a.read().LichSuXem.some(r=>r.maNguoiDung==='ND_VU'&&r.maVideo==='VD_FLOWER')); a.V.XuLyLichSu.xoaTatCa(); assert.ok(!a.read().LichSuXem.some(r=>r.maNguoiDung==='ND_VU')); assert.ok(a.read().LichSuXem.some(r=>r.maNguoiDung==='ND_MAU')); assert.deepEqual(a.read().Video.map(v=>v.luotXem),views);
});
test('Quản trị từ chối Khách và User; tài khoản bị khóa mất quyền ngay',()=>{
  const a=app(); unchanged(a,()=>a.V.XuLyQuanTri.video('VD_BUNNY','an'),'AUTH'); a.login(); unchanged(a,()=>a.V.XuLyQuanTri.video('VD_BUNNY','an'),'FORBIDDEN'); unchanged(a,()=>a.V.XuLyQuanTri.taiKhoan('ND_MAU'),'FORBIDDEN'); unchanged(a,()=>a.V.XuLyQuanTri.binhLuan('BL2'),'FORBIDDEN'); assert.throws(()=>a.V.XuLyQuanTri.thongKe(),e=>e.code==='FORBIDDEN');
  a.V.KhoDuLieu.giaoDich(d=>{d.NguoiDung.find(u=>u.maNguoiDung==='ND_VU').trangThai='NGUNG_HOAT_DONG';}); assert.equal(a.V.XuLyTaiKhoan.hienTai(),null); unchanged(a,()=>a.V.XuLyTuongTac.xemSau('VD_BUNNY'),'AUTH');
});
test('Admin ẩn/hiện giữ dữ liệu, khóa/mở tài khoản và không tự khóa',()=>{
  const a=app(); a.login('admin','Admin123',true); const old=a.read(); a.V.XuLyQuanTri.video('VD_BUNNY','an'); const hidden=a.read(); assert.equal(hidden.Video.length,old.Video.length); assert.deepEqual(hidden.BinhLuan,old.BinhLuan); assert.deepEqual(hidden.TuongTac,old.TuongTac); assert.ok(!a.V.XuLyVideo.danhSach().some(v=>v.maVideo==='VD_BUNNY'));
  a.V.XuLyQuanTri.video('VD_BUNNY','hien'); assert.ok(a.V.XuLyVideo.danhSach().some(v=>v.maVideo==='VD_BUNNY')); unchanged(a,()=>a.V.XuLyQuanTri.taiKhoan('ND_ADMIN'),'FORBIDDEN'); a.V.XuLyQuanTri.taiKhoan('ND_VU'); assert.equal(a.read().NguoiDung.find(u=>u.maNguoiDung==='ND_VU').trangThai,'NGUNG_HOAT_DONG'); a.V.XuLyQuanTri.taiKhoan('ND_VU'); assert.equal(a.read().NguoiDung.find(u=>u.maNguoiDung==='ND_VU').trangThai,'HOAT_DONG');
});
test('Admin xóa bình luận độc lập; xóa video cùng toàn bộ dữ liệu liên quan',()=>{
  const a=app(); a.login('admin','Admin123',true); const old=a.read(); a.V.XuLyQuanTri.binhLuan('BL2'); assert.equal(a.read().BinhLuan.length,old.BinhLuan.length-1); assert.deepEqual(a.read().Video,old.Video); a.V.XuLyQuanTri.video('VD_BUNNY','xoa');
  for(const name of ['Video','BinhLuan','TuongTac','LichSuXem'])assert.ok(!a.read()[name].some(r=>r.maVideo==='VD_BUNNY'));
});
test('Thống kê đếm bản ghi hiện tại gồm video ẩn và xử lý danh sách trống',()=>{
  const a=app(); a.login('admin','Admin123',true); const d=a.read(); assert.deepEqual(plain(a.V.XuLyQuanTri.thongKe()),{taiKhoan:d.NguoiDung.length,video:d.Video.length,binhLuan:d.BinhLuan.length,luotThich:d.TuongTac.filter(r=>r.loaiTuongTac==='THICH').length,luotXem:d.Video.reduce((s,v)=>s+v.luotXem,0)});
  a.V.KhoDuLieu.giaoDich(d=>{for(const name of ['Video','BinhLuan','TuongTac','LichSuXem'])d[name]=[];}); assert.deepEqual(plain(a.V.XuLyQuanTri.thongKe()),{taiKhoan:d.NguoiDung.length,video:0,binhLuan:0,luotThich:0,luotXem:0});
});
test('JSON lỗi hoặc sai quan hệ được giữ nguyên, không âm thầm thay dữ liệu mẫu',()=>{
  const a=app(); a.localStorage.setItem(a.V.KhoDuLieu.khoa,'{invalid'); assert.throws(()=>a.V.KhoDuLieu.doc(),e=>e.code==='DATA'); assert.equal(a.raw(),'{invalid'); const invalid=a.V.duLieuMau(); invalid.Kenh.pop(); a.localStorage.setItem(a.V.KhoDuLieu.khoa,JSON.stringify(invalid)); const before=a.raw(); assert.throws(()=>a.V.KhoDuLieu.doc(),e=>e.code==='DATA'); assert.equal(a.raw(),before);
});
test('Chặn đọc/ghi và giao dịch sai quan hệ không làm mất dữ liệu cũ',()=>{
  const a=app(),before=a.raw(); a.localStorage.blockRead=true; assert.throws(()=>a.V.KhoDuLieu.doc(),e=>e.code==='STORAGE'); a.localStorage.blockRead=false; assert.equal(a.raw(),before); assert.throws(()=>a.V.KhoDuLieu.giaoDich(d=>{d.Video[0].duongDanVideo='blob:temporary';})); assert.equal(a.raw(),before); a.login(); a.localStorage.blockWrite=true; unchanged(a,()=>a.V.XuLyTuongTac.danhGia('VD_SINTEL','THICH'),'STORAGE');
});
test('Tìm kiếm bỏ dấu và chuẩn hóa khoảng trắng',()=>{
  const a=app(); assert.equal(a.V.timKiem('  HỌC   LẬP trình ĐẸP  '),'hoc lap trinh dep'); assert.ok(a.V.timKiem('Thư viện phim mở').includes(a.V.timKiem('PHIM MO')));
});
test('Tìm kiếm theo danh mục và từ gần nghĩa trả về đủ video liên quan',()=>{
  const a=app();
  for(const [query,category] of [['nhạc','Âm nhạc'],['  ÂM NHẠC ','Âm nhạc'],['music','Âm nhạc'],['video về nhạc','Âm nhạc'],['gaming','Game'],['trò chơi','Game'],['food','Ẩm thực'],['bóng đá','Thể thao'],['hài','Giải trí'],['lập trình','Học tập']]){
    const results=a.V.XuLyVideo.timKiem(query),expected=a.read().Video.filter(v=>v.danhMuc===category);
    for(const v of expected)assert.ok(results.some(row=>row.maVideo===v.maVideo),query+': thiếu '+v.maVideo);
  }
  assert.ok(a.V.XuLyVideo.timKiem('nhạc Bùi Công Nam').some(v=>v.danhMuc==='Âm nhạc'));
  assert.equal(a.V.XuLyVideo.timKiem('zzzzkhongcoketqua').length,0);
  assert.equal(a.V.XuLyVideo.timKiem('').length,50);
  const sample=a.read().Video[0];a.V.KhoDuLieu.giaoDich(data=>{data.Video.find(v=>v.maVideo===sample.maVideo).trangThai='AN';});
  assert.ok(!a.V.XuLyVideo.timKiem('nhạc').some(v=>v.maVideo===sample.maVideo));
});

test('Chuyển tiếp sau đăng nhập chỉ về trang cùng website, hợp lệ và đúng quyền',()=>{
  const a=app(); vm.runInContext(fs.readFileSync(path.join(jsRoot,'giao-dien.js'),'utf8'),a.sandbox); const ui=a.V.UI;
  for(const bad of ['https://other.example/tai-khoan.html','javascript:alert(1)','/admin/index.html','/dang-nhap.html','/khong-ton-tai.html','//other.example/index.html'])assert.equal(ui.safeReturn(bad),'https://demo.example/index.html');
  assert.equal(ui.safeReturn('/xem-video.html?id=VD_FLOWER'),'https://demo.example/xem-video.html?id=VD_FLOWER'); a.login('admin','Admin123',true); assert.equal(ui.safeReturn('/admin/index.html?muc=video',true),'https://demo.example/admin/index.html?muc=video'); assert.equal(ui.safeReturn('/tai-khoan.html',true),'https://demo.example/admin/index.html');
});
