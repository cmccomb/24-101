import assert from 'node:assert/strict';
import {allSystems as systems,defaults} from '../site/systems.js';
const get=id=>systems.find(s=>s.id===id),calc=(id,override={})=>{const s=get(id);return s.calc({...defaults(s),...override});},val=(id,i,override={})=>calc(id,override).metrics[i].value;
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
let checked=0;
for(const s of systems){const d=defaults(s);let combos=[d];for(const p of s.params)for(const v of [p.min,p.max])combos.push({...d,[p.key]:v});let corners=2**s.params.length;for(let mask=0;mask<corners;mask++)combos.push(Object.fromEntries(s.params.map((p,i)=>[p.key,mask&(1<<i)?p.max:p.min])));for(const p of combos){let r=s.calc(p);assert.equal(r.metrics.length,4);for(const m of r.metrics){assert.ok(Number.isFinite(m.value),`${s.id}: ${m.label} nonfinite at ${JSON.stringify(p)}`);assert.ok(m.signed||m.value>=0,`${s.id}: ${m.label} negative`);}assert.ok(r.equations.length>=3);checked++;}}
// Analytic scaling and conservation, including SI conversions.
close(val('printer',0,{speed:110}),2*val('printer',0));close(val('printer',3,{speed:110}),val('printer',3)/2);
close(val('laser',0,{power:120}),2*val('laser',0));close(val('laser',3,{thick:6}),val('laser',3));
close(val('heatpump',1)-val('heatpump',2),defaults(get('heatpump')).input);assert.ok(val('heatpump',0)<val('heatpump',3));
close(val('otto',2)*4*2500/120/1000,val('otto',1));close(val('otto',1)+val('otto',3),850*4*2500/120/1000);
close(val('turbine',2)-val('turbine',1),val('turbine',0));close(val('turbine',3),100*(1-10**(-2/7)));
close(val('wind',0,{wind:16}),8*val('wind',0));close(val('wind',0,{radius:12}),4*val('wind',0));
close(val('battery',1,{power:100})/val('battery',1,{power:50}),4);assert.ok(val('battery',2)<val('battery',3));
close(val('datacenter',2,{flow:10}),8*val('datacenter',2));close(val('datacenter',1,{flow:10}),val('datacenter',1)/2);
assert.ok(val('buggy',2)<=100);assert.ok(val('buggy',0,{cda:.05})>val('buggy',0,{cda:.25}));assert.ok(val('buggy',0,{mass:140})>val('buggy',0,{mass:70}));
assert.ok(val('racecar',0,{power:100})<val('racecar',0,{power:20}));assert.ok(val('racecar',0,{mass:220})<val('racecar',0,{mass:380}));close(val('racecar',3),.5*300*(80/3.6)**2/1000);
// Independent fine-step solver resolves the remaining numerical integration risk.
function raceTime(dt){let v=0,t=0;while(v<80/3.6&&t<120){let F=Math.min(1.3*300*9.81,60000/Math.max(v,.1))-.015*300*9.81-.5*1.225*.9*v*v;v+=F/300*dt;t+=dt;}return t;}assert.ok(Math.abs(val('racecar',0)-raceTime(.001))<.02);
close(val('drivetrain',0),175);
close(val('drivetrain',1,{rear:36}),2*val('drivetrain',1));
close(val('drivetrain',0,{rear:36}),.5*val('drivetrain',0));
close(val('drivetrain',3,{rear:36}),val('drivetrain',3));
close(val('drivetrain',2),175*Math.PI/30*.34*3.6);
close(val('refrigerator',0),50);
close(val('refrigerator',3),val('refrigerator',1)+90);
close(val('refrigerator',2,{ua:5}),2*val('refrigerator',2));
assert.ok(val('refrigerator',2,{room:35})>val('refrigerator',2,{room:15}));
assert.ok(val('refrigerator',2,{room:35,ua:6,power:40})>100);
console.log(`Passed ${checked} parameter configurations across the course and retained further systems, conservation/scaling checks and EV integration convergence.`);
