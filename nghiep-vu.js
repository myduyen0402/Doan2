(function (g) {
  'use strict';
  const V = g.VideoShare, K = V.KhoDuLieu, E = V.LoiUngDung;
  const norm = value => String(value || '').trim().toLowerCase();
  const text = value => String(value || '').trim();
  function current(data = K.doc()) { return data.NguoiDung.find(u => u.maNguoiDung === K.sessionId() && u.trangThai === 'HOAT_DONG') || null; }
  function user(data) { const u = current(data); if (!u) throw new E('Vui lòng đăng nhập bằng tài khoản đang hoạt động.', 'AUTH'); return u; }
  function admin(data) { const u = user(data); if (u.vaiTro !== 'admin') throw new E('Tài khoản này không có quyền quản trị.', 'FORBIDDEN'); return u; }
  function video(data, id, publicOnly = true) { const v = data.Video.find(v => v.maVideo === id); if (!v || (publicOnly && v.trangThai !== 'HIEN_THI')) throw new E('Video không tồn tại hoặc hiện không khả dụng.', 'NOT_FOUND'); return v; }
  function owned(data, id) { const u = user(data), v = video(data, id, false); if (!data.Kenh.some(k => k.maKenh === v.maKenh && k.maNguoiDung === u.maNguoiDung)) throw new E('Bạn chỉ được quản lý video thuộc kênh của mình.', 'FORBIDDEN'); return v; }
  function imageOK(value) { return value === '' || (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(value) && value.length <= 1400000) || /^assets\/img\/[a-z0-9-]+\.svg$/.test(value); }
  function validateVideo(input) {
    const fields = {}, title = text(input.tieuDe), description = text(input.moTa), category = text(input.danhMuc), image = String(input.anhThuNho || '');
    if (!title || title.length > 120) fields.tieuDe = 'Tiêu đề cần có từ 1 đến 120 ký tự.';
    if (description.length > 2000) fields.moTa = 'Mô tả tối đa 2.000 ký tự.';
    if (!V.DANH_MUC.includes(category)) fields.danhMuc = 'Vui lòng chọn danh mục.';
    if (!imageOK(image) && !/^https:\/\/i\.ytimg\.com\/vi\/[\w-]{11}\/hqdefault\.jpg$/.test(image)) fields.anhThuNho = 'Ảnh thu nhỏ không hợp lệ hoặc quá lớn.';
    if (Object.keys(fields).length) throw new E('Vui lòng kiểm tra thông tin video.', 'VALIDATION', fields);
    return {tieuDe:title,moTa:description,danhMuc:category,anhThuNho:image};
  }
  function cascade(data, id) { data.Video = data.Video.filter(v => v.maVideo !== id); for (const key of ['BinhLuan','TuongTac','LichSuXem']) data[key] = data[key].filter(row => row.maVideo !== id); }
  function youtubeURL(value) {
    try {
      const raw = text(value), url = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
      if (!['https:','http:'].includes(url.protocol) || url.username || url.password || url.port) throw new Error();
      let id;
      if (['youtu.be','www.youtu.be'].includes(url.hostname)) id = url.pathname.slice(1);
      else if (['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(url.hostname)) {
        if (url.pathname === '/watch' && !url.hostname.includes('nocookie')) id = url.searchParams.get('v');
        else id = url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})\/?$/)?.[1];
      }
      if (!/^[\w-]{11}$/.test(id || '')) throw new Error();
      return 'https://www.youtube-nocookie.com/embed/' + id;
    } catch (_) { throw new E('Vui lòng nhập link video YouTube hợp lệ (youtube.com/watch?v=… hoặc youtu.be/…).', 'VALIDATION', {linkYouTube:'Link YouTube không hợp lệ. Hãy dùng link của một video cụ thể.'}); }
  }
  V.XuLyTaiKhoan = {
    hienTai:current,
    dangNhap(identity, password, isAdmin = false) {
      const data = K.doc(), u = data.NguoiDung.find(u => norm(u.tenDangNhap) === norm(identity) || norm(u.email) === norm(identity));
      if (!text(identity) || !password || !u || u.matKhau !== password) throw new E('Tên đăng nhập/email hoặc mật khẩu không đúng.', 'VALIDATION');
      if (u.trangThai !== 'HOAT_DONG') throw new E('Tài khoản đã ngừng hoạt động.', 'FORBIDDEN');
      if (isAdmin && u.vaiTro !== 'admin') throw new E('Tài khoản này không có quyền quản trị.', 'FORBIDDEN');
      K.setSession(u.maNguoiDung); return u;
    },
    dangXuat() { K.setSession(null); },
    dangKy(input) {
      return K.giaoDich(data => {
        const fields = {}, username = norm(input.tenDangNhap), name = text(input.hoTen), email = norm(input.email), password = String(input.matKhau || '');
        if (!/^[a-z0-9_]{3,30}$/.test(username)) fields.tenDangNhap = 'Tên đăng nhập 3–30 ký tự: chữ, số hoặc dấu gạch dưới.';
        else if (data.NguoiDung.some(u => norm(u.tenDangNhap) === username)) fields.tenDangNhap = 'Tên đăng nhập đã được sử dụng.';
        if (!name || name.length > 100) fields.hoTen = 'Họ tên cần có từ 1 đến 100 ký tự.';
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = 'Vui lòng nhập email đúng định dạng.';
        else if (data.NguoiDung.some(u => norm(u.email) === email)) fields.email = 'Email đã được sử dụng.';
        if (password.length < 8 || password.length > 128) fields.matKhau = 'Mật khẩu cần có từ 8 đến 128 ký tự.';
        if (password !== input.xacNhanMatKhau) fields.xacNhanMatKhau = 'Mật khẩu xác nhận chưa khớp.';
        if (Object.keys(fields).length) throw new E('Vui lòng kiểm tra thông tin đăng ký.', 'VALIDATION', fields);
        const id = V.maMoi('ND');
        data.NguoiDung.push({maNguoiDung:id,tenDangNhap:username,hoTen:name,email,matKhau:password,anhDaiDien:'',vaiTro:'user',trangThai:'HOAT_DONG'});
        data.Kenh.push({maKenh:V.maMoi('K'),maNguoiDung:id,tenKenh:('Kênh của ' + name).slice(0,100),moTa:'',anhDaiDien:''});
        return id;
      });
    },
    capNhat(input) {
      return K.giaoDich(data => {
        const u = user(data), channel = data.Kenh.find(k => k.maNguoiDung === u.maNguoiDung), fields = {};
        if (!channel) throw new E('Không tìm thấy kênh của tài khoản.', 'DATA');
        const name = text(input.hoTen), email = norm(input.email), channelName = text(input.tenKenh), description = text(input.moTa), avatar = String(input.anhDaiDien || ''), channelAvatar = String(input.anhKenh || '');
        if (!name || name.length > 100) fields.hoTen = 'Họ tên cần có từ 1 đến 100 ký tự.';
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = 'Vui lòng nhập email đúng định dạng.';
        else if (data.NguoiDung.some(other => other.maNguoiDung !== u.maNguoiDung && norm(other.email) === email)) fields.email = 'Email đã được tài khoản khác sử dụng.';
        if (!channelName || channelName.length > 100) fields.tenKenh = 'Tên kênh cần có từ 1 đến 100 ký tự.';
        if (description.length > 2000) fields.moTa = 'Mô tả kênh tối đa 2.000 ký tự.';
        if (!imageOK(avatar)) fields.anhDaiDien = 'Ảnh đại diện không hợp lệ.';
        if (!imageOK(channelAvatar)) fields.anhKenh = 'Ảnh kênh không hợp lệ.';
        if (Object.keys(fields).length) throw new E('Vui lòng kiểm tra thông tin được đánh dấu.', 'VALIDATION', fields);
        Object.assign(u,{hoTen:name,email,anhDaiDien:avatar}); Object.assign(channel,{tenKenh:channelName,moTa:description,anhDaiDien:channelAvatar});
        return u.maNguoiDung;
      });
    }
  };
  V.XuLyVideo = {
    chuanHoaYouTube:youtubeURL,
    async layTieuDeYouTube(link) {
      const src = youtubeURL(link), id = src.split('/').at(-1), controller = new g.AbortController();
      const timeout = g.setTimeout(()=>controller.abort(),5000);
      try {
        const endpoint = new URL('https://www.youtube.com/oembed');
        endpoint.searchParams.set('url','https://www.youtube.com/watch?v='+id);endpoint.searchParams.set('format','json');
        const response = await g.fetch(endpoint.href,{signal:controller.signal,credentials:'omit'});
        if (!response.ok) throw new Error();
        const info = await response.json(), title = typeof info.title === 'string' ? info.title.trim().slice(0,120) : '';
        if (!title) throw new Error();
        return title;
      } catch (_) { throw new E('Chưa lấy được tiêu đề YouTube. Bạn có thể nhập tiêu đề thủ công.', 'NETWORK'); }
      finally { g.clearTimeout(timeout); }
    },
    async dongBoTieuDe() {
      const pending = K.doc().Video.filter(v=>v.tuDongTieuDe && v.tieuDe==='Video YouTube' && v.trangThai==='HIEN_THI');
      const results = await Promise.all(pending.map(async v=>{try{return {id:v.maVideo,src:v.duongDanVideo,title:await V.XuLyVideo.layTieuDeYouTube(v.duongDanVideo)};}catch(_){return null;}}));
      const titles = results.filter(Boolean);if(!titles.length)return;
      K.giaoDich(data=>{for(const item of titles){const v=data.Video.find(v=>v.maVideo===item.id);if(v?.tuDongTieuDe && v.duongDanVideo===item.src && v.tieuDe==='Video YouTube')v.tieuDe=item.title;}});
    },
    danhSach(data = K.doc()) { return data.Video.filter(v => v.trangThai === 'HIEN_THI'); },
    timKiem(query,data=K.doc()) {
      const aliases={
        'Âm nhạc':'nhạc music bài hát ca nhạc mv ca sĩ hát',
        'Game':'game gaming trò chơi chơi game streamer',
        'Giải trí':'giải trí hài hài hước vui nhộn comedy thử thách',
        'Du lịch':'du lịch travel khám phá phượt du ký',
        'Ẩm thực':'ẩm thực food món ăn nấu ăn công thức bếp',
        'Công nghệ':'công nghệ tech điện thoại máy tính thiết bị review',
        'Học tập':'học tập học education bài giảng lập trình coding tutorial',
        'Khoa học':'khoa học science kiến thức thí nghiệm',
        'Thể thao':'thể thao sport sports bóng đá football soccer',
        'Đời sống':'đời sống lifestyle vlog cuộc sống tâm sự'
      };
      const normalized=V.timKiem(query).replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
      if(!normalized)return this.danhSach(data);
      const ignored=new Set(['video','ve','cac','nhung','muc','xem']);
      const meaningful=normalized.split(' ').filter(word=>!ignored.has(word));
      const words=meaningful.length?meaningful:normalized.split(' ');
      return this.danhSach(data).filter(v=>{
        const channel=data.Kenh.find(k=>k.maKenh===v.maKenh);
        const content=V.timKiem([v.tieuDe,v.moTa,v.danhMuc,v.kenhYouTube,channel?.tenKenh,aliases[v.danhMuc]].filter(Boolean).join(' ')).replace(/[^a-z0-9\s]/g,' ');
        return words.every(word=>content.includes(word));
      });
    },
    taiLen(input) { return saveVideo(input); },
    async taiLenCoTep(input,file) {
      if(input.nguonVideo==='YOUTUBE')return saveVideo(input);
      user(K.doc());validateVideo(input);
      if(!file||!file.size||!/\.mp4$/i.test(file.name||'')||!['','video/mp4','application/mp4'].includes(file.type))throw new E('Vui lòng chọn tệp MP4 hợp lệ.', 'VALIDATION');
      const fileId=V.maMoi('TEP');await V.KhoTepVideo.luu(fileId,file);
      try{return saveVideo({...input,tenTepGoc:file.name},fileId);}
      catch(error){try{await V.KhoTepVideo.xoa(fileId);}catch(_){}throw error;}
    },
    sua(id, input) { return K.giaoDich(data => { const v = owned(data,id), info = validateVideo(input); Object.assign(v,info,{tuDongTieuDe:false}); return id; }); },
    xoa(id) { const v=owned(K.doc(),id);const result=K.giaoDich(data => { owned(data,id); cascade(data,id); });V.KhoTepVideo.xoa(v.maTep||id).catch(()=>{});return result; },
    moXem(id) { return K.giaoDich(data => { const v = video(data,id); v.luotXem += 1; const u = current(data); if (u) { const row = data.LichSuXem.find(r => r.maNguoiDung === u.maNguoiDung && r.maVideo === id); if (row) row.thoiGianXem = V.bayGio(); else data.LichSuXem.push({maLichSu:V.maMoi('LS'),maNguoiDung:u.maNguoiDung,maVideo:id,thoiGianXem:V.bayGio()}); } return v.luotXem; }); },
    luuTienDo(id, seconds) { if (!Number.isFinite(seconds) || seconds < 0) return; return K.giaoDich(data => { const u = user(data); video(data,id); const row = data.LichSuXem.find(r => r.maNguoiDung === u.maNguoiDung && r.maVideo === id); if (row) row.tienDoXem = seconds; }); }
  };
  function saveVideo(input,fileId='') { return K.giaoDich(data => {
      const u = user(data), channel = data.Kenh.find(k => k.maNguoiDung === u.maNguoiDung), info = validateVideo(input);
      if (!channel) throw new E('Không tìm thấy kênh cá nhân.', 'DATA');
      let source;
      if (input.nguonVideo === 'YOUTUBE') source = {loaiNguon:'TRUC_TUYEN',kieuPhat:'NHUNG',duongDanVideo:youtubeURL(input.linkYouTube),tenTepGoc:''};
      else {
        if (input.nguonVideo && input.nguonVideo !== 'CUC_BO') throw new E('Nguồn video không hợp lệ.', 'VALIDATION');
        if (!/\.mp4$/i.test(input.tenTepGoc || '')) throw new E('Vui lòng chọn tệp MP4 hợp lệ.', 'VALIDATION');
        source = {loaiNguon:'CUC_BO',kieuPhat:'MP4',duongDanVideo:'',tenTepGoc:input.tenTepGoc,...(fileId?{maTep:fileId}:{})};
      }
      const id = V.maMoi('VD');
      if (!info.anhThuNho && source.kieuPhat === 'NHUNG') info.anhThuNho = V.anhBiaYouTube(source.duongDanVideo);
      data.Video.push({maVideo:id,maKenh:channel.maKenh,...info,...source,luotXem:0,ngayDang:V.bayGio(),trangThai:'HIEN_THI'});
      return id;
    }); }
  V.XuLyTuongTac = {
    danhGia(id, type) { if (!['THICH','KHONG_THICH'].includes(type)) throw new E('Đánh giá không hợp lệ.'); return K.giaoDich(data => { const u = user(data); video(data,id); const old = data.TuongTac.find(r => r.maNguoiDung === u.maNguoiDung && r.maVideo === id && r.loaiTuongTac !== 'XEM_SAU'); data.TuongTac = data.TuongTac.filter(r => !(r.maNguoiDung === u.maNguoiDung && r.maVideo === id && r.loaiTuongTac !== 'XEM_SAU')); if (!old || old.loaiTuongTac !== type) data.TuongTac.push({maTuongTac:V.maMoi('TT'),maNguoiDung:u.maNguoiDung,maVideo:id,loaiTuongTac:type,ngayTao:V.bayGio()}); }); },
    xemSau(id) { return K.giaoDich(data => { const u = user(data); video(data,id); const old = data.TuongTac.find(r => r.maNguoiDung === u.maNguoiDung && r.maVideo === id && r.loaiTuongTac === 'XEM_SAU'); if (old) data.TuongTac = data.TuongTac.filter(r => r.maTuongTac !== old.maTuongTac); else data.TuongTac.push({maTuongTac:V.maMoi('TT'),maNguoiDung:u.maNguoiDung,maVideo:id,loaiTuongTac:'XEM_SAU',ngayTao:V.bayGio()}); }); },
    bo(id, type) { if (!['THICH','XEM_SAU'].includes(type)) throw new E('Thao tác không hợp lệ.'); return K.giaoDich(data => { const u = user(data); data.TuongTac = data.TuongTac.filter(r => !(r.maNguoiDung === u.maNguoiDung && r.maVideo === id && r.loaiTuongTac === type)); }); },
    binhLuan(id, content, commentId = null) { return K.giaoDich(data => { const u = user(data); video(data,id); const value = text(content); if (!value || value.length > 1000) throw new E('Bình luận cần có từ 1 đến 1.000 ký tự.', 'VALIDATION', {noiDung:'Bình luận cần có từ 1 đến 1.000 ký tự.'}); if (commentId) { const row = data.BinhLuan.find(r => r.maBinhLuan === commentId && r.maVideo === id); if (!row || row.maNguoiDung !== u.maNguoiDung) throw new E('Bạn chỉ được sửa bình luận của mình.', 'FORBIDDEN'); row.noiDung = value; } else data.BinhLuan.push({maBinhLuan:V.maMoi('BL'),maNguoiDung:u.maNguoiDung,maVideo:id,noiDung:value,ngayTao:V.bayGio()}); }); },
    xoaBinhLuan(id) { return K.giaoDich(data => { const u = user(data), row = data.BinhLuan.find(r => r.maBinhLuan === id); if (!row || row.maNguoiDung !== u.maNguoiDung) throw new E('Bạn chỉ được xóa bình luận của mình.', 'FORBIDDEN'); video(data,row.maVideo); data.BinhLuan = data.BinhLuan.filter(r => r.maBinhLuan !== id); }); }
  };
  V.XuLyKenh = {
    dangKy(id) { return K.giaoDich(data => { const u = user(data), channel = data.Kenh.find(k => k.maKenh === id); if (!channel || channel.maNguoiDung === u.maNguoiDung) throw new E('Không thể đăng ký kênh này.', 'FORBIDDEN'); if (!data.DangKyKenh.some(r => r.maNguoiDung === u.maNguoiDung && r.maKenh === id)) data.DangKyKenh.push({maDangKy:V.maMoi('DK'),maNguoiDung:u.maNguoiDung,maKenh:id,ngayDangKy:V.bayGio()}); }); },
    huy(id) { return K.giaoDich(data => { const u = user(data); data.DangKyKenh = data.DangKyKenh.filter(r => !(r.maNguoiDung === u.maNguoiDung && r.maKenh === id)); }); }
  };
  V.XuLyLichSu = {
    xoa(id) { return K.giaoDich(data => { const u = user(data); data.LichSuXem = data.LichSuXem.filter(r => !(r.maNguoiDung === u.maNguoiDung && r.maVideo === id)); }); },
    xoaTatCa() { return K.giaoDich(data => { const u = user(data); data.LichSuXem = data.LichSuXem.filter(r => r.maNguoiDung !== u.maNguoiDung); }); }
  };
  V.XuLyQuanTri = {
    kiemTra() { return admin(K.doc()); },
    video(id, action) { return K.giaoDich(data => { admin(data); const v = video(data,id,false); if (action === 'xoa') cascade(data,id); else if (action === 'an') v.trangThai = 'AN'; else if (action === 'hien') v.trangThai = 'HIEN_THI'; else throw new E('Thao tác video không hợp lệ.'); }); },
    taiKhoan(id) { return K.giaoDich(data => { const a = admin(data), u = data.NguoiDung.find(u => u.maNguoiDung === id); if (!u) throw new E('Tài khoản không còn tồn tại.', 'NOT_FOUND'); if (a.maNguoiDung === id) throw new E('Không thể tự khóa tài khoản quản trị đang đăng nhập.', 'FORBIDDEN'); u.trangThai = u.trangThai === 'HOAT_DONG' ? 'NGUNG_HOAT_DONG' : 'HOAT_DONG'; }); },
    binhLuan(id) { return K.giaoDich(data => { admin(data); if (!data.BinhLuan.some(r => r.maBinhLuan === id)) throw new E('Bình luận không còn tồn tại.', 'NOT_FOUND'); data.BinhLuan = data.BinhLuan.filter(r => r.maBinhLuan !== id); }); },
    thongKe() { const data = K.doc(); admin(data); return {taiKhoan:data.NguoiDung.length,video:data.Video.length,binhLuan:data.BinhLuan.length,luotThich:data.TuongTac.filter(r => r.loaiTuongTac === 'THICH').length,luotXem:data.Video.reduce((sum,v) => sum + v.luotXem,0)}; }
  };
  V.chuanHoa = norm;
  V.timKiem = value => norm(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/\s+/g,' ');
})(window);
