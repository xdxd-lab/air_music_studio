// Dependency-free checks for the shipped synth graph and automation. To export a
// synthetic A/B example (not a microphone recording): node tests/check_dizi_timbre.mjs /tmp/dizi-ab.wav
// The small offline renderer evaluates the same partials, filters and timed envelopes;
// browser anti-aliasing, compression and speaker acoustics are not modeled.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const block = html.slice(html.indexOf('function makeFluteVoice('), html.indexOf('function setFluteNote('));
const {makeFluteVoice,playFluteVoice} = runInNewContext(block + '\n({makeFluteVoice,playFluteVoice})');
const sr = 48000, tau = 2 * Math.PI;
class Param {
  constructor(value) { this.value = value; this.events = []; this.index = 0; this.smooth = 0; this.target = value; }
  setTargetAtTime(value,time,constant) { this.events.push({value, frame:Math.round(time*sr), factor:1-Math.exp(-1/(sr*constant))}); }
  next(frame) {
    let event;
    while ((event=this.events[this.index]) && frame >= event.frame) {
      this.index++; this.target=event.value; this.smooth=event.factor;
    }
    this.value += this.smooth * (this.target - this.value);
    return this.value;
  }
}
class AudioNode {
  constructor(type) {
    this.kind=type; this.inputs=[]; this.outputs=[]; this.phase=0;
    this.frequency=new Param(0); this.Q=new Param(.707); this.gain=new Param(1);
    this.startFrame=0; this.endFrame=Infinity; this.x1=this.x2=this.y1=this.y2=0;
  }
  connect(next) { next.inputs.push(this); this.outputs.push(next); return next; }
  disconnect() { for (const next of this.outputs) next.inputs=next.inputs.filter(node=>node!==this); this.outputs=[]; }
  setPeriodicWave(wave) { this.wave=wave; }
  start(t) { this.startFrame=Math.round(t*sr); }
  stop(t) { this.endFrame=Math.round(t*sr); }
  next(frame) {
    if (this.kind==='oscillator') {
      if (frame < this.startFrame || frame >= this.endFrame) return 0;
      const f=this.frequency.next(frame), {real,imag}=this.wave;
      let out=0;
      for(let i=1;i<real.length && i*f<sr/2;i++)
        out+=real[i]*Math.cos(i*this.phase)+imag[i]*Math.sin(i*this.phase);
      this.phase=(this.phase + tau*f/sr) % tau;
      return out;
    }
    if (this.kind==='noise')
      return frame < this.startFrame || frame >= this.endFrame ? 0 : this.buffer.data[(frame-this.startFrame)%this.buffer.data.length];
    let x=0;
    for (const node of this.inputs) x += node.next(frame);
    if(this.kind==='gain') return x*this.gain.next(frame);
    if(this.kind!=='biquad') return x;
    const w=tau*this.frequency.next(frame)/sr, c=Math.cos(w), s=Math.sin(w);
    const q=this.type==='lowpass' ? 10**(this.Q.value/20) : this.Q.value;
    const alpha=s/(2*q), a0=1+alpha;
    const b0=this.type==='lowpass' ? (1-c)/2 : alpha;
    const b1=this.type==='lowpass' ? 1-c : 0;
    const b2=this.type==='lowpass' ? b0 : -b0;
    const y=(b0*x + b1*this.x1 + b2*this.x2 + 2*c*this.y1 - (1-alpha)*this.y2)/a0;
    this.x2=this.x1; this.x1=x; this.y2=this.y1; this.y1=y;
    return y;
  }
}
class Audio {
  constructor(){this.sampleRate=sr; this.currentTime=0; this.nodes=[];this.destination=this.node('destination');}
  node(kind){const node=new AudioNode(kind); this.nodes.push(node); return node;}
  createOscillator(){return this.node('oscillator');}
  createBufferSource(){return this.node('noise');}
  createGain(){return this.node('gain');}
  createBiquadFilter(){return this.node('biquad');}
  createPeriodicWave(real,imag){return {real,imag};}
  createBuffer(_,length){const data=new Float32Array(length);return {data,getChannelData:()=>data};}
  render(seconds){return Float32Array.from({length:Math.round(seconds*sr)},(_,frame)=>this.destination.next(frame));}
}
const hz = n=>440 * 2**((n-69)/12);
function renderExample(notes, upper, breathAt = () => .66, seconds = 1) {
  const audio=new Audio(), voice=makeFluteVoice(audio,audio.destination);
  for(let step=0;step<seconds*100;step++) {
    const t=step/100, melody=notes.find(([start,stop])=>start<=t && t<stop);
    playFluteVoice(voice, melody ? melody[2] + (upper ? 12 : 0) : null, upper, breathAt(t),t);
  }
  return {samples:audio.render(seconds),voice,audio};
}
const phrase=[[.05,.70,72]];
const lower=renderExample(phrase,false), higher=renderExample(phrase,true);
assert.equal(lower.voice.midi,72); assert.equal(higher.voice.midi,84,'register is an exact octave');
assert.ok(Math.abs(lower.voice.tone.frequency.value-hz(72))<.001);
assert.ok(Math.abs(higher.voice.dimo.frequency.value-hz(84))<.001,'dimo never adds a mistuned second fundamental');
assert.ok(higher.voice.body.frequency.events.at(-1).value > 2*lower.voice.body.frequency.events.at(-1).value);
assert.ok(higher.voice.windGain.gain.events.at(-1).value < lower.voice.windGain.gain.events.at(-1).value);
assert.ok(lower.voice.windGain.gain.events[0].value > 2*lower.voice.windGain.gain.events.at(-1).value);
assert.ok(lower.voice.dimoGain.gain.events[0].value < lower.voice.dimoGain.gain.events.at(-1).value);
const rms=(data,from,to)=>{
  let sum=0; for(let i=from*sr;i<to*sr;i++) sum+=data[i]**2;
  return Math.sqrt(sum/((to-from)*sr));
};
function spectrumAt(samples,freq) {
  let re=0,im=0;
  for(let i=0,n=.2*sr;i<n;i++) {
    const sample=samples[i+.30*sr]*(.5-.5*Math.cos(tau*i/n)), angle=tau*i*freq/sr;
    re+=sample*Math.cos(angle); im+=sample*Math.sin(angle);
  }
  return Math.hypot(re,im);
}
const harmonicBrightness=(sample,pitch)=>{
  const spectrum=Array.from({length:9},(_,i)=>spectrumAt(sample,(i+1)*pitch)**2);
  return spectrum.slice(2).reduce((a,b)=>a+b,0)/spectrum[0];
};
assert.ok(harmonicBrightness(higher.samples,hz(84)) > 1.2*harmonicBrightness(lower.samples,hz(72)),
  'upper register brighter even relative to its own fundamental');
