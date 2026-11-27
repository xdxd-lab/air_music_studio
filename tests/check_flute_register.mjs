// Run the page's actual module with synthetic mic/analyser data, a manual RAF
// clock and recording Web Audio endpoints. This does not measure a real mic.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
let now = 0, pending, micStarts = 0, stopped = 0, fftReads = 0, graphPaints = 0;
let level = 0, mid = 1e-11, high = 1e-11, pointed = null;
const oscillators = [];
const noop = () => {};
const drawing = new Proxy({}, {get:(_, key) => key === 'clearRect' ? () => graphPaints++ : noop});
class Element {
  constructor() { this.children=[]; this.dataset={}; this.style = new Map(); this.style.setProperty = this.style.set; this.classList={toggle:noop}; this.events={}; this.value=''; }
  get firstChild() { return this.children[0]; }
  get lastChild() { return this.children.at(-1); }
  setAttribute(k,v) { this[k]=v; }
  getAttribute(k) { return this[k]; }
  append(...v) { this.children.push(...v); }
  contains(e) { return this.children.includes(e); }
  closest(selector) { return selector === '[data-hole]' && this.dataset.hole !== undefined ? this : null; }
  setPointerCapture(id) { this.captured = id; }
  showModal() { this.open = true; }
  close() { this.open = false; this.events.close?.(); }
  replaceChildren(...v) { this.children=v; }
  addEventListener(k,v) { this.events[k]=v; }
  getContext() { return drawing; }
}
const ids = {};
for (const m of html.matchAll(/<[^<>]*\bid="([^"]+)"[^<>]*>/g)) {
  const e = ids[m[1]] = new Element();
  for (const attr of ['open','checked','disabled','hidden']) e[attr] = new RegExp('\\s'+attr+'(?:\\s|>)').test(m[0]);
  for (const attr of ['width','height']) e[attr] = Number(m[0].match(new RegExp(attr+'="(\\d+)"'))?.[1] || 0);
  e.value = m[0].match(/\bvalue="([^"]*)"/)?.[1] || '';
}
function parseSelect(id) {
  const contents = html.match(new RegExp('<select id="'+id+'"[^>]*>([\\s\\S]*?)</select>'))[1];
  const choices = [...contents.matchAll(/<option value="([^"]+)"( selected)?>/g)];
  ids[id].value = (choices.find(m => m[2]) || choices[0])[1];
  return choices.map(m => m[1]);
}
assert.deepEqual(parseSelect('octaveThreshold'), ['4','8','12','16','20','24','28','32']);
assert.equal(ids.octaveThreshold.value, '4');
assert.deepEqual(parseSelect('stageWidth'), ['50','60','70','80','90','100','110','120','130','140','150']);
assert.equal(ids.stageWidth.value, '100');
assert.match(html,/flex:0 0 var\(--flute-band-span\);/);
assert.match(html,/grid-template-columns:minmax\(0,1\.5fr\) repeat\(5,minmax\(0,1fr\)\)/);
assert.match(html,/grid-template-rows:repeat\(5,minmax\(0,1fr\)\) minmax\(0,1\.5fr\)/);
parseSelect('fluteFingering');
function param(){return {value:0,setTargetAtTime(v){this.value=v;}};}
class Audio {
  constructor(){this.sampleRate=48000; this.state='running'; this.destination={};}
  get currentTime(){return now/1000;}
  node(){return {connect(n){return n;},disconnect:noop};}
  createDynamicsCompressor(){return {...this.node(), threshold:param(),ratio:param()};}
  createGain(){return {...this.node(),gain:param()};}
  createBiquadFilter(){return {...this.node(),frequency:param()};}
  createPeriodicWave(){}
  createOscillator(){const o={...this.node(), frequency:param(), start:noop, stop:noop,setPeriodicWave:noop}; oscillators.push(o); return o;}
  createMediaStreamSource(){return this.node();}
  createAnalyser(){return {...this.node(),get frequencyBinCount(){return this.fftSize/2;},
    getFloatTimeDomainData(w){for(let i=0;i<w.length;i++)w[i]=i%2?level:-level;},
    getFloatFrequencyData(s){fftReads++; for(let i=0;i<s.length;i++){
      const hz = i*48000/(s.length*2);
      s[i] = 10*Math.log10(hz>=1000&&hz<3000?mid:hz>=3000&&hz<6000?high:1e-13);
    }}
  };}
}
const document = {getElementById:id=>ids[id],querySelector:()=>new Element(),createElement:()=>new Element(),addEventListener:noop,elementFromPoint:()=>pointed};
const track = {stop:()=>stopped++,addEventListener:noop};
const navigator = {mediaDevices:{enumerateDevices:async()=>[],getUserMedia:async({audio,video})=>{
  assert.ok(audio); assert.equal(video,false); micStarts++;
  return {getTracks:()=>[track],getAudioTracks:()=>[track]};
}}};
const media = {matches:false,addEventListener:noop};
const win = new Element();
win.AudioContext = Audio;
const runtime = {document,navigator,window:win,
  location:{protocol:'https:',hostname:'localhost'},matchMedia:()=>media,performance:{now:()=>now},
  Option:class{},requestAnimationFrame:cb=>{pending=cb;return 1;},cancelAnimationFrame:()=>{pending=null;}};
