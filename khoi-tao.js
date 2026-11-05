(async function(g){
  'use strict';const V=g.VideoShare,U=V.UI;
  try{
    U.boot();const page=document.body.dataset.page;
    if(document.body.dataset.private&&!U.requireLogin(document.body.dataset.private==='admin'))return;
    try { await V.XuLyVideo.dongBoTieuDe(); } catch (_) { /* Vẫn mở trang bằng dữ liệu đã lưu khi mất mạng hoặc hết dung lượng. */ }
    if(!V.trang||typeof V.trang[page]!=='function')throw new Error('Chưa tìm thấy phần xử lý trang.');
    V.trang[page]();
    g.addEventListener('storage',event=>{if(event.key!==V.KhoDuLieu.khoa)return;try{const current=V.XuLyTaiKhoan.hienTai();if(document.body.dataset.private&&(!current||(document.body.dataset.private==='admin'&&current.vaiTro!=='admin'))){U.login(document.body.dataset.private==='admin');return;}U.syncHeader();if(typeof U.onStorage==='function')U.onStorage();}catch(e){U.toast(e.message,true);}});
  }catch(error){
    const main=document.getElementById('noi-dung');main.replaceChildren(U.h('section',{class:'fatal panel',role:'alert'},U.h('h1',{text:'Chưa mở được website'}),U.h('p',{text:error.message||'Có lỗi khi đọc dữ liệu.'}),U.h('p',{class:'muted',text:'Nếu đang mở trực tiếp tệp HTML, hãy dùng Live Server hoặc máy chủ tĩnh theo README.'}),U.button('Thử lại',()=>g.location.reload())));
  }
})(window);
