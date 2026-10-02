import assert from 'node:assert/strict';
import {scoreStep} from '../src/score.js';
import {Soundscape} from '../src/sound.js';
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
const timers=new Set();let timerId=0;
globalThis.setInterval=()=>{const id=++timerId;timers.add(id);return id;};globalThis.clearInterval=id=>timers.delete(id);
class Param {constructor(){this.value=0;this.events=[];}setValueAtTime(v,t){this.events.push([v,t]);}linearRampToValueAtTime(v,t){this.events.push([v,t]);}exponentialRampToValueAtTime(v,t){this.events.push([v,t]);}setTargetAtTime(v,t){this.value=v;this.events.push([v,t]);}}
class Node {constructor(){this.connections=[];this.gain=new Param();this.frequency=new Param();}connect(n){this.connections.push(n);return n;}disconnect(){}start(t=0){this.started=t;}stop(t){this.stopped=t;}}
class Audio {constructor(){this.sampleRate=8000;this.currentTime=2;this.state='running';this.destination=new Node();this.oscillators=[];}createGain(){return new Node();}createBiquadFilter(){return new Node();}createConvolver(){return new Node();}createOscillator(){const n=new Node();this.oscillators.push(n);return n;}createBufferSource(){return new Node();}createBuffer(channels,length){const data=Array.from({length:channels},()=>new Float32Array(length));return {getChannelData:i=>data[i]};}}
globalThis.window={AudioContext:Audio};
test('Original score loops through four regional harmonies and adds combat pulse only when needed',()=>{
 const roots=[];for(let zone=0;zone<4;zone++){roots.push(scoreStep(zone,0)[0].frequency);for(let step=0;step<64;step++){const notes=scoreStep(zone,step,0);assert(notes.every(n=>Number.isFinite(n.frequency)&&n.frequency>30&&n.frequency<1000&&n.duration>0&&n.volume<=.04));assert(!notes.some(n=>n.kind==='pulse'));assert.deepEqual(notes,scoreStep(zone,step+32,0));}assert(scoreStep(zone,0,1).some(n=>n.kind==='pulse'));}assert.equal(new Set(roots).size,4);
});
test('Audio starts once, routes quiet music separately, respects mute and stops scheduling on pause',()=>{
 const s=new Soundscape();assert.equal(s.ctx,null);s.start();assert.equal(timers.size,1);const initial=s.ctx.oscillators.length;assert(initial>0);s.start();assert.equal(timers.size,1);assert.equal(s.ctx.oscillators.length,initial);assert(s.music.gain.value<s.fx.gain.value);s.toggle();s.ambient();s.event({type:'ultimate'});assert.equal(s.ctx.oscillators.length,initial);s.toggle();for(let i=0;i<4;i++)s.ambient();assert(s.ctx.oscillators.length>initial);s.pause();assert.equal(timers.size,0);const stopped=s.ctx.oscillators.length;s.ambient();s.event({type:'cast',spell:'storm'});assert.equal(s.ctx.oscillators.length,stopped);
});
test('Level-up schedules four ascending audible notes; missing audio support remains playable',()=>{
 const s=new Soundscape();s.start();const before=s.ctx.oscillators.length;s.event({type:'levelready'});const notes=s.ctx.oscillators.slice(before);assert.equal(notes.length,4);assert(notes.every((n,i)=>!i||n.started>notes[i-1].started));assert(notes.every((n,i)=>!i||n.frequency.events[0][0]>notes[i-1].frequency.events[0][0]));s.pause();window={};const fallback=new Soundscape();assert.doesNotThrow(()=>fallback.start());assert.equal(fallback.running,false);
});
console.log(`\n${passed} sound checks passed (audio graph and scheduling, not speaker output).`);
