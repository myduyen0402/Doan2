const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../dist');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):path.join(dir,e.name));}
const all=files(root),pages=all.filter(p=>p.endsWith('.html')),controllers=new Set();
assert.equal(pages.length,12,'Cần đủ 12 trang HTML');
for(const filename of pages){
  const html=fs.readFileSync(filename,'utf8');
  for(const pattern of [/<html lang="vi">/,/name="viewport"/,/id="noi-dung"/,/id="app-dialog"/])assert.match(html,pattern);
  const page=html.match(/data-page="([^"]+)"/)?.[1]; assert.ok(page,filename); assert.ok(!controllers.has(page),page); controllers.add(page);
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
    const source=match[1];if(/^(https?:|data:|#)/.test(source))continue;
    const target=path.resolve(path.dirname(filename),source.split(/[?#]/)[0]);assert.ok(target.startsWith(root+path.sep),source);assert.ok(fs.existsSync(target),`${filename}: thiếu ${source}`);
  }
  const scripts=[...html.matchAll(/<script defer src="([^"]+)"/g)].map(m=>path.basename(m[1]));
  assert.deepEqual(scripts.slice(0,4),['du-lieu-mau.js','luu-tru.js','nghiep-vu.js','giao-dien.js']);assert.equal(scripts.at(-1),'khoi-tao.js');assert.equal(scripts.length,6);
}
for(const filename of all.filter(p=>p.endsWith('.js'))){const result=spawnSync(process.execPath,['--check',filename],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);}
console.log(`Đạt: ${pages.length} trang HTML; tài nguyên nội bộ và cú pháp tất cả JavaScript hợp lệ.`);
