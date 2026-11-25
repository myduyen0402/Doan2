// Chỉ đọc trang YouTube công khai và oEmbed; không cần khóa API.
const fs = require('node:fs');
const path = require('node:path');
const groups = [
  ['Âm nhạc', 'Bùi Công Nam official MV', /Bùi Công Nam/i],
  ['Game', 'MixiGaming chơi game', /MixiGaming/i],
  ['Giải trí', 'Schannel thử thách', /^Schannel$/i],
  ['Du lịch', 'Khoai Lang Thang du lịch', /Khoai Lang Thang/i],
  ['Ẩm thực', 'Vành Khuyên Lê nấu ăn', /Vành Khuyên/i],
  ['Công nghệ', 'Vật Vờ Studio đánh giá', /Vật Vờ Studio/i],
  ['Học tập', 'F8 Official lập trình', /F8.*Official/i],
  ['Khoa học', 'Kiến Thức Thú Vị khoa học', /Kiến Thức Thú Vị/i],
  ['Thể thao', 'BLV Anh Quân bóng đá', /^BLV Anh Quân$/i],
  ['Đời sống', 'Giang Ơi vlog', /^Giang Ơi$/i]
];
async function get(url) {
  const response = await fetch(url,{headers:{'User-Agent':'Mozilla/5.0','Accept-Language':'vi-VN,vi;q=0.9'},signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error('HTTP '+response.status);
  return response;
}
function videos(value,out=[]) {
  if(!value||typeof value!=='object')return out;
  if(value.videoRenderer?.videoId)out.push(value.videoRenderer);
  for(const child of Object.values(value))if(child&&typeof child==='object')videos(child,out);
  return out;
}
(async()=>{
  const outputPath=path.join(__dirname,'video-viet-da-xac-minh.json');
  const output=fs.existsSync(outputPath)?JSON.parse(fs.readFileSync(outputPath,'utf8')):[],seen=new Set(output.map(v=>v.youtubeId));
  for(const [category,query,author] of groups){
    if(output.filter(v=>v.category===category).length===5)continue;
    const html=await(await get('https://www.youtube.com/results?search_query='+encodeURIComponent(query))).text();
    const match=html.match(/(?:var\s+)?ytInitialData\s*=\s*(\{.*?\});<\/script>/s);
    if(!match)throw new Error('Không đọc được kết quả: '+query);
    const candidates=videos(JSON.parse(match[1]));let count=output.filter(v=>v.category===category).length;
    for(const item of candidates){
      if(count===5)break;
      if(seen.has(item.videoId)||!item.lengthText)continue;
      const owner=(item.ownerText?.runs||[]).map(x=>x.text).join('');
      if(!author.test(owner))continue;
      try{
        const url='https://www.youtube.com/watch?v='+item.videoId;
        const info=await(await get('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent(url))).json();
        if(!author.test(info.author_name)||!info.title)continue;
        output.push({youtubeId:item.videoId,title:info.title,category,author:info.author_name,authorUrl:info.author_url,url,verifiedAt:'2026-10-27'});
        seen.add(item.videoId);count++;
      }catch(error){process.stdout.write('Bỏ qua '+item.videoId+': '+error.message+'\n');}
    }
    process.stdout.write(category+': '+count+' video\n');
    fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n');
    if(count!==5)throw new Error('Chưa đủ video cho '+category+' ('+count+'/5)');
  }
  fs.writeFileSync(path.join(__dirname,'video-viet-da-xac-minh.json'),JSON.stringify(output,null,2)+'\n');
  process.stdout.write('Đã xác minh '+output.length+' video từ kênh Việt qua YouTube oEmbed.\n');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
