const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const catalog=require('./video-viet-da-xac-minh.json');
assert.equal(catalog.length,50);assert.equal(new Set(catalog.map(v=>v.youtubeId)).size,50);
const playback=require('./ket-qua-phat-nhung.json');
for(const video of catalog)assert.ok(playback.some(v=>v.youtubeId===video.youtubeId&&v.playable===true&&v.state==='PLAYING'),'Chưa phát nhúng thành công: '+video.youtubeId);
const file=path.resolve(__dirname,'../dist/assets/js/du-lieu-mau.js');
let source=fs.readFileSync(file,'utf8');
const channelId=v=>'K_YT_'+v.authorUrl.split('/').at(-1).replace(/^@/,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').replace(/[^a-z0-9]/gi,'_').toUpperCase();
const rows=catalog.map((v,i)=>'                movie('+[
  'VD_VIET_'+String(i+1).padStart(2,'0'),v.title,v.youtubeId,'default',0,v.category,channelId(v),v.author,v.authorUrl
].map(x=>JSON.stringify(x)).join(', ')+')');
source=source.replace(/Video: \[[\s\S]*?\],/,'Video: [\n'+rows.join(',\n')+'\n            ],');
fs.writeFileSync(file,source);
console.log('Đã thêm '+catalog.length+' video / '+new Set(catalog.map(v=>v.category)).size+' danh mục.');
