// Dependency-free UI regression: run the shipped page with a synthetic camera.
// No real hardware, camera permission, CDN access or AI model is required.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const controls = [...html.matchAll(/<[^<>]*\bid="([^"]+)"[^<>]*>/g)];
const menuHTML = html.match(/<select id="camera"[^>]*>(.*?)<\/select>/s)[1];
const presets = [...menuHTML.matchAll(/<option value="([^"]*)">([^<]+)<\/option>/g)];
const tick = () => new Promise(resolve => setImmediate(resolve));
const noop = () => {};
const storage = new Map();
class Option { constructor(text,value) { this.text = text; this.value = value; } }
class Element {
  constructor(){
    this.children=[]; this.value=''; this.dataset={}; this.classList={toggle:noop};
    this.handlers={}; this.style={setProperty:noop};
  }
  get firstChild(){return this.children[0];}
  get lastChild(){return this.children.at(-1);}
  getContext(){return new Proxy({}, {get:() => noop});}
  addEventListener(k,v){this.handlers[k]=v;}
  setAttribute(k,v){this[k]=v;}
  getAttribute(k){return this[k];}
  append(...xs){this.children.push(...xs);}
  replaceChildren(...xs){this.children=xs; this.value=xs[0]?.value || '';}
  play(){return Promise.resolve();}
  pause(){}
}
function launch() {
  const ids = {};
  for(const [tag,id] of controls) {
    const e=ids[id]=new Element();
    for(const k of ['disabled','checked','hidden']) e[k]=new RegExp('\\s'+k+'(?:\\s|>)').test(tag);
  }
  ids.video.videoWidth=960; ids.video.videoHeight=540;
  ids.camera.replaceChildren(...presets.map(([,value,text])=>new Option(text,value)));
  const window=new Element(), requests=[], tracks=[];
  window.localStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
  const sim={devices:[],actual:'user',allow:true,acquire:async () => {
    const track={stopped:false,getSettings:()=>({facingMode:sim.actual}),addEventListener:noop,stop(){this.stopped=true;}};
    tracks.push(track);
    return {getTracks:()=>[track],getVideoTracks:()=>[track]};
  }};
  const document={getElementById:id=>ids[id],querySelector:()=>new Element(),createElement:()=>new Element(),addEventListener:noop,
    permissionsPolicy:{allowsFeature:()=>sim.allow}};
  const navigator={permissions:{query:async()=>({state:'prompt'})},mediaDevices:{
    enumerateDevices:async()=>sim.devices, getUserMedia:async constraints=>{
      requests.push(JSON.parse(JSON.stringify(constraints))); return sim.acquire();
    }}};
  const context={window,document,navigator,location:{protocol:'https:',hostname:'example.test'},
    Option,matchMedia:()=>({matches:false,addEventListener:noop}),performance:{now:()=>0},
    requestAnimationFrame:()=>1,cancelAnimationFrame:noop,console:{error:noop}};
  vm.runInNewContext(script, context);
  const choose=v=>{assert.ok(ids.camera.children.some(x=>x.value===v));ids.camera.value=v;ids.camera.onchange();};
  return {ids,window,requests,tracks,sim,choose};
}

let app=launch();
await tick();
const base=['','facing:user','facing:environment'];
assert.deepEqual(app.ids.camera.children.map(x=>x.value),base,'presets before permissions with no devices');
assert.equal(app.requests.length,0,'opening the page never opens the camera');
app.choose('facing:environment');
await app.ids.scan.onclick();
assert.equal(app.ids.camera.value,'facing:environment');
assert.equal(app.requests.length,0,'select or rescan is not a permission request');
app=launch(); await tick();
assert.equal(app.ids.camera.value,'facing:environment','restore direction on reload');
const {ids,sim,requests,tracks,choose,window}=app;
sim.devices=[{kind:'videoinput',deviceId:'abc:123',label:''},{kind:'audioinput',deviceId:'mic',label:'Secret Mic'}];
await ids.test.onclick();
assert.equal(requests[0].audio,false);
assert.deepEqual(requests[0].video.facingMode,{ideal:'environment'});
assert.ok(!('deviceId' in requests[0].video));
assert.match(ids.status.textContent,/未使用後鏡頭；實際使用：前鏡頭/,'do not misreport fallback as the selected direction');
assert.deepEqual(ids.camera.children.map(x=>x.value),[...base,'device:abc:123']);
assert.equal(ids.camera.children.at(-1).text,'相機 1','do not infer front/back from an unnamed camera');
assert.equal(ids.camera.value,'facing:environment');
ids.stop.onclick();
choose('device:abc:123'); sim.devices=[]; await ids.scan.onclick();
assert.equal(ids.camera.value,'device:abc:123','do not silently substitute a new camera if the selected ID vanishes');
sim.acquire=async()=>{throw Object.assign(new Error('device unavailable'),{name:'OverconstrainedError'});};
await ids.start.onclick();
assert.deepEqual(requests[1].video.deviceId,{exact:'abc:123'});
assert.ok(!('facingMode' in requests[1].video));
assert.equal(requests.length,2,'no silent fallback for an exact camera');
assert.match(ids.status.textContent,/所選相機無法使用/);
choose('');
await ids.test.onclick();
assert.ok(!('facingMode' in requests[2].video) && !('deviceId' in requests[2].video),'auto leaves camera choice to browser');
choose('facing:user');
sim.allow=false; await ids.test.onclick();
assert.equal(requests.length,3,'respect permissions policy before capture');
assert.match(ids.status.textContent,/Permissions Policy/);
sim.allow=true; sim.acquire=async()=>{throw Object.assign(new Error(),{name:'NotAllowedError'});};
await ids.start.onclick();
assert.deepEqual(requests[3].video.facingMode,{ideal:'user'});
assert.match(ids.status.textContent,/遭瀏覽器/);
const fresh=launch(); await tick();
fresh.sim.actual=undefined;
await fresh.ids.test.onclick();
assert.match(fresh.ids.cameraInfo.textContent,/未回報實際方向/);
fresh.ids.stop.onclick();
// A late permission result after leaving the page cannot resurrect the camera.
let finish,stopped=false;
sim.acquire=()=>new Promise(resolve=>{finish=()=>resolve({getTracks:()=>[{stop(){stopped=true;}}]});});
const pending=ids.test.onclick();
window.handlers.pagehide(); finish(); await pending;
assert.equal(stopped,true); assert.equal(ids.video.srcObject,null);
assert.equal(ids.start.disabled,false);
assert.equal(tracks[0].stopped,true);
console.log('PASS: camera presets at first load, no permission on select/rescan, preferences, exact devices, actual/fallback/unknown directions, denied policy/permission and stale stream cleanup.');
