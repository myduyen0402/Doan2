(function (g) {
  'use strict';
  const V = g.VideoShare;
  const KEY = 'videoshare.doan.data.v1';
  const SESSION = 'videoshare.doan.session.v1';
  const TABLES = {NguoiDung:'maNguoiDung',Kenh:'maKenh',Video:'maVideo',DangKyKenh:'maDangKy',BinhLuan:'maBinhLuan',TuongTac:'maTuongTac',LichSuXem:'maLichSu'};
  const copy = value => JSON.parse(JSON.stringify(value));
  class LoiUngDung extends Error {
    constructor(message, code = 'DATA', fields = {}) { super(message); this.name = 'LoiUngDung'; this.code = code; this.fields = fields; }
  }
  function validate(data) {
    if (!data || data.version !== 1 || !Number.isInteger(data.revision) || data.revision < 0) throw new Error('Sai phiên bản dữ liệu.');
    for (const [table, key] of Object.entries(TABLES)) {
      if (!Array.isArray(data[table])) throw new Error('Thiếu bảng ' + table);
      const ids = new Set();
      for (const row of data[table]) {
        if (!row || typeof row[key] !== 'string' || !row[key] || ids.has(row[key])) throw new Error('Sai định danh ' + table);
        ids.add(row[key]);
      }
    }
    const hasUser = id => data.NguoiDung.some(u => u.maNguoiDung === id);
    const hasChannel = id => data.Kenh.some(k => k.maKenh === id);
    const hasVideo = id => data.Video.some(v => v.maVideo === id);
    const owners = new Set(), usernames = new Set(), emails = new Set();
    for (const user of data.NguoiDung) {
      if (!['user','admin'].includes(user.vaiTro) || !['HOAT_DONG','NGUNG_HOAT_DONG'].includes(user.trangThai)) throw new Error('Sai trạng thái tài khoản.');
      for (const key of ['tenDangNhap','hoTen','email','matKhau','anhDaiDien']) if (typeof user[key] !== 'string') throw new Error('Sai thông tin tài khoản.');
      const name = user.tenDangNhap.trim().toLowerCase(), email = user.email.trim().toLowerCase();
      if (usernames.has(name) || emails.has(email)) throw new Error('Trùng tài khoản.');
      usernames.add(name); emails.add(email);
    }
    for (const channel of data.Kenh) {
      if (!hasUser(channel.maNguoiDung) || owners.has(channel.maNguoiDung)) throw new Error('Sai quan hệ sở hữu kênh.');
      owners.add(channel.maNguoiDung);
      for (const key of ['tenKenh','moTa','anhDaiDien']) if (typeof channel[key] !== 'string') throw new Error('Sai thông tin kênh.');
    }
    if (owners.size !== data.NguoiDung.length) throw new Error('Thiếu kênh của tài khoản.');
    for (const video of data.Video) {
      if (!hasChannel(video.maKenh) || !['HIEN_THI','AN'].includes(video.trangThai) || !['TRUC_TUYEN','CUC_BO'].includes(video.loaiNguon) || !['MP4','NHUNG'].includes(video.kieuPhat) || !Number.isInteger(video.luotXem) || video.luotXem < 0) throw new Error('Sai thông tin video.');
      for (const key of ['tieuDe','moTa','duongDanVideo','anhThuNho','danhMuc','ngayDang','tenTepGoc']) if (typeof video[key] !== 'string') throw new Error('Thiếu thông tin video.');
      if (video.duongDanVideo.startsWith('blob:') || (video.loaiNguon === 'CUC_BO' && video.duongDanVideo !== '')) throw new Error('URL cục bộ không được lưu lâu dài.');
    }
    for (const row of data.BinhLuan) if (!hasUser(row.maNguoiDung) || !hasVideo(row.maVideo) || typeof row.noiDung !== 'string') throw new Error('Sai bình luận.');
    const ratings = new Set(), later = new Set(), subscriptions = new Set(), viewed = new Set();
    for (const row of data.TuongTac) {
      if (!hasUser(row.maNguoiDung) || !hasVideo(row.maVideo) || !['THICH','KHONG_THICH','XEM_SAU'].includes(row.loaiTuongTac)) throw new Error('Sai tương tác.');
      const pair = row.maNguoiDung + ':' + row.maVideo, set = row.loaiTuongTac === 'XEM_SAU' ? later : ratings;
      if (set.has(pair)) throw new Error('Trùng tương tác.'); set.add(pair);
    }
    for (const row of data.DangKyKenh) {
      const pair = row.maNguoiDung + ':' + row.maKenh;
      if (!hasUser(row.maNguoiDung) || !hasChannel(row.maKenh) || subscriptions.has(pair) || data.Kenh.find(k => k.maKenh === row.maKenh).maNguoiDung === row.maNguoiDung) throw new Error('Sai đăng ký kênh.');
      subscriptions.add(pair);
    }
    for (const row of data.LichSuXem) {
      const pair = row.maNguoiDung + ':' + row.maVideo;
      if (!hasUser(row.maNguoiDung) || typeof row.maVideo !== 'string' || viewed.has(pair) || (row.tienDoXem !== undefined && (!Number.isFinite(row.tienDoXem) || row.tienDoXem < 0))) throw new Error('Sai lịch sử xem.');
      viewed.add(pair);
    }
    return data;
  }
  function read() {
    let raw;
    try { raw = g.localStorage.getItem(KEY); } catch (_) { throw new LoiUngDung('Trình duyệt chưa cho phép đọc dữ liệu đã lưu. Hãy kiểm tra quyền lưu dữ liệu.', 'STORAGE'); }
    if (raw === null) {
      const seed = validate(V.duLieuMau());
      seed.videoMau = copy(seed.Video);
      try { g.localStorage.setItem(KEY, JSON.stringify(seed)); } catch (_) { throw new LoiUngDung('Không khởi tạo được dữ liệu. Hãy kiểm tra quyền và dung lượng lưu trữ của trình duyệt.', 'STORAGE'); }
      return seed;
    }
    let data, seed;
    try { data = validate(JSON.parse(raw)); seed = validate(V.duLieuMau()); } catch (_) { throw new LoiUngDung('Không đọc được dữ liệu mô phỏng hoặc dữ liệu mẫu trong code. Dữ liệu cũ vẫn được giữ; hãy kiểm tra du-lieu-mau.js và dữ liệu đã lưu.', 'DATA'); }
    if (JSON.stringify(data.videoMau) === JSON.stringify(seed.Video)) return data;
    // Đồng bộ video khai báo trong code; giữ video tự thêm và dữ liệu tài khoản.
    const previous = Array.isArray(data.videoMau) ? data.videoMau : [];
    const removed = new Set(previous.map(v => v.maVideo));
    // Các video trực tuyến của bản mẫu cũ trước khi có dấu mốc đồng bộ.
    if (!Array.isArray(data.videoMau)) for (const id of ['VD_BUNNY','VD_SINTEL','VD_STEEL','VD_DREAM','VD_FLOWER']) removed.add(id);
    // Bổ sung kênh/tài khoản nguồn trước khi chuyển video mẫu sang kênh riêng.
    const sourceChannels = new Set(seed.Video.map(v=>v.maKenh));
    for (const channel of seed.Kenh) {
      if (!sourceChannels.has(channel.maKenh) || data.Kenh.some(k=>k.maKenh===channel.maKenh)) continue;
      const owner = seed.NguoiDung.find(u=>u.maNguoiDung===channel.maNguoiDung);
      if (!data.NguoiDung.some(u=>u.maNguoiDung===owner.maNguoiDung)) data.NguoiDung.push(copy(owner));
      data.Kenh.push(copy(channel));
    }
    for (const item of seed.Video) {
      removed.delete(item.maVideo);
      const existing = data.Video.find(v => v.maVideo === item.maVideo);
      if (existing) {
        const views = existing.luotXem, status = existing.trangThai;
        const autoTitle = item.tuDongTieuDe && existing.tuDongTieuDe && existing.duongDanVideo === item.duongDanVideo ? existing.tieuDe : null;
        Object.assign(existing, copy(item), {luotXem:views,trangThai:status});
        if (autoTitle) existing.tieuDe = autoTitle;
        const old = previous.find(v => v.maVideo === item.maVideo);
        if (old && old.trangThai !== item.trangThai) existing.trangThai = item.trangThai;
      } else if (data.Kenh.some(k => k.maKenh === item.maKenh)) data.Video.push(copy(item));
    }
    // Giữ bản ghi và tương tác của video đã bỏ khỏi code trong trạng thái ẩn.
    for (const item of data.Video) if (removed.has(item.maVideo)) item.trangThai = 'AN';
    data.videoMau = copy(seed.Video);
    data.revision += 1;
    try { validate(data); } catch (_) { throw new LoiUngDung('Chưa đồng bộ được video mẫu. Hãy kiểm tra mã video và mã kênh trong du-lieu-mau.js.', 'DATA'); }
    try { g.localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) { throw new LoiUngDung('Chưa lưu được video mới từ code. Hãy kiểm tra dung lượng và quyền lưu của trình duyệt.', 'STORAGE'); }
    return data;
  }
  function transact(action) {
    const next = copy(read());
    const result = action(next);
    next.revision += 1;
    validate(next);
    try { g.localStorage.setItem(KEY, JSON.stringify(next)); } catch (_) { throw new LoiUngDung('Chưa lưu được thay đổi. Dung lượng có thể đã đầy hoặc quyền lưu bị chặn. Thông tin đã lưu trước đó được giữ nguyên.', 'STORAGE'); }
    return copy(result === undefined ? null : result);
  }
  function sessionId() {
    try { return g.sessionStorage.getItem(SESSION); } catch (_) { return null; }
  }
  function setSession(id) {
    try { if (id) g.sessionStorage.setItem(SESSION, id); else g.sessionStorage.removeItem(SESSION); }
    catch (_) { throw new LoiUngDung('Không lưu được phiên đăng nhập trong trình duyệt.', 'STORAGE'); }
  }
  V.LoiUngDung = LoiUngDung;
  // Tệp lớn lưu trong IndexedDB, metadata nhỏ tiếp tục dùng LocalStorage.
  function fileTransaction(mode, action) {
    return new Promise((resolve,reject)=>{
      if(!g.indexedDB){reject(new LoiUngDung('Trình duyệt chưa hỗ trợ lưu tệp video.', 'STORAGE'));return;}
      let db, result;
      const fail=()=>{if(db)db.close();reject(new LoiUngDung('Chưa lưu hoặc đọc được tệp video. Hãy kiểm tra quyền lưu và dung lượng trình duyệt.', 'STORAGE'));};
      const opening=g.indexedDB.open('videoshare.files.v1',1);
      opening.onupgradeneeded=()=>opening.result.createObjectStore('videos');
      opening.onerror=fail;opening.onblocked=fail;
      opening.onsuccess=()=>{
        db=opening.result;db.onversionchange=()=>db.close();
        try{
          const tx=db.transaction('videos',mode),request=action(tx.objectStore('videos'));
          request.onsuccess=()=>{result=request.result;};
          tx.oncomplete=()=>{db.close();resolve(result);};tx.onabort=fail;tx.onerror=()=>{};
        }catch(_){fail();}
      };
    });
  }
  V.KhoTepVideo={
    luu:(id,file)=>fileTransaction('readwrite',store=>store.put(file,id)),
    doc:id=>fileTransaction('readonly',store=>store.get(id)),
    xoa:id=>fileTransaction('readwrite',store=>store.delete(id))
  };
  V.KhoDuLieu = {doc:read,giaoDich:transact,kiemTra:validate,khoa:KEY,sessionId,setSession,saoChep:copy};
  V.maMoi = prefix => prefix + '_' + (g.crypto && g.crypto.randomUUID ? g.crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  V.bayGio = () => new Date().toISOString();
})(window);
