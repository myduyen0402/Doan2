(function(g){
  'use strict';const V=g.VideoShare,U=V.UI,h=U.h;V.trang=V.trang||{};
  V.trang.library=function(){
    const main=document.getElementById('noi-dung'),muc=new URLSearchParams(g.location.search).get('muc')||'lich-su',tab=['lich-su','xem-sau','da-thich'].includes(muc)?muc:'lich-su';
    function render(){
      const data=V.KhoDuLieu.doc(),user=V.XuLyTaiKhoan.hienTai(data);if(!user){U.login();return;}
      const source=tab==='lich-su'?data.LichSuXem:data.TuongTac.filter(r=>r.loaiTuongTac===(tab==='xem-sau'?'XEM_SAU':'THICH'));
      const items=source.filter(r=>r.maNguoiDung===user.maNguoiDung&&data.Video.some(v=>v.maVideo===r.maVideo)).sort((a,b)=>new Date(b.thoiGianXem||b.ngayTao)-new Date(a.thoiGianXem||a.ngayTao));
      const tabs=h('nav',{class:'library-tabs','aria-label':'Các mục trong Thư viện'});[['lich-su','Lịch sử xem'],['xem-sau','Xem sau'],['da-thich','Video đã thích']].forEach(([key,label])=>tabs.append(h('a',{class:'button'+(key===tab?' primary':''),href:U.url('thu-vien.html',{muc:key}),'aria-current':key===tab?'page':null,text:label})));
      const top=h('div',{class:'count-toolbar'},h('p',{text:items.length+' video'}));
      if(tab==='lich-su') {const clear=U.button('Xóa toàn bộ lịch sử',async()=>{if(!await U.confirm('Xóa toàn bộ lịch sử xem của bạn?','Chỉ các mục lịch sử của tài khoản hiện tại bị xóa.','Xóa lịch sử'))return;try{V.XuLyLichSu.xoaTatCa();render();U.toast('Đã xóa toàn bộ lịch sử xem cá nhân.');}catch(e){U.actionError(e);}});clear.disabled=!data.LichSuXem.some(r=>r.maNguoiDung===user.maNguoiDung);top.append(clear);}
      main.replaceChildren(h('div',{class:'page-heading'},h('div',{},h('h1',{text:'Thư viện'}),h('p',{class:'muted',text:user.hoTen}))),tabs,top);
      if(!items.length){const emptyText=tab==='lich-su'?['Chưa có lịch sử xem','Các video bạn mở xem sẽ xuất hiện tại đây.']:tab==='xem-sau'?['Chưa có video xem sau','Lưu video vào Xem sau để tìm lại tại đây.']:['Chưa có video đã thích','Các video bạn bấm Thích sẽ xuất hiện tại đây.'];main.append(U.empty(...emptyText,h('a',{class:'button',href:U.url('index.html'),text:'Về Trang chủ'})));return;}
      let lastDate='';for(const item of items){
        const video=data.Video.find(v=>v.maVideo===item.maVideo),available=video.trangThai==='HIEN_THI',stamp=item.thoiGianXem||item.ngayTao,day=U.date(stamp),channel=data.Kenh.find(k=>k.maKenh===video.maKenh);
        if(tab==='lich-su'&&day!==lastDate){main.append(h('h2',{class:'date-group',text:day}));lastDate=day;}
        const thumb=available?h('a',{class:'thumbnail',href:U.url('xem-video.html',{id:video.maVideo}),'aria-label':'Xem '+video.tieuDe},h('img',{src:U.imageSrc(video.anhThuNho,video.duongDanVideo),alt:'',loading:'lazy'})):h('div',{class:'unavailable-thumb',text:'Không khả dụng'});
        const info=h('div',{},h('h2',{},available?h('a',{href:U.url('xem-video.html',{id:video.maVideo}),text:video.tieuDe}):'Video hiện không khả dụng'));
        if(available)info.append(h('p',{class:'meta',text:channel.tenKenh+' · '+U.number(video.luotXem)+' lượt mở'}));
        info.append(h('p',{class:'meta',text:tab==='lich-su'?'Đã xem lúc '+U.time(stamp):(tab==='xem-sau'?'Đã lưu ngày ':'Đã thích ngày ')+day}));
        if(available&&tab==='lich-su'&&typeof item.tienDoXem==='number'&&item.tienDoXem>0)info.append(h('p',{class:'meta',text:'Đã xem đến '+U.seconds(item.tienDoXem)}));
        if(available&&video.loaiNguon==='CUC_BO')info.append(h('p',{class:'meta',text:'MP4 · Cần chọn lại tệp để phát'}));
        const remove=U.button(tab==='lich-su'?'Xóa khỏi lịch sử':tab==='xem-sau'?'Bỏ khỏi Xem sau':'Bỏ thích',()=>{try{if(tab==='lich-su')V.XuLyLichSu.xoa(video.maVideo);else V.XuLyTuongTac.bo(video.maVideo,tab==='xem-sau'?'XEM_SAU':'THICH');render();U.toast('Đã cập nhật danh sách cá nhân.');}catch(e){U.actionError(e);}});
        main.append(h('article',{class:'list-row'},thumb,info,h('div',{class:'actions'},remove)));
      }
    }render();
  };
})(window);
