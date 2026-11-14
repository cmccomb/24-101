import assert from 'node:assert/strict';
import * as T from '../site/vendor/three.module.js';
import {systems,defaults} from '../site/systems.js';
import {modelColors as C} from '../site/theme.js';
import {buildPhysicsModel,visualGuides} from '../site/physics-models.js';
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
// Run the real explanatory renderer without a GPU. The fixtures provide primitive
// construction, while the production module determines every physical relationship.
function scene(s,p){
 const model=new T.Group(),labels=[],flows=[];
 const mat=c=>new T.MeshStandardMaterial({color:c});
 const mesh=(geo,c,pos=[0,0,0],parent=model)=>{const o=new T.Mesh(geo,mat(c));o.position.set(...pos);parent.add(o);return o;};
 const box=(w,h,d,c,pos,parent)=>mesh(new T.BoxGeometry(w,h,d),c,pos,parent);
 const cyl=(r,h,c,pos,parent)=>mesh(new T.CylinderGeometry(r,r,h,12),c,pos,parent);
 const ball=(r,c,pos,parent)=>mesh(new T.SphereGeometry(r,8,6),c,pos,parent);
 const group=(pos=[0,0,0],parent=model)=>{const o=new T.Group();o.position.set(...pos);parent.add(o);return o;};
 const link=(a,b,r,c,parent=model)=>{const v=new T.Vector3(...a),w=new T.Vector3(...b),o=cyl(r,v.distanceTo(w),c,v.clone().add(w).multiplyScalar(.5).toArray(),parent);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),w.sub(v).normalize());return o;};
 const ring=(r,t,c,pos,parent)=>mesh(new T.TorusGeometry(r,t,6,20),c,pos,parent);
 const wheel=(r,pos,parent)=>{const o=group(pos,parent);ring(r,.05,C.dark,[0,0,0],o);return o;};
 const fan=(r,pos,parent)=>{const o=group(pos,parent);box(r*2,.05,.1,C.steel,[0,0,0],o);return o;};
 const flow=(points,color,count,speed)=>{flows.push({points,speed});return()=>{};};
 const label=(text,pos)=>labels.push({text,pos});
 const result=buildPhysicsModel(s.id,p,s.calc(p).metrics,{T,C,model,box,cyl,ball,group,link,ring,wheel,fan,flow,label});
 return{model,labels,flows,result,tick(t){result.ticks.forEach(f=>f(t));model.updateMatrixWorld(true);},dispose(){model.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}};
}
let cases=0;
for(const s of systems){
 const d=defaults(s);assert.ok(visualGuides[s.id].summary);for(const p of s.params)assert.ok(visualGuides[s.id][p.key],s.id+'.'+p.key+' needs an explanation');
 const configs=[d,...s.params.flatMap(p=>[p.min,p.max].map(v=>({...d,[p.key]:v})))];
 for(const p of configs){const v=scene(s,p);assert.ok(v.result&&v.labels.length);for(const time of [0,1,2,5]){v.tick(time);const bounds=new T.Box3().setFromObject(v.model);for(const n of [...bounds.min.toArray(),...bounds.max.toArray()])assert.ok(Number.isFinite(n)&&Math.abs(n)<50,`${s.id} has invalid or runaway geometry`);}v.dispose();cases++;}
}
const get=id=>systems.find(s=>s.id===id);
// Weight must remain world-vertical when the arm or aircraft rotates.
for(const [id,name] of [['robot','payload-weight'],['quadcopter','vehicle-weight']]){
 const v=scene(get(id),defaults(get(id)));for(const t of [.2,.5,1,2]){v.tick(t);const o=v.model.getObjectByName(name),q=o.getWorldQuaternion(new T.Quaternion()),direction=new T.Vector3(0,1,0).applyQuaternion(q);near(direction.x,0);near(direction.y,-1);near(direction.z,0);}v.dispose();
}
// Moving pistons conserve the depicted liquid volume, not only the numeric work account.
const press=get('press'),pv=scene(press,defaults(press));
function liquidVolume(){return ['press-fluid-master','press-fluid-ram'].reduce((sum,name)=>{const o=pv.model.getObjectByName(name),q=o.geometry.parameters;return sum+Math.PI*q.radiusTop**2*q.height*o.scale.y;},0);}
pv.tick(0);const V=liquidVolume();for(const t of [.5,1,2,3.9]){pv.tick(t);near(liquidVolume(),V);}pv.dispose();
// The largest ram and full input stroke must still fit the depicted frame.
const clearance=scene(press,{...defaults(press),ram:100,stroke:100});
for(const time of [0,2,3.99]){clearance.tick(time);const left=new T.Box3().setFromObject(clearance.model.getObjectByName('press-frame-left')),right=new T.Box3().setFromObject(clearance.model.getObjectByName('press-frame-right')),ram=new T.Box3().setFromObject(clearance.model.getObjectByName('press-output-cylinder')),barrel=new T.Box3().setFromObject(clearance.model.getObjectByName('press-input-cylinder')),knob=new T.Box3().setFromObject(clearance.model.getObjectByName('press-input-knob'));assert.ok(ram.min.x>left.max.x&&ram.max.x<right.min.x);assert.ok(knob.min.y>barrel.max.y);}clearance.dispose();
// Pressure cannot change brew flow when the calculation prescribes 2 mL/s.
const espresso=get('espresso');const low=scene(espresso,{...defaults(espresso),pressure:3}),high=scene(espresso,{...defaults(espresso),pressure:12});assert.deepEqual(low.flows.map(f=>f.speed),high.flows.map(f=>f.speed));low.dispose();high.dispose();
// Suspension bases stay attached as the drum oscillates.
const washer=get('washer'),wv=scene(washer,{...defaults(washer),rpm:120});wv.tick(.2);let moved=false;wv.model.traverse(o=>{if(o.name!=='suspension-spring')return;const a=o.geometry.attributes.position.array,r=o.userData.rest;for(let i=0;i<a.length;i+=3){if((r[i]-o.userData.side*1.3)/(-o.userData.side*.55)<=0)near(a[i],r[i]);if(Math.abs(a[i]-r[i])>.001)moved=true;}});assert.ok(moved);wv.dispose();
// A fixed-time Buggy marker must reflect the actual resistance dynamics.
const buggy=get('buggy');
for(const crr of [.002,.015]){
 const p={...defaults(buggy),crr},v=scene(buggy,p),L=3+p.length*.006;
 const distance=o=>(o.position.x+L*.35)/(L*.7)*p.length;
 const theta=Math.asin(p.height/p.length),dt=.0002;let x=0,speed=0,x3=0;
 for(let i=0;i<100000;i++){const a=9.81*(Math.sin(theta)-p.crr*Math.cos(theta))-.5*1.225*p.cda/p.mass*speed*speed,next=speed+a*dt;x+=(speed+next)*.5*dt;speed=next;if(i===14999)x3=x;}
 v.tick(1);assert.ok(Math.abs(distance(v.model.getObjectByName('buggy-20s'))-x)<.03);assert.ok(Math.abs(distance(v.model.getObjectByName('buggy-motion'))-x3)<.03);v.dispose();
}
console.log(`Passed ${cases} explanatory scenes, all 56 input cues, finite animated geometry, vertical weight, press liquid conservation, fixed brew flow, attached suspension and fixed-time Buggy dynamics.`);
