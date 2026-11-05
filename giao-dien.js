(function (g) {
  'use strict';
  const V = g.VideoShare, body = document.body;
  const BASE = new URL(body.dataset.depth === '1' ? '../' : './', g.location.href);
  const paths = ['index.html','tim-kiem.html','xem-video.html','kenh.html','dang-nhap.html','dang-ky.html','thu-vien.html','tai-video.html','video-cua-toi.html','tai-khoan.html','admin/index.html','admin/dang-nhap.html'];
  const iconPaths = {menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',home:'<path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7"/>',library:'<path d="M4 4v16M9 4v16M14 4v16M18 5l3 14"/>',upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',video:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m10 8 6 4-6 4z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',like:'<path d="M8 10 12 3c3 0 2 5 2 6h5c2 0 2 2 1 5l-2 6H8zM3 10h5v10H3z"/>',dislike:'<path d="m8 14 4 7c3 0 2-5 2-6h5c2 0 2-2 1-5l-2-6H8zM3 4h5v10H3z"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',admin:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6"/>',comment:'<path d="M3 3h18v14H8l-5 4z"/>',close:'<path d="m5 5 14 14M19 5 5 19"/>',play:'<path d="m7 3 14 9-14 9z"/>'};
  function h(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key,value] of Object.entries(attrs)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (['value','checked','disabled','readOnly','hidden'].includes(key)) node[key] = value;
      else node.setAttribute(key, value === true ? '' : String(value));
    }
    for (const child of children.flat(Infinity)) if (child !== null && child !== undefined && child !== false) node.append(child.nodeType ? child : document.createTextNode(String(child)));
    if (tag === 'img' && /^https:\/\/i\.ytimg\.com\//.test(attrs.src || '')) node.addEventListener('error',()=>{node.src=url('assets/img/default.svg');},{once:true});
    return node;
  }
  function icon(name) { const wrap = h('span',{'aria-hidden':'true'}); wrap.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + (iconPaths[name] || iconPaths.video) + '</svg>'; return wrap.firstChild; }
  function url(path, params = {}) { const result = new URL(path, BASE); for (const [key,value] of Object.entries(params)) if (value !== undefined && value !== null && value !== '') result.searchParams.set(key,value); return result.href; }
  function imageSrc(value, source = '') {
    if ((!value || value === 'assets/img/default.svg') && source) value = V.anhBiaYouTube(source) || value;
    if (/^https:\/\/i\.ytimg\.com\/vi\/[\w-]{11}\/hqdefault\.jpg$/.test(value || '')) return value;
    if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(value || '')) return value;
    if (/^assets\/img\/[a-z0-9-]+\.svg$/.test(value || '')) return url(value);
    return url('assets/img/default.svg');
  }
  function avatar(name, image = '', large = false) { const a = h('span',{class:'avatar' + (large ? ' large' : ''),'aria-hidden':'true'}); if (image && imageSrc(image) !== url('assets/img/default.svg')) a.append(h('img',{src:imageSrc(image),alt:''})); else a.textContent = (String(name || '?').trim().split(/\s+/).at(-1)[0] || '?').toUpperCase(); return a; }
  const number = value => new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0}).format(value);
  const date = value => { const d = new Date(value); return Number.isNaN(d.valueOf()) ? '' : new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d); };
  const time = value => { const d = new Date(value); return Number.isNaN(d.valueOf()) ? '' : new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit'}).format(d); };
  const seconds = value => { const s = Math.floor(value), hours = Math.floor(s/3600); return (hours ? hours + ':' : '') + String(Math.floor(s%3600/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0'); };
  function button(label, fn, primary = false) { return h('button',{class:'button' + (primary ? ' primary' : ''),type:'button',onclick:fn},label); }
  function empty(title, detail, action = null) { return h('div',{class:'empty'},h('h2',{text:title}),h('p',{text:detail}),action); }
  function toast(message, error = false) { const box = document.getElementById('app-message'); box.hidden = false; box.className = 'notice app-message' + (error ? ' error' : ''); box.setAttribute('role',error ? 'alert' : 'status'); box.replaceChildren(h('span',{text:message}),h('button',{type:'button',class:'icon-button','aria-label':'Đóng thông báo',onclick:()=>{box.hidden=true;}},icon('close'))); }
  function safeReturn(input, adminOnly = false) {
    try { const u = new URL(input || (adminOnly ? 'admin/index.html' : 'index.html'),BASE), relative = u.pathname.slice(BASE.pathname.length); if (u.origin !== BASE.origin || !u.pathname.startsWith(BASE.pathname) || !paths.includes(relative) || /dang-(nhap|ky)\.html$/.test(relative)) throw new Error(); if (relative.startsWith('admin/') && V.XuLyTaiKhoan.hienTai()?.vaiTro !== 'admin') throw new Error(); if (adminOnly && relative !== 'admin/index.html') throw new Error(); return u.href; }
    catch (_) { return url(adminOnly ? 'admin/index.html' : 'index.html'); }
  }
  function login(admin = false) { g.location.href = url(admin ? 'admin/dang-nhap.html' : 'dang-nhap.html',{next:g.location.href}); }
  function requireLogin(admin = false) {
    const current = V.XuLyTaiKhoan.hienTai();
    if (!current) { login(admin); return null; }
    if (admin && current.vaiTro !== 'admin') { g.location.href = url('admin/dang-nhap.html',{next:url('admin/index.html')}); return null; }
    return current;
  }
  function actionError(error, form = null) {
    if (error.code === 'AUTH') { login(body.dataset.admin === 'true'); return; }
    if (form && error.fields) errors(form,error.fields);
    toast(error.message || 'Không thực hiện được thao tác. Vui lòng thử lại.',true);
  }
  function errors(form, map = {}) { form.querySelectorAll('[data-field-error]').forEach(n=>{n.textContent='';}); form.querySelectorAll('[aria-invalid]').forEach(n=>n.removeAttribute('aria-invalid')); let first = null; for (const [name,message] of Object.entries(map)) { const input = form.elements.namedItem(name), err = form.querySelector('[data-field-error="' + name + '"]'); if (err) err.textContent = message; if (input) {input.setAttribute('aria-invalid','true');first=first||input;} } if (first) first.focus(); }
  function field(name, label, options = {}) {
    const id = 'field-' + name, input = h(options.multiline ? 'textarea' : options.select ? 'select' : 'input',{id,name,required:options.required || false,...(options.multiline || options.select ? {} : {type:options.type || 'text'}),...(options.max ? {maxlength:options.max} : {}),...(options.autocomplete ? {autocomplete:options.autocomplete} : {}),...(options.readonly ? {readOnly:true} : {})});
    if (options.select) { input.append(h('option',{value:'',text:'Chọn danh mục'})); V.DANH_MUC.forEach(category=>input.append(h('option',{value:category,text:category}))); }
    if (options.rows) input.rows = options.rows;
    input.value = options.value || '';
    const wrapper = h('div',{class:'field'},h('label',{for:id},label + (options.required ? ' *' : '')));
    if (options.type === 'password') { const toggle = h('button',{type:'button','aria-label':'Hiện mật khẩu','aria-pressed':'false',onclick:()=>{const show=input.type==='password';input.type=show?'text':'password';toggle.textContent=show?'Ẩn':'Hiện';toggle.setAttribute('aria-label',show?'Ẩn mật khẩu':'Hiện mật khẩu');toggle.setAttribute('aria-pressed',String(show));}},'Hiện'); wrapper.append(h('div',{class:'password-wrap'},input,toggle)); } else wrapper.append(input);
    const refs = []; if (options.hint) {wrapper.append(h('p',{id:id+'-hint',class:'hint',text:options.hint}));refs.push(id+'-hint');}
    wrapper.append(h('p',{id:id+'-error',class:'field-error',role:'alert','data-field-error':name}));refs.push(id+'-error');input.setAttribute('aria-describedby',refs.join(' '));
    input.addEventListener('input',()=>{input.removeAttribute('aria-invalid');wrapper.querySelector('[data-field-error]').textContent='';});
    return wrapper;
  }
  function imagePicker(name, label, initial = '', avatarMode = false, onChange = ()=>{}) {
    const state = {value:initial,busy:false,problem:false,token:0,reader:null,probe:null};
    const id = 'field-' + name, preview = h('div',{class:'photo-preview'}), input = h('input',{id,name,type:'file',accept:'.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp','aria-describedby':id+'-hint '+id+'-error'}), error = h('p',{id:id+'-error',class:'field-error',role:'alert','data-field-error':name});
    const node = h('div',{class:'field photo-editor' + (avatarMode ? ' avatar-editor' : '')},h('label',{for:id,text:label}),preview,input,h('p',{id:id+'-hint',class:'hint',text:'PNG, JPG hoặc WebP, tối đa 1 MB.'}),error);
    function show() { preview.replaceChildren(state.value ? h('img',{src:imageSrc(state.value),alt:label}) : h('span',{class:'muted small',text:avatarMode?'Ảnh mặc định':'Ảnh thu nhỏ mặc định'})); }
    function abort() { state.token++; if (state.reader) {state.reader.onload=null;state.reader.onerror=null;if(state.reader.readyState===1)state.reader.abort();state.reader=null;} if (state.probe) {state.probe.onload=null;state.probe.onerror=null;state.probe=null;} state.busy=false; }
    function reset(value = initial) { abort();state.value=value;state.problem=false;input.value='';error.textContent='';input.removeAttribute('aria-invalid');show();onChange(); }
    function fail(message) { state.busy=false;state.problem=true;error.textContent=message;input.setAttribute('aria-invalid','true');onChange(); }
    input.addEventListener('change',()=>{const file=input.files[0];if(!file)return;abort();state.problem=false;error.textContent='';input.removeAttribute('aria-invalid');if(!/\.(png|jpe?g|webp)$/i.test(file.name)||!['','image/png','image/jpeg','image/webp'].includes(file.type)||!file.size||file.size>1048576){fail('Chọn ảnh PNG, JPG hoặc WebP không rỗng, tối đa 1 MB.');return;}state.busy=true;onChange();const token=state.token,reader=new FileReader();state.reader=reader;reader.onerror=()=>{if(token===state.token)fail('Không đọc được ảnh. Hãy chọn ảnh khác.');};reader.onload=()=>{if(token!==state.token)return;const image=new Image();state.probe=image;image.onload=()=>{if(token!==state.token)return;state.value=reader.result;state.busy=false;state.problem=false;show();onChange();};image.onerror=()=>{if(token===state.token)fail('Không giải mã được ảnh. Hãy chọn ảnh khác hoặc dùng ảnh mặc định.');};image.src=reader.result;};try{reader.readAsDataURL(file);}catch(_){fail('Không đọc được ảnh đã chọn.');}});
    node.append(h('div',{class:'actions'},button('Dùng ảnh mặc định',()=>reset(''))));show();g.addEventListener('pagehide',abort);
    return {node,state,reset,abort};
  }
  function videoCard(video, data, compact = false) {
    const channel = data.Kenh.find(k=>k.maKenh===video.maKenh), current = V.XuLyTaiKhoan.hienTai(data), saved = current && data.TuongTac.some(r=>r.maNguoiDung===current.maNguoiDung&&r.maVideo===video.maVideo&&r.loaiTuongTac==='XEM_SAU');
    const cover = h('a',{class:'thumbnail',href:url('xem-video.html',{id:video.maVideo}),'aria-label':'Xem '+video.tieuDe},h('img',{src:imageSrc(video.anhThuNho,video.duongDanVideo),alt:'',loading:'lazy'}),h('span',{class:'source-tag',text:video.loaiNguon==='CUC_BO'?'MP4 cục bộ':video.kieuPhat==='NHUNG'?'Video nhúng':'MP4 trực tuyến'}));
    const copy = h('div',{class:'card-copy'},h(compact?'h3':'h2',{},h('a',{href:url('xem-video.html',{id:video.maVideo}),text:video.tieuDe})),h('p',{class:'meta'},h('a',{href:url('kenh.html',{id:video.maKenh}),text:channel?.tenKenh||'Kênh video'})),h('p',{class:'meta',text:number(video.luotXem)+' lượt mở · '+date(video.ngayDang)}));
    const save = button(saved?'Đã lưu':'Xem sau',()=>{if(!requireLogin())return;try{V.XuLyTuongTac.xemSau(video.maVideo);const now=V.KhoDuLieu.doc(),u=V.XuLyTaiKhoan.hienTai(now),on=now.TuongTac.some(r=>r.maNguoiDung===u.maNguoiDung&&r.maVideo===video.maVideo&&r.loaiTuongTac==='XEM_SAU');save.textContent=on?'Đã lưu':'Xem sau';save.setAttribute('aria-pressed',String(on));toast(on?'Đã lưu vào Xem sau.':'Đã bỏ khỏi Xem sau.');}catch(e){actionError(e);}});save.classList.add('card-save');save.setAttribute('aria-pressed',String(!!saved));save.setAttribute('aria-label','Xem sau: '+video.tieuDe);copy.append(save);
    if(video.kenhYouTube&&video.kenhYouTube!==channel?.tenKenh)copy.insertBefore(h('p',{class:'meta',text:'YouTube · '+video.kenhYouTube}),copy.children[1]);
    return h('article',{class:'video-card'},cover,h('div',{class:'card-info'},avatar(channel?.tenKenh,channel?.anhDaiDien),copy));
  }
  function confirm(title, detail = '', accept = 'Xác nhận') {
    const dialog = document.getElementById('app-dialog');if(dialog.open)return Promise.resolve(false);
    document.getElementById('dialog-title').textContent=title;document.getElementById('dialog-detail').textContent=detail;document.getElementById('dialog-accept').textContent=accept;dialog.returnValue='cancel';dialog.showModal();document.getElementById('dialog-cancel').focus();
    const actor=V.KhoDuLieu.sessionId();return new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue==='ok'&&V.KhoDuLieu.sessionId()===actor),{once:true}));
  }
  const U = V.UI = {h,icon,url,imageSrc,avatar,number,date,time,seconds,button,empty,toast,safeReturn,login,requireLogin,actionError,errors,field,imagePicker,videoCard,confirm,dirty:()=>false,base:BASE};
  U.playVideo=async media=>{try{await media.play();return true;}catch(error){if(error.name==='NotAllowedError'){media.muted=true;try{await media.play();return true;}catch(_){}}return false;}};
  function header() {
    const current = V.XuLyTaiKhoan.hienTai(), data = V.KhoDuLieu.doc(), admin = body.dataset.admin === 'true';
    const mark = h('span',{class:'brand-mark'},icon('play')), brand = h('a',{class:'brand',href:url('index.html')},mark,h('span',{class:'brand-name',text:'VideoShare'}),admin?h('span',{class:'admin-label',text:'Admin'}):null);
    const head = h('header',{class:'site-header' + (admin?' admin-header':'')},h('button',{class:'icon-button',type:'button','aria-label':'Mở hoặc đóng điều hướng','aria-controls':'site-sidebar','aria-expanded':String(!g.matchMedia('(max-width:760px)').matches),onclick:()=>{const shell=document.getElementById('site-shell'),mobile=g.matchMedia('(max-width:760px)').matches,watch=body.dataset.page==='watch';if(mobile||watch)shell.classList.toggle('menu-open');else shell.classList.toggle('sidebar-closed');const open=mobile||watch?shell.classList.contains('menu-open'):!shell.classList.contains('sidebar-closed');head.querySelector('[aria-controls="site-sidebar"]').setAttribute('aria-expanded',String(open));}},icon('menu')),brand);
    if (!admin) {
      const search = h('form',{class:'header-search',role:'search',onsubmit:async event=>{event.preventDefault();if(U.dirty()&&!await confirm('Tìm kiếm và bỏ thay đổi chưa lưu?','Thông tin đã lưu vẫn được giữ.','Tìm kiếm'))return;U.dirty=()=>false;g.location.href=url('tim-kiem.html',{q:search.elements.q.value.trim()});}},h('input',{name:'q',type:'search',placeholder:'Tìm kiếm video','aria-label':'Tìm kiếm video',value:new URLSearchParams(g.location.search).get('q')||'',maxlength:'254'}),h('button',{type:'submit','aria-label':'Tìm kiếm'},icon('search')));head.append(search);
    } else head.append(h('span',{class:'header-space'}));
    head.append(h('button',{class:'icon-button',type:'button','aria-label':'Đổi giao diện sáng hoặc tối',onclick:()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{g.localStorage.setItem('videoshare.doan.theme',next);}catch(_){toast('Giao diện đã đổi nhưng chưa lưu được lựa chọn.',true);}}},icon('sun')));
    const logout = async()=>{if(U.dirty()&&!await confirm('Đăng xuất và bỏ thay đổi chưa lưu?','Thông tin đã lưu vẫn được giữ.','Đăng xuất'))return;try{V.XuLyTaiKhoan.dangXuat();U.dirty=()=>false;g.location.href=url(admin?'admin/dang-nhap.html':'index.html');}catch(e){actionError(e);}};
    if (current && admin) head.append(h('span',{class:'admin-account-name',text:current.hoTen}),button('Đăng xuất',logout));
    else if (current) {
      const channel=data.Kenh.find(k=>k.maNguoiDung===current.maNguoiDung), menu=h('details',{class:'account-menu'},h('summary',{'aria-label':'Tài khoản '+current.hoTen},avatar(current.hoTen,current.anhDaiDien)));
      const popup=h('div',{class:'account-popover'},h('p',{class:'account-name',text:current.hoTen}),h('a',{href:url('tai-khoan.html')},icon('user'),'Tài khoản cá nhân'),h('a',{href:url('kenh.html',{id:channel.maKenh})},icon('video'),'Kênh của tôi'),h('a',{href:url('thu-vien.html')},icon('library'),'Thư viện'),h('a',{href:url('tai-video.html')},icon('upload'),'Tải video lên'));
      if(current.vaiTro==='admin')popup.append(h('a',{href:url('admin/index.html')},icon('admin'),'Quản trị'));
      popup.append(button('Đăng xuất',logout));menu.append(popup);head.append(menu);
    } else if (!admin) head.append(h('a',{class:'button',href:url('dang-nhap.html',{next:g.location.href}),text:'Đăng nhập'}));
    document.getElementById('site-header').replaceChildren(head);
  }
  function sidebar() {
    const admin = body.dataset.admin === 'true', page=body.dataset.page;
    const links=admin?[['Tổng quan','admin/index.html','admin','admin'],['Video','admin/index.html?muc=video','admin','video'],['Người dùng','admin/index.html?muc=nguoi-dung','user','users'],['Bình luận','admin/index.html?muc=binh-luan','comment','comments']]:[['Trang chủ','index.html','home','home'],['Thư viện','thu-vien.html','library','library'],['Tải video lên','tai-video.html','upload','upload'],['Video của tôi','video-cua-toi.html','video','mine']];
    const nav=h('nav',{'aria-label':admin?'Điều hướng quản trị':'Điều hướng chính'});
    for(const[label,path,name,key]of links){const link=h('a',{href:url(path)},icon(name),label);if(!admin&&key===page)link.setAttribute('aria-current','page');nav.append(link);}
    if(admin)nav.append(h('hr',{class:'divider'}),h('a',{href:url('index.html')},icon('home'),'Về website'));
    document.getElementById('site-sidebar').replaceChildren(nav,h('p',{text:'Được tạo bởi Npdv'}));
  }
  U.syncHeader=header;
  U.boot=function () {
    V.KhoDuLieu.doc();
    let theme;try{theme=g.localStorage.getItem('videoshare.doan.theme');}catch(_){}document.documentElement.dataset.theme=theme|| (g.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
    header();sidebar();
    const shell=document.getElementById('site-shell');if(['login','register','admin-login'].includes(body.dataset.page))shell.classList.add('auth-shell');if(body.dataset.page==='watch')shell.classList.add('watch-shell');
    const dialog=document.getElementById('app-dialog');document.getElementById('dialog-cancel').onclick=()=>dialog.close('cancel');document.getElementById('dialog-accept').onclick=()=>dialog.close('ok');dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.close('cancel');});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('details.account-menu[open]').forEach(n=>n.removeAttribute('open'));});
    document.addEventListener('click',async event=>{const link=event.target.closest('a[href]');if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||link.target==='_blank'||(link.hash&&link.href.split('#')[0]===g.location.href.split('#')[0])||!U.dirty())return;event.preventDefault();if(await confirm('Rời trang và bỏ thay đổi chưa lưu?','Thông tin đã lưu vẫn được giữ.','Rời trang')){U.dirty=()=>false;g.location.href=link.href;}});
    g.addEventListener('beforeunload',event=>{if(U.dirty()){event.preventDefault();event.returnValue='';}});
    if(g.location.protocol==='file:')toast('Hãy mở website bằng Live Server hoặc máy chủ tĩnh theo README để các trang dùng chung dữ liệu.',true);
  };
})(window);
