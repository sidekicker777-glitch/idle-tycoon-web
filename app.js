import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const SAVE_KEY = 'tycoon_save_v1';
let state = JSON.parse(localStorage.getItem(SAVE_KEY) || '{"cash":0,"lastSeen":0,"buildings":[{"name":"Corner","level":1,"baseProd":1,"baseCost":10},{"name":"Warehouse","level":1,"baseProd":3,"baseCost":50},{"name":"Lab","level":1,"baseProd":8,"baseCost":150}]}');

function save(){ state.lastSeen = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
function prod(b){ return b.baseProd * Math.pow(1.07, b.level-1); }
function cost(b){ return b.baseCost * Math.pow(1.15, b.level); }
function rate(){ return state.buildings.reduce((s,b)=>s+prod(b),0); }

if(state.lastSeen){
  const elapsed = Math.min((Date.now()-state.lastSeen)/1000, 28800);
  state.cash += rate()*elapsed;
}

const cashEl = document.getElementById('cash');
const rateEl = document.getElementById('rate');
function refresh(){ cashEl.textContent='$'+Math.floor(state.cash); rateEl.textContent='$'+Math.floor(rate()); }
refresh();

const renderer = new THREE.WebGLRenderer({canvas:document.getElementById('c'),antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.1,100);
camera.position.set(0,8,10);
camera.lookAt(0,0,0);
scene.add(new THREE.HemisphereLight(0xffffff,0x444444,1));

const ground = new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:0x111111}));
ground.rotation.x=-Math.PI/2;
scene.add(ground);

const meshes=[];
state.buildings.forEach((b,i)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshStandardMaterial({color:0x2b6cff+i*200000}));
  m.position.set(i*4-4,1,0);
  scene.add(m);
  meshes.push(m);
});

const ray=new THREE.Raycaster();
const pointer=new THREE.Vector2();

document.getElementById('c').addEventListener('click',(e)=>{
  pointer.x=(e.clientX/window.innerWidth)*2-1;
  pointer.y=-(e.clientY/window.innerHeight)*2+1;
  ray.setFromCamera(pointer,camera);
  const hits=ray.intersectObjects(meshes);
  if(hits.length){
    const i=meshes.indexOf(hits[0].object);
    const b=state.buildings[i];
    if(state.cash>=cost(b)){ state.cash-=cost(b); b.level++; save(); refresh(); }
  }
});

let last=performance.now();
function loop(t){
  const dt=(t-last)/1000; last=t;
  state.cash+=rate()*dt;
  renderer.render(scene,camera);
  refresh();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
setInterval(save,5000);
