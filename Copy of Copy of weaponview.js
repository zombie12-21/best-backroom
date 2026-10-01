let lastAtk=0;
export function notifyShot(){lastAtk=performance.now()}
function recent(){return (performance.now()-lastAtk)/1000}
function swingK(cd){let t=recent();if(t>0.35)return 0;return Math.sin((t/0.35)*Math.PI)}
export function drawPlayerWeapon(ctx,X,Y,ang,wid){
let t=recent(),sw=swingK();
ctx.save();ctx.translate(X,Y);
ctx.scale(1.5,1.5);
ctx.fillStyle="rgba(0,0,0,.45)";ctx.beginPath();ctx.ellipse(0,3,14,11,0,0,7);ctx.fill();
ctx.rotate(ang);
ctx.fillStyle="#1c2638";ctx.strokeStyle="#0a0e16";ctx.lineWidth=2;
ctx.beginPath();ctx.arc(0,0,12,0,7);ctx.fill();ctx.stroke();
ctx.fillStyle="#31435f";ctx.fillRect(-14,-7,7,14);
ctx.fillStyle="#c9a87a";ctx.beginPath();ctx.arc(2,0,6,0,7);ctx.fill();
ctx.fillStyle="#222";ctx.beginPath();ctx.arc(2,0,6,0,7);ctx.stroke();
let gun=wid==="shotgun"||wid==="nailgun"||wid==="crossbow"||wid==="almond_darts"||wid==="rifle"||wid==="flamethrower";
let hx=gun?12:14,hy=6;
ctx.fillStyle="#c9a87a";
ctx.beginPath();ctx.arc(hx,hy,4,0,7);ctx.fill();
ctx.beginPath();ctx.arc(hx,-hy,4,0,7);ctx.fill();
ctx.save();
if(!gun)ctx.rotate(sw*1.1);
drawGun(ctx,wid,t,sw);
ctx.restore();
if(gun&&t<0.09){
let mz=muzzle(wid);
ctx.fillStyle="rgba(255,220,120,.95)";ctx.strokeStyle="#ff9500";ctx.lineWidth=2;
ctx.beginPath();
ctx.moveTo(mz,0);ctx.lineTo(mz+16,-7);ctx.lineTo(mz+11,0);ctx.lineTo(mz+16,7);ctx.closePath();ctx.fill();ctx.stroke();
ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(mz+4,0,4,0,7);ctx.fill();
}
if(!gun&&t<0.3){
ctx.strokeStyle="rgba(255,255,255,.35)";ctx.lineWidth=5;
ctx.beginPath();ctx.arc(0,0,38,-0.9+sw*0.4,0.9+sw*0.4);ctx.stroke();
}
ctx.restore();
}
function muzzle(wid){
if(wid==="shotgun")return 46;
if(wid==="spear")return 50;
if(wid==="katana")return 44;
if(wid==="crossbow")return 42;
if(wid==="nailgun")return 40;
if(wid==="almond_darts")return 34;
if(wid==="fire_axe")return 36;
if(wid==="machete")return 38;
if(wid==="crowbar")return 36;
if(wid==="pipe_wrench")return 34;
if(wid==="rifle")return 46;
if(wid==="flamethrower")return 40;
if(wid==="nail_bat")return 34;
return 22;
}
function drawGun(ctx,wid,t,sw){
ctx.lineCap="round";ctx.lineJoin="round";
if(wid==="fists"){
let p=1-Math.min(1,t/0.25);
ctx.fillStyle="#c9a87a";
ctx.beginPath();ctx.arc(20,-5-p*8,5,0,7);ctx.fill();ctx.strokeStyle="#5a3d22";ctx.lineWidth=1;ctx.stroke();
ctx.beginPath();ctx.arc(20,5+p*8,5,0,7);ctx.fill();ctx.stroke();
return;
}
if(wid==="crowbar"){
ctx.strokeStyle="#3a3f46";ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(8,4);ctx.lineTo(32,0);ctx.stroke();
ctx.strokeStyle="#9aa2ad";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(8,4);ctx.lineTo(32,0);ctx.stroke();
ctx.strokeStyle="#c02020";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(32,0);ctx.lineTo(37,-5);ctx.stroke();
ctx.fillStyle="#111";ctx.fillRect(6,1,8,6);
return;
}
if(wid==="pipe_wrench"){
ctx.fillStyle="#7a4a22";ctx.fillRect(8,-3,20,6);
ctx.fillStyle="#9aa2ad";ctx.fillRect(26,-6,8,12);
ctx.fillStyle="#3a3f46";ctx.fillRect(32,-8,5,4);ctx.fillRect(32,4,5,4);
ctx.fillStyle="#111";ctx.fillRect(8,-3,4,6);
return;
}
if(wid==="machete"){
ctx.fillStyle="#4a2f18";ctx.fillRect(8,-3,9,6);
ctx.fillStyle="#c8ccd2";ctx.beginPath();ctx.moveTo(17,-4);ctx.lineTo(38,-2);ctx.lineTo(38,2);ctx.lineTo(17,4);ctx.closePath();ctx.fill();
ctx.strokeStyle="#5a6068";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(17,-2);ctx.lineTo(38,0);ctx.stroke();
return;
}
if(wid==="katana"){
ctx.fillStyle="#111";ctx.fillRect(6,-2,11,5);
ctx.fillStyle="#e8ecf2";ctx.beginPath();ctx.moveTo(17,-2);ctx.lineTo(44,-1);ctx.lineTo(44,1);ctx.lineTo(17,2);ctx.closePath();ctx.fill();
ctx.strokeStyle="#7ab0ff";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(17,0);ctx.lineTo(44,0);ctx.stroke();
ctx.fillStyle="#c9a227";ctx.fillRect(15,-4,3,8);
return;
}
if(wid==="fire_axe"){
ctx.fillStyle="#7a4a22";ctx.fillRect(8,-2,26,5);
ctx.fillStyle="#8a9098";ctx.fillRect(28,-9,8,18);
ctx.fillStyle="#c02020";ctx.fillRect(34,-9,3,18);
return;
}
if(wid==="spear"){
ctx.fillStyle="#7a5a30";ctx.fillRect(2,-2,38,4);
ctx.fillStyle="#222";ctx.fillRect(14,-3,8,6);
ctx.fillStyle="#d8dce2";ctx.beginPath();ctx.moveTo(40,-4);ctx.lineTo(52,0);ctx.lineTo(40,4);ctx.closePath();ctx.fill();
return;
}
if(wid==="stun_lantern"){
ctx.fillStyle="#222";ctx.fillRect(12,-7,14,14);
ctx.fillStyle=t<0.25?"#fff8c8":"#ffdf6b";ctx.fillRect(15,-4,8,8);
ctx.strokeStyle="#888";ctx.lineWidth=2;ctx.strokeRect(12,-7,14,14);
return;
}
if(wid==="almond_darts"){
ctx.fillStyle="#2a4a2a";ctx.fillRect(8,-4,24,8);
ctx.fillStyle="#111";ctx.fillRect(28,-2,6,4);
ctx.fillStyle="#e8d8a8";ctx.beginPath();ctx.arc(36,0,3,0,7);ctx.fill();
return;
}
if(wid==="nailgun"){
ctx.fillStyle="#2f6a8a";ctx.fillRect(6,-6,24,11);
ctx.fillStyle="#222";ctx.fillRect(10,4,6,8);
ctx.fillStyle="#555";ctx.fillRect(12,-11,14,5);
ctx.fillStyle="#999";ctx.fillRect(30,-2,10,4);
ctx.fillStyle="#ffdf6b";ctx.fillRect(8,-4,4,3);
return;
}
if(wid==="shotgun"){
ctx.fillStyle="#5a3a1a";ctx.fillRect(8,-3,18,6);
ctx.fillStyle="#3a3f46";ctx.fillRect(26,-4,18,3);ctx.fillRect(26,1,18,3);
ctx.fillStyle="#222";ctx.fillRect(42,-5,4,10);
ctx.fillStyle="#c9a227";ctx.fillRect(12,-5,3,3);ctx.fillRect(17,-5,3,3);
return;
}
if(wid==="crossbow"){
ctx.fillStyle="#5a3a1a";ctx.fillRect(6,-2,32,5);
ctx.strokeStyle="#111";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(30,0);ctx.quadraticCurveTo(20,-12,12,-14);ctx.moveTo(30,0);ctx.quadraticCurveTo(20,12,12,14);ctx.stroke();
ctx.strokeStyle="#ddd";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(12,-14);ctx.lineTo(12,14);ctx.stroke();
ctx.fillStyle="#d8dce2";ctx.fillRect(10,-1,28,2);
return;
}
if(wid==="rifle"){
ctx.fillStyle="#3a3f46";ctx.fillRect(6,-4,30,7);
ctx.fillStyle="#222";ctx.fillRect(36,-2,10,4);
ctx.fillStyle="#5a3a1a";ctx.fillRect(14,3,6,9);
ctx.fillStyle="#222";ctx.fillRect(24,-8,4,5);
ctx.fillStyle="#999";ctx.fillRect(8,-3,6,2);
return;
}
if(wid==="flamethrower"){
ctx.fillStyle="#7a2020";ctx.fillRect(4,-5,12,10);
ctx.fillStyle="#555";ctx.fillRect(16,-3,20,5);
ctx.fillStyle="#222";ctx.fillRect(34,-2,6,4);
ctx.fillStyle=t<0.2?"#ffef9a":"#ff9500";ctx.beginPath();ctx.arc(38,0,2.5,0,7);ctx.fill();
ctx.fillStyle="#c9a227";ctx.fillRect(6,-6,8,2);
return;
}
if(wid==="nail_bat"){
ctx.fillStyle="#8a6238";ctx.fillRect(6,-3,26,6);
ctx.fillStyle="#6a4a28";ctx.fillRect(6,-3,7,6);
ctx.fillStyle="#999";ctx.fillRect(20,-6,2,4);ctx.fillRect(25,2,2,4);ctx.fillRect(29,-6,2,4);
ctx.fillStyle="#222";ctx.fillRect(4,-4,4,8);
return;
}
ctx.fillStyle="#666";ctx.fillRect(8,-2,16,4);
}
export function drawProjReal(ctx,x,y,p){
if(p.lure)return false;
let a=Math.atan2(p.vy,p.vx);
ctx.save();ctx.translate(x,y);ctx.rotate(a);
if(p.dmg>=30){ctx.strokeStyle="#ffb300";ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-21,0);ctx.lineTo(0,0);ctx.stroke();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(3,0,6,0,7);ctx.fill()}
else{ctx.strokeStyle="#aef";ctx.lineWidth=4.5;ctx.beginPath();ctx.moveTo(-15,0);ctx.lineTo(0,0);ctx.stroke();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(1.5,0,4,0,7);ctx.fill()}
ctx.restore();
return true;
}
