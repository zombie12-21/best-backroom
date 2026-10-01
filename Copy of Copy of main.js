import {LEVELS,ENTITIES,ITEMS,WEAPONS} from "./data.js";
import {genMaze,freeCells} from "./maze.js";
import {hum,beep,step,pickupS,hurt,sting,hit} from "./audio.js";
import {RECIPES,canCraft,doCraft} from "./craft.js";
import {TAPES,INTROS,ACHIEVE} from "./story.js";
import {floats,addFloat,addShake,stepFx,drawFloats,shakeOff} from "./fx.js";
import {drawPlayerWeapon,drawProjReal,notifyShot} from "./weaponview.js";
import {clearDetails,h2,addDecal,stepDecals,drawFloorD,drawWallD,drawDecals,drawMotes,drawExitD} from "./details.js";
const cv=document.getElementById("c3d"),ctx=cv.getContext("2d");
const mapC=document.getElementById("map"),mapX=mapC.getContext("2d");
const $=id=>document.getElementById(id);
const menu=$("menu"),tabBody=$("tabBody"),lvlSel=$("lvlSel");
let W=0,H=0;function rs(){W=cv.width=cv.clientWidth||innerWidth;H=cv.height=cv.clientHeight||innerHeight}
addEventListener("resize",rs);rs();
LEVELS.forEach((l,i)=>{let o=document.createElement("option");o.value=i;o.textContent=l.name;lvlSel.appendChild(o)});
let T=96,grid=[],GW=0,GH=0,px=0,py=0,fx=1,fy=0,hp=100,st=100,sa=100,bat=100,lightOn=true,inv=[],sel=0,weapon="fists",items=[],ents=[],projs=[],parts=[],safes=[],inSafe=false,exit={x:0,y:0},fuses=0,needF=0,li=0,L=LEVELS[0],keys={},playing=false,lastT=0,atkCd=0,msgT=null,seen=0,chasing=false,stepT=0;
let joy={x:0,y:0};
let kills=+(localStorage.getItem("br_kills")||0),boost=0,hasNV=false;
let ach={};try{ach=JSON.parse(localStorage.getItem("br_ach")||"{}")}catch(e){ach={}}
function unlock(id){if(ach[id])return;ach[id]=1;try{localStorage.setItem("br_ach",JSON.stringify(ach))}catch(e){}say("🏆 "+ACHIEVE[id].name+" — "+ACHIEVE[id].desc);beep(880,.2)}
function lorePop(t,x){say("📼 "+t+" — "+x,4200);unlock("guide")}
let tapesFound=[];try{tapesFound=JSON.parse(localStorage.getItem("br_tapes")||"[]")}catch(e){}
let tut={move:false,pick:false,hit:false},tutCoins=0,traps=[],flareT=0,crates=[],arena=null,guideGift=false,sanWarn=false,godMode=false,godArmed=false;
const MIL_LOOT=["rifle","flamethrower","nail_bat","nailgun","shotgun","spear","crossbow","adrenaline","molotov","flare","smoke_bomb","bear_trap","medkit","batteries","backcoin","backcoin"];
const MED_LOOT=["medkit","bandage","almond_water","adrenaline","canteen","mre","canned_beans","hazmat_suit","backcoin"];
const TECH_LOOT=["batteries","fuse","nightvision","compass","binoculars","glowstick","lantern","duct_tape","emp_grenade","lockpick","backcoin"];
const CRATE_STYLE={mil:{name:"MIL-CRATE",icon:"📦",color:"#5a5a30",edge:"#2c2c16",mark:"★",map:"#fd6"},med:{name:"MED-CRATE",icon:"➕",color:"#e8e8e8",edge:"#a00",mark:"✚",map:"#0f8"},tech:{name:"TECH-CRATE",icon:"⚙️",color:"#2e4a5a",edge:"#12303c",mark:"⚙",map:"#4df"}};
let coins=+(localStorage.getItem("br_coins")||0),traders=[];
function updCoins(){let e=$("coinTag");if(!e){e=document.createElement("span");e.className="tag";e.id="coinTag";$("top").appendChild(e)}e.textContent="🪙 "+coins;try{localStorage.setItem("br_coins",coins)}catch(x){}}
updCoins();
function loadKeep(){try{let k=JSON.parse(localStorage.getItem("br_keep"));if(k&&Array.isArray(k.inv)&&k.inv.length)return k}catch(e){}return null}
function saveKeep(){try{localStorage.setItem("br_keep",JSON.stringify({inv,weapon,coins}))}catch(e){}}
function redeemCode(raw){let c=String(raw||"").trim().replace(/\s+/g,"");
let out=(t)=>{tab("levels");tabBody.innerHTML=`<div style="font-size:15px">${t}</div>`;beep(660,.15)};
if(c==="9676911025"){try{localStorage.setItem("br_unlocked",LEVELS.length-1)}catch(e){}refreshLabels();coins+=50;updCoins();godArmed=true;godMode=true;let k=loadKeep()||{inv:["almond_water"],weapon:"fists",coins};for(let i=0;i<3&&k.inv.length<6;i++)k.inv.push("almond_water");k.coins=coins;try{localStorage.setItem("br_keep",JSON.stringify(k))}catch(e){}saveKeep();out("🔓 <b>9676911025 ACCEPTED.</b><br>Every level open · +50🪙 · +3 almond water · godmode ON.<br>Finish the run.");return}
out(`❌ Wrong code.`);beep(160,.25)}
window.redeemCode=redeemCode;
let ghosts=new Map(),sock=null,myId=String((Math.random()*1e9)|0),netT=0;
function netInit(){try{if(!root.createServerSocket)return;let s=root.createServerSocket();sock=s;
s.addEventListener("open",()=>{updNetTag()});
s.addEventListener("message",ev=>{try{let m=String(ev.data);if(m[0]==="p"){let p=m.split("|");if(p[1]===myId)return;ghosts.set(p[1],{x:+p[2],y:+p[3],lv:+p[4],t:Date.now()})}else if(m[0]==="c"){say("💬 "+m.slice(7))}}catch(e){}});
s.addEventListener("close",ev=>{sock=null;setTimeout(()=>{if(!sock)netInit()},4000+Math.random()*4000)});
setInterval(()=>{for(let[k,v]of ghosts)if(Date.now()-v.t>8000)ghosts.delete(k)},3000);
}catch(e){}}
function updNetTag(){let e=$("netTag");if(!e){e=document.createElement("span");e.className="tag";e.id="netTag";$("top").appendChild(e)}let n=ghosts.size+(sock?1:0);e.textContent="🌐 "+n+" online"}
try{netInit()}catch(e){}
addEventListener("keydown",e=>{if(e.key==="Enter"&&playing&&sock){let m=prompt("Say to level chat:");if(m)sock.send("c|"+String(L.id).padStart(4,"0")+"|"+m.slice(0,80))}});
function isLocked(i){try{if(i===0)return false;if(LEVELS[i]&&LEVELS[i].sandbox)return false;let u=+localStorage.getItem("br_unlocked")||0;return i>u}catch(e){return false}}
function refreshLabels(){try{for(let i=0;i<lvlSel.options.length;i++){let o=lvlSel.options[i];o.textContent=o.textContent.replace(" 🔒","");if(isLocked(i))o.textContent+=" 🔒"}}catch(e){}}
try{refreshLabels()}catch(e){}
window.refreshLabels=refreshLabels;
window.BR={get x(){return px},get y(){return py},get ex(){return exit.x},get ey(){return exit.y},get items(){return items},get ents(){return ents},get crates(){return crates},get safes(){return safes},get arena(){return arena},get projs(){return projs},get atk(){return atkCd},get bat(){return bat},get sanity(){return sa},give(id){if(WEAPONS[id]){weapon=id;updHot();return "equipped "+id}if(inv.length<6){inv.push(id);updHot();return "got "+id}return "full"},tp(x,y){px=x;py=y},keys};
function say(t,ms=2200){let m=$("msg");m.textContent=t;m.style.display="block";clearTimeout(msgT);msgT=setTimeout(()=>m.style.display="none",ms)}
function tab(name){
document.querySelectorAll("#tabRow button").forEach(b=>b.classList.toggle("on",b.dataset.t===name));
if(name==="play"){tabBody.innerHTML=`<div style="font-size:13px;line-height:1.7">2D top-down, <b>BIG MAP</b> (45-60 tiles wide). Explore, loot, avoid the entity, power the exit.<br>WASD/arrows move · mouse aims · click/Space attacks · <b>E</b> pickup · <b>F</b> flashlight · <b>1-6</b> use slot · <b>C</b> craft · <b>J</b> journal · <b>G</b> greet the Guide · <b>X</b> sandbox panel · <b>M</b> menu.<br>Loot now <b>carries between levels</b> (tutorial stays in training). Rumor: 5 secrets hide in these halls…</div>`;return}
if(name==="github"){tabBody.innerHTML=`<pre class="git">git init backrooms-game && cd backrooms-game\nmkdir src && cp ~/downloads/src/* src/\ncp main.pjs index.html .\ngit add . && git commit -m "backrooms 2D big-map v1"\ngh repo create backrooms-game --public --source=. --push\n# files: src/data.js maze.js audio.js main.js README.md</pre>`;return}
const map={levels:[LEVELS,ENTITIES],entities:[ENTITIES],items:[ITEMS],weapons:[WEAPONS]}[name];
let src=name==="levels"?LEVELS:name==="entities"?Object.values(ENTITIES):name==="items"?Object.values(ITEMS):Object.values(WEAPONS);
tabBody.innerHTML=`<div class="codex">`+src.map(o=>`<div class="cardx"><b>${o.icon||""} ${o.name}</b><br><i>${o.sub||o.desc||o.use||""}</i><br>${o.tip||o.quote||""}</div>`).join("")+`</div>`}
document.querySelectorAll("#tabRow button").forEach(b=>b.onclick=()=>tab(b.dataset.t));tab("play");
{let clicks=0,cool=false;let h=document.querySelector(".panel h1");if(h){h.style.cursor="pointer";h.title="...";h.onclick=()=>{clicks++;if(clicks>=7&&!cool){cool=true;clicks=0;unlock("disco");tabBody.innerHTML=`<div style="font-size:16px">🎧 DISCO NIGHTS IN THE BACKROOMS 🪩</div>`;let n=0;let iv=setInterval(()=>{document.body.style.filter=`hue-rotate(${n*40}deg)`;n++;if(n>20){clearInterval(iv);document.body.style.filter="";cool=false}},200)}}}}
function start(i){
refreshLabels();
if(isLocked(i)){menu.style.display="flex";playing=false;tab("levels");tabBody.innerHTML=`<div style="font-size:15px">🔒 <b>${LEVELS[i].name}</b> is locked.<br>Escape the previous level to unlock it. (Tutorial + Sandbox are always open.)</div>`;beep(160,.25);return}
try{if(playing&&LEVELS[li]&&!LEVELS[li].tutorial)saveKeep()}catch(e){}
li=i;L=LEVELS[i];let big=Math.min(61,L.size*2+1);if(big%2===0)big++;
grid=genMaze(big,Date.now()%100000);GW=grid[0].length;GH=grid.length;
arena=null;
if(L.bossArena){let cxm=(GW/2)|0,cym=(GH/2)|0,R=6;
for(let y=cym-R;y<=cym+R;y++)for(let x=cxm-R;x<=cxm+R;x++)if(x>0&&y>0&&x<GW-1&&y<GH-1)grid[y][x]=0;
[[-3,-3],[2,-3],[-3,2],[2,2]].forEach(([dx,dy])=>{grid[cym+dy][cxm+dx]=1;grid[cym+dy][cxm+dx+1]=1;grid[cym+dy+1][cxm+dx]=1;grid[cym+dy+1][cxm+dx+1]=1});
arena={tx:cxm,ty:cym,r:R,x:cxm*T+T/2,y:cym*T+T/2};
exit={x:(cxm+R-1)*T+T/2,y:(cym+R-1)*T+T/2};}
let free=freeCells(grid);seen=new Set();
let s=free[0];px=(s[0]*T+T/2);py=(s[1]*T+T/2);
if(!L.bossArena){let e=free[free.length-1];exit={x:e[0]*T+T/2,y:e[1]*T+T/2}}
needF=L.needFuse||0;fuses=0;hp=100;st=100;sa=100;bat=100;lightOn=true;guideGift=false;sanWarn=false;godMode=godArmed;inv=["almond_water"];sel=0;weapon="fists";
if(!L.tutorial){let k=loadKeep();if(k){inv=k.inv.filter(id=>ITEMS[id]);if(!inv.length)inv=["almond_water"];if(WEAPONS[k.weapon])weapon=k.weapon;coins=k.coins||coins;updCoins()}}projs=[];parts=[];items=[];ents=[];safes=[];inSafe=false;traps=[];flareT=0;crates=[];
if(arena){let R=arena.r,cxm=arena.tx,cym=arena.ty;
items.push({id:"shotgun",x:(cxm-R+1)*T+T/2,y:(cym-R+1)*T+T/2});
items.push({id:"medkit",x:(cxm+R-1)*T+T/2,y:(cym-R+1)*T+T/2});
items.push({id:"flare",x:(cxm-R+1)*T+T/2,y:(cym+R-1)*T+T/2});
items.push({id:"batteries",x:(cxm+R-2)*T+T/2,y:(cym+R-1)*T+T/2});}
if(L.tutorial){
tut={move:false,pick:false,hit:false};tutCoins=coins;
let c0=free[2]||free[0];items.push({id:"crowbar",x:c0[0]*T+T/2,y:c0[1]*T+T/2});
let c1=free[4]||free[0];items.push({id:"energy_bar",x:c1[0]*T+T/2,y:c1[1]*T+T/2});
let c2=free[6]||free[0];items.push({id:"batteries",x:c2[0]*T+T/2,y:c2[1]*T+T/2});
let mid=free[(free.length/2)|0];
ents.push({t:"bacteria",x:mid[0]*T+T/2,y:mid[1]*T+T/2,hp:30,max:30,stun:0,wx:0,wy:0,wt:0});
let g0=free[1]||free[0];ents.push({t:"guide",x:g0[0]*T+T/2,y:g0[1]*T+T/2,hp:999,max:999,stun:0,wx:0,wy:0,wt:0});
}else{
for(let ri=0;ri<2;ri++){let rx=2+(((GW-7)*(ri===0?0.18:0.72))|0);let y0=GH;for(let k=0;k<7;k++)grid.push(Array(GW).fill(1));GH=grid.length;
for(let y=y0+1;y<=y0+5;y++)for(let x=rx;x<=rx+4;x++)grid[y][x]=(y>y0+1&&y<y0+5&&x>rx&&x<rx+4)?0:1;
grid[y0+1][rx+2]=0;let ty=y0;while(ty>1&&grid[ty][rx+2]===1){grid[ty][rx+2]=0;ty--}
let scx=(rx+2)*T+T/2,scy=(y0+3)*T+T/2;safes.push({x:scx,y:scy,r:150,room:true,half:1.5*T});items.push({id:Math.random()<.5?"almond_water":"batteries",x:scx,y:scy+44})}
traders=[];{let pool=["crowbar","machete","pipe_wrench","katana","nailgun","shotgun","spear","crossbow","rifle","flamethrower","nail_bat","almond_water","medkit","bandage","repellent","lantern","compass","nightvision","coffee","adrenaline","duct_tape","flare","smoke_bomb","bear_trap","gas_mask","molotov","canned_beans","hazmat_suit","binoculars","canteen","lockpick","emp_grenade","glowstick","mre"];
safes.forEach(s=>{let stock=[];for(let k=0;k<3;k++){let id=pool[(Math.random()*pool.length)|0];let price=WEAPONS[id]?8+((Math.random()*8)|0):3+((Math.random()*5)|0);stock.push({id,price})}traders.push({x:s.x-45,y:s.y-45,stock,name:["Mira","Dusty","Ash","Vex"][(Math.random()*4)|0]})})}
for(let k=0;k<14;k++){let c=free[(Math.random()*free.length)|0];items.push({id:"backcoin",x:c[0]*T+T/2,y:c[1]*T+T/2})}
for(let k=0;k<3;k++){let c=free[(Math.random()*free.length)|0];crates.push({x:c[0]*T+T/2,y:c[1]*T+T/2,opened:false,kind:"mil"})}
for(let k=0;k<2;k++){let c=free[(Math.random()*free.length)|0];crates.push({x:c[0]*T+T/2,y:c[1]*T+T/2,opened:false,kind:"med"})}
for(let k=0;k<2;k++){let c=free[(Math.random()*free.length)|0];crates.push({x:c[0]*T+T/2,y:c[1]*T+T/2,opened:false,kind:"tech"})}
const loot=L.loot;
for(let k=0;k<big*2;k++){let c=free[(Math.random()*free.length)|0];let id=loot[(Math.random()*loot.length)|0];
if(ITEMS[id].type==="weapon"||WEAPONS[id]){if(!inv.includes(id)&&Math.random()<.3)items.push({id,x:c[0]*T+T/2,y:c[1]*T+T/2})}else items.push({id,x:c[0]*T+T/2+(Math.random()*30-15),y:c[1]*T+T/2+(Math.random()*30-15)})}
for(let k=0;k<needF+1;k++){let c=free[(Math.random()*free.length)|0];items.push({id:"fuse",x:c[0]*T+T/2,y:c[1]*T+T/2})}
if(Math.random()<.65){let c=farCell();items.push({id:"golden_almond",x:c[0]*T+T/2,y:c[1]*T+T/2})}
if(L.vault){Object.keys(ITEMS).forEach(id=>{let c=free[(Math.random()*free.length)|0];items.push({id,x:c[0]*T+T/2+(Math.random()*30-15),y:c[1]*T+T/2+(Math.random()*30-15)})});say(L.sandbox?"🧪 SANDBOX — every item is here. Press X for the spawn panel.":"🌰 THE VAULT — one of EVERY item. Take it all. SHE is waiting.",4200)}
let ec=free[(free.length/2)|0],E=ENTITIES[L.entity];
function farCell(){for(let k=0;k<24;k++){let c=free[(Math.random()*free.length)|0];if(Math.hypot(c[0]*T-px,c[1]*T-py)>520)return c}return free[(free.length/2)|0]}
if(!L.sandbox&&!(L.bossArena&&L.entity===(L.bossEnt||"boss")))ents.push({t:L.entity,x:ec[0]*T+T/2,y:ec[1]*T+T/2,hp:E.hp,max:E.hp,stun:0,wx:0,wy:0,wt:0});
let pack=L.sandbox?0:L.bossArena?2:L.double?4:3+(big>49?1:0);
let pool=["bacteria","hound","smiler","dullers","clumps","skinstealer","party","moths","shadow","window","wretch","static","stalker","crawler","wailer","brute","mimic","lifeless","screamer","angler"];
for(let k=1;k<pack;k++){let t=k===1&&L.double?L.entity:pool[(Math.random()*pool.length)|0];if(t==="boss")t="party";let c=farCell(),SE=ENTITIES[t];ents.push({t,x:c[0]*T+T/2,y:c[1]*T+T/2,hp:SE.hp,max:SE.hp,stun:0,wx:0,wy:0,wt:0})}
if(L.bossArena){let bt=L.bossEnt||"boss",BE=ENTITIES[bt];ents.push({t:bt,x:arena.x,y:arena.y,hp:BE.hp,max:BE.hp,stun:0,wx:0,wy:0,wt:0,big:true,spawnT:6});say(`${BE.icon} ${BE.name.toUpperCase()} nests here. Gear up, then KILL HER — the white door is sealed.`,4200)}
if(Math.random()<.3){let g=free[(Math.random()*free.length)|0];ents.push({t:"guide",x:g[0]*T+T/2,y:g[1]*T+T/2,hp:999,max:999,stun:0,wx:0,wy:0,wt:0})}
}
boost=0;
clearDetails();
$("lvlTag").textContent=L.tutorial?"TRAINING":"Lv"+L.id+" · "+L.name.split("—")[0];
menu.style.display="none";$("load").style.display="none";playing=true;hum(true);
say((INTROS[L.id]||L.name)+" — "+L.tip,3400);updHot();updObj();
if(coins>=20)unlock("rich");
}
$("playBtn").onclick=()=>start(+lvlSel.value);
{let row=$("playBtn").parentElement,sv=document.createElement("button");sv.className="btn g";sv.textContent="💾 SAVE";sv.onclick=()=>{if(L.tutorial){say("🎓 No saving during training — nothing leaves here.");return}try{localStorage.setItem("br_save",JSON.stringify({lid:L.id,inv,weapon,coins}))}catch(e){}saveKeep();say("Build saved.");beep(660,.15)};row.appendChild(sv);
let ld=document.createElement("button");ld.className="btn g";ld.textContent="📂 LOAD";ld.onclick=()=>{let s=null;try{s=JSON.parse(localStorage.getItem("br_save"))}catch(e){}if(!s){say("No save yet.");return}let idx=LEVELS.findIndex(l=>String(l.id)===String(s.lid));if(idx<0)idx=Math.min(s.li||0,LEVELS.length-1);start(idx);inv=s.inv;weapon=s.weapon;coins=s.coins;updCoins();updHot();say(s.auto?"Build loaded (auto-save).":"Build loaded.")};row.appendChild(ld)
let cd=document.createElement("button");cd.className="btn g";cd.textContent="🎟 CODE";cd.onclick=()=>{let c=prompt("Enter code:");if(c)redeemCode(c)};row.appendChild(cd)}
lvlSel.onchange=()=>$("playBtn").textContent="ENTER "+LEVELS[+lvlSel.value].name.split("—")[0].trim();
$("helpBtn").onclick=()=>tab("play");
addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;
window.BR={get x(){return px},get y(){return py},get ex(){return exit.x},get ey(){return exit.y},get items(){return items},get ents(){return ents},get crates(){return crates},get safes(){return safes},get arena(){return arena},get projs(){return projs},get atk(){return atkCd},get bat(){return bat},get sanity(){return sa},give(id){if(WEAPONS[id]){weapon=id;updHot();return "equipped "+id}if(inv.length<6){inv.push(id);updHot();return "got "+id}return "full"},tp(x,y){px=x;py=y},keys};if(e.key==="m")menu.style.display=menu.style.display==="none"?"flex":"none";
if(!playing)return;
if(e.key==="e"||e.key==="E")pickup();
if(e.key==="f"||e.key==="F")lightOn=!lightOn;
if(e.key===" ")attack();
if(e.key==="c"||e.key==="C")toggleCraft();
if(e.key==="j"||e.key==="J")showJournal();
if(e.key>="1"&&e.key<="6")useSlot(+e.key-1)});
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
cv.addEventListener("mousemove",e=>{let r=cv.getBoundingClientRect();fx=e.clientX-r.left-W/2;fy=e.clientY-r.top-H/2;let l=Math.hypot(fx,fy)||1;fx/=l;fy/=l});
cv.addEventListener("mousedown",()=>{if(playing)attack()});
$("atkBtn").onclick=()=>attack();
function solid(x,y){let gx=(x/T)|0,gy=(y/T)|0;if(gx<0||gy<0||gx>=GW||gy>=GH)return true;return grid[gy][gx]===1}
function move(o,dx,dy){if(!solid(o.x+dx*1.4+Math.sign(dx)*15,o.y))o.x+=dx;if(!solid(o.x,o.y+dy*1.4+Math.sign(dy)*15))o.y+=dy}
function pickup(){let cr=null,cd=96;crates.forEach(c=>{if(!c.opened){let d=Math.hypot(c.x-px,c.y-py);if(d<cd){cd=d;cr=c}}});
if(cr){openCrate(cr);return}
let bt=null,bd=105;traders.forEach(t=>{let d=Math.hypot(t.x-px,t.y-py);if(d<bd){bd=d;bt=t}});
if(bt){trade(bt);return}
let best=-1;bd=69;items.forEach((it,i)=>{let d=Math.hypot(it.x-px,it.y-py);if(d<bd){bd=d;best=i}});
if(best<0)return;let it=items.splice(best,1)[0],D=ITEMS[it.id];
if(L.tutorial)tut.pick=true;
if(L.tutorial)updObj();
if(it.id==="backcoin"){coins+=1;updCoins();pickupS();say("🪙 +1 Backcoin (total "+coins+")");return}
if(WEAPONS[it.id]){weapon=it.id;say(D.icon+" picked up "+D.name+" — auto-equipped");pickupS();updHot();return}
if(it.id==="tape"){let tp=Math.random()<.12?TAPES[TAPES.length-1]:TAPES[(Math.random()*TAPES.length)|0];lorePop(tp.t,tp.x);try{if(!tapesFound.includes(tp.t)){tapesFound.push(tp.t);localStorage.setItem("br_tapes",JSON.stringify(tapesFound))}}catch(e){}pickupS();return}
if(it.id==="golden_almond"){unlock("seeker")}
if(inv.length>=6){say("Hotbar full (6). Press 1-6 to use something first.");items.push(it);return}
inv.push(it.id);pickupS();say(D.icon+" "+D.name+" — "+D.use);updHot()}
function openCrate(cr){cr.opened=true;pickupS();
let table=cr.kind==="med"?MED_LOOT:cr.kind==="tech"?TECH_LOOT:MIL_LOOT;
let style=CRATE_STYLE[cr.kind]||CRATE_STYLE.mil;
let rolls=inv.includes("lockpick")?3:2;
let n=0,gots=[];
for(let k=0;k<rolls;k++){let id=table[(Math.random()*table.length)|0];
if(id==="backcoin"){coins+=3;updCoins();gots.push("+3🪙");continue}
if(WEAPONS[id]){if(!n){weapon=id;n++}else if(inv.length<6)inv.push(id);gots.push(ITEMS[id].icon+" "+ITEMS[id].name);continue}
if(inv.length>=6){items.push({id,x:px+36,y:py});gots.push(ITEMS[id].name+" (dropped — full)")}else{inv.push(id);gots.push(ITEMS[id].icon+" "+ITEMS[id].name)}}
let oc=0;try{oc=+localStorage.getItem("br_crates")||0;oc++;localStorage.setItem("br_crates",oc)}catch(e){}
if(oc>=3)unlock("quartermaster");
say(style.icon+" "+style.name+(rolls>2?" (lockpick +1): ":": ")+gots.join(" + "));updHot()}
function trade(t){if(!t.stock.length){say("🧑‍💼 "+t.name+": sold out, wanderer.");return}
let offer=t.stock[0];
if(coins<offer.price){say(`🧑‍💼 ${t.name}: ${ITEMS[offer.id].icon} ${ITEMS[offer.id].name} costs ${offer.price}🪙 — you have ${coins}.`);return}
coins-=offer.price;t.stock.shift();updCoins();pickupS();
if(WEAPONS[offer.id]){weapon=offer.id;say(`🧑‍💼 ${t.name}: sold ${ITEMS[offer.id].icon} ${ITEMS[offer.id].name}! Equipped. (${coins}🪙 left)`)}
else if(inv.length>=4){items.push({id:offer.id,x:px+30,y:py});say(`🧑‍💼 bought ${ITEMS[offer.id].name} — hotbar full, dropped at feet.`)}
else{inv.push(offer.id);say(`🧑‍💼 ${t.name}: bought ${ITEMS[offer.id].icon} ${ITEMS[offer.id].name}! (${coins}🪙 left)`)}
updHot()}
function useSlot(i){if(!inv[i])return;let id=inv[i],D=ITEMS[id];
if(D.type==="heal"){hp=Math.min(100,hp+D.heal);sa=Math.min(100,sa+20);if(id==="golden_almond"){hp=100;st=100;coins+=5;updCoins();say("✨ GOLDEN ALMOND — fully restored +5🪙!")}else say(D.icon+" used: "+D.use);inv.splice(i,1);beep(520,.15)}
else if(D.type==="stam"){st=Math.min(100,st+D.heal);hp=Math.min(100,hp+10);if(id==="coffee")boost=20;if(id==="adrenaline"){boost=20;hp=Math.min(100,hp+25);say("💉 ADRENALINE — full sprint!")}if(id==="mre"){hp=Math.min(100,hp+40);say("🍱 MRE downed — +40 HP, full belly.")}inv.splice(i,1);beep(520,.15);if(id==="coffee")say("☕ SPEED +20s!")}
else if(D.type==="ammo"){bat=100;inv.splice(i,1);say("🔋 flashlight recharged")}
else if(D.type==="throw"){inv.splice(i,1);throwItem(id)}
else if(D.type==="buff"){if(id==="compass")say("🧭 compass equipped — follow the arrow.");else if(id==="gas_mask")say("😷 gas mask on — sanity drains slower.");else if(id==="hazmat_suit")say("☢️ hazmat sealed — damage + sanity resist.");else if(id==="binoculars")say("🔭 binoculars up — arrow finds nearest crate.");else say("🪙 lucky coin is passive — keep it.")}
else if(D.type==="tool"){if(id==="bear_trap"){traps.push({x:px,y:py});inv.splice(i,1);beep(440,.15);say("🪤 trap SET at your feet. Lure it in!")}else if(id==="lockpick")say("🗝️ lockpick kept — crates drop +1 loot.");else if(id==="glowstick")say("🪄 glowstick snapped — dim light, no battery.");else say(D.icon+" "+D.name+" — passive, keep it.")}
else if(D.type==="weapon"){weapon=id;say("Equipped "+D.name)}
else if(D.type==="coin"){coins+=1;updCoins();inv.splice(i,1);say("🪙 +1 Backcoin")}
else say(D.use);
if(sel>=inv.length)sel=0;updHot()}
function throwItem(id){let E=nearestEnt(500);
if(id==="repellent"){if(E){E.hp-=50;E.stun=3;burst(E.x,E.y,"🧪");say("Repellent burns it!")}else say("Threw repellent — nothing near.")}
if(id==="radio"){projs.push({x:px,y:py,vx:fx*450,vy:fy*450,life:2,lure:true});say("📻 thrown — noise lure!")}
if(id==="flare"){let n=0;ents.forEach(e=>{if(e.t==="guide")return;if(Math.hypot(e.x-px,e.y-py)<420){e.hp-=60;e.stun=4;burst(e.x,e.y,"🔥");addDecal(e.x,e.y,"scorch");n++}});flareT=14;addShake(6);say(n?`🧨 flare burns ${n}! (+14s light)`:"🧨 flare lit — +14s light.")}
if(id==="smoke_bomb"){let n=0;ents.forEach(e=>{if(e.t==="guide"||e.big)return;let d=Math.hypot(e.x-px,e.y-py);if(d<510){e.stun=6;let a=Math.atan2(e.y-py,e.x-px);let nx=e.x+Math.cos(a)*195,ny=e.y+Math.sin(a)*195;if(!solid(nx,e.y))e.x=nx;if(!solid(e.x,ny))e.y=ny;burst(e.x,e.y,"💨");n++}});say(n?`💨 ${n} chaser(s) lost you!`:"💨 smoke out — nothing near.")}
if(id==="molotov"){let n=0;ents.forEach(e=>{if(e.t==="guide")return;if(Math.hypot(e.x-px,e.y-py)<330){e.hp-=90;e.stun=2;burst(e.x,e.y,"🔥");addFloat(e.x,e.y,"-90","#f80");addDecal(e.x,e.y,"scorch");n++}});for(let k=0;k<3;k++)addDecal(px+(Math.random()*120-60),py+(Math.random()*120-60),"scorch");addShake(8);say(n?`🍾 direct hit on ${n}!`:"🍾 thrown — fire everywhere, nothing hit.")}
if(id==="emp_grenade"){let n=0;ents.forEach(e=>{if(e.t==="guide")return;if(Math.hypot(e.x-px,e.y-py)<450){e.hp-=100;e.stun=8;burst(e.x,e.y,"⚡");addFloat(e.x,e.y,"-100 EMP","#4df");n++}});for(let k=0;k<4;k++)addDecal(px+(Math.random()*150-75),py+(Math.random()*150-75),"scorch");addShake(10);sting();say(n?`💥 EMP fried ${n}! 8s stun.`:"💥 EMP popped — nothing near.")}
hit()}
function nearestEnt(r){let b=null,bd=r;ents.forEach(e=>{if(e.t==="guide")return;let d=Math.hypot(e.x-px,e.y-py);if(d<bd){bd=d;b=e}});return b}
function attack(){if(atkCd>0)return;let Wp=WEAPONS[weapon];atkCd=Wp.cd;burst(px+fx*45,py+fy*45,"💥");addShake(2);notifyShot();if(L.tutorial)tut.hit=true;
if(L.tutorial)updObj();
if(weapon==="shotgun"){for(let k=-1;k<=1;k++){let a=Math.atan2(fy,fx)+k*.18;projs.push({x:px,y:py,vx:Math.cos(a)*720,vy:Math.sin(a)*720,life:.6,dmg:Wp.dmg/2})}hit();return}
if(Wp.ammo||weapon==="almond_darts"){let cost=weapon==="nailgun"?5:weapon==="rifle"?2:0;if(bat<cost){say("🔋 too low — grab batteries!");return}bat-=cost;let spd=weapon==="rifle"?960:780;projs.push({x:px,y:py,vx:fx*spd,vy:fy*spd,life:1.2,dmg:Wp.dmg});hit();return}
if(weapon==="flamethrower"){if(bat<4){say("🔋 too low — grab batteries!");return}bat-=4;let n=0;ents.forEach(e=>{if(e.t==="guide")return;let dx=e.x-px,dy=e.y-py,d=Math.hypot(dx,dy);if(d<225&&(dx*fx+dy*fy)/(d||1)>0.4){e.hp-=Wp.dmg;e.stun=1;burst(e.x,e.y,"🔥");n++}});for(let k=0;k<6;k++)parts.push({x:px+fx*60,y:py+fy*60,vx:fx*240+(Math.random()-.5)*180,vy:fy*240+(Math.random()-.5)*180,life:.4,t:"🔥"});addShake(3);hit();if(!n)say("🔥 whoosh — nothing in the cone.");return}
if(Wp.stun){ents.forEach(e=>{if(Math.hypot(e.x-px,e.y-py)<Wp.range*T/4){e.stun=Wp.stun;e.hp-=Wp.dmg;burst(e.x,e.y,"💡")}});hit();return}
let E=nearestEnt(Wp.range*T/3.2);if(E){E.hp-=Wp.dmg*(ENTITIES[E.t].weak==="almond"&&inv.includes("almond_water")?1.5:1);if(weapon==="nail_bat"&&E.t!=="guide"){let a=Math.atan2(E.y-py,E.x-px);let nx=E.x+Math.cos(a)*105,ny=E.y+Math.sin(a)*105;if(!solid(nx,E.y))E.x=nx;if(!solid(E.x,ny))E.y=ny;E.stun=Math.max(E.stun,1);addFloat(E.x,E.y,"SENT!","#fc0")}burst(E.x,E.y,"🩸");addDecal(E.x,E.y,"blood");addFloat(E.x,E.y,"-"+Wp.dmg,"#ff6");addShake(4);hit();if(E.hp<=0){burst(E.x,E.y,"🎉");addDecal(E.x,E.y,"blood");say("ENTITY DOWN! Exit is open — RUN!");ents.splice(ents.indexOf(E),1);sting()}}else hit()}
function burst(x,y,t){for(let i=0;i<8;i++)parts.push({x,y,vx:(Math.random()-.5)*300,vy:(Math.random()-.5)*300,life:.5,t})}
function updHot(){let h=$("hot");h.innerHTML="";inv.forEach((id,i)=>{let D=ITEMS[id];let d=document.createElement("div");d.className="slot"+(i===sel?" sel":"");d.innerHTML=`<b>${D.icon}</b>${D.name.split(" ")[0]}<br>${i+1}`;d.onclick=()=>{sel=i;useSlot(i)};h.appendChild(d)});
let w=document.createElement("div");w.className="slot sel";w.innerHTML=`<b>${WEAPONS[weapon].icon}</b>${weapon}`;w.title=WEAPONS[weapon].name;h.appendChild(w)}
function toggleCraft(){let p=$("craftP");if(!p){p=document.createElement("div");p.id="craftP";p.style.cssText="position:absolute;left:8px;bottom:140px;z-index:9;background:#000e;border:1px solid #c9a227;border-radius:10px;padding:10px;max-width:300px;font-size:12px";$("app").appendChild(p)}if(p.style.display==="block"){p.style.display="none";return}p.style.display="block";p.innerHTML="<b>🔨 CRAFT (C)</b><br>"+RECIPES.map((r,i)=>{let ok=canCraft(inv,r,weapon);return `<div style="margin:6px 0;border-top:1px solid #443;padding-top:4px">${r.name} — ${r.desc}<br><i>${Object.entries(r.need).map(([k,n])=>n+"x "+(ITEMS[k]?ITEMS[k].name:k)).join(" + ")} → ${(ITEMS[r.gives]||WEAPONS[r.gives]||{}).name||r.gives}</i><br><button data-i="${i}" ${ok?"":"disabled"} style="margin-top:4px;cursor:pointer">${ok?"CRAFT":"need mats"}</button></div>`}).join("")+`<div style="opacity:.7">J = journal/tapes · K = kills</div>`;p.querySelectorAll("button").forEach(b=>b.onclick=()=>{let r=RECIPES[+b.dataset.i];if(!canCraft(inv,r,weapon))return;let g=doCraft(inv,r,weapon);if(g.usedWeapon)weapon="fists";if(WEAPONS[g.gives]){weapon=g.gives;say("🔨 crafted "+WEAPONS[g.gives].name+" — equipped!")}else{inv.push(g.gives);say("🔨 crafted "+ITEMS[g.gives].name+"!")}unlock("crafter");updHot();toggleCraft();toggleCraft();pickupS()})}
window.toggleCraft=toggleCraft;
function showJournal(){let p=$("craftP");if(!p){toggleCraft();p=$("craftP")}p.style.display="block";p.innerHTML=`<b>📓 JOURNAL (J)</b> — ☠${kills} kills · 🪙${coins}<br><br><b>Tapes (${tapesFound.length}/${TAPES.length}):</b><br>`+(tapesFound.length?tapesFound.map(t=>`· ${t}`).join("<br>"):"No tapes yet — grab 📼.")+`<br><br><b>Achievements:</b><br>`+Object.keys(ACHIEVE).map(k=>`${ach[k]?"✅":"🔒"} ${ACHIEVE[k].name} — ${ACHIEVE[k].desc}`).join("<br>")+`<br><br><button onclick="this.parentElement.style.display='none'">close</button>`}
window.showJournal=showJournal;
function toggleSandbox(){if(!L.sandbox){say("🧪 The spawn panel only exists in SANDBOX.");return}
let p=$("sbP");if(!p){p=document.createElement("div");p.id="sbP";p.style.cssText="position:absolute;right:8px;bottom:140px;z-index:9;background:#000e;border:1px solid #4df;border-radius:10px;padding:10px;max-width:280px;font-size:12px";$("app").appendChild(p)}
if(p.style.display==="block"){p.style.display="none";return}p.style.display="block";
let entOpts=Object.keys(ENTITIES).map(t=>`<option value="${t}">${ENTITIES[t].icon} ${ENTITIES[t].name}</option>`).join("");
let itemOpts=Object.keys(ITEMS).map(id=>`<option value="${id}">${ITEMS[id].icon} ${ITEMS[id].name}</option>`).join("");
p.innerHTML=`<b>🧪 SANDBOX (X)</b><br><div style="margin:6px 0">Entity: <select id="sbEnt">${entOpts}</select> <button id="sbEntB">spawn</button></div><div style="margin:6px 0">Item: <select id="sbItem">${itemOpts}</select> <button id="sbItemB">drop</button></div><div style="margin:6px 0"><button id="sbGod">${godMode?"GOD: ON":"GOD: off"}</button> <button id="sbKill">kill all</button> <button id="sbExit">to exit</button></div><div style="opacity:.7">Guide = peaceful. Mother = pain.</div>`;
p.querySelector("#sbEntB").onclick=()=>{let t=p.querySelector("#sbEnt").value,E=ENTITIES[t];ents.push({t,x:px+130,y:py,hp:E.hp,max:E.hp,stun:0,wx:0,wy:0,wt:0,big:(t==="boss"||t==="mother"),spawnT:14});burst(px+130,py,"✨");say(`${E.icon} ${E.name} spawned.`);pickupS()};
p.querySelector("#sbItemB").onclick=()=>{let id=p.querySelector("#sbItem").value;items.push({id,x:px+44,y:py});say(`${ITEMS[id].icon} ${ITEMS[id].name} dropped — press E.`);pickupS()};
p.querySelector("#sbGod").onclick=e=>{godMode=!godMode;e.target.textContent=godMode?"GOD: ON":"GOD: off";say(godMode?"✨ godmode ON — unkillable.":"godmode off. Be careful.")};
p.querySelector("#sbKill").onclick=()=>{ents.forEach(e=>{if(e.t!=="guide")e.hp=0});say("💥 judgment day.")};
p.querySelector("#sbExit").onclick=()=>{px=exit.x;py=exit.y;say("➡️ exit delivery.")};}
window.toggleSandbox=toggleSandbox;
function autosave(nextIdx){try{localStorage.setItem("br_save",JSON.stringify({lid:LEVELS[nextIdx].id,inv,weapon,coins,auto:true,t:Date.now()}))}catch(e){}saveKeep()}
function endingStats(){let na=Object.keys(ach).length;return `☠${kills} kills · 🪙${coins} coins<br>📼 tapes ${tapesFound.length}/${TAPES.length} · 🏆 ${na}/${Object.keys(ACHIEVE).length} achievements`}
function updObj(){if(L.tutorial){$("objTag").textContent=`🎓 ${(tut.move?"✅":"①")}move ${(tut.pick?"✅":"②")}grab ${(tut.hit?"✅":"③")}hit → exit`;return}let t=needF?`◈ fuses ${fuses}/${needF} → exit`:"◈ find the glowing exit";$("objTag").textContent=t+" · ☠"+kills}
addEventListener("keydown",e=>{if(e.key>="1"&&e.key<="6"){sel=+e.key-1}});
addEventListener("keydown",e=>{if(playing&&(e.key==="x"||e.key==="X"))toggleSandbox()});
const KONAMI=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];let konI=0;
addEventListener("keydown",e=>{
let k=e.key.length===1?e.key.toLowerCase():e.key;
if(k===KONAMI[konI]){konI++;if(konI>=KONAMI.length){konI=0;coins+=10;updCoins();saveKeep();burst(px,py,"🎉");unlock("konami");say("🎉 UP UP! +10🪙 — the dev winks at you.");sting()}}else konI=k===KONAMI[0]?1:0;
if(!playing)return;
if((e.key==="g"||e.key==="G")&&!guideGift){let g=null,gd=150;ents.forEach(en=>{if(en.t==="guide"){let d=Math.hypot(en.x-px,en.y-py);if(d<gd){gd=d;g=en}}});if(g){guideGift=true;unlock("friend");if(inv.length<6){inv.push("almond_water");updHot()}else items.push({id:"almond_water",x:px+30,y:py});pickupS();say("🧙 The Guide presses a cold bottle into your hands. \"Drink. Keep going.\"")}}
});
(function stick(){let s=$("stick"),n=$("nub"),on=false;function p(e){let r=s.getBoundingClientRect(),t=e.touches?e.touches[0]:e;let dx=t.clientX-(r.left+55),dy=t.clientY-(r.top+55),l=Math.hypot(dx,dy)||1,m=Math.min(l,40);joy={x:dx/l*(m/40),y:dy/l*(m/40)};n.style.left=(35+dx/l*m*.8)+"px";n.style.top=(35+dy/l*m*.8)+"px"}
s.addEventListener("touchstart",e=>{on=true;p(e)},{passive:true});addEventListener("touchmove",e=>{if(on)p(e)},{passive:true});addEventListener("touchend",()=>{on=false;joy={x:0,y:0};n.style.left="35px";n.style.top="35px"})})();
function loop(t){requestAnimationFrame(loop);let dt=Math.min(.05,(t-lastT)/1000||.016);lastT=t;if(!playing)return;
if(boost>0)boost-=dt;
let sp=(keys["shift"]&&st>1?300:180)*(boost>0?1.4:1);if(keys["shift"]&&st>1)st-=14*dt;else st=Math.min(100,st+8*dt);
let mx=((keys["d"]||keys["arrowright"])?1:0)-((keys["a"]||keys["arrowleft"])?1:0)+joy.x;
let my=((keys["s"]||keys["arrowdown"])?1:0)-((keys["w"]||keys["arrowup"])?1:0)+joy.y;
let l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}
if(l>.1){let nx=mx*sp*dt,ny=my*sp*dt;
if(!solid(px+nx*2+Math.sign(nx)*15,py))px+=nx;if(!solid(px,py+ny*2+Math.sign(ny)*15))py+=ny;
stepT+=dt;if(stepT>.32){stepT=0;step();if(Math.random()<.6)addDecal(px,py,"step")}if(Math.random()<.02)seen.add(((px/T)|0)+","+((py/T)|0))}
if(L.tutorial&&l>.1&&!tut.move){tut.move=true;updObj()}
hasNV=inv.includes("nightvision");if(flareT>0)flareT-=dt;let glow=inv.includes("glowstick");let lit=lightOn||hasNV||flareT>0||glow;
inSafe=safes.some(s=>s.room?Math.abs(px-s.x)<s.half&&Math.abs(py-s.y)<s.half:Math.hypot(s.x-px,s.y-py)<s.r);
if(inSafe){hp=Math.min(100,hp+10*dt);sa=Math.min(100,sa+12*dt);st=Math.min(100,st+20*dt)}
if(lightOn&&bat>0&&!hasNV)bat-=dt*2;if(bat<=0)lightOn=false;
if(!lit&&L.bright<.5)sa-=dt*(inv.includes("hazmat_suit")?1:inv.includes("gas_mask")?1.5:3);sa=Math.min(100,sa+dt*(lit?1.2:.3));sa=Math.max(0,sa);
if(sa<=0){hp-=3*dt;if(!sanWarn){sanWarn=true;say("🧠 SANITY GONE — mind slipping! Get to LIGHT or drink almond water!",3200)}if(Math.random()<dt*1.2)beep(170+Math.random()*130,.25,"sine",.05)}else if(sa>25)sanWarn=false;
atkCd-=dt;projs.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.lure&&Math.random()<.1)beep(300+Math.random()*300,.1,"sine",.04);
ents.forEach(e=>{if(Math.hypot(e.x-p.x,e.y-p.y)<24){if(p.dmg){e.hp-=p.dmg;burst(e.x,e.y,"🩸")}p.life=0}})});
projs=projs.filter(p=>p.life>0&&!solid(p.x,p.y));
parts.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt});parts=parts.filter(p=>p.life>0);
chasing=false;
for(let Ei=ents.length-1;Ei>=0;Ei--){let E=ents[Ei];
if(E.t==="guide"){let a=Math.atan2(exit.y-E.y,exit.x-E.x);E.x+=Math.cos(a)*75*dt;E.y+=Math.sin(a)*75*dt;if(solid(E.x,E.y)){E.x-=Math.cos(a)*75*dt;E.y-=Math.sin(a)*75*dt}continue}
if(E.hp<=0&&E.t!=="guide")E.stun=0;
if(E.stun>0){E.stun-=dt;continue}
if(E.big){E.spawnT-=dt;if(E.spawnT<=0&&ents.length<4){E.spawnT=14;let mt=E.t==="mother"?["crawler","wailer","mimic","screamer","brute"][(Math.random()*5)|0]:"party",ME=ENTITIES[mt];ents.push({t:mt,x:E.x+45,y:E.y,hp:ME.hp,max:ME.hp,stun:0,wx:0,wy:0,wt:0});say(`${ENTITIES[E.t].icon} ${ENTITIES[E.t].name} screams — a ${ME.name} crawls out!`);sting()}}
for(let s of safes){let sd=Math.hypot(E.x-s.x,E.y-s.y);if(sd<s.r+30){let a=Math.atan2(E.y-s.y,E.x-s.x);E.x+=Math.cos(a)*135*dt;E.y+=Math.sin(a)*135*dt;if(solid(E.x,E.y)){E.x-=Math.cos(a)*135*dt;E.y-=Math.sin(a)*135*dt}}}
if(inSafe)continue
let d=Math.hypot(E.x-px,E.y-py),Ed=ENTITIES[E.t],vis=d<630&&(lit||d<225);
let hear=d<390&&l>.5&&keys["shift"];
if(E.t==="shadow"&&!hasNV&&d>225)vis=false;
if(E.t==="wretch"&&l<.15)vis=false;
if(E.t==="static"){vis=lightOn?d<780:d<240}
if(E.t==="smiler"&&lit&&d<300){}
else if(vis||hear||p_lured(E)){let a=Math.atan2(py-E.y,px-E.x);let s2=Ed.speed*63*dt*(E.t==="smiler"&&lit?0.25:1)*(E.big&&E.hp<E.max*0.35?1.2:1);
let ox=E.x,oy=E.y;E.x+=Math.cos(a)*s2;E.y+=Math.sin(a)*s2;if(solid(E.x,E.y)){E.x=ox;E.y+=Math.sin(a)*s2;if(solid(E.x,E.y)){E.y=oy;E.x+=Math.cos(a)*s2}}
if(d<450)chasing=true}
if(d<45){let coin=inv.includes("lucky_coin")?.7:1;let jack=inv.includes("jacket")?.6:1;let haz=inv.includes("hazmat_suit")?.5:1;hp-=Ed.dmg*coin*jack*haz*dt*2;hurt();addShake(5);if(Math.random()<.1)burst(px,py,"🩸")}
for(let ti=traps.length-1;ti>=0;ti--){if(E.t!=="guide"&&Math.hypot(E.x-traps[ti].x,E.y-traps[ti].y)<57){traps.splice(ti,1);E.hp-=80;E.stun=2;burst(E.x,E.y,"🩸");addFloat(E.x,E.y,"-80 TRAP","#fc0");addShake(7);sting();break}}
if(E.hp<=0){let wasBoss=!!E.big;ents.splice(Ei,1);kills++;if(kills===1)unlock("firstblood");if(E.t==="boss")unlock("mama");if(E.t==="mother")unlock("mother");coins+=wasBoss?10:2;updCoins();try{localStorage.setItem("br_kills",kills)}catch(e){}for(let k=0;k<(wasBoss?10:0);k++)items.push({id:"backcoin",x:E.x+(Math.random()*60-30),y:E.y+(Math.random()*60-30)});burst(E.x,E.y,"🎉");addFloat(E.x,E.y,"+2🪙","#ffdf6b");say(wasBoss?`${ENTITIES[E.t].icon} ${ENTITIES[E.t].name.toUpperCase()} DOWN! +10🪙 shower!`:`ENTITY DOWN ☠ ${kills} kills, +2🪙 — exit open!`);sting()}}
function p_lured(e){for(let p of projs)if(p.lure&&Math.hypot(e.x-p.x,e.y-p.y)<300){let a=Math.atan2(p.y-e.y,p.x-e.x);e.x+=Math.cos(a)*90*dt;e.y+=Math.sin(a)*90*dt;return false}return false}
if(godMode){hp=100;sa=100;st=100}
if(hp<=0){playing=false;hum(false);$("boss").style.display="none";menu.style.display="flex";tabBody.innerHTML=`<div style="font-size:18px">☠ YOU NOCLIPPED OUT OF EXISTENCE on ${L.name}. <button class="btn" onclick="location.reload()">RETRY</button></div>`;return}
if(Math.hypot(exit.x-px,exit.y-py)<60){if(L.tutorial){playing=false;hum(false);$("boss").style.display="none";inv=["almond_water"];weapon="fists";sel=0;coins=tutCoins;updCoins();updHot();try{localStorage.setItem("br_unlocked",Math.max(+localStorage.getItem("br_unlocked")||0,1))}catch(e){}$("playBtn").textContent="ENTER "+LEVELS[1].name;menu.style.display="flex";lvlSel.value=1;tabBody.innerHTML=`<div style="font-size:16px">🎓 TRAINING COMPLETE! Practice gear recycled — nothing leaves training.<br>Next: ${LEVELS[1].name} — ${LEVELS[1].tip}</div>`;beep(880,.3);return}let foes=ents.filter(e=>e.t!=="guide");if(L.bossArena&&ents.some(e=>e.big)){let BB=ents.find(e=>e.big);say(`⛔ The exit is SEALED — kill ${BB?ENTITIES[BB.t].name:"the boss"} first!`)}else if(fuses>=needF&&foes.length===0||fuses>=needF&&foes.length===0||(fuses>=needF&&kills>0)){playing=false;hum(false);$("boss").style.display="none";if(li===LEVELS.length-1){autosave(1);try{localStorage.setItem("br_unlocked",LEVELS.length-1)}catch(e){}$("playBtn").textContent="ENTER "+LEVELS[1].name;menu.style.display="flex";lvlSel.value=1;tabBody.innerHTML=`<div style="font-size:16px">🏆 YOU ESCAPED THE BACKROOMS!<br>${endingStats()}<br><i>Progress auto-saved. Free-roam continues at ${LEVELS[1].name}.</i></div>`;beep(880,.3);setTimeout(()=>beep(1320,.4),250);return}let n=(li+1)%LEVELS.length;if(n===0&&LEVELS[0].tutorial)n=1;autosave(n);try{localStorage.setItem("br_unlocked",Math.max(+localStorage.getItem("br_unlocked")||0,n))}catch(e){}$("playBtn").textContent="ENTER "+LEVELS[n].name;menu.style.display="flex";lvlSel.value=n;tabBody.innerHTML=`<div style="font-size:16px">✅ ESCAPED ${L.name}! ☠${kills} (auto-saved ✓)<br>Next: ${LEVELS[n].name} — ${LEVELS[n].tip}</div>`;beep(880,.3);return}
else if(foes.length>0)say("Kill or lose the entity first!");else say(`Need ${needF-fuses} more FUSE(S) 🔌`)}
items.forEach(it=>{if(it.id==="fuse"&&Math.hypot(it.x-px,it.y-py)<45){items.splice(items.indexOf(it),1);fuses++;pickupS();say(`🔌 Fuse ${fuses}/${needF}`);updObj()}});
netT-=dt;if(sock&&netT<=0){netT=.2;try{sock.send("p|"+myId+"|"+(px|0)+"|"+(py|0)+"|"+L.id)}catch(e){}updNetTag()}
draw(dt)}
function draw(dt){
ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);
stepFx(dt);stepDecals(dt);let[shx,shy]=shakeOff();
let cx=px-W/2+shx,cy=py-H/2+shy;
let x0=Math.max(0,(cx/T|0)-1),x1=Math.min(GW-1,(cx+W)/T+1|0),y0=Math.max(0,(cy/T|0)-1),y1=Math.min(GH-1,(cy+H)/T+1|0);
for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){let sx=x*T-cx,sy=y*T-cy;
if(grid[y][x]){ctx.fillStyle="#"+L.wall.toString(16).padStart(6,"0");ctx.fillRect(sx,sy,T,T);drawWallD(ctx,sx,sy,x,y,T,L,grid)}
else{ctx.fillStyle="#"+L.floor.toString(16).padStart(6,"0");ctx.fillRect(sx,sy,T,T);drawFloorD(ctx,sx,sy,x,y,T,L)}}
drawDecals(ctx,cx,cy);
ctx.fillStyle="#ffdf6b";ctx.shadowColor="#ffdf6b";ctx.shadowBlur=20;ctx.beginPath();ctx.arc(exit.x-cx,exit.y-cy,24+Math.sin(Date.now()/300)*4,0,7);ctx.fill();ctx.shadowBlur=0;
drawExitD(ctx,exit.x-cx,exit.y-cy,L,Date.now());
if(arena){let ax=(arena.tx-arena.r)*T-cx,ay=(arena.ty-arena.r)*T-cy,as=(arena.r*2+1)*T;ctx.fillStyle="rgba(160,20,20,.16)";ctx.fillRect(ax,ay,as,as);ctx.strokeStyle="#f33";ctx.lineWidth=4;ctx.setLineDash([24,16]);ctx.strokeRect(ax,ay,as,as);ctx.setLineDash([]);ctx.fillStyle="#f66";ctx.font="bold 26px monospace";ctx.textAlign="center";ctx.fillText(`${ENTITIES[L.bossEnt||"boss"].icon} ${ENTITIES[L.bossEnt||"boss"].name.toUpperCase()}'S LAIR — KILL HER`,arena.x-cx,arena.y-cy-arena.r*T-20)}
safes.forEach(s=>{let X=s.x-cx,Y=s.y-cy;if(s.room){ctx.fillStyle="rgba(0,255,110,.10)";ctx.fillRect(X-s.half,Y-s.half,s.half*2,s.half*2);ctx.strokeStyle="#0f6";ctx.lineWidth=3;ctx.setLineDash([12,9]);ctx.strokeRect(X-s.half,Y-s.half,s.half*2,s.half*2);ctx.setLineDash([]);ctx.font="20px monospace";ctx.textAlign="center";ctx.fillStyle="#0f6";ctx.fillText("🛟 SAFE ROOM",X,Y-s.half-12);return}
ctx.fillStyle="#0f08";ctx.beginPath();ctx.arc(X,Y,s.r,0,7);ctx.fill();ctx.strokeStyle="#0f6";ctx.lineWidth=3;ctx.setLineDash([12,9]);ctx.beginPath();ctx.arc(X,Y,s.r,0,7);ctx.stroke();ctx.setLineDash([]);ctx.font="20px monospace";ctx.fillStyle="#0f6";ctx.fillText("🛟 SAFE ROOM",X,Y-6)});
ctx.font="22px serif";ctx.textAlign="center";ctx.fillStyle="rgba(255,255,255,.9)";
ctx.font="28px serif";items.forEach(it=>{let D=ITEMS[it.id];ctx.fillStyle="rgba(0,0,0,.4)";ctx.beginPath();ctx.ellipse(it.x-cx,it.y-cy+12,15,6,0,0,7);ctx.fill();ctx.fillText(D.icon,it.x-cx,it.y-cy+10+Math.sin(Date.now()/400+it.x)*3)});
traps.forEach(tr=>{ctx.fillText("🪤",tr.x-cx,tr.y-cy+7)});
crates.forEach(cr=>{let X=cr.x-cx,Y=cr.y-cy;ctx.save();ctx.translate(X,Y);ctx.scale(1.5,1.5);let st=CRATE_STYLE[cr.kind]||CRATE_STYLE.mil;if(cr.opened){ctx.fillStyle="#222";ctx.fillRect(-13,-10,26,20);ctx.fillStyle="#111";ctx.fillRect(-13,-10,26,5)}else{ctx.fillStyle="rgba(0,0,0,.4)";ctx.beginPath();ctx.ellipse(0,12,15,5,0,0,7);ctx.fill();ctx.fillStyle=st.color;ctx.fillRect(-14,-11,28,22);ctx.fillStyle="rgba(255,255,255,.15)";ctx.fillRect(-14,-11,28,6);ctx.strokeStyle=st.edge;ctx.lineWidth=2;ctx.strokeRect(-14,-11,28,22);ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(0,11);ctx.stroke();ctx.fillStyle=cr.kind==="med"?"#c00":"#ffdf6b";ctx.font="bold 11px monospace";ctx.textAlign="center";ctx.fillText(st.mark,0,4);if(Math.sin(Date.now()/400+cr.x)>0.6){ctx.strokeStyle=cr.kind==="med"?"rgba(255,80,80,.7)":cr.kind==="tech"?"rgba(80,220,255,.7)":"rgba(255,223,107,.7)";ctx.strokeRect(-16,-13,32,26)}}ctx.restore()});
traders.forEach(t=>{ctx.font="34px serif";ctx.fillText("🧑‍💼",t.x-cx,t.y-cy+12);ctx.font="11px monospace";ctx.fillStyle="#ffe9a3";let s=t.stock[0];ctx.fillText(s?`[E] ${t.name}: ${ITEMS[s.id].icon}${s.price}🪙`:`${t.name}: sold out`,t.x-cx,t.y-cy-30)});
ctx.font="11px monospace";ctx.fillStyle="#fff";items.forEach(it=>{if(Math.hypot(it.x-px,it.y-py)<180)ctx.fillText(ITEMS[it.id].name,it.x-cx,it.y-cy-21)});
ents.forEach(e=>{let D=ENTITIES[e.t];let r=e.big?39:24;ctx.fillStyle="rgba(0,0,0,.45)";ctx.beginPath();ctx.ellipse(e.x-cx,e.y-cy+r*0.7,r*0.9,r*0.35,0,0,7);ctx.fill();if(e.stun>0){ctx.fillStyle="#9df";ctx.font="20px serif";ctx.fillText("✶",e.x-cx+21,e.y-cy-21+Math.sin(Date.now()/150)*4)}ctx.fillStyle="#"+D.color.toString(16).padStart(6,"0");ctx.beginPath();ctx.arc(e.x-cx,e.y-cy,r,0,7);ctx.fill();ctx.font=e.big?"48px serif":"32px serif";ctx.fillText(D.icon,e.x-cx,e.y-cy+11);if(chasing&&Math.hypot(e.x-px,e.y-py)<450){ctx.fillStyle="#f33";ctx.beginPath();ctx.arc(e.x-cx-12,e.y-cy-15,4.5,0,7);ctx.arc(e.x-cx+12,e.y-cy-15,4.5,0,7);ctx.fill()}
if(e.big){ctx.fillStyle="#300";ctx.fillRect(e.x-cx-45,e.y-cy-60,90,12);ctx.fillStyle="#f60";ctx.fillRect(e.x-cx-45,e.y-cy-60,90*Math.max(0,e.hp/e.max),12)}
else{ctx.fillStyle="#300";ctx.fillRect(e.x-cx-30,e.y-cy-42,60,9);ctx.fillStyle="#e33";ctx.fillRect(e.x-cx-30,e.y-cy-42,60*Math.max(0,e.hp/e.max),9)}});
projs.forEach(p=>{if(p.lure){ctx.font="14px serif";ctx.fillText("📻",p.x-cx,p.y-cy+5)}else drawProjReal(ctx,p.x-cx,p.y-cy,p)});
parts.forEach(p=>{ctx.font="14px serif";ctx.fillText(p.t,p.x-cx,p.y-cy+5)});
drawPlayerWeapon(ctx,px-cx,py-cy,Math.atan2(fy,fx),weapon);
ghosts.forEach(g=>{if(g.lv!==L.id)return;ctx.fillStyle="#0f6";ctx.beginPath();ctx.arc(g.x-cx,g.y-cy,10,0,7);ctx.fill();ctx.font="14px serif";ctx.fillText("🧑‍🤝‍🧑",g.x-cx,g.y-cy+5)});
drawFloats(ctx,cx,cy);
if(inv.includes("compass")){let a=Math.atan2(exit.y-py,exit.x-px);ctx.font="30px serif";ctx.fillText("🧭",px-cx+Math.cos(a)*66,py-cy+Math.sin(a)*66+12)}
if(inv.includes("binoculars")){let bc=null,bd=1e9;crates.forEach(c=>{if(!c.opened){let d=Math.hypot(c.x-px,c.y-py);if(d<bd){bd=d;bc=c}}});if(bc){let a=Math.atan2(bc.y-py,bc.x-px);ctx.font="24px serif";ctx.fillStyle="#4df";ctx.fillText("🔭",px-cx+Math.cos(a)*93,py-cy+Math.sin(a)*93+9)}}
let near=null,nd=90;items.forEach(it=>{let d=Math.hypot(it.x-px,it.y-py);if(d<nd){nd=d;near=it}});
if(near){ctx.font="18px monospace";ctx.fillStyle="#ffe9a3";ctx.fillText("[E] "+ITEMS[near.id].name,px-cx,py-cy-36)}
ctx.fillStyle="#ffdf6b55";ctx.fillRect(exit.x-cx-4,exit.y-cy-210,8,180);
if(hasNV){ctx.fillStyle="rgba(0,255,80,.08)";ctx.fillRect(0,0,W,H)}
if(!lightOn||bat<=0){ctx.fillStyle=`rgba(0,0,10,${L.bright<.3?.72:.45})`;ctx.fillRect(0,0,W,H)}
else{let flick=L.id===3||L.id===6?(Math.random()<.04?.55:.75):.75;let g=ctx.createRadialGradient(W/2,H/2,60,W/2,H/2,480);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,`rgba(0,0,10,${flick})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
let a=Math.atan2(fy,fx);ctx.save();ctx.translate(W/2,H/2);ctx.rotate(a);let cg=ctx.createLinearGradient(0,0,480,0);cg.addColorStop(0,"rgba(255,240,180,.14)");cg.addColorStop(1,"rgba(255,240,180,0)");ctx.fillStyle=cg;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(480,-135);ctx.lineTo(480,135);ctx.closePath();ctx.fill();ctx.restore()}
drawMotes(ctx,W,H,Date.now()/1000);
$("vig").style.boxShadow=chasing?"inset 0 0 160px #f00":sa<30?"inset 0 0 160px #a0f":"inset 0 0 120px #000";
$("warn").style.display=chasing?"block":"none";
{let B=ents.find(e=>e.big);if(B){$("boss").style.display="block";$("bossName").textContent="👹 "+ENTITIES[B.t].name;$("bossHp").style.width=Math.max(0,B.hp/B.max*100)+"%"}else $("boss").style.display="none"}
$("hpB").style.width=hp+"%";$("stB").style.width=st+"%";$("saB").style.width=sa+"%";
if(inSafe)$("objTag").textContent="🛟 SAFE — healing…";else updObj();
mapX.fillStyle="#000";mapX.fillRect(0,0,132,132);let s=132/Math.max(GW,GH);
safes.forEach(z=>{if(z.room){mapX.strokeStyle="#0f6";mapX.lineWidth=1;mapX.strokeRect(z.x/T*s-z.half/T*s,z.y/T*s-z.half/T*s,z.half/T*s*2,z.half/T*s*2)}else{mapX.fillStyle="#0f6";mapX.fillRect(z.x/T*s-2,z.y/T*s-2,4,4)}});
traders.forEach(t=>{mapX.fillStyle="#0ff";mapX.fillRect(t.x/T*s-2,t.y/T*s-2,4,4)});
for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(!grid[y][x]){mapX.fillStyle="#665";mapX.fillRect(x*s,y*s,s,s)}
mapX.fillStyle="#ff0";mapX.fillRect(exit.x/T*s-2,exit.y/T*s-2,4,4);
mapX.fillStyle="#4af";mapX.fillRect(px/T*s-2,py/T*s-2,4,4);
ents.forEach(e=>{mapX.fillStyle="#f00";mapX.fillRect(e.x/T*s-2,e.y/T*s-2,4,4)});
items.forEach(it=>{mapX.fillStyle="#0f0";mapX.fillRect(it.x/T*s-1,it.y/T*s-1,2,2)});
crates.forEach(cr=>{if(!cr.opened){let st=CRATE_STYLE[cr.kind]||CRATE_STYLE.mil;mapX.fillStyle=st.map;mapX.fillRect(cr.x/T*s-2,cr.y/T*s-2,4,4)}});
if(arena){mapX.strokeStyle="#f33";mapX.lineWidth=2;mapX.strokeRect((arena.tx-arena.r)*s,(arena.ty-arena.r)*s,(arena.r*2+1)*s,(arena.r*2+1)*s)}}
requestAnimationFrame(loop);
