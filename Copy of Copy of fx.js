export let floats=[],shake=0;
export function addFloat(x,y,t,color="#ffe9a3"){floats.push({x,y,t,life:1.4,color})}
export function addShake(n){shake=Math.min(14,shake+n)}
export function stepFx(dt,cx,cy,ctx){
floats.forEach(f=>{f.y-=34*dt;f.life-=dt});
floats=floats.filter(f=>f.life>0);
if(shake>0)shake=Math.max(0,shake-dt*26);
}
export function drawFloats(ctx,cx,cy){
ctx.textAlign="center";ctx.font="bold 14px monospace";
floats.forEach(f=>{ctx.globalAlpha=Math.min(1,f.life);ctx.fillStyle=f.color;ctx.fillText(f.t,f.x-cx,f.y-cy);ctx.globalAlpha=1});
}
export function shakeOff(){
let a=Math.random()*6.28,m=shake;
return [Math.cos(a)*m,Math.sin(a)*m];
}
