import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {weeks,projects,areas,calendar,candidateOrder,resolveOrder} from '../site/course.js';
import {systems,allSystems,defaults} from '../site/systems.js';
import {stepResponse} from '../site/core-systems.js';
import {engineering,lessonFor} from '../site/engineering.js';
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const get=id=>allSystems.find(s=>s.id===id),calc=(id,p={})=>get(id).calc({...defaults(get(id)),...p}).metrics.map(m=>m.value);
assert.deepEqual(systems.map(s=>s.id),weeks.map(w=>w.id));assert.equal(new Set(systems.map(s=>s.id)).size,14);
assert.deepEqual(systems.slice(0,2).map(s=>s.id),['laser','printer']);
assert.deepEqual(projects.map(p=>weeks.filter(w=>w.project===p.id).length),[3,4,7]);
assert.equal(weeks.find(w=>w.id==='buggy').meeting,'2027-04-12');assert.equal(weeks.find(w=>w.id==='autoinjector').week,13);
assert.equal(weeks[0].meeting,null,'No university-wide make-up is asserted for the MLK closure');
for(const w of weeks){assert.ok(w.demo&&w.design&&w.method&&w.deliverable&&w.transfer);assert.ok(w.deliverable.startsWith('P'+w.project+':'));assert.ok(w.coverage.every(k=>areas[k]));}
for(const area of Object.keys(areas))assert.ok(weeks.some(w=>w.coverage.includes(area)),area+' missing');
// Re-resolve another Carnival week, preserving uniqueness and the fixed fabrication order.
const alternate=resolveOrder(calendar.mondays,'2027-04-22');assert.equal(alternate[12],'buggy');assert.equal(alternate[11],'autoinjector');assert.deepEqual(alternate,candidateOrder);
const earlier=resolveOrder(calendar.mondays,'2027-04-08');assert.equal(earlier[10],'buggy');assert.equal(earlier[12],'quadcopter');assert.equal(new Set(earlier).size,14);
assert.throws(()=>resolveOrder(calendar.mondays,'2027-03-11'));assert.throws(()=>resolveOrder(calendar.mondays,'2027-01-28'));assert.throws(()=>resolveOrder([...calendar.mondays].reverse(),calendar.carnival));
// Independent physical checks of the new models.
let press=calc('press');close(press[3],press[1]*press[2]);close(calc('press',{ram:100})[1]/calc('press',{ram:50})[1],4);close(calc('press',{ram:100})[2]/calc('press',{ram:50})[2],.25);
let b=calc('bicycle');close(b[1]*b[2],b[3]*1000);close(calc('bicycle',{speed:50})[2],4*b[2]);
let el=calc('elevator',{payload:100,counter:700});assert.ok(el[2]<0,'Counterweight can drive regeneration');
close(el[0],400*(9.81+.5));close(el[1],700*(9.81-.5));
let r=calc('robot');close(r[0],1.2*9.81*.5);close(r[1]*2*.4,.8*9.81);
// Compare the analytic PD solution with an independently integrated second-order ODE.
for(const [I,c,k] of [[.3,.1,8],[.3,2*Math.sqrt(.3*8),8],[.3,5,8]]){
 let x=0,v=0,dt=.00001;for(let i=0;i<200000;i++){v+=(k*(1-x)-c*v)/I*dt;x+=v*dt;}close(x,stepResponse(I,c,k,2),2e-5);
}
close(calc('excavator',{pressure:20})[0]/calc('excavator',{pressure:10})[0],2);close(calc('excavator',{bore:80})[0]/calc('excavator',{bore:40})[0],4);
const p=defaults(get('pump')),pm=calc('pump'),Q=pm[0]/60000,A=Math.PI*(p.diameter/1000)**2/4;
close(pm[1],p.lift+(.025*p.length/(p.diameter/1000)+3)*(Q/A)**2/(2*9.81));
close(calc('pump',{rpm:1800,lift:15})[0],0);close(calc('pump',{rpm:1800,lift:15})[2],25);
let w=calc('washer');close(calc('washer',{imbalance:400})[0],2*w[0]);close(w[1],Math.sqrt(6000/35)/(2*Math.PI));
close(calc('quadcopter',{diameter:300})[1]/calc('quadcopter',{diameter:100})[1],1/3);close(calc('quadcopter',{mass:2})[0],2*calc('quadcopter',{mass:1})[0]);
const a=calc('autoinjector');assert.ok(a[2]<=Math.PI*.004**2*.012*1e6);assert.ok(calc('autoinjector',{viscosity:10})[2]<calc('autoinjector',{viscosity:1})[2]);
assert.equal(engineering(get('autoinjector'),defaults(get('autoinjector'))).valid,true);
assert.equal(engineering(get('autoinjector'),{...defaults(get('autoinjector')),viscosity:1,bore:.35,stiffness:800,compression:35}).valid,false);
// Needle resistance/flow relation and spring displacement use consistent SI units.
const ap=Math.PI*.004**2,R=128*.004*.012/(Math.PI*.00025**4),x=a[2]/1e6/ap,tau=R*ap*ap/400;
close(x,Math.min(.012,(.025-1/400)*(1-Math.exp(-5/tau))));
for(const s of allSystems){assert.ok(lessonFor(s));const a=engineering(s,defaults(s));assert.ok(Number.isFinite(a.residual));}
const models=readFileSync(new URL('../site/physics-models.js',import.meta.url),'utf8');for(const s of systems)assert.ok(models.includes("id==='"+s.id+"'"),s.id+' needs a model');
console.log('Passed 14-week schedule, 3/4/7 projects, calendar swaps, complete core coverage, new-model physics and independent PD integration.');
