const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const catalog=require('./video-viet-da-xac-minh.json'),music=require('./ket-qua-am-nhac.json');
const replacements=music.filter(v=>v.playable&&v.state==='PLAYING').slice(0,5);assert.equal(replacements.length,5);
let index=0;
const updated=catalog.map(v=>v.category==='Âm nhạc'?replacements[index++]:v);
fs.writeFileSync(path.join(__dirname,'video-viet-da-xac-minh.json'),JSON.stringify(updated,null,2)+'\n');
console.log('Đã thay 5 video nhạc bị chặn bằng 5 video đã phát thật thành công.');
