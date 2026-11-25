// Kiểm tra bằng trình phát thật trong Edge headless trên localhost.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),catalog=require(path.resolve(process.argv[3]||path.join(__dirname,'video-viet-da-xac-minh.json')));
const limit=Number(process.argv[2]||catalog.length),items=catalog.slice(0,limit);
const resultPath=path.resolve(process.argv[4]||path.join(__dirname,'ket-qua-phat-nhung.json'));
const profile=path.join(root,'.tmp','youtube-playback-'+Date.now());
fs.mkdirSync(profile,{recursive:true});
let browser,completed=false;
const html=`<!doctype html><meta charset="utf-8"><meta name="referrer" content="strict-origin-when-cross-origin"><body><h1>Kiểm tra trình phát YouTube</h1><div id="players"></div><script>
const items=${JSON.stringify(items)},results=[];let cursor=0;
async function report(item,result){results.push({...item,...result});await fetch('/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(results)});}
async function check(item){return new Promise(resolve=>{
const div=document.createElement('div');document.getElementById('players').append(div);let player,done=false;
const finish=async result=>{if(done)return;done=true;clearTimeout(timer);if(player)player.destroy();div.remove();await report(item,result);resolve();};
const timer=setTimeout(()=>finish({playable:false,reason:'TIMEOUT'}),25000);
player=new YT.Player(div,{host:'https://www.youtube-nocookie.com',width:480,height:270,videoId:item.youtubeId,playerVars:{autoplay:1,mute:1,origin:location.origin,playsinline:1},events:{
onReady:e=>{e.target.mute();e.target.playVideo();},
onStateChange:e=>{if(e.data===YT.PlayerState.PLAYING)finish({playable:true,state:'PLAYING'});},
onError:e=>finish({playable:false,reason:'YOUTUBE_'+e.data})}});
});}
window.onYouTubeIframeAPIReady=async()=>{async function worker(){while(cursor<items.length)await check(items[cursor++]);}await Promise.all([worker(),worker(),worker()]);await fetch('/done',{method:'POST'});};
const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';document.head.append(script);
</script>`;
const server=http.createServer((req,res)=>{
  if(req.url==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);return;}
  if(req.method==='POST'&&req.url==='/result'){let body='';req.on('data',v=>body+=v);req.on('end',()=>{const rows=JSON.parse(body);fs.writeFileSync(resultPath,JSON.stringify(rows,null,2)+'\n');const last=rows.at(-1);console.log(rows.length+'/'+items.length+' '+last.youtubeId+' '+(last.playable?'PLAYING':last.reason));res.end('ok');});return;}
  if(req.url==='/done'){completed=true;res.end('ok');setTimeout(cleanup,500);return;}
  res.statusCode=404;res.end();
});
const timeout=setTimeout(()=>{console.error('Hết thời gian kiểm tra');process.exitCode=1;cleanup();},Math.ceil(items.length/3)*27000+30000);
function cleanup(){clearTimeout(timeout);if(browser){require('node:child_process').spawnSync('taskkill',['/PID',String(browser.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});}server.close();if(!completed)process.exitCode=1;}
server.listen(5507,'127.0.0.1',()=>{
  browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
    '--headless=new','--no-first-run','--no-default-browser-check','--autoplay-policy=no-user-gesture-required',
    '--disable-background-timer-throttling','--disable-renderer-backgrounding','--user-data-dir='+profile,'http://127.0.0.1:5507'
  ],{windowsHide:true,stdio:'ignore'});
  browser.on('error',e=>{console.error(e.message);cleanup();});
});
