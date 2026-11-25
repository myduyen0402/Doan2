const fs=require('node:fs'),path=require('node:path');
function videos(v,out=[]){if(!v||typeof v!=='object')return out;if(v.videoRenderer?.videoId)out.push(v.videoRenderer);for(const x of Object.values(v))if(x&&typeof x==='object')videos(x,out);return out;}
(async()=>{
 const rows=[];
 for(const [query,author] of [['Ngọt official MV',/^Ngọt$/i],['Bùi Công Nam official MV',/Bùi Công Nam/i],['Vũ Cát Tường official MV',/Vũ Cát Tường/i]]){
  const html=await(await fetch('https://www.youtube.com/results?search_query='+encodeURIComponent(query),{signal:AbortSignal.timeout(20000)})).text();
  const match=html.match(/(?:var\s+)?ytInitialData\s*=\s*(\{.*?\});<\/script>/s);if(!match)continue;
  let count=0;
  for(const item of videos(JSON.parse(match[1]))){
   if(count>=7)break;
   if(!item.lengthText||!author.test(item.ownerText?.runs?.map(r=>r.text).join('')||'')||rows.some(v=>v.youtubeId===item.videoId))continue;
   try{const url='https://www.youtube.com/watch?v='+item.videoId,response=await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent(url),{signal:AbortSignal.timeout(10000)});if(!response.ok)continue;const info=await response.json();if(!author.test(info.author_name))continue;
    rows.push({youtubeId:item.videoId,title:info.title,category:'Âm nhạc',author:info.author_name,authorUrl:info.author_url,url,verifiedAt:'2026-10-27'});count++;
   }catch(_){}
  }
  console.log(query+': '+count);
 }
 fs.writeFileSync(path.join(__dirname,'ung-vien-am-nhac.json'),JSON.stringify(rows,null,2)+'\n');console.log('Ứng viên: '+rows.length);
})().catch(e=>{console.error(e);process.exitCode=1;});
