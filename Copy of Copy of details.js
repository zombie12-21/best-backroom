let decals=[],motes=[];
export function clearDetails(){decals=[];motes=[];for(let i=0;i<70;i++)motes.push({ox:Math.random(),oy:Math.random(),s:1+Math.random()*2,v:4+Math.random()*10,ph:Math.random()*7})}
export function h2(x,y){let n=x*374761393+y*668265263;n=(n^(n>>13))*1274126177;return ((n^(n>>16))>>>0)/4294967295}
export function addDecal(x,y,kind){if(decals.length>220)decals.shift();decals.push({x,y,kind,life:kind==="blood"?60:40})}
export function stepDecals(dt){decals.forEach(d=>d.life-=dt*0.05);decals=decals.filter(d=>d.life>0)}
export function drawFloorD(ctx,sx,sy,x,y,T,L){
let h=h2(x,y);
ctx.fillStyle="rgba(0,0,0,.14)";
if(((x+y)&1)===0)ctx.fillRect(sx,sy,T,T);
if(L.id===0){ctx.fillStyle="rgba(0,0,0,.08)";for(let i=1;i<4;i++)ctx.fillRect(sx,sy+i*(T/4),T,1)}
if(L.id===5){ctx.fillStyle="rgba(60,10,10,.25)";ctx.fillRect(sx+8,sy+8,T-16,T-16);ctx.strokeStyle="rgba(120,40,20,.3)";ctx.strokeRect(sx+8,sy+8,T-16,T-16)}
if(L.id===7||L.id===14){ctx.strokeStyle="rgba(255,255,255,.14)";ctx.lineWidth=1;ctx.strokeRect(sx+0.5,sy+0.5,T-1,T-1)}
if(L.id===1&&h>0.86){ctx.fillStyle="rgba(10,10,10,.5)";ctx.beginPath();ctx.ellipse(sx+T*h,sy+T*h2(y,x),8,5,h*3,0,7);ctx.fill()}
if(h>0.93){ctx.fillStyle="rgba(0,0,0,.3)";ctx.beginPath();ctx.ellipse(sx+T/2,sy+T/2,7,4,0,0,7);ctx.fill()}
if(h>0.965){ctx.fillStyle="rgba(220,215,190,.5)";ctx.save();ctx.translate(sx+T/2,sy+T/2);ctx.rotate(h*6);ctx.fillRect(-7,-4,14,8);ctx.fillStyle="rgba(0,0,0,.2)";ctx.fillRect(-7,0,14,1);ctx.restore()}
if(h<0.06){ctx.strokeStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.moveTo(sx+6,sy+T-8);ctx.lineTo(sx+T-10,sy+4);ctx.stroke()}
}
export function drawWallD(ctx,sx,sy,x,y,T,L,grid){
let h=h2(x*3+1,y*7+2);
ctx.fillStyle="rgba(255,255,255,.09)";ctx.fillRect(sx,sy,T,3);
ctx.fillStyle="rgba(0,0,0,.35)";ctx.fillRect(sx,sy+T-5,T,5);
if(h>0.9){ctx.fillStyle="rgba(0,0,0,.25)";ctx.fillRect(sx+T*0.3,sy,4,T)}
if(L.id===2){ctx.fillStyle="#7a5a28";ctx.fillRect(sx,sy+T/2-3,T,6);ctx.fillStyle="#3a2c12";ctx.fillRect(sx,sy+T/2-1,T,2)}
if(L.id===3&&h>0.7){ctx.fillStyle="#ffef9a";ctx.fillRect(sx+6,sy+6,4,4);ctx.fillStyle="rgba(255,240,150,.25)";ctx.fillRect(sx+2,sy+2,12,12)}
if(L.id===8&&h>0.5){ctx.fillStyle="#ff4040";ctx.fillRect(sx,sy+T/2-2,T,4)}
let gy=grid;
let open=gy[y]&&gy[y][x]!==undefined;
let below=y+1<gy.length&&gy[y+1]&&gy[y+1][x]===0;
if(below){ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(sx,sy+T-8,T,8)}
}
export function drawDecals(ctx,cx,cy){
decals.forEach(d=>{
let X=d.x-cx,Y=d.y-cy;
if(d.kind==="blood"){ctx.fillStyle=`rgba(140,10,10,${Math.min(1,d.life)})`;ctx.beginPath();ctx.arc(X,Y,8,0,7);ctx.fill();ctx.beginPath();ctx.arc(X+8,Y+3,4.5,0,7);ctx.fill()}
else if(d.kind==="step"){ctx.fillStyle=`rgba(0,0,0,${0.25*Math.min(1,d.life)})`;ctx.beginPath();ctx.ellipse(X,Y,6,4,0,0,7);ctx.fill()}
else if(d.kind==="scorch"){ctx.fillStyle=`rgba(20,20,20,${0.5*Math.min(1,d.life)})`;ctx.beginPath();ctx.arc(X,Y,14,0,7);ctx.fill()}
});
}
export function drawMotes(ctx,W,H,t){
ctx.fillStyle="rgba(255,245,200,.35)";
motes.forEach(m=>{
let x=(m.ox*W+t*m.v)%W,y=(m.oy*H+Math.sin(t+m.ph)*8+H)%H;
ctx.fillRect(x,y,m.s,m.s);
});
}
export function drawExitD(ctx,X,Y,L,t){
ctx.save();ctx.translate(X,Y);ctx.scale(1.5,1.5);
let pulse=1+Math.sin(t/300)*0.08;ctx.scale(pulse,pulse);
ctx.fillStyle="rgba(0,0,0,.5)";ctx.beginPath();ctx.ellipse(0,14,20,7,0,0,7);ctx.fill();
if(L.id===7||L.id===14){ctx.fillStyle="#062a33";ctx.fillRect(-16,-16,32,32);ctx.fillStyle="#9adbe8";ctx.fillRect(-13,-13,26,26);ctx.fillStyle="#062a33";ctx.beginPath();ctx.arc(0,0,7,0,7);ctx.fill()}
else if(L.id===1){ctx.fillStyle="#333";ctx.fillRect(-18,-14,36,28);ctx.fillStyle="#888";ctx.fillRect(-18,-14,36,4);ctx.fillStyle="#ffdf6b";ctx.fillRect(-3,-10,6,6)}
else if(L.id===8){ctx.fillStyle="#fff";ctx.fillRect(-14,-16,28,32);ctx.fillStyle="#c02020";ctx.fillRect(-14,-16,28,5);ctx.fillStyle="#111";ctx.font="12px monospace";ctx.textAlign="center";ctx.fillText("RUN",0,6)}
else{ctx.fillStyle="#2a1f08";ctx.fillRect(-15,-15,30,30);ctx.fillStyle="#ffdf6b";ctx.fillRect(-11,-11,22,22);ctx.fillStyle="#2a1f08";ctx.fillRect(-4,-11,8,22)}
ctx.restore();
ctx.save();ctx.translate(X,Y-51-Math.sin(t/400)*4);ctx.fillStyle="#ffe9a3";ctx.font="bold 14px monospace";ctx.textAlign="center";
let label={T:"TRAINING EXIT 🎓",0:"STAIR ▲",1:"GARAGE ⇧",2:"POWERED DOOR ⚡",3:"BREAKER ⚡",6:"SLIDE ▼",8:"WHITE DOOR",10:"CAKE DOOR 🍰"}[L.id]||"EXIT ▲";
ctx.fillText("◈ "+label,0,0);ctx.restore();
}