const soft=renderExample(phrase,false,()=>.20).samples;
assert.ok(rms(lower.samples,.3,.55)>2*rms(soft,.3,.55),'breath opens the voice dynamically');
assert.ok(rms(lower.samples,.72,.89)<.2*rms(lower.samples,.3,.55),'gated note releases smoothly to silence');
for(const {samples} of [lower,higher])
  assert.ok(samples.every(sample=>Number.isFinite(sample)&&Math.abs(sample)<.60),'safe synthesis headroom');

const sources=({audio})=>audio.nodes.filter(node=>['oscillator','noise'].includes(node.kind));
lower.voice.stop(1,false);
assert.ok(sources(lower).every(source=>source.endFrame===Math.round(1.065*sr)));
lower.voice.tone.onended();
assert.ok(lower.audio.nodes.every(node=>node.outputs.length===0));
higher.voice.stop(1,true);
assert.ok(sources(higher).every(source=>source.endFrame===sr));
assert.ok(higher.audio.nodes.every(node=>node.outputs.length===0),'hidden page immediately silences and detaches nodes');
assert.match(html,/input\.connect\(analyser\);/);
assert.doesNotMatch(html,/\b(analyser|input)\.connect\((?:mix|audio\.destination|flute\.voice)/,'no digital mic passthrough');

if(process.argv[2]) {
  const melody=[[.22,.88,69],[.88,1.45,72],[1.49,2.02,74],[2.12,2.83,72]];
  const take=upper=>renderExample(melody,upper,t=>.61+.22*Math.sin(t*3)+.06*Math.sin(t*15),3.18).samples;
  const data=[...take(false),...take(true)];
  const wav=Buffer.alloc(44+2*data.length);
  wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
  wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
  wav.writeUInt32LE(sr,24);wav.writeUInt32LE(2*sr,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
  wav.write('data',36);wav.writeUInt32LE(2*data.length,40);
  data.forEach((x,i)=>wav.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(x*32767))),44+i*2));
  writeFileSync(process.argv[2],wav);
}
console.log('PASS: qudi/bangdi spectra, breath attack and dynamics, correct octave, runtime node cleanup, and no digital microphone passthrough.');
