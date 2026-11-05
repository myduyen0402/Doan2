(function(g){
  'use strict';const V=g.VideoShare,U=V.UI,h=U.h;V.trang=V.trang||{};
  V.trang.watch=function(){
    const main=document.getElementById('noi-dung'),params=new URLSearchParams(g.location.search),id=params.get('id'),preview=params.get('preview')==='1';let blob=null,native=null,editing=null,draftText='',lastProgress=0,progressProblem=false;
    function context(){const data=V.KhoDuLieu.doc(),video=data.Video.find(v=>v.maVideo===id),user=V.XuLyTaiKhoan.hienTai(data),channel=video&&data.Kenh.find(k=>k.maKenh===video.maKenh),own=!!user&&channel?.maNguoiDung===user.maNguoiDung;return{data,video,user,channel,own};}
    let mediaGeneration=0;
    function stopMedia(){mediaGeneration++;const old=native;native=null;if(old){old.pause();old.removeAttribute('src');old.load();}if(blob){URL.revokeObjectURL(blob);blob=null;}}
    function unavailable(message='Video không tồn tại hoặc hiện không khả dụng.'){stopMedia();main.replaceChildren(U.empty('Chưa mở được video',message,h('a',{class:'button',href:U.url('index.html'),text:'Về Trang chủ'})));}
    let initial=context();if(!initial.video||(!preview&&initial.video.trangThai!=='HIEN_THI')){unavailable();return;}if(preview&&!initial.own){unavailable('Chỉ chủ kênh đang đăng nhập mới được xem trước video cá nhân.');return;}
    if(!preview)try{V.XuLyVideo.moXem(id);}catch(e){U.toast(e.message,true);}
    const player=h('div',{class:'player'}),mediaError=h('p',{class:'field-error',role:'alert',hidden:true}),playerArea=h('section',{'aria-label':'Trình phát video'},player,mediaError),meta=h('div'),commentsArea=h('section',{'aria-label':'Bình luận'}),related=h('aside',{'aria-label':'Video liên quan'});
    const primary=h('div',{},playerArea,meta,commentsArea);main.replaceChildren(preview?primary:h('div',{class:'watch-layout'},primary,related));
    const source=initial.video;
    function writeProgress(){if(preview||!native||!V.XuLyTaiKhoan.hienTai()||!Number.isFinite(native.currentTime))return;try{V.XuLyVideo.luuTienDo(id,native.currentTime);}catch(e){if(!progressProblem&&e.code==='STORAGE'){progressProblem=true;U.toast('Video vẫn phát, nhưng chưa lưu được tiến độ xem.',true);}}}
    function setupNative(src){
      const media=h('video',{controls:true,playsinline:true,preload:'metadata',poster:U.imageSrc(source.anhThuNho,source.duongDanVideo),'aria-label':'Phát '+source.tieuDe});native=media;media.src=src;player.replaceChildren(media);mediaError.hidden=true;
      media.addEventListener('error',()=>{if(media!==native)return;mediaError.textContent='Chưa phát được nguồn này. Hãy kiểm tra kết nối, chọn lại MP4 hoặc thử nguồn gốc.';mediaError.hidden=false;});
      media.addEventListener('canplay',()=>{if(media===native)mediaError.hidden=true;});
      media.addEventListener('timeupdate',()=>{if(media!==native||Date.now()-lastProgress<5000)return;lastProgress=Date.now();writeProgress();});for(const event of ['pause','ended'])media.addEventListener(event,()=>{if(media===native)writeProgress();});
      if(source.loaiNguon==='CUC_BO')U.playVideo(media);
    }
    if(source.loaiNguon==='CUC_BO'){
      player.append(h('div',{class:'player-placeholder'},h('h2',{text:'Chọn lại tệp MP4 để phát'}),h('p',{text:'Tệp gốc: '+source.tenTepGoc})));
      const input=h('input',{type:'file',id:'local-video-file',accept:'.mp4,video/mp4,application/mp4','aria-describedby':'local-file-hint local-file-error'}),err=h('p',{id:'local-file-error',class:'field-error',role:'alert'});
      const picker=h('div',{class:'field',hidden:true},h('label',{for:'local-video-file',text:'Tệp MP4 trên thiết bị'}),input,h('p',{id:'local-file-hint',class:'hint',text:'Video cũ chưa lưu tệp: chọn một lần để phát. Chủ video có thể lưu tệp để xem lại trên trình duyệt này.'}),err);playerArea.append(picker);
      player.replaceChildren(h('p',{text:'Đang tải video đã lưu…'}));
      const generation=mediaGeneration;
      V.KhoTepVideo.doc(source.maTep||id).then(file=>{
        if(generation!==mediaGeneration)return;
        if(file&&file.size){blob=URL.createObjectURL(file);setupNative(blob);}
        else{picker.hidden=false;player.replaceChildren(h('div',{class:'player-placeholder'},h('h2',{text:'Chọn tệp MP4 để khôi phục video cũ'}),h('p',{text:'Tệp gốc: '+source.tenTepGoc})));}
      }).catch(error=>{if(generation!==mediaGeneration)return;picker.hidden=false;err.textContent=error.message;player.replaceChildren(h('p',{text:'Chọn tệp MP4 để phát video.'}));});
      input.addEventListener('change',async()=>{const file=input.files[0];if(!file)return;err.textContent='';if(!/\.mp4$/i.test(file.name)||!['','video/mp4','application/mp4'].includes(file.type)||!file.size){err.textContent='Hãy chọn một tệp MP4 có nội dung.';input.value='';return;}stopMedia();try{blob=URL.createObjectURL(file);setupNative(blob);if(context().own){await V.KhoTepVideo.luu(source.maTep||id,file);picker.hidden=true;}}catch(error){err.textContent=error.message||'Không mở được tệp. Hãy chọn lại.';}});
    }else if(source.kieuPhat==='NHUNG'){
      let src;try{src=new URL(source.duongDanVideo);if(src.protocol!=='https:'||!['www.youtube-nocookie.com','www.youtube.com'].includes(src.hostname)||!/^\/embed\/[\w-]{11}$/.test(src.pathname))throw new Error();src.searchParams.set('rel','0');}catch(_){unavailable('Nguồn nhúng không được hỗ trợ.');return;}
      player.append(h('iframe',{src:src.href,title:'Trình phát '+source.tieuDe,allow:'accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen',allowfullscreen:true,referrerpolicy:'strict-origin-when-cross-origin'}));
    }else{
      try{const src=new URL(source.duongDanVideo);if(src.protocol!=='https:')throw new Error();setupNative(src.href);playerArea.append(h('p',{class:'player-help'},'Nguồn MP4 trực tuyến cần Internet. ',h('a',{href:src.href,target:'_blank',rel:'noopener noreferrer',text:'Mở nguồn gốc'}),' nếu trình phát không hoạt động.'));}catch(_){unavailable('Chưa có URL phát trực tuyến hợp lệ.');return;}
    }
    function renderMeta(){
      const{data,video,user,channel,own}=context();if(!video||(!preview&&video.trangThai!=='HIEN_THI')||(preview&&!own)){unavailable();return;}
      document.title=video.tieuDe+' · VideoShare';const following=user&&data.DangKyKenh.some(r=>r.maNguoiDung===user.maNguoiDung&&r.maKenh===channel.maKenh),subCount=data.DangKyKenh.filter(r=>r.maKenh===channel.maKenh).length;
      const subscribe=own?h('a',{class:'button',href:U.url('tai-khoan.html'),text:'Kênh của bạn'}):U.button(following?'Đã đăng ký':'Đăng ký',async()=>{if(!U.requireLogin())return;try{const latest=context(),on=latest.data.DangKyKenh.some(r=>r.maNguoiDung===latest.user.maNguoiDung&&r.maKenh===channel.maKenh);if(on&&!await U.confirm('Hủy đăng ký kênh?',channel.tenKenh,'Hủy đăng ký'))return;if(on)V.XuLyKenh.huy(channel.maKenh);else V.XuLyKenh.dangKy(channel.maKenh);renderMeta();}catch(e){U.actionError(e);}},!following);
      if(!own)subscribe.setAttribute('aria-pressed',String(!!following));
      meta.replaceChildren(h('h1',{class:'watch-title',text:video.tieuDe}),...(preview?[h('p',{class:'notice',text:'Xem trước video cá nhân · '+(video.trangThai==='AN'?'Đang ẩn':'Đang hiển thị')+'. Lượt mở và lịch sử không tăng trong chế độ này.'})]:[]),h('div',{class:'watch-channel-row'},h('a',{class:'channel-link',href:U.url('kenh.html',{id:channel.maKenh})},U.avatar(channel.tenKenh,channel.anhDaiDien),h('div',{},h('p',{text:channel.tenKenh}),h('p',{class:'muted small',text:U.number(subCount)+' người đăng ký mô phỏng'}))),preview?h('a',{class:'button',href:U.url('video-cua-toi.html'),text:'Về Video của tôi'}):subscribe));
      if(!preview){const actions=h('div',{class:'watch-actions'});for(const[type,label,ico]of[['THICH','Thích','like'],['KHONG_THICH','Không thích','dislike'],['XEM_SAU','Xem sau','clock']]){const on=!!user&&data.TuongTac.some(r=>r.maNguoiDung===user.maNguoiDung&&r.maVideo===id&&r.loaiTuongTac===type),count=data.TuongTac.filter(r=>r.maVideo===id&&r.loaiTuongTac===type).length;const b=U.button('',()=>{if(!U.requireLogin())return;try{if(type==='XEM_SAU')V.XuLyTuongTac.xemSau(id);else V.XuLyTuongTac.danhGia(id,type);renderMeta();}catch(e){U.actionError(e);}});b.replaceChildren(U.icon(ico),h('span',{text:type==='XEM_SAU'?(on?'Đã lưu':'Xem sau'):label+' '+U.number(count)}));b.setAttribute('aria-label',label);b.setAttribute('aria-pressed',String(on));actions.append(b);}meta.append(actions);}
      meta.append(h('div',{class:'description-box'},h('p',{class:'small',text:U.number(video.luotXem)+' lượt mở mô phỏng · '+U.date(video.ngayDang)+' · '+video.danhMuc}),h('details',{},h('summary',{text:'Mô tả video'}),h('p',{class:'pre-wrap',text:video.moTa||'Video chưa có mô tả.'}))));
    }
    function renderComments(){
      if(preview){commentsArea.replaceChildren();return;}const{data,user,video}=context();if(!video||video.trangThai!=='HIEN_THI')return;
      const comments=data.BinhLuan.filter(r=>r.maVideo===id).sort((a,b)=>new Date(b.ngayTao)-new Date(a.ngayTao));commentsArea.replaceChildren(h('h2',{text:comments.length+' bình luận'}));
      if(user){const form=h('form',{class:'comment-form',novalidate:true},U.field('noiDung',editing?'Sửa bình luận':'Viết bình luận',{required:true,multiline:true,max:1000,value:draftText,rows:3,hint:'Tối đa 1.000 ký tự.'})),submit=h('button',{type:'submit',class:'button primary',text:editing?'Lưu thay đổi':'Bình luận'});const controls=h('div',{class:'actions'},submit);if(editing)controls.append(U.button('Hủy sửa',()=>{editing=null;draftText='';renderComments();}));form.append(controls);form.elements.noiDung.addEventListener('input',()=>{draftText=form.elements.noiDung.value;});form.addEventListener('submit',event=>{event.preventDefault();try{V.XuLyTuongTac.binhLuan(id,form.elements.noiDung.value,editing?.maBinhLuan||null);editing=null;draftText='';renderComments();U.toast('Đã lưu bình luận.');}catch(e){U.actionError(e,form);}});commentsArea.append(form);U.dirty=()=>draftText.trim()!==(editing?.noiDung||'');}
      else commentsArea.append(h('p',{class:'notice'},h('a',{href:U.url('dang-nhap.html',{next:g.location.href}),text:'Đăng nhập'}),' để bình luận và tương tác.'));
      if(!comments.length)commentsArea.append(h('p',{class:'muted',text:'Chưa có bình luận. Hãy chia sẻ cảm nhận của bạn.'}));
      for(const row of comments){const author=data.NguoiDung.find(u=>u.maNguoiDung===row.maNguoiDung),copy=h('div',{class:'comment-body'},h('strong',{text:author.hoTen}),h('p',{class:'comment-meta',text:U.date(row.ngayTao)+' · '+U.time(row.ngayTao)}),h('p',{class:'pre-wrap',text:row.noiDung}));if(user&&row.maNguoiDung===user.maNguoiDung)copy.append(h('div',{class:'comment-actions'},U.button('Sửa',async()=>{if(U.dirty()&&!await U.confirm('Bỏ bản nhập bình luận chưa lưu?','','Bỏ bản nhập'))return;editing=row;draftText=row.noiDung;renderComments();commentsArea.querySelector('textarea')?.focus();}),U.button('Xóa',async()=>{if(!await U.confirm('Xóa bình luận của bạn?','Bình luận này sẽ bị xóa khỏi dữ liệu mô phỏng.','Xóa bình luận'))return;try{V.XuLyTuongTac.xoaBinhLuan(row.maBinhLuan);if(editing?.maBinhLuan===row.maBinhLuan){editing=null;draftText='';}renderComments();U.toast('Đã xóa bình luận.');}catch(e){U.actionError(e);}})));commentsArea.append(h('article',{class:'comment'},U.avatar(author.hoTen,author.anhDaiDien),copy));}
    }
    renderMeta();renderComments();
    if(!preview){const{data,video}=context(),all=V.XuLyVideo.danhSach(data).filter(v=>v.maVideo!==id).sort((a,b)=>Number(b.danhMuc===video.danhMuc)-Number(a.danhMuc===video.danhMuc)||Number(b.maKenh===video.maKenh)-Number(a.maKenh===video.maKenh));const list=h('div',{class:'related-list'});all.slice(0,4).forEach(v=>list.append(U.videoCard(v,data,true)));related.append(h('h2',{text:'Video liên quan'}),list);}
    U.onStorage=()=>{const next=context();if(!next.video||(!preview&&next.video.trangThai!=='HIEN_THI')||(preview&&!next.own)){unavailable();return;}renderMeta();if(!U.dirty())renderComments();};
    g.addEventListener('pagehide',()=>{writeProgress();stopMedia();});
  };
})(window);
