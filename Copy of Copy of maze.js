export function genMaze(n,seed){
let s=seed>>>0;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
let g=Array.from({length:n},()=>Array(n).fill(1));
function carve(x,y){g[y][x]=0;let d=[[2,0],[-2,0],[0,2],[0,-2]].sort(()=>rnd()-.5);
for(let[dx,dy]of d){let nx=x+dx,ny=y+dy;
if(nx>0&&ny>0&&nx<n-1&&ny<n-1&&g[ny][nx]===1){g[y+dy/2][x+dx/2]=0;carve(nx,ny)}}}
carve(1,1);
for(let i=0;i<n*n*0.04;i++){g[1+Math.floor(rnd()*(n-2))][1+Math.floor(rnd()*(n-2))]=0}
g[1][1]=0;g[n-2][n-2]=0;return g}
export function freeCells(g){let o=[];for(let y=0;y<g.length;y++)for(let x=0;x<g.length;x++)if(!g[y][x])o.push([x,y]);return o}
