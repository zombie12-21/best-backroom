export const RECIPES=[
{id:"spear",name:"Scrap Spear",need:{crowbar:1,duct_tape:1},gives:"spear",desc:"Crowbar (even equipped) + tape = long reach spear."},
{id:"darts2",name:"Almond Bundle",need:{almond_water:1,energy_bar:1},gives:"almond_darts",desc:"Infuse darts with almond water."},
{id:"med2",name:"Field Medkit",need:{bandage:2,almond_water:1},gives:"medkit",desc:"2 bandages + almond water."},
{id:"nails2",name:"Nail Bomb",need:{batteries:1,duct_tape:1},gives:"repellent",desc:"Battery acid + tape = repellent."},
{id:"stim",name:"Stim Shot",need:{coffee:1,energy_bar:1},gives:"adrenaline",desc:"Coffee + bar = full sprint + heal."},
{id:"armor",name:"Taped Jacket",need:{duct_tape:2},gives:"jacket",desc:"-40% damage while held."},
{id:"smoke",name:"Smoke Bomb",need:{radio:1,duct_tape:1},gives:"smoke_bomb",desc:"Radio + tape = choking cloud."},
{id:"trapkit",name:"Bear Trap",need:{pipe_wrench:1,duct_tape:1},gives:"bear_trap",desc:"Wrench (even equipped) + tape = snap shut."},
{id:"emp",name:"EMP Grenade",need:{batteries:1,radio:1,duct_tape:1},gives:"emp_grenade",desc:"Battery + radio + tape = shock."},
{id:"hazmat",name:"Hazmat Suit",need:{jacket:1,gas_mask:1},gives:"hazmat_suit",desc:"Jacket + gas mask = full seal."},
];
export function canCraft(inv,recipe,cur){
let c={};inv.forEach(i=>c[i]=(c[i]||0)+1);
if(cur)c[cur]=(c[cur]||0)+1;
return Object.entries(recipe.need).every(([k,n])=>(c[k]||0)>=n);
}
export function doCraft(inv,recipe,cur){
let usedWeapon=null;
for(let[k,n]of Object.entries(recipe.need))for(let i=0;i<n;i++){
let ix=inv.indexOf(k);
if(ix>=0)inv.splice(ix,1);
else if(k===cur){usedWeapon=k}
}
return {gives:recipe.gives,usedWeapon};
}
