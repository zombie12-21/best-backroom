let C=null;
export function audio(){if(!C){C=new(window.AudioContext||window.webkitAudioContext)()}if(C.state==="suspended")C.resume();return C}
export function hum(on){try{const c=audio();if(!on&&hum._o){hum._o.stop();hum._o=null;return}
if(hum._o||!on)return;const o=c.createOscillator(),g=c.createGain();o.type="sawtooth";o.frequency.value=120;g.gain.value=0.015;
const o2=c.createOscillator(),g2=c.createGain();o2.type="sine";o2.frequency.value=60;g2.gain.value=0.03;
o.connect(g).connect(c.destination);o2.connect(g2).connect(c.destination);o.start();o2.start();hum._o={stop(){try{o.stop();o2.stop()}catch(e){}},o}}catch(e){}}
export function beep(f=440,d=.15,t="square",v=.12){try{const c=audio(),o=c.createOscillator(),g=c.createGain();o.type=t;o.frequency.value=f;g.gain.value=v;o.connect(g).connect(c.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,c.currentTime+d);o.stop(c.currentTime+d)}catch(e){}}
export function step(){beep(90+Math.random()*40,.07,"triangle",.06)}
export function hit(){beep(150,.2,"sawtooth",.2)}
export function pickupS(){beep(660,.12,"sine",.15);setTimeout(()=>beep(880,.12,"sine",.15),90)}
export function hurt(){beep(110,.3,"sawtooth",.25)}
export function sting(){beep(220,.5,"sawtooth",.2);setTimeout(()=>beep(180,.6,"sawtooth",.2),200)}
