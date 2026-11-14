import assert from 'node:assert/strict';
import {allSystems as systems,defaults} from '../site/systems.js';
import {lessons,lessonFor,engineering,requirement,perturbation} from '../site/engineering.js';

let configurations=0;
for(const s of systems){
  const lesson=lessonFor(s),base=defaults(s);assert.ok(lesson.claim.endsWith('.'));
  assert.ok(s.params.find(p=>p.key===lesson.sweep[0]));
  for(const p of s.params)assert.ok(lesson.roles[p.key],`${s.id}.${p.key} needs a physical role`);
  for(let mask=0;mask<2**s.params.length;mask++){
    const p=Object.fromEntries(s.params.map((v,i)=>[v.key,mask&(1<<i)?v.max:v.min]));
    const r=s.calc(p),a=engineering(s,p,r);
    assert.ok(a.input.length&&a.output.length);
    for(const t of [...a.input,...a.output])assert.ok(Number.isFinite(t.value)&&t.value>=-1e-8,`${s.id}: invalid ${t.label}`);
    assert.ok(Math.abs(a.residual)<1e-8*Math.max(1,a.total),`${s.id}: balance does not close`);
    const c=lesson.criterion,actual=r.metrics[c.metric].value;
    assert.equal(requirement(s,r,actual,a.valid).met,a.valid,'Equality must satisfy either requirement direction');
    assert.equal(requirement(s,r,actual,false).met,false,'Outside applicability cannot be marked feasible');
    if(a.valid){
      const easier=c.sense==='max'?actual+1:Math.max(0,actual-1),harder=c.sense==='max'?actual-1:actual+1;
      assert.equal(requirement(s,r,easier).met,true);
      assert.equal(requirement(s,r,harder).met,false);
    }
    configurations++;
  }
  const probe=perturbation(s,base,lesson.sweep[0],lesson.sweep[1]);
  assert.ok(Number.isFinite(probe.before)&&Number.isFinite(probe.after));assert.notEqual(probe.from,probe.to);
}
const get=id=>systems.find(s=>s.id===id);
const solar=get('solar');
assert.equal(engineering(solar,{...defaults(solar),area:40,tank:100,sun:1000,ua:5}).valid,false);
assert.equal(engineering(solar,defaults(solar)).valid,true);
const espresso=get('espresso'),e=engineering(espresso,defaults(espresso));
assert.equal(e.unit,'kJ');assert.equal(e.output.filter(t=>t.stored).length,2);
const car=get('racecar'),force=engineering(car,defaults(car));assert.equal(force.unit,'N');
assert.ok(force.output.find(t=>t.label.includes('ma')).value>0);
console.log(`Passed ${configurations} conservation accounts, physical input roles, requirement boundaries and model-applicability checks.`);
