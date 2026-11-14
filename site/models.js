import {buildPhysicsModel} from './physics-models.js?v=1.6.2';
import * as T from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {allSystems as systems} from './systems.js?v=1.6.2';
import {modelColors as C} from './theme.js?v=1.6.2';
import {jobTimeline, laserMaterials, jobSystem} from './fabrication.js?v=1.6.2';
export function createViewer(host,onFailure,onJobProgress=()=>{}){
 let renderer;try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch(e){onFailure(e);return null;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(C.background,1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;
 host.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-label','Interactive 3D system model. Drag to orbit, scroll to zoom.');renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-describedby','model-note');
 const scene=new T.Scene();scene.fog=new T.Fog(C.background,14,35);const camera=new T.OrthographicCamera(-4,4,2.9,-2.9,.05,100);const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.minZoom=.55;orbit.maxZoom=3;orbit.maxPolarAngle=Math.PI*.49;renderer.domElement.style.touchAction='pan-y';
 scene.add(new T.HemisphereLight(0xffffff,0x9da4a9,2));const key=new T.DirectionalLight(0xffffff,2.5);key.position.set(3,8,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=6;key.shadow.camera.bottom=-6;scene.add(key);const rim=new T.DirectionalLight(0xffffff,1.2);rim.position.set(-4,3,-4);scene.add(rim);
 const floor=new T.Mesh(new T.PlaneGeometry(100,100),new T.MeshStandardMaterial({color:C.background,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.03;floor.receiveShadow=true;scene.add(floor);const grid=new T.GridHelper(12,24,C.grid,C.grid);grid.position.y=-.02;scene.add(grid);
 let model=new T.Group(),animate=()=>{},labels=[],phase=0,last=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,rate=1,cut=false,frames=0,jobPlayback=null,jobRate=30,lastProgress=-Infinity;
 scene.add(model);
 const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.7,metalness:.1,...extra});
 function mesh(geo,color,pos=[0,0,0],parent=model,extra={}){let o=new T.Mesh(geo,material(color,extra));o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const box=(w,h,d,c,pos,parent,extra)=>mesh(new T.BoxGeometry(w,h,d),c,pos,parent,extra);
 const cyl=(r,h,c,pos,parent)=>mesh(new T.CylinderGeometry(r,r,h,32),c,pos,parent);
 const ball=(r,c,pos,parent)=>mesh(new T.SphereGeometry(r,16,12),c,pos,parent);
 const group=(pos=[0,0,0],parent=model)=>{let g=new T.Group();g.position.set(...pos);parent.add(g);return g;};
 function link(a,b,r,c,parent=model){const start=new T.Vector3(...a),end=new T.Vector3(...b),o=cyl(r,start.distanceTo(end),c,start.clone().add(end).multiplyScalar(.5).toArray(),parent);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());return o;}
 function ring(r,t,c,pos,parent=model){let o=mesh(new T.TorusGeometry(r,t,12,48),c,pos,parent);return o;}
 function label(text,pos){labels.push({text,pos:new T.Vector3(...pos)});}
 function wheel(r,pos,parent=model){let g=group(pos,parent),t=ring(r,.06,C.dark,[0,0,0],g);cyl(.07,.16,C.steel,[0,0,0],g).rotation.x=Math.PI/2;for(let i=0;i<8;i++){let a=i*Math.PI/4;link([0,0,0],[r*Math.cos(a),r*Math.sin(a),0],.012,C.light,g);}return g;}
 function fan(r,pos,parent=model){let g=group(pos,parent);ball(.12,C.light,[0,0,0],g);for(let i=0;i<5;i++){let blade=box(r*.33,r*.75,.05,C.steel,[0,r*.5,0],g);let pivot=group([0,0,0],g);g.remove(blade);pivot.add(blade);pivot.rotation.z=i*Math.PI*2/5;}ring(r,.025,C.steel,[0,0,0],parent).position.set(...pos);return g;}
 function flow(points,color,count=10,speed=1,parent=model){let curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));mesh(new T.TubeGeometry(curve,60,.035,8,false),color,[0,0,0],parent,{transparent:true,opacity:.48});let dots=Array.from({length:count},()=>ball(.055,color,[0,0,0],parent));return t=>dots.forEach((o,i)=>o.position.copy(curve.getPoint((t*speed*.12+i/count)%1)));}
 function boiler(pos=[0,0,0],parent=model){let g=group(pos,parent);cyl(.48,1.25,C.red,[0,.8,0],g);cyl(.49,.08,C.light,[0,1.45,0],g);box(1,.22,.9,C.dark,[0,.1,0],g);for(let i=0;i<5;i++)ring(.25,.025,C.red,[0,.65+i*.12,.42],g);return g;}
 function heatExchanger(pos,color,parent=model){let g=group(pos,parent);box(.9,1.25,.65,C.steel,[0,.75,0],g);for(let i=0;i<10;i++)box(.95,.035,.7,C.light,[0,.25+i*.11,0],g);return fan(.35,[0,.75,.42],g);}
 function vehicle(race,p){let car=group([0,.48,0]);if(race){box(2.25,.23,.8,C.dark,[0,0,0],car);box(.8,.26,.68,C.steel,[-.45,.2,0],car);box(.65,.18,.35,C.light,[1,.1,0],car);box(.8,.5,.7,C.dark,[.2,.25,0],car);box(.6,.2,.75,C.steel,[-.75,.33,0],car);box(.14,.2,1.55,C.light,[1.35,-.05,0],car);box(.14,.32,1.5,C.steel,[-1.2,.45,0],car);link([-.4,.3,-.4],[.2,.75,-.4],.035,C.steel,car);link([-.4,.3,.4],[.2,.75,.4],.035,C.steel,car);}else{let body=mesh(new T.SphereGeometry(1,40,24),C.steel,[0,.12,0],car);body.scale.set(1.45,.34,.43);let visor=mesh(new T.SphereGeometry(1,24,16),C.dark,[.4,.25,0],car,{metalness:.1});visor.scale.set(.45,.19,.31);link([-1.2,.2,0],[-1.7,.65,0],.035,C.light,car);link([-1.7,.65,-.3],[-1.7,.65,.3],.035,C.light,car);}
 let wheels=[];const contacts=race?[[-.9,-.57],[-.9,.57],[.8,-.57],[.8,.57]]:[[-.9,-.57],[-.9,.57],[.8,0]];for(const [x,z] of contacts){wheels.push(wheel(race?.3:.19,[x,-.12,z],car));link([x,0,0],[x,-.12,z],.025,C.steel,car);}return{car,wheels};}
 function clear(){scene.remove(model);model.traverse(o=>{o.geometry?.dispose();if(o.material){[].concat(o.material).forEach(m=>m.dispose());}});model=new T.Group();scene.add(model);labels=[];jobPlayback=null;host.querySelectorAll('.model-label').forEach(e=>e.remove());}
 function build(id,p,reset=true){clear();let ticks=[];const outputs=systems.find(s=>s.id===id).calc(p).metrics;
  const explainer=buildPhysicsModel(id,p,outputs,{T,C,model,box,cyl,ball,group,link,ring,label,wheel,fan,flow});
  if(explainer){ticks=explainer.ticks;}else if(id==='excavator'){
   box(2,.35,1.1,C.dark,[-.65,.3,0]);for(const z of [-.65,.65])box(2.2,.3,.25,C.steel,[-.65,.2,z]);box(.7,.85,.8,C.light,[-1.1,.85,0]);
   const boom=group([-.25,.7,0]),L=1.2+p.reach*.28;link([0,0,0],[L,.7,0],.13,C.gold,boom);link([L,.7,0],[L+.5,-.1,0],.12,C.gold,boom);box(.65,.4,.7,C.dark,[L+.55,-.25,0],boom);box(.45,.2+p.payload/1800,.45,C.steel,[L+.55,-.1,0],boom);
   const attach=.35+p.arm*1.5;link([-.1,.1,.16],[attach,.7*attach/L,.16],p.bore*.001,C.steel,boom);link([.05,.13,.16],[attach-.2,.7*(attach-.2)/L,.16],p.bore*.00065,C.red,boom);
   ticks.push(t=>{boom.rotation.z=.08+.12*Math.sin(t*.8)*Math.min(1,outputs[3].value);});label('Pressure-area cylinder',[.7,1.4,.5]);label('Payload + load reach',[2,1.3,.6]);label(outputs[3].value>=1?'Static moment sufficient':'Static moment insufficient',[-.2,.2,1]);
  }else if(id==='heatpump'){
   let left=heatExchanger([-1.35,0,0],C.blue),right=heatExchanger([1.35,0,0],C.red);let comp=cyl(.35,.65,C.dark,[0,.4,.2]);let f1=flow([[-1.35,1.2,.5],[-1.35,1.8,.5],[0,1.8,.5],[1.35,1.2,.5]],C.red,12,outputs[1].value/5);let f2=flow([[1.35,.3,.4],[1.35,.15,1],[0,.2,1],[-1.35,.3,.4]],C.blue,12,outputs[2].value/5);ticks.push(t=>{left.rotation.z=t*p.input*2;right.rotation.z=-t*p.input*2;f1(t);f2(t);});label('Cold side',[-1.4,1.8,0]);label('Hot side',[1.4,1.8,0]);label('Compressor',[0,.65,1]);
  }else if(id==='otto'){
   box(3.2,.3,1.6,C.dark,[0,.2,0]);link([-1.6,.65,0],[1.6,.65,0],.09,C.steel);for(let i=0;i<4;i++){let x=-1.1+i*.73;let housing=cyl(.29,1.25,C.steel,[x,1.7,0]);housing.material.transparent=true;housing.material.opacity=.25;let piston=cyl(.25,.17,C.light,[x,1.55,0]);let rod=link([x,.65,0],[x,1.5,0],.045,C.steel);let spark=ball(.13,C.orange,[x,2.3,0]);spark.material.emissive.set(C.orange);ticks.push(t=>{let a=t*p.rpm/450+i*Math.PI,py=1.55+.32*Math.cos(a),bot=new T.Vector3(x+.18*Math.sin(a),.65+.18*Math.cos(a),0),top=new T.Vector3(x,py,0);piston.position.y=py;rod.position.copy(bot.clone().add(top).multiplyScalar(.5));rod.scale.y=bot.distanceTo(top)/.85;rod.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),top.sub(bot).normalize());spark.scale.setScalar(.2+Math.max(0,Math.sin(a/2))**12);});box(.63,.16,.75,C.red,[x,2.35+(10-p.ratio)*.015,0]);}label('Piston + cylinder',[0,2.8,0]);label('Connecting rods',[1.1,1.05,.7]);label('Crankshaft',[-1,.6,.7]);
  }else if(id==='turbine'){
   let body=cyl(.63,3.5,C.steel,[0,1,0]);body.rotation.z=Math.PI/2;body.material.transparent=true;body.material.opacity=.18;for(let x of [-1.45,-1.1,-.75,.6,.95,1.3]){let f=fan(.52,[x,1,0]);f.rotation.y=Math.PI/2;ticks.push(t=>f.rotation.x=t*5*p.flow);}link([-2,1,0],[2,1,0],.055,C.light);let chamber=cyl(.45,.65,C.red,[0,1,0]);chamber.rotation.z=Math.PI/2;chamber.material.transparent=true;chamber.material.opacity=.5;let f=flow([[-2,1,0],[-1,1,0],[0,1,0],[1,1,0],[2.2,1,0]],C.orange,20,p.flow);ticks.push(f);for(let x of [-1,1])box(.25,.7,.8,C.dark,[x,.35,0]);label('Compressor',[-1.4,1.9,0]);label('Heat addition',[0,1.9,0]);label('Turbine',[1.4,1.9,0]);
  }else if(id==='wind'){
   let r=1.25+.04*p.radius;cyl(.09,2.7,C.light,[0,1.35,0]);mesh(new T.ConeGeometry(.22,.65,20),C.light,[0,2.8,.1]).rotation.x=Math.PI/2;let rotor=group([0,2.7,.48]);for(let i=0;i<3;i++){let g=group([0,0,0],rotor);g.rotation.z=i*2*Math.PI/3;let blade=box(.15,r,.05,C.light,[.1,r/2,0],g);blade.rotation.z=-.13;}ball(.16,C.steel,[0,0,.04],rotor);ticks.push(t=>{rotor.rotation.z=-t*(6*p.wind/p.radius)*.18;});let wind=flow([[-2.4,1,1],[-.8,1,1],[1,1,1],[2.4,1,1]],C.blue,12,p.wind/8);ticks.push(wind);label('Swept rotor area',[1.3,3.5,.5]);label('Generator',[.2,2.5,-.4]);
  }else if(id==='solar'){
   let w=1.3+Math.sqrt(p.area)*.1;let panel=group([-.9,.9,0]);panel.rotation.x=-.45;box(w,.12,1.8,C.steel,[0,0,0],panel);for(let x=-w/2+.13;x<w/2;x+=.18)box(.08,.05,1.65,C.blue,[x,.09,0],panel);let tank=cyl(.48,1.3+p.tank/2000,C.steel,[1.2,1,0]);tank.material.transparent=true;tank.material.opacity=.3;cyl(.4,1.1+p.tank/2000,C.blue,[1.2,.9,0]);let f=flow([[-.7,1.1,.6],[.2,1.1,.8],[1.2,1.5,.4],[1.2,.35,.5],[-.7,.4,.6],[-.7,1.1,.6]],C.orange,14,p.sun/750);ticks.push(f);let sun=ball(.26,C.gold,[-1.5,3,0]);sun.material.emissive.set(C.gold);for(let i=0;i<6;i++){let x=-1.9+i*.2;link([x,2.65,0],[x+.5,1.35,0],.012,C.gold);}label('Solar collector',[-1.3,1.55,.8]);label('Insulated store',[1.2,2.3,.3]);
  }else if(id==='battery'){
   box(3.4,.15,2.25,C.dark,[0,.2,0]);let heat=outputs[2].value-20;let color=new T.Color(C.green).lerp(new T.Color(C.red),Math.min(Math.max(heat/60,0),1));for(let x=0;x<8;x++)for(let z=0;z<5;z++){let cell=cyl(.13,.55,color,[-1.4+x*.4,.56,-.85+z*.42]);cyl(.045,.035,C.light,[-1.4+x*.4,.855,-.85+z*.42]);}for(let z of [-1.08,1.08])link([-1.65,.35,z],[1.65,.35,z],.045,C.blue);let f=flow([[-1.7,.35,-1.1],[1.7,.35,-1.1],[1.7,.35,1.1],[-1.7,.35,1.1],[-1.7,.35,-1.1]],C.blue,20,p.ua/100);ticks.push(f);label('Cells · color at 20 min',[-.7,1.35,0]);label('Cooling loop',[1.5,.65,1.2]);
  }else if(id==='drivetrain'){
   const rear=-1.05,front=1.14,y=1.25,z=.45,pitch=.065;
   const rearRadius=p.rear*pitch/(2*Math.PI),frontRadius=p.front*pitch/(2*Math.PI);
   const wheelRadius=p.radius*3.35,rearWheel=wheel(wheelRadius,[rear,y,0]);
   box(.075,.17,.08,C.red,[0,wheelRadius,0],rearWheel);
   link([rear,y,0],[rear,y,z],.065,C.dark);
   link([rear,y,-.13],[front,y,-.13],.065,C.steel);
   link([rear,y,-.13],[.48,2.34,-.13],.055,C.steel);
   link([front,y,-.13],[.48,2.34,-.13],.055,C.steel);
   const sprocket=(x,r,teeth,color)=>{
     const gear=group([x,y,z]);
     ring(r,.026,color,[0,0,0],gear);
     for(let i=0;i<teeth;i++){
       const angle=i*2*Math.PI/teeth;
       const tooth=box(.028,.038,.05,color,[r*Math.cos(angle),r*Math.sin(angle),0],gear);
       tooth.rotation.z=angle;
     }
     for(let i=0;i<3;i++){
       const angle=i*2*Math.PI/3;
       link([0,0,0],[r*Math.cos(angle),r*Math.sin(angle),0],.024,color,gear);
     }
     return gear;
   };
   const cog=sprocket(rear,rearRadius,p.rear,C.steel),ringGear=sprocket(front,frontRadius,p.front,C.dark);
   link([0,0,0],[0,-.55,.12],.045,C.steel,ringGear);
   box(.23,.065,.2,C.dark,[0,-.55,.12],ringGear);

   const tangent=Math.acos((rearRadius-frontRadius)/(front-rear));
   const path=new T.Path();
   path.moveTo(rear+rearRadius*Math.cos(tangent),y+rearRadius*Math.sin(tangent));
   path.lineTo(front+frontRadius*Math.cos(tangent),y+frontRadius*Math.sin(tangent));
   path.absarc(front,y,frontRadius,tangent,-tangent,true);
   path.lineTo(rear+rearRadius*Math.cos(tangent),y-rearRadius*Math.sin(tangent));
   path.absarc(rear,y,rearRadius,-tangent,tangent-2*Math.PI,true);
   const length=path.getLength();
   const rollers=Array.from({length:Math.round(length/pitch)},()=>box(.045,.032,.053,C.dark,[0,0,z]));
   const crankSpeed=p.cadence*Math.PI/30*.22,wheelSpeed=outputs[0].value*Math.PI/30*.22;
   ticks.push(t=>{
     ringGear.rotation.z=-t*crankSpeed;
     cog.rotation.z=rearWheel.rotation.z=-t*wheelSpeed;
     rollers.forEach((roller,i)=>{
       const position=(i/rollers.length+t*crankSpeed*frontRadius/length)%1;
       const point=path.getPointAt(position),direction=path.getTangentAt(position);
       roller.position.set(point.x,point.y,z);
       roller.rotation.z=Math.atan2(direction.y,direction.x);
     });
   });
   label(`${p.rear}T rear sprocket`,[rear,.69,.52]);
   label(`${p.front}T chainring`,[front,1.98,.54]);
   label('Rear wheel',[rear,2.58,.06]);
  }else if(id==='racecar'){
   let {car,wheels}=vehicle(true,p);ticks.push(t=>{wheels.forEach(w=>w.rotation.z=-t*(p.power/15));});let airflow=flow([[-2.5,.6,1.1],[-1,.6,1.1],[1,.6,1.1],[2.5,.6,1.1]],C.blue,12,p.power/60);ticks.push(airflow);label('Battery + powertrain',[-.6,1.3,0]);label('Grip at the contact patch',[1.2,.15,.8]);
  }
  model.traverse(o=>{if(o.isMesh&&o.material){o.userData.baseOpacity=o.material.opacity;o.userData.baseTransparent=o.material.transparent;}});
  labels.forEach(l=>{l.el=document.createElement('span');l.el.className='model-label';l.el.textContent=l.text;host.append(l.el);});animate=t=>ticks.forEach(f=>f(t));if(reset)resetCamera(id);setCutaway(cut);animate(phase);}
 function jobPower(job,p,stock){const r=jobSystem(systems.find(s=>s.id===job.kind),job,stock).calc(p);return job.kind==='printer'?r.metrics[2].value:r.metrics[0].value*p.speed;}
 function buildJob(job,p,stock,reset=true){
   if(jobPlayback?.job===job){
     const fraction=jobPlayback.duration?jobPlayback.elapsed/jobPlayback.duration:0;
     jobPlayback.visualParams={...p};jobPlayback.power=jobPower(job,p,stock);
     jobPlayback.timeFactor=job.kind==='printer'?100/p.speed:1/p.speed;
     const total=jobPlayback.timeline.at(-1);
     jobPlayback.duration=total.variableEnd*jobPlayback.timeFactor+total.fixedEnd;
     jobPlayback.elapsed=fraction*jobPlayback.duration;
     if(jobPlayback.sheet){
       jobPlayback.sheet.material.color.setHex(laserMaterials[stock].color);
       jobPlayback.sheet.scale.y=p.thick/3.175;
       jobPlayback.sheet.position.y=.6-p.thick*jobPlayback.scale/2;
     }
     if(reset)resetCamera(job.kind);
     return;
   }
   clear();
   const printer=job.kind==='printer',scale=printer?3.2/220:3.8/1219.2;
   const area=printer?[220,220]:[1219.2,914.4],base=printer?.55:.6;
   const map=point=>new T.Vector3((point[0]-area[0]/2)*scale,base+point[2]*scale,(area[1]/2-point[1])*scale);
   let sheet=null,bed=null;
   const gantry=group(),head=group([0,0,0],gantry);
   if(printer){
     box(3.75,.2,3.75,C.dark,[0,.1,0]);
     bed=group();
     box(3.2,.1,3.2,C.light,[0,.49,0],bed);
     for(const x of [-1.8,1.8]){
       box(.13,3.95,.17,C.dark,[x,2.12,0]);
     }
     for(const x of [-.2,.2])link([x,.3,1.8],[x,.3,-1.8],.035,C.steel);
     box(3.72,.14,.2,C.dark,[0,4.12,0]);
     link([-1.62,.4,.09],[-1.62,3.95,.09],.025,C.light);
     box(.42,1.7,.28,C.steel,[2.04,1.3,.1]);
     const display=box(.7,.18,.5,C.dark,[1.4,.44,1.58]);display.rotation.x=.35;
     const spool=cyl(.43,.25,C.dark,[.65,4.68,0]);spool.rotation.x=Math.PI/2;
     box(3.65,.13,.18,C.dark,[0,.25,0],gantry);
     box(.4,.43,.28,C.dark,[0,.35,0],head);
     mesh(new T.ConeGeometry(.04,.1,12),C.orange,[0,.05,0],head).rotation.z=Math.PI;
     box(.38,.32,.3,C.dark,[-1.76,.3,-.12],gantry);
   }else{
     box(4,.32,3.12,C.dark,[0,.22,0]);
     for(let index=0;index<22;index++)box(3.8,.06,.025,C.steel,[0,.52,-1.42+index*.135]);
     for(const x of [-1.95,1.95])box(.08,.13,3.03,C.steel,[x,.58,0]);
     const width=(job.bounds.max[0]-job.bounds.min[0])*scale,depth=(job.bounds.max[1]-job.bounds.min[1])*scale;
     const center=map(job.bounds.min.map((min,i)=>(min+job.bounds.max[i])/2));
     sheet=box(Math.max(width,.02),3.175*scale,Math.max(depth,.02),laserMaterials[stock].color,[center.x,.6-3.175*scale/2,center.z]);
     sheet.scale.y=p.thick/3.175;
     sheet.position.y=.6-p.thick*scale/2;
     box(3.85,.12,.14,C.steel,[0,.88,0],gantry);
     box(.22,.3,.24,C.red,[0,.77,0],head);
   }
   const active=[],travel=[],counts=[];
   let completed=0;
   for(const segment of job.segments){
     const vertices=segment.active?active:travel;
     vertices.push(...map(segment.from).toArray(),...map(segment.to).toArray());
     if(segment.active)completed+=2;
     counts.push(completed);
   }
   const makeLines=(vertices,color,opacity)=>{
     const geometry=new T.BufferGeometry();
     geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
     const object=new T.LineSegments(geometry,new T.LineBasicMaterial({color,transparent:true,opacity,depthTest:false}));
     object.renderOrder=2;(bed||model).add(object);return object;
   };
   makeLines(active,C.reference??C.steel,.45);
   makeLines(travel,C.blue,.18);
   const deposited=makeLines(active,C.red,1);
   deposited.geometry.setDrawRange(0,0);
   const partial=makeLines([0,0,0,0,0,0],C.red,1);
   partial.frustumCulled=false;
   const cursor=ball(printer?.028:.006,C.red,[0,0,0],bed||model);
   cursor.material.depthTest=false;
   cursor.renderOrder=3;
   const cursorRing=ring(printer?.034:.008,.002,C.paper,[0,0,0],bed||model);cursorRing.material.depthTest=false;cursorRing.renderOrder=4;
   const markerSize=Math.max(.015,Math.min(.08,Math.max(job.bounds.max[0]-job.bounds.min[0],job.bounds.max[1]-job.bounds.min[1])*scale*.1));
   const velocity=new T.ArrowHelper(new T.Vector3(1,0,0),new T.Vector3(),markerSize,C.blue,markerSize*.3,markerSize*.15);velocity.renderOrder=5;velocity.line.renderOrder=5;velocity.cone.renderOrder=5;velocity.line.material.depthTest=false;velocity.cone.material.depthTest=false;(bed||model).add(velocity);
   const energyInput=new T.ArrowHelper(new T.Vector3(0,-1,0),new T.Vector3(),markerSize,C.red,markerSize*.3,markerSize*.15);energyInput.line.material.depthTest=false;energyInput.cone.material.depthTest=false;energyInput.line.renderOrder=5;energyInput.cone.renderOrder=5;(bed||model).add(energyInput);
   const fallbackSegment=job.segments.find(s=>s.length>1e-8);
   const fallbackDirection=fallbackSegment?map(fallbackSegment.to).sub(map(fallbackSegment.from)).normalize():new T.Vector3(1,0,0);
   const timeline=jobTimeline(job,p);
   jobPlayback={job,timeline,timeFactor:printer?100/p.speed:1/p.speed,duration:timeline.at(-1).end,elapsed:0,sheet,map,scale,bed,gantry,cursor,velocity,markerSize,visualParams:{...p},power:jobPower(job,p,stock),machineMode:false};
   orbit.maxZoom=20;
   animate=()=>{
     const playback=jobPlayback;
     if(!playback)return;
     let low=0,high=playback.timeline.length-1;
     while(low<high){
       const middle=Math.floor((low+high)/2);
       const candidate=playback.timeline[middle];
       if(candidate.variableEnd*playback.timeFactor+candidate.fixedEnd<playback.elapsed)low=middle+1;
       else high=middle;
     }
     const entry=playback.timeline[low],segment=job.segments[low];
     const previous=playback.timeline[low-1];
     const start=previous?previous.variableEnd*playback.timeFactor+previous.fixedEnd:0;
     const end=entry.variableEnd*playback.timeFactor+entry.fixedEnd;
     const fraction=end===start?1:Math.min(1,Math.max(0,(playback.elapsed-start)/(end-start)));
     const point=segment.from.map((v,i)=>v+(segment.to[i]-v)*fraction);
     const position=map(point),from=map(segment.from);
     gantry.visible=playback.machineMode;
     if(printer){
       bed.position.z=playback.machineMode?-position.z:0;
       gantry.position.y=position.y;
       head.position.x=position.x;
     }else{
       gantry.position.z=position.z;
       head.position.x=position.x;
     }
     cursor.position.copy(position);
     const settings=playback.visualParams;
     const intensity=printer?(settings.temp-180)/70:(settings.power-10)/110;
     cursor.material.color.copy(new T.Color(C.blue).lerp(new T.Color(C.red),Math.max(0,Math.min(1,intensity))));
     cursor.scale.setScalar(printer?Math.sqrt(settings.flow/100):settings.kerf/.15);cursorRing.position.copy(position);cursorRing.quaternion.copy(camera.quaternion);cursorRing.scale.copy(cursor.scale);
     const energyLength=markerSize*playback.power/(printer?20:40);energyInput.position.copy(position).add(new T.Vector3(0,energyLength+markerSize*.8,0));energyInput.setLength(energyLength,energyLength*.3,energyLength*.16);
     const direction=map(segment.to).sub(map(segment.from));
     if(direction.lengthSq()<1e-16)direction.copy(fallbackDirection);
     velocity.visible=true;
     if(velocity.visible){velocity.position.copy(position);velocity.setDirection(direction.normalize());const length=markerSize*(printer?1.5*settings.speed/100:settings.speed/20);velocity.setLength(length,length*.3,length*.16);}

     deposited.geometry.setDrawRange(0,playback.elapsed>=playback.duration?completed:(low?counts[low-1]:0));
     partial.visible=segment.active;
     const attribute=partial.geometry.getAttribute('position');
     attribute.setXYZ(0,from.x,from.y,from.z);attribute.setXYZ(1,position.x,position.y,position.z);attribute.needsUpdate=true;
     if(performance.now()-lastProgress>100){
       lastProgress=performance.now();
       onJobProgress(playback.duration?playback.elapsed/playback.duration:0,playback.elapsed,playback.duration,point[2]);
     }
   };
   resetCamera(job.kind);
   animate();
   model.traverse(o=>{if(o.isMesh&&o.material){o.userData.baseOpacity=o.material.opacity;o.userData.baseTransparent=o.material.transparent;}});
   setCutaway(cut);
 }
 function machineView(id){
   if(jobPlayback)jobPlayback.machineMode=true;
   orbit.target.set(0,id==='printer'?2:1.1,0);
   camera.position.set(5.4,id==='printer'?4.1:5.3,6.4);
   camera.zoom=id==='printer'?.65:1;
   camera.updateProjectionMatrix();orbit.update();
 }
 function resetCamera(id){
   if(jobPlayback){
     jobPlayback.machineMode=false;
     if(jobPlayback.bed)jobPlayback.bed.position.z=0;
     const job=jobPlayback.job,center=job.bounds.min.map((v,i)=>(v+job.bounds.max[i])/2);
     const target=jobPlayback.map(center);
     orbit.target.copy(target);
     camera.position.copy(target).add(new T.Vector3(3.5,id==='printer'?4:7,6));
     camera.zoom=1;
     camera.updateProjectionMatrix();orbit.update();camera.updateMatrixWorld();
     let extent=.001;
     for(let mask=0;mask<8;mask++){
       const point=job.bounds.min.map((min,axis)=>mask&(1<<axis)?job.bounds.max[axis]:min);
       const projected=jobPlayback.map(point).project(camera);
       extent=Math.max(extent,Math.abs(projected.x),Math.abs(projected.y));
     }
     camera.zoom=Math.max(.55,Math.min(20,.77/extent));
     camera.updateProjectionMatrix();return;
   }
   orbit.maxZoom=3;
   const bicycle=id==='drivetrain';camera.position.set(bicycle?2.2:id==='wind'?5:5.4,bicycle?2.7:id==='wind'?3.2:4.1,bicycle?8:id==='wind'?7.5:6.4);if(id==='elevator')camera.position.y=4.45;camera.zoom=id==='elevator'?.88:1;camera.updateProjectionMatrix();orbit.target.set(0,id==='wind'?1.8:id==='elevator'?1.6:1.25,0);orbit.update();}
 function setCutaway(value){cut=value;model.traverse(o=>{if(o.isMesh&&o.material){o.material.opacity=cut?Math.min(o.userData.baseOpacity,.32):o.userData.baseOpacity;o.material.transparent=cut||o.userData.baseTransparent;o.material.depthWrite=!cut;}});}
 const observer=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);const extent=Math.max(2.2,2.25*h/w);camera.left=-extent*w/h;camera.right=extent*w/h;camera.top=extent;camera.bottom=-extent;camera.updateProjectionMatrix();});observer.observe(host);
 let raf;function render(now){let dt=Math.min((now-last)/1000,.05);last=now;const rect=host.getBoundingClientRect();if(!rect.width||!rect.height){raf=requestAnimationFrame(render);return;}if(playing){
   phase+=dt*rate;
   if(jobPlayback){
     jobPlayback.elapsed=Math.min(jobPlayback.duration,jobPlayback.elapsed+dt*jobRate);
     if(jobPlayback.elapsed>=jobPlayback.duration)playing=false;
   }
 }animate(phase);orbit.update();const placed=[];labels.map(l=>({l,v:l.pos.clone().project(camera)})).sort((a,b)=>b.v.y-a.v.y).forEach(({l,v})=>{const w=l.el.offsetWidth,h=l.el.offsetHeight;let x=Math.max(w/2+5,Math.min(rect.width-w/2-5,(v.x+1)*rect.width/2)),y=Math.max(h/2+5,Math.min(rect.height-h/2-5,(-v.y+1)*rect.height/2));for(const offset of [0,-h-6,h+6,-2*h-12,2*h+12]){const yy=Math.max(h/2+5,Math.min(rect.height-h/2-5,y+offset));if(!placed.some(b=>Math.abs(x-b.x)<(w+b.w)/2+4&&Math.abs(yy-b.y)<(h+b.h)/2+4)){y=yy;break;}}placed.push({x,y,w,h});l.el.style.left=`${x}px`;l.el.style.top=`${y}px`;l.el.style.display=v.z<1?'':'none';});renderer.render(scene,camera);frames++;raf=requestAnimationFrame(render);}raf=requestAnimationFrame(render);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();onFailure(new Error('Graphics context lost. Reload this page to restore the model.'));});
 return{build,buildJob,machineView,resetCamera,setCutaway,restart:()=>{phase=0;if(jobPlayback){jobPlayback.elapsed=0;lastProgress=-Infinity;}animate(phase);},setPlaying:v=>{
   if(v&&jobPlayback?.elapsed>=jobPlayback?.duration)jobPlayback.elapsed=0;
   playing=v;
 },setProgress:v=>{
   if(jobPlayback){jobPlayback.elapsed=Math.min(1,Math.max(0,v))*jobPlayback.duration;lastProgress=-Infinity;animate();}
 },setRate:v=>jobRate=v,get playing(){return playing;},get frames(){return frames;},dispose(){cancelAnimationFrame(raf);observer.disconnect();clear();orbit.dispose();renderer.dispose();}};
}