// Only the synthetic camera source and observation hooks are external to the
// module. Screen notes otherwise use exactly the delivered page's UI handlers.
runInNewContext(script + `
this.observe = {
  holes: () => [...screenHoles],
  cameraHoles: () => cameraHoles && [...cameraHoles],
  updateCameraHoles, flutePitch,
};`,runtime);
const {observe} = runtime;
const stage = ids.fluteTouchStage, bands = ids.fluteTouchBands;
stage.clientWidth=1150; stage.clientHeight=375;
const state = (...expected) => assert.deepEqual(Array.from(observe.holes()), expected);
const contact = (type, id, index) => {
  pointed = bands.children.find(band => band.dataset.hole === index);
  let prevented = false;
  bands.events[type]({target:bands, pointerId:id, clientX:0, clientY:0, button:0, preventDefault:()=>{prevented=true;}});
  if (type === 'pointerdown') {
    assert.ok(prevented, 'suppress touch compatibility defaults in playing bands');
    assert.equal(bands.captured,id);
  }
};
const key = (type, key, target = stage) => stage.events[type]({key, target, preventDefault:noop});
const requestedSpan = () => bands.style.get('--flute-band-span');
const width = value => { ids.stageWidth.value = value; ids.stageWidth.onchange(); };
const pressReference = () => [0,1,2].forEach(i => contact('pointerdown',i,i));
assert.ok(ids.flutePanel.open);
assert.equal(micStarts,0,'opening page must not request a mic');
assert.ok(!ids.fluteHalfHoles && !ids.fluteTouchDock && !stage.open);
assert.deepEqual(bands.children.map(band => band.dataset.hole), [0,1,2,3,4,5]);
assert.deepEqual(bands.children.map(band => band.style.get('--portrait-row')), ['6','5','4','3','2','1']);
assert.equal(requestedSpan(),'967.200px');
for (const [choice, span] of [
  ['50','483.600px'], ['60','580.320px'], ['70','677.040px'], ['80','773.760px'],
  ['90','870.480px'], ['100','967.200px'], ['110','1063.920px'], ['120','1160.640px'],
  ['130','1257.360px'], ['140','1354.080px'], ['150','1450.800px'],
]) {
  width(choice);
  assert.equal(requestedSpan(),span);
}
width('100');
ids.fluteFingering.value='touch'; ids.fluteFingering.onchange();
assert.ok(stage.open);
assert.equal(stage.dataset.compact,'false');
stage.clientWidth=667; win.events.resize();
assert.equal(requestedSpan(),'967.200px'); assert.equal(stage.dataset.compact,'true');
width('50'); assert.equal(requestedSpan(),'483.600px'); assert.equal(stage.dataset.compact,'false');
stage.clientWidth=440;
width('150'); assert.equal(requestedSpan(),'1450.800px'); assert.equal(stage.dataset.compact,'true');
stage.clientWidth=1600; win.events.resize();
assert.equal(requestedSpan(),'1450.800px'); assert.equal(stage.dataset.compact,'false');
media.matches=true; stage.clientHeight=400; win.events.resize();
assert.equal(requestedSpan(),'1450.800px'); assert.equal(stage.dataset.compact,'true');
media.matches=false; win.events.resize(); width('100');
assert.equal(micStarts,0,'entering touch mode and resizing must not request a mic');
assert.ok(!ids.openTouchStage.hidden);
let menuSuppressed = false;
bands.events.contextmenu({preventDefault:()=>{menuSuppressed=true;}});
assert.ok(menuSuppressed);
pressReference(); state(.5,1,1,0,0,0);
width('90'); assert.equal(requestedSpan(),'870.480px'); state(0,0,0,0,0,0);
assert.ok(stage.open && micStarts === 0,'resizing never activates the mic');
contact('pointermove',1,4); state(0,0,0,0,0,0);
pressReference(); win.events.resize(); state(0,0,0,0,0,0);
key('keydown','6',ids.stageWidth); state(0,0,0,0,0,0);
width('100'); pressReference(); state(.5,1,1,0,0,0);
contact('pointermove',1,4); state(.5,0,1,0,1,0);
contact('pointercancel',2,2); state(.5,0,0,0,1,0);
contact('pointerdown',6,0);
contact('lostpointercapture',0,0); state(.5,0,0,0,1,0);
contact('pointerup',6,0); state(0,0,0,0,1,0);
key('keydown','1'); key('keydown','2'); state(.5,1,0,0,1,0);
key('keyup','2'); state(.5,0,0,0,1,0);
ids.closeTouchStage.onclick(); state(0,0,0,0,0,0);
assert.ok(!stage.open);
ids.openTouchStage.onclick(); pressReference();
const step=(count=1)=>{while(count-->0){now+=20; assert.ok(pending); pending(now);}};
const freq=()=>oscillators.at(-2).frequency.value;
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<.1,actual+' vs '+expected);
const c5=523.25113;
await ids.stageMic.onclick(); assert.equal(micStarts,1);
assert.equal(ids.stageMic.textContent,'停用麥克風');
step(60); // calibrate in quiet
const quietReads=fftReads; step(20); assert.ok(fftReads>quietReads && fftReads-quietReads<10,'live but throttled quiet spectrum');
level=.045; mid=1e-6; high=mid*.15; step(12);
near(freq(),c5); assert.equal(ids.fluteNote.textContent,'C5');
high=mid*.30; step(2); near(freq(),c5); // very brief spike
high=mid*.15; step(7); near(freq(),c5);
high=mid*.30; step(11);
near(freq(),2*c5); near(oscillators.at(-1).frequency.value,4*c5);
assert.equal(ids.fluteNote.textContent,'C6'); assert.match(ids.registerReadout.textContent,/0\.300.*高八度/);
high=mid*.20; step(10); near(freq(),2*c5); // stable lower return threshold
high=mid*.15; step(10); near(freq(),c5);
ids.octaveThreshold.value='8'; step(10); near(freq(),2*c5);
ids.octaveThreshold.value='4'; step(10); near(freq(),c5);
// 3.3% high-band power clears 1/32 but not 1/28. Reset the sustained
// register between the two choices since release hysteresis is intentional.
high=mid*.033;
ids.octaveThreshold.value='28'; step(10); near(freq(),c5);
ids.octaveThreshold.value='32'; step(10); near(freq(),2*c5);
assert.match(ids.registerReadout.textContent,/0\.033.*高八度/);
high=mid*.02; step(10); near(freq(),c5);
level=0; step(10); assert.equal(ids.fluteNote.textContent,'—');
assert.match(ids.registerReadout.textContent,/未發聲/);
assert.ok(graphPaints>10);
// Recalibration with high-band ambient noise: unchanged high-band energy is
// not a reason to jump up on a new blow.
mid=1e-8; high=1e-6; ids.fluteCalibrate.onclick(); step(60);
level=.045; mid=1e-6; step(20); near(freq(),c5); assert.match(ids.registerReadout.textContent,/0\.00.*本音/);
// Near-zero mid band, even with appreciable absolute rms and high-band energy.
mid=1e-11; high=1e-5; step(20); assert.match(ids.registerReadout.textContent,/功率 —/);
assert.notEqual(ids.fluteNote.textContent,'C6');
// Return to settings without shutting down the microphone and without
// carrying any fingers into a reopened playing area.
ids.closeTouchStage.onclick(); assert.ok(!stage.open && pending);
assert.equal(stopped,0); state(0,0,0,0,0,0);
ids.openTouchStage.onclick(); state(0,0,0,0,0,0);
pressReference(); width('150'); state(0,0,0,0,0,0);
assert.equal(micStarts,1); assert.equal(stopped,0);
assert.ok(pending,'width change must not restart a working mic');
ids.stageMic.onclick(); assert.equal(stopped,1); assert.equal(pending,null);
assert.equal(ids.stageMic.textContent,'啟用麥克風'); assert.equal(ids.audition.disabled,false);

