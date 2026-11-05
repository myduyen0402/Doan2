(function(g){
  'use strict';const V=g.VideoShare,U=V.UI,h=U.h;V.trang=V.trang||{};
  function catalog(search=false){
    const main=document.getElementById('noi-dung'),data=V.KhoDuLieu.doc(),params=new URLSearchParams(g.location.search),query=(params.get('q')||'').trim(),category=V.DANH_MUC.includes(params.get('danhMuc'))?params.get('danhMuc'):'';
    let items=search?V.XuLyVideo.timKiem(query,data):V.XuLyVideo.danhSach(data);
    if(category)items=items.filter(v=>v.danhMuc===category);
    items.sort((a,b)=>new Date(b.ngayDang)-new Date(a.ngayDang));
    main.replaceChildren(h('div',{class:'page-heading'},h('div',{},h('h1',{text:search?(query?'Kết quả cho “'+query+'”':'Tất cả video'):'Khám phá'}),h('p',{class:'muted',text:search?'Tìm theo chủ đề, danh mục, tiêu đề hoặc tên kênh.':'Xem, học và chia sẻ những điều bạn yêu thích.'}))));
    const chips=h('nav',{class:'chips','aria-label':'Lọc danh mục'});['',...V.DANH_MUC].forEach(name=>{const a=h('a',{class:'chip',href:U.url(search?'tim-kiem.html':'index.html',{q:search?query:'',danhMuc:name}),text:name||'Tất cả'});a.setAttribute('aria-pressed',String(category===name));chips.append(a);});main.append(chips);
    if(search)main.append(h('p',{class:'search-result-count',text:items.length+' kết quả'+(category?' · '+category:'')}));
    if(!items.length)main.append(U.empty('Chưa tìm thấy video phù hợp','Hãy đổi từ khóa hoặc chọn danh mục khác.',h('a',{class:'button',href:U.url('index.html'),text:'Về Trang chủ'})));
    else{const grid=h('div',{class:'video-grid'});items.forEach(v=>grid.append(U.videoCard(v,data)));main.append(grid);}
    document.title=(search?'Tìm kiếm':'Khám phá')+' · VideoShare';
  }
  V.trang.home=()=>catalog(false);V.trang.search=()=>catalog(true);
  V.trang.channel=function(){
    const main=document.getElementById('noi-dung'),id=new URLSearchParams(g.location.search).get('id')||'K_PHIM';
    function render(){
      const data=V.KhoDuLieu.doc(),channel=data.Kenh.find(k=>k.maKenh===id),current=V.XuLyTaiKhoan.hienTai(data);if(!channel){main.replaceChildren(U.empty('Không tìm thấy kênh','Kênh không tồn tại trong dữ liệu hiện tại.',h('a',{class:'button',href:U.url('index.html'),text:'Về Trang chủ'})));return;}
      const own=current?.maNguoiDung===channel.maNguoiDung,subscribed=current&&data.DangKyKenh.some(r=>r.maNguoiDung===current.maNguoiDung&&r.maKenh===id),count=data.DangKyKenh.filter(r=>r.maKenh===id).length;
      const action=own?h('a',{class:'button',href:U.url('tai-khoan.html'),text:'Chỉnh sửa kênh'}):U.button(subscribed?'Đã đăng ký':'Đăng ký',async()=>{if(!U.requireLogin())return;try{const latest=V.KhoDuLieu.doc(),u=V.XuLyTaiKhoan.hienTai(latest),on=latest.DangKyKenh.some(r=>r.maNguoiDung===u.maNguoiDung&&r.maKenh===id);if(on&&!await U.confirm('Hủy đăng ký kênh?','Bạn sẽ bỏ theo dõi “'+channel.tenKenh+'”.','Hủy đăng ký'))return;if(on)V.XuLyKenh.huy(id);else V.XuLyKenh.dangKy(id);render();U.toast(on?'Đã hủy đăng ký kênh.':'Đã đăng ký kênh.');}catch(e){U.actionError(e);}},!subscribed);
      if(!own)action.setAttribute('aria-pressed',String(!!subscribed));
      main.replaceChildren(h('div',{class:'channel-banner','aria-hidden':'true'}),h('section',{class:'channel-header'},U.avatar(channel.tenKenh,channel.anhDaiDien,true),h('div',{class:'channel-info'},h('h1',{text:channel.tenKenh}),h('p',{class:'muted',text:U.number(count)+' người đăng ký · dữ liệu mô phỏng'}),h('details',{},h('summary',{text:'Giới thiệu kênh'}),h('p',{class:'pre-wrap',text:channel.moTa||'Kênh chưa có mô tả.'}))),action));
      const videos=V.XuLyVideo.danhSach(data).filter(v=>v.maKenh===id).sort((a,b)=>new Date(b.ngayDang)-new Date(a.ngayDang));main.append(h('div',{class:'channel-tabs'},h('h2',{text:'Video · '+videos.length})));
      if(!videos.length)main.append(U.empty('Kênh chưa có video công khai','Các video đang hiển thị của kênh sẽ xuất hiện tại đây.'));else{const grid=h('div',{class:'video-grid'});videos.forEach(v=>grid.append(U.videoCard(v,data)));main.append(grid);}document.title=channel.tenKenh+' · VideoShare';
    }render();
  };
})(window);
