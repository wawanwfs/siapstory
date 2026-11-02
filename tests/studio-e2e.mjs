// End-to-end media test executed in real Chromium by GitHub Actions.
// Generates a local H.264 + AAC test clip. No user media leaves the browser.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {existsSync,createReadStream,mkdirSync} from 'node:fs';
import {readFile,stat} from 'node:fs/promises';
import {join,extname,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {mkdtempSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root=resolve('dist');
const temp=mkdtempSync(join(tmpdir(),'storysiap-video-'));
const input=join(temp,'source.mp4');
const ff=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','lavfi','-i','testsrc2=size=360x640:rate=30','-f','lavfi','-i','sine=frequency=440:sample_rate=48000','-t','4','-c:v','libx264','-preset','veryfast','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-shortest',input],{encoding:'utf8',timeout:45000});
assert.equal(ff.status,0,'ffmpeg test input failed: '+ff.stderr);
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.mp4':'video/mp4'};
const server=createServer(async(req,res)=>{
  try{
    const key=decodeURI((req.url||'/').split('?')[0]);
    const full=resolve(root,'.'+(key==='/'?'/studio.html':key));
    if(!full.startsWith(root+'/'))throw Error('unsafe path');
    const s=await stat(full);if(!s.isFile())throw Error('not file');
    res.writeHead(200,{'Content-Type':mime[extname(full)]||'application/octet-stream','Content-Length':s.size,'Cache-Control':'no-store'});
    createReadStream(full).pipe(res);
  }catch{res.writeHead(404);res.end('not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const page=await browser.newPage({acceptDownloads:true,viewport:{width:1366,height:850}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/studio.html',{waitUntil:'load'});
  assert.equal(await page.locator('#export').isDisabled(),true,'Export should be disabled before selecting media');
  await page.locator('#upload').setInputFiles(input);
  await page.waitForFunction(()=>window.storysiapVideo&&window.storysiapVideo.duration>=3,{timeout:12000});
  assert.equal(await page.locator('#videoTools').isVisible(),true,'Video timeline visible');
  const duration=await page.evaluate(()=>window.storysiapVideo.duration);
  assert.ok(duration>=3,'decoded video duration unavailable');
  await page.locator('#size').selectOption('540');
  await page.locator('#format').selectOption('webm');
  await page.locator('#clipLength').fill('2');
  await page.locator('#keepAudio').check();
  await page.locator('#caption').fill('STORYSIAP TEST');
  await page.locator('#export').click();
  await page.locator('#result').waitFor({state:'visible',timeout:45000});
  const resultText=await page.locator('#resultInfo').innerText();
  assert.match(resultText,/WEBM/i,'Must correctly label the recorded container');
  const downloadPromise=page.waitForEvent('download',{timeout:10000});
  await page.locator('#download').click();
  const download=await downloadPromise;
  const output=join(temp,'output.webm');await download.saveAs(output);
  assert.ok((await stat(output)).size>2000,'Video output is empty');
  const probe=spawnSync('ffprobe',['-v','error','-show_streams','-of','json',output],{encoding:'utf8'});
  assert.equal(probe.status,0,'Exported file must decode in ffprobe: '+probe.stderr);
  const streams=JSON.parse(probe.stdout).streams||[];
  assert.ok(streams.some(s=>s.codec_type==='video'),'Export must contain video track');
  assert.ok(streams.some(s=>s.codec_type==='audio'),'Keep audio should preserve audio track');
  const video=streams.find(s=>s.codec_type==='video');
  assert.equal(video.width,540,'Portrait FullHD/Lite width selection');
  assert.equal(video.height,960,'Portrait Lite 9:16 height selection');
  assert.equal(errors.length,0,'Uncaught browser JS errors: '+errors.join(' | '));
  console.log('PASS: real '+resultText+'; video+audio tracks and 9:16 dimensions validated');
}finally{
  await browser?.close();await new Promise(resolve=>server.close(resolve));
}