// Camera fingering uses the identical half-index convention. Two synthetic
// tracked hands have either straight or deliberately bent finger segments.
ids.fluteFingering.value='camera'; ids.fluteFingering.onchange();
assert.ok(!stage.open && ids.openTouchStage.hidden);
await ids.startMic.onclick(); assert.equal(micStarts,2);
const hand = presses => {
  const points = Array.from({length:21},()=>({x:.4,y:.65,z:0}));
  for (const [finger,tip] of [8,12,16].entries()) {
    const x = .35 + finger*.05;
    [[x,.48],[x,.4],[x,.32], presses[finger]?[x+.04,.43]:[x,.24]].forEach(([x,y],i)=>{points[tip-3+i]={x,y,z:0};});
  }
  return points;
};
const camera = (left, right) => observe.updateCameraHoles(
  [{label:'Left',hand:hand(left)},{label:'Right',hand:hand(right)}], now);
camera([true,true,true],[false,false,false]);
assert.deepEqual(Array.from(observe.cameraHoles()), [.5,1,1,0,0,0]);
assert.equal(observe.flutePitch(observe.cameraHoles()),72,'C5 despite the half-index coverage');
camera([true,true,true],[true,true,true]);
assert.deepEqual(Array.from(observe.cameraHoles()), [.5,1,1,1,1,1]);
assert.equal(observe.flutePitch(observe.cameraHoles()),67);
camera([false,false,false],[false,false,false]);
assert.equal(observe.flutePitch(observe.cameraHoles()),78);
observe.updateCameraHoles([],now);
assert.equal(observe.cameraHoles(),null);
ids.flutePanel.open=false; ids.flutePanel.events.toggle();
assert.equal(stopped,2); assert.ok(!stage.open); assert.equal(pending,null);
assert.equal(ids.fluteNote.textContent,'—'); assert.equal(ids.registerReadout.textContent,'麥克風未啟用');
assert.equal(ids.audition.disabled,false);
console.log('PASS: full entrypoint; landscape and portrait order, 50–150% resize, simultaneous holds, slide/cancel/capture, keyboard and settings; fixed half-index in touch and camera; live spectrum, octave, noise guard and mic cleanup.');
