/* StorySiap Creative Studio v8
   Browser-native video editing: trim + color + framing + audio + real video export.
   Output MIME is selected by actual MediaRecorder support. Never fake MP4. */
const byId=id=>document.getElementById(id);
const preview=byId('previewCanvas'),previewCtx=preview.getContext('2d',{alpha:false});
const sourceVideo=byId('sourceVideo'),outputCanvas=document.createElement('canvas');
const outputCtx=outputCanvas.getContext('2d',{alpha:false});
const state={file:null,url:null,kind:null,image:null,duration:0,active:false,exporting:false,previewRaf:0,exportRaf:0,blobUrl:null,recording:null,audioContext:null,audioSource:null,audioDestination:null,videoError:null,abortExport:null};
const ids=['ratio','size','fit','format','trimStart','clipLength','keepAudio','brightness','contrast','saturation','warmth','grain','vignette','caption'];
const looks={natural:{brightness:100,contrast:100,saturation:100,warmth:0,grain:0,vignette:0},cinema:{brightness:94,contrast:116,saturation:83,warmth:-6,grain:9,vignette:22},golden:{brightness:106,contrast:108,saturation:122,warmth:21,grain:7,vignette:13},noir:{brightness:100,contrast:133,saturation:0,warmth:0,grain:17,vignette:30}};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const isVideo=()=>state.kind==='video';
const status=(message,error=false)=>{const el=byId('status');el.textContent=message;el.classList.toggle('error',error)};
const stamp=t=>{if(!Number.isFinite(t))return '0:00.0';const m=Math.floor(t/60),s=(t-m*60).toFixed(1).padStart(4,'0');return m+':'+s};
const getDuration=()=>isVideo()&&Number.isFinite(sourceVideo.duration)?sourceVideo.duration:0;
const trim=()=>{const duration=getDuration(),start=clamp(Number(byId('trimStart').value)||0,0,Math.max(0,duration-.05));const length=clamp(Number(byId('clipLength').value)||15,.05,60);return {start,end:Math.min(duration,start+length),duration:Math.min(length,duration-start)}};
const ratio=()=>byId('ratio').value.split(':').map(Number);
const size=()=>{const [a,b]=ratio(),long=Number(byId('size').value),width=a<=b?Math.round(long*a/b):long,height=a<=b?long:Math.round(long*b/a);return {w:Math.max(2,2*Math.round(width/2)),h:Math.max(2,2*Math.round(height/2))}};
function setPreviewSize(){const [a,b]=ratio(),max=640;preview.width=a<=b?Math.round(max*a/b):max;preview.height=a<=b?max:Math.round(max*b/a);byId('previewRatio').textContent=byId('ratio').value+' / LIVE'}
function redraw(){if(previewCtx)paint(previewCtx,preview.width,preview.height)}
function paint(ctx,w,h){
  ctx.save();ctx.clearRect(0,0,w,h);
  const bg=ctx.createLinearGradient(0,0,w,h);
  bg.addColorStop(0,'#312343');bg.addColorStop(.56,'#624b7c');bg.addColorStop(1,'#171122');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  const image=isVideo()?sourceVideo:state.image;
  const iw=image?(isVideo()?image.videoWidth:image.naturalWidth):0;
  const ih=image?(isVideo()?image.videoHeight:image.naturalHeight):0;
  if(iw>0&&ih>0&&(!isVideo()||sourceVideo.readyState>=2)){
    const scale=byId('fit').value==='cover'?Math.max(w/iw,h/ih):Math.min(w/iw,h/ih);
    const dw=iw*scale,dh=ih*scale;
    ctx.filter='brightness('+byId('brightness').value+'%) contrast('+byId('contrast').value+'%) saturate('+byId('saturation').value+'%)';
    try{ctx.drawImage(image,(w-dw)/2,(h-dh)/2,dw,dh)}catch{}
    ctx.filter='none';
  }else{
    ctx.textAlign='center';ctx.fillStyle='#e4d4f4';ctx.font='600 '+Math.max(13,Math.round(w*.038))+'px system-ui,sans-serif';
    ctx.fillText('YOUR STORY GOES HERE',w/2,h*.50);
  }
  const warmth=Number(byId('warmth').value),vignette=Number(byId('vignette').value),grain=Number(byId('grain').value);
  if(warmth){ctx.fillStyle=warmth>0?'rgba(255,170,80,'+(warmth*.0035)+')':'rgba(77,146,247,'+(-warmth*.0035)+')';ctx.fillRect(0,0,w,h)}
  if(vignette){const gradient=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.13,w/2,h/2,Math.max(w,h)*.72);gradient.addColorStop(0,'rgba(0,0,0,0)');gradient.addColorStop(1,'rgba(9,3,20,'+(vignette/110)+')');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h)}
  if(grain){ctx.fillStyle='rgba(255,248,255,'+(grain/550)+')';const n=Math.round(w*h*(grain/45)*.002);for(let i=0;i<n;i++){let x=(i*4733+17)%w,y=(i*7919+43)%h;ctx.fillRect(x,y,Math.max(1,w/900),Math.max(1,w/900))}}
  const caption=byId('caption').value.trim();
  if(caption){
    const font=Math.max(18,Math.round(w*.061)),limit=w*.84;
    ctx.font='600 '+font+'px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';
    let lines=[],line='';
    for(const word of caption.split(/\s+/)){
      const candidate=line?line+' '+word:word;
      if(line&&ctx.measureText(candidate).width>limit){lines.push(line);line=word}else line=candidate;
    }
    if(line)lines.push(line);
    lines=lines.slice(0,3);
    const y=h*.79-(lines.length-1)*font*.55;
    const overlay=ctx.createLinearGradient(0,y-font*3,0,y+font*3);
    overlay.addColorStop(0,'rgba(0,0,0,0)');overlay.addColorStop(.5,'rgba(0,0,0,.4)');overlay.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=overlay;ctx.fillRect(0,y-font*3,w,font*6);
    ctx.fillStyle='#fff';ctx.shadowColor='#000a';ctx.shadowBlur=Math.max(3,w*.013);
    lines.forEach((item,index)=>ctx.fillText(item,w/2,y+index*font*1.16,limit));
    ctx.shadowBlur=0;
  }
  ctx.restore();
}
function updateValues(){
  for(const id of ['brightness','contrast','saturation','warmth','grain','vignette']){
    const o=byId(id+'Label');if(o)o.textContent=byId(id).value+(['brightness','contrast','saturation'].includes(id)?'%':'');
  }
}
function updateTrim(){
  if(!isVideo())return;
  const duration=getDuration();
  byId('trimStart').max=Math.max(0,duration-.05).toFixed(2);
  byId('clipLength').max=Math.max(1,Math.min(60,Math.ceil(duration)));
  const r=trim();
  byId('trimStartLabel').textContent=stamp(r.start);
  byId('clipLengthLabel').textContent=r.duration.toFixed(1)+'s';
  byId('clipRange').textContent=stamp(r.start)+' – '+stamp(r.end);
  byId('videoDuration').textContent='Total '+stamp(duration);
  byId('seek').max=duration.toFixed(3);
  updateTime();
}
function updateTime(){
  byId('clock').textContent=stamp(sourceVideo.currentTime)+' / '+stamp(getDuration());
  byId('seek').value=sourceVideo.currentTime||0;
}
function clearResult(){
  byId('result').hidden=true;byId('resultVideo').pause();byId('resultVideo').removeAttribute('src');byId('resultVideo').load();
  if(state.blobUrl){URL.revokeObjectURL(state.blobUrl);state.blobUrl=null}
}
function stopPreview(){sourceVideo.pause();cancelAnimationFrame(state.previewRaf);state.previewRaf=0;byId('play').textContent='▶'}
function previewFrames(){
  state.previewRaf=0;if(sourceVideo.paused||state.exporting)return;
  const r=trim();if(sourceVideo.currentTime>=r.end-.025){stopPreview();sourceVideo.currentTime=r.start;redraw();return}
  redraw();updateTime();state.previewRaf=requestAnimationFrame(previewFrames);
}
function setBusy(value){state.exporting=value;for(const id of [...ids,'upload','play','seek','original','export']){const el=byId(id);if(el)el.disabled=value||(id==='export'&&!state.file)||(id==='original'&&!state.file)}byId('cancel').hidden=!value;byId('progressWrap').hidden=!value}
function original(){if(!state.file)return;const link=document.createElement('a');link.href=state.url;link.download=state.file.name||'story-original';document.body.append(link);link.click();link.remove()}
async function loadFile(file){
  if(!file||state.exporting)return;
  stopPreview();clearResult();
  if(state.url){URL.revokeObjectURL(state.url);state.url=null}
  state.file=file;state.image=null;state.kind=null;state.duration=0;state.audioSource=null;
  if(state.audioContext){try{await state.audioContext.close()}catch{}state.audioContext=null;state.audioDestination=null}
  state.url=URL.createObjectURL(file);
  byId('fileMeta').textContent=file.name+' · '+(file.size/1024/1024).toFixed(2)+' MB';
  if(file.type.startsWith('image/')||/\.(png|jpe?g|webp|avif|gif)$/i.test(file.name)){
    state.kind='image';
    const img=new Image();
    img.onload=()=>{if(state.image!==img)return;status('Foto siap diedit dan diekspor sebagai PNG.');redraw()};
    img.onerror=()=>status('Foto tidak bisa dibaca oleh browser ini. Coba JPG atau PNG.',true);
    state.image=img;img.src=state.url;
  }else{
    state.kind='video';sourceVideo.muted=true;
    sourceVideo.src=state.url;sourceVideo.load();
    status('Membaca metadata dan codec video…');
  }
  byId('videoTools').hidden=!isVideo();byId('transport').hidden=!isVideo();
  byId('export').textContent=isVideo()?'Export edited video ↗':'Export edited photo ↗';
  byId('export').disabled=false;byId('original').disabled=false;
  updateTrim();redraw();
}
sourceVideo.addEventListener('loadedmetadata',()=>{
  if(!isVideo())return;
  if(!Number.isFinite(sourceVideo.duration)||!sourceVideo.duration||!sourceVideo.videoWidth||!sourceVideo.videoHeight){
    status('Metadata video tidak valid. Coba file MP4/WebM lain.',true);return;
  }
  state.duration=sourceVideo.duration;
  const max=Math.max(0,state.duration-.05);byId('trimStart').max=max.toFixed(2);byId('trimStart').value=0;
  byId('clipLength').value=Math.min(15,Math.max(1,Math.floor(state.duration)));
  updateTrim();
  status('Video siap: '+sourceVideo.videoWidth+' × '+sourceVideo.videoHeight+' · '+stamp(sourceVideo.duration)+' · sesuaikan lalu ekspor.');
});
sourceVideo.addEventListener('loadeddata',redraw);
sourceVideo.addEventListener('seeked',()=>{redraw();updateTime()});
sourceVideo.addEventListener('timeupdate',()=>{if(!state.exporting)updateTime()});
sourceVideo.addEventListener('error',()=>{
  if(!state.file||!isVideo())return;
  status('Codec video tidak dapat diputar oleh browser ini. File MOV/HEVC tertentu memerlukan konversi ke MP4 H.264 terlebih dahulu.',true);
});
byId('upload').addEventListener('change',event=>{loadFile(event.target.files?.[0])});
const drop=byId('drop');
drop.addEventListener('dragover',event=>{event.preventDefault();drop.style.borderColor='#daf6a6'});
drop.addEventListener('dragleave',()=>{drop.style.borderColor=''});
drop.addEventListener('drop',event=>{event.preventDefault();drop.style.borderColor='';if(event.dataTransfer?.files?.[0])loadFile(event.dataTransfer.files[0])});
byId('play').addEventListener('click',async()=>{
  if(!isVideo()||!getDuration()||state.exporting)return;
  if(!sourceVideo.paused){stopPreview();return}
  const r=trim();if(sourceVideo.currentTime<r.start||sourceVideo.currentTime>=r.end-.05)sourceVideo.currentTime=r.start;
  sourceVideo.muted=true;
  try{await sourceVideo.play();byId('play').textContent='Ⅱ';state.previewRaf=requestAnimationFrame(previewFrames)}catch{status('Browser menolak pemutaran video ini. Coba format MP4 H.264.',true)}
});
byId('seek').addEventListener('input',()=>{if(isVideo()&&!state.exporting)sourceVideo.currentTime=Number(byId('seek').value)});
byId('trimStart').addEventListener('input',()=>{stopPreview();const start=Number(byId('trimStart').value);sourceVideo.currentTime=start;updateTrim();redraw()});
byId('clipLength').addEventListener('input',()=>{stopPreview();updateTrim()});
for(const id of ['ratio','size','fit','format','brightness','contrast','saturation','warmth','grain','vignette','caption','keepAudio']){
  byId(id).addEventListener('input',()=>{if(id==='ratio')setPreviewSize();updateValues();redraw()});
}
for(const btn of byId('presets').querySelectorAll('button')){
  btn.addEventListener('click',()=>{
    if(state.exporting)return;
    const preset=looks[btn.dataset.look];if(!preset)return;
    for(const key of Object.keys(preset))byId(key).value=preset[key];
    for(const b of byId('presets').querySelectorAll('button'))b.setAttribute('aria-pressed',String(btn===b));
    updateValues();redraw();
  });
}
function pickMime(wantAudio){
  if(typeof MediaRecorder==='undefined'||typeof MediaRecorder.isTypeSupported!=='function')return null;
  const mp4=wantAudio?['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4;codecs=avc1,mp4a.40.2','video/mp4']:['video/mp4;codecs=avc1.42E01E','video/mp4;codecs=avc1','video/mp4'];
  const webm=wantAudio?['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']:['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
  const order=byId('format').value==='webm'?webm:byId('format').value==='mp4'?mp4:[...mp4,...webm];
  return order.find(type=>MediaRecorder.isTypeSupported(type))||null;
}
async function waitSeek(seconds){
  if(Math.abs(sourceVideo.currentTime-seconds)<.035&&sourceVideo.readyState>=2)return;
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{cleanup();reject(Error('Video tidak merespons saat diposisikan. Coba MP4 H.264.'))},10000);
    const cleanup=()=>{clearTimeout(timer);sourceVideo.removeEventListener('seeked',done);sourceVideo.removeEventListener('error',fail)};
    const done=()=>{cleanup();resolve()};const fail=()=>{cleanup();reject(Error('Gagal membaca frame video.'))};
    sourceVideo.addEventListener('seeked',done,{once:true});sourceVideo.addEventListener('error',fail,{once:true});
    try{sourceVideo.currentTime=seconds}catch(error){cleanup();reject(error)}
  });
}
async function getAudioStream(){
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context)throw Error('Browser ini tidak mendukung ekspor audio. Nonaktifkan Include original audio.');
  if(!state.audioContext||state.audioContext.state==='closed'){
    state.audioContext=new Context();
    state.audioSource=state.audioContext.createMediaElementSource(sourceVideo);
    state.audioDestination=state.audioContext.createMediaStreamDestination();
    state.audioSource.connect(state.audioDestination);
  }
  await state.audioContext.resume();
  const tracks=state.audioDestination.stream.getAudioTracks();
  if(!tracks.length)throw Error('Tidak dapat mengambil track audio. Nonaktifkan opsi audio.');
  return tracks;
}
function setProgress(value,message){byId('progress').value=value;byId('progressLabel').textContent=message}
function showResult(blob,extension,seconds){
  clearResult();
  state.blobUrl=URL.createObjectURL(blob);
  const base=(state.file?.name||'story').replace(/\.[^.]+$/,'').replace(/[^\w-]+/g,'-').slice(0,50)||'story';
  const link=byId('download');link.href=state.blobUrl;link.download=base+'-storysiap.'+extension;
  byId('result').hidden=false;
  byId('resultInfo').textContent=extension.toUpperCase()+' · '+(blob.size/1024/1024).toFixed(2)+' MB'+(seconds?' · '+seconds.toFixed(1)+'s':'')+' · Ready for download.';
  const resultVideo=byId('resultVideo');
  resultVideo.hidden=!['mp4','webm'].includes(extension);
  if(!resultVideo.hidden)resultVideo.src=state.blobUrl;
}
async function exportPhoto(){
  if(!state.image||!state.image.complete||!state.image.naturalWidth)throw Error('Foto belum selesai dibaca.');
  const {w,h}=size();outputCanvas.width=w;outputCanvas.height=h;paint(outputCtx,w,h);
  const blob=await new Promise(resolve=>outputCanvas.toBlob(resolve,'image/png'));
  if(!blob||!blob.size)throw Error('Gagal mengekspor foto. Coba file lain.');
  showResult(blob,'png',null);setProgress(100,'PNG ready.');
}
async function exportVideo(){
  if(!isVideo()||!getDuration()||sourceVideo.readyState<2)throw Error('Video belum siap atau codec tidak didukung. Coba MP4 H.264.');
  if(typeof HTMLCanvasElement.prototype.captureStream!=='function'||typeof MediaRecorder==='undefined')throw Error('Browser ini tidak mendukung rendering video melalui Canvas + MediaRecorder. Coba Chrome atau Edge terbaru.');
  const withAudio=byId('keepAudio').checked,mime=pickMime(withAudio);
  if(!mime)throw Error('Format output tidak didukung browser. Pilih Auto/WebM, atau nonaktifkan audio dan coba lagi.');
  const {w,h}=size(),r=trim();
  if(r.duration<=0)throw Error('Pilih klip dengan durasi positif.');
  outputCanvas.width=w;outputCanvas.height=h;sourceVideo.playbackRate=1;
  let stream=null,recorder=null,stopTimer=null,watchdog=null,wakeLock=null,cancelled=false;
  let frames=0,recorderStopped=false;const chunks=[];let stopPromiseReject=null;
  const cancel=()=>{cancelled=true;finish()};
  const finish=()=>{if(recorderStopped)return;recorderStopped=true;cancelAnimationFrame(state.exportRaf);state.exportRaf=0;sourceVideo.pause();if(recorder&&recorder.state!=='inactive'){try{recorder.stop()}catch{}}};
  state.abortExport=cancel;
  try{
    sourceVideo.muted=!withAudio;
    if(withAudio)await getAudioStream();
    // Prime the browser's playback permission from the export button interaction.
    try{await sourceVideo.play();sourceVideo.pause()}catch{}
    await waitSeek(r.start);
    paint(outputCtx,w,h);
    stream=outputCanvas.captureStream(30);
    if(withAudio){for(const track of state.audioDestination.stream.getAudioTracks())stream.addTrack(track)}
    const options={mimeType:mime,videoBitsPerSecond:Number(byId('size').value)>=1080?8500000:4200000,audioBitsPerSecond:128000};
    recorder=new MediaRecorder(stream,options);
    const recording=new Promise((resolve,reject)=>{
      let settled=false;
      const fail=error=>{if(settled)return;settled=true;reject(error)};
      recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
      recorder.onerror=()=>fail(Error('Browser gagal mengenkode video. Coba WebM atau resolusi 720.'));
      recorder.onstop=()=>{if(settled)return;settled=true;resolve(new Blob(chunks,{type:recorder.mimeType||mime}))};
      stopPromiseReject=fail;
    });
    recording.catch(()=>{});
    if(navigator.wakeLock){try{wakeLock=await navigator.wakeLock.request('screen')}catch{}}
    if(cancelled)throw Error('Ekspor dibatalkan.');
    const progress=()=>{
      if(recorderStopped)return;
      paint(outputCtx,w,h);
      if((frames++%2)===0)redraw();
      const delta=sourceVideo.currentTime-r.start;
      setProgress(clamp(Math.round(delta/r.duration*96),0,96),'Encoding video · '+Math.max(0,delta).toFixed(1)+' / '+r.duration.toFixed(1)+' detik');
      if(sourceVideo.ended||sourceVideo.currentTime>=r.end-.035){finish();return}
      state.exportRaf=requestAnimationFrame(progress);
    };
    watchdog=setTimeout(()=>{stopPromiseReject?.(Error('Encoder tidak merespons. Coba video lebih pendek atau resolusi 720.'));finish()},(r.duration+25)*1000);
    recorder.start(250);
    const playable=sourceVideo.play();
    await playable;
    state.exportRaf=requestAnimationFrame(progress);
    const blob=await recording;
    if(cancelled)throw Error('Ekspor dibatalkan. File asli tetap aman.');
    if(blob.size<1000)throw Error('Output video kosong. Coba format WebM atau video sumber lain.');
    const first=new Uint8Array(await blob.slice(0,12).arrayBuffer());
    const mp4=first.length>=8&&String.fromCharCode(...first.slice(4,8))==='ftyp';
    const webm=first.length>=4&&first[0]===0x1a&&first[1]===0x45&&first[2]===0xdf&&first[3]===0xa3;
    if(!mp4&&!webm)throw Error('Encoder menghasilkan format video tidak valid. Pilih codec lain.');
    const ext=mp4?'mp4':'webm';
    setProgress(100,'Video selesai. '+ext.toUpperCase()+' siap disimpan.');
    showResult(blob,ext,r.duration);
    status('Video berhasil diekspor sebagai '+ext.toUpperCase()+' dengan efek dan framing yang dipilih.');
  }finally{
    state.abortExport=null;clearTimeout(stopTimer);clearTimeout(watchdog);finish();
    if(stream)stream.getVideoTracks().forEach(track=>track.stop());
    if(wakeLock){try{await wakeLock.release()}catch{}}
    sourceVideo.muted=true;
    if(state.audioContext?.state==='running'){try{await state.audioContext.suspend()}catch{}}
    if(getDuration()){try{sourceVideo.currentTime=r.start}catch{}}
    redraw();updateTime();
  }
}
byId('export').addEventListener('click',async()=>{
  if(!state.file||state.exporting)return;
  stopPreview();clearResult();setBusy(true);
  setProgress(0,isVideo()?'Menyiapkan encoder video…':'Menyiapkan foto…');
  status(isVideo()?'Proses real-time dimulai. Jangan pindah tab atau kunci layar.':'Menyiapkan foto…');
  try{if(isVideo())await exportVideo();else{await exportPhoto();status('Foto berhasil diekspor. Klik Download edited media.')}}
  catch(error){status(error?.message||'Terjadi kesalahan ketika ekspor.',true);byId('result').hidden=true}
  finally{setBusy(false);redraw()}
});
byId('cancel').addEventListener('click',()=>{if(state.abortExport)state.abortExport();else status('Ekspor dibatalkan.')});
byId('original').addEventListener('click',original);
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopPreview();if(state.exporting)status('Jangan sembunyikan tab saat ekspor; browser dapat menghentikan perekaman.',true)}});
window.addEventListener('pagehide',()=>{if(state.abortExport)state.abortExport();stopPreview();if(state.url)URL.revokeObjectURL(state.url)});
setPreviewSize();updateValues();redraw();
if(!previewCtx||!outputCtx)status('Canvas 2D tidak tersedia di browser ini.',true);
window.storysiapVideo={get status(){return state.exporting?'exporting':state.kind||'empty'},get format(){return pickMime(byId('keepAudio').checked)},get duration(){return getDuration()},version:'8.0'};
