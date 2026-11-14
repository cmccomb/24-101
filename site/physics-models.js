import {stepResponse} from './core-systems.js?v=1.6.2';
// These are explanatory schematics. Numeric labels retain physical units;
// dimensions, vector lengths and playback speeds use explicit display scales.
export const visualGuides={
 laser:{summary:'Red: absorbed power. Blue: travel. The enlarged groove shows kerf and stock depth.',power:'Watch the absorbed-power arrow and penetration budget.',speed:'Watch travel speed and the opposing energy demand.',thick:'Watch stock depth against the available cutting depth.',kerf:'Watch the enlarged groove widen and the removal demand increase.'},
 printer:{summary:'The enlarged bead section shows width × layer height. Red arrows show heating demand.',speed:'Watch nozzle travel and material throughput.',layer:'Watch bead height and the number of layers in the fixed-volume part.',width:'Watch the enlarged bead section widen.',temp:'Watch nozzle temperature color and required heating power.'},
 bicycle:{summary:'Red: braking force. Blue: initial velocity. The rotor and hand lever transmit torque.',mass:'Watch the weight arrow and stopping-distance marker.',speed:'Watch the velocity arrow and stopping-distance marker.',hand:'Watch lever position and braking force; tire grip can cap the force.',rotor:'Watch rotor radius, brake torque and stopping distance.'},
 elevator:{summary:'Upward tension and downward weight share a force scale. Motion shows the selected upward load case.',payload:'Watch cabin load, weight and tension.',counter:'Watch counterweight size, weight and tension.',speed:'Watch the upward velocity arrow and travel rate.',accel:'Watch the net upward force and the acceleration arrow.'},
 robot:{summary:'One arm; blue dots mark equal time intervals after a 30° command. Red weight stays vertical.',payload:'Watch payload weight, jaw force and the tip-response trace.',reach:'Watch link length, gravity torque and the tip-response trace.',kp:'Watch the tip-response trace and the position at the 2 s comparison marker.',kd:'Watch overshoot in the tip-response trace and the 2 s comparison marker.'},
 press:{summary:'Connected liquid transmits pressure. The wider ram trades force for travel; force arrows use different display scales.',force:'Watch input and output forces at the same piston-area ratio.',master:'Watch the small piston area change pressure and output travel.',ram:'Watch ram area, force amplification and the shorter output stroke.',stroke:'Watch the master stroke and the smaller ram displacement; both displace equal liquid volume.'},
 pump:{summary:'Blue arrows show flow; the enlarged pipe bore and repeated pipe runs show resistance.',rpm:'Watch the impeller, flow arrow and pump head.',diameter:'Watch the enlarged pipe bore and the operating flow.',lift:'Watch the outlet elevation and available flow.',length:'Watch additional pipe runs and the reduction in flow.'},
 refrigerator:{summary:'Red: heat leaking in and heat rejected. Blue: heat removed. The compressor supplies the difference.',setpoint:'Watch cabinet color, heat leak and the duty indicator.',room:'Watch room-side color, heat leak and required duty.',ua:'Watch insulation thickness and the heat-leak arrow.',power:'Watch the compressor input and heat-removal arrows.'},
 espresso:{summary:'Red: heater input; the bar shows warm-up after 30 s. Blue: fixed 2 mL/s brew flow.',water:'Watch the boiler water level and stored heat.',temp:'Watch target-temperature color and the required heat.',power:'Watch the heater-power arrow and warm-up progress at a common 30 s.',pressure:'Watch force on the brew face; the stream remains at 2 mL/s.'},
 washer:{summary:'The band marks ±20× calculated motion. Red: rotating imbalance force. Black: transmitted-force amplitude.',rpm:'Watch rotation, eccentric forcing and the motion envelope.',stiffness:'Watch spring stiffness and the motion envelope.',damping:'Watch the damper and the motion envelope.',imbalance:'Watch eccentric mass, forcing and the motion envelope.'},
 quadcopter:{summary:'Thrust tilts with the craft; gravity stays vertical. Blue dots compare the small-angle roll response at equal time intervals.',mass:'Watch weight, hover thrust and the roll response.',diameter:'Watch swept rotor area and the induced-flow indicator.',kp:'Watch the roll-response arc and the 1 s comparison marker.',kd:'Watch roll overshoot and the 1 s comparison marker.'},
 autoinjector:{summary:'The spring releases energy into seal friction and liquid flow. Needle bore is enlarged.',stiffness:'Watch spring force and the 5 s plunger position.',compression:'Watch initial spring compression and the 5 s plunger position.',viscosity:'Watch the flow arrow and the 5 s plunger position.',bore:'Watch the enlarged needle bore and the 5 s plunger position.'},
 buggy:{summary:'Blue dot: position at 20 s. Red: rolling and exit drag. Motion uses a common clock at 3× real time; slope shown ×3.',mass:'Watch ballast, gravity and the resistance-force balance.',height:'Watch slope angle and the downhill gravity component.',length:'Watch the run length and exit-speed marker.',crr:'Watch rolling resistance and the 20 s position marker.',cda:'Watch drag area, resistance and the 20 s position marker.'},
 datacenter:{summary:'Blue: supply air. Red: IT heat and exhaust. More airflow reduces temperature rise but costs fan power. Air colors span 10–60 °C.',load:'Watch IT heat arrows and exhaust color.',flow:'Watch airflow arrows, exhaust temperature and fan-power demand.',supply:'Watch supply and exhaust colors shift together.'}
};
export function buildPhysicsModel(id,p,out,k){
 if(!visualGuides[id])return null;
 const {T,C,model,box,cyl,ball,group,link,ring,label,wheel,fan,flow}=k;
 const ticks=[],pi=Math.PI,g=9.81;
 const num=(x,d=1)=>Number(x.toFixed(d)).toLocaleString('en-US');
 const thermal=temp=>new T.Color(C.blue).lerp(new T.Color(C.red),Math.max(0,Math.min(1,(temp-5)/95)));
 function arrow(pos,dir,length,color,parent=model){
  const obj=group(pos,parent),len=Math.min(2.1,Math.max(.025,Math.abs(length))),head=Math.min(.17,len*.35);
  obj.visible=Math.abs(length)>1e-10;
  const shaft=cyl(.025,Math.max(.002,len-head),color,[0,(len-head)/2,0],obj);
  const cone=new T.Mesh(new T.ConeGeometry(Math.min(.09,head*.5),head,12),new T.MeshStandardMaterial({color}));cone.position.y=len-head/2;obj.add(cone);
  obj.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...dir).normalize());return obj;
 }
 function line(points,color,opacity=1){const o=new T.Line(new T.BufferGeometry().setFromPoints(points.map(v=>new T.Vector3(...v))),new T.LineBasicMaterial({color,transparent:opacity<1,opacity}));model.add(o);return o;}
 function dimension(a,b,text){link(a,b,.012,C.steel);for(const v of [a,b])link([v[0],v[1]-.08,v[2]],[v[0],v[1]+.08,v[2]],.012,C.steel);if(text)label(text,a.map((v,i)=>(v+b[i])/2+(i===1?.13:0)));}
 function guideArc(center,r,angle,color){return line(Array.from({length:61},(_,i)=>{const a=angle*i/60;return[center[0]+r*Math.cos(a),center[1]+r*Math.sin(a),center[2]];}),color,.65);}
 function responseTrace(I,c,k,target,reach,origin,limit,roll=false){
  const points=Array.from({length:101},(_,i)=>{const a=target*stepResponse(I,c,k,limit*i/100);return[origin[0]+reach*Math.cos(a),origin[1]+reach*Math.sin(a),origin[2]+.18];});line(points,C.blue,.8);
  for(const f of [.125,.25,.5,.75]){const a=target*stepResponse(I,c,k,limit*f);ball(.035,C.blue,[origin[0]+reach*Math.cos(a),origin[1]+reach*Math.sin(a),origin[2]+.18]);}
  const a=target*stepResponse(I,c,k,limit);ball(.065,C.blue,[origin[0]+reach*Math.cos(a),origin[1]+reach*Math.sin(a),origin[2]+.2]);guideArc(origin,reach,target,C.steel);
 }
 if(id==='laser'){
  box(3.8,.2,2.4,C.dark,[0,.1,0]);const h=p.thick*.065,kerf=p.kerf*1.6;
  box(1.4,h,1.6,C.light,[-.7,.35+h/2,0]);box(1.4,h,1.6,C.light,[.7+kerf,.35+h/2,0]);
  const cutDepth=Math.min(h,out[3].value*.065);box(kerf,cutDepth,1.45,C.red,[kerf/2,.35+h-cutDepth/2,0]);
  const bridge=group([0,1.8,0]);box(3.7,.13,.15,C.steel,[0,0,0],bridge);const head=group([kerf/2,0,0],bridge);box(.32,.4,.3,C.dark,[0,0,0],head);link([0,-.2,0],[0,-1.1+h,0],.015,C.red,head);
  arrow([-.95,2.55,.25],[0,-1,0],p.power*.7*.012,C.red);arrow([.8,.4+h,1],[1,0,0],p.speed*.02,C.blue);
  dimension([0,.32,1],[kerf,.32,1],null);label(`Kerf ${num(p.kerf,2)} mm · enlarged`,[.45,.22,1.25]);label(`${num(.7*p.power)} W absorbed`,[-1.1,2.7,.25]);label(`${num(out[3].value)} mm budget depth`,[1.25,.75+h,.7]);
  ticks.push(t=>{head.position.z=.65*Math.sin(t*p.speed/22);});
 }else if(id==='printer'){
  box(3.6,.15,2.4,C.dark,[0,.1,0]);for(const x of [-1.4,1.4])box(.12,2.8,.14,C.steel,[x,1.55,-.7]);box(2.9,.12,.14,C.steel,[0,2.95,-.7]);
  const layers=Math.ceil(Math.cbrt(10000)/p.layer);box(1.05,.95,1.05,C.light,[-.7,.7,0]);for(let i=1;i<layers;i++)box(1.06,.006,1.06,C.steel,[-.7,.225+.95*i/layers,0]);
  const head=group([-.7,1.75,0]);box(.42,.35,.35,C.dark,[0,.2,0],head);cyl(.075,.3,thermal(p.temp-155),[0,-.12,0],head);
  // An inset is intentionally enlarged; width and height have a shared scale.
  box(p.width*1.9,p.layer*1.9,.45,C.red,[1.05,.4+p.layer*.95,.4]);dimension([1.05-p.width*.95,.22,1],[1.05+p.width*.95,.22,1],null);
  arrow([-.2,2.8,.4],[0,-1,0],out[2].value*.018,C.red);arrow([-1.5,.55,1],[1,0,0],p.speed*.008,C.blue);
  label(`${layers} layers`,[-.9,.8,1]);label(`${num(p.width,2)} × ${num(p.layer,2)} mm bead · enlarged`,[1,.9,1]);label(`${num(out[2].value)} W · ${p.temp} °C`,[-.15,2.9,.5]);
  ticks.push(t=>{head.position.x=-.7+.4*Math.sin(t*p.speed/30);});
 }else if(id==='bicycle'){
  const w=wheel(1.05,[0,1.3,0]),r=p.rotor/1000/.34*1.05;ring(r,.055,C.steel,[0,0,.15],w);box(.2,.45,.28,C.red,[r,1.3,.15]);link([0,1.3,0],[.25,2.65,0],.055,C.steel);link([.25,2.65,0],[.9,2.65,0],.035,C.steel);const lever=box(.4,.05,.08,C.red,[.8,2.5,.1]);lever.rotation.z=-p.hand/220;
  arrow([-.9,1,.3],[0,-1,0],p.mass*g*.001,C.dark);arrow([-.8,.2,1],[1,0,0],p.speed*.025,C.blue);arrow([.75,.3,.5],[-1,0,0],out[1].value*.001,C.red);
  arrow([0,.25,.2],[0,1,0],p.mass*g*.001,C.blue);
  const stop=out[2].value;box(Math.min(3.4,stop*.045),.035,.1,C.red,[0,.09,1]);ball(.07,C.blue,[-1.6+Math.min(3.2,stop*.045),.15,1]);
  label(`${num(out[1].value)} N braking`,[.8,.65,.6]);label(`${num(p.mass*g)} N weight`,[-1.15,1.7,.3]);label(`${num(stop)} m stop · ${p.speed} km/h`,[.1,.1,1.5]);
  ticks.push(t=>{const v=p.speed/3.6,a=out[1].value/p.mass,dt=t%(v/a+1),s=dt<v/a?v*dt-.5*a*dt*dt:v*v/(2*a);w.rotation.z=-s/.34;});
 }else if(id==='elevator'){
  for(const x of [-1.45,1.45])box(.1,3.6,.12,C.steel,[x,1.8,-.3]);box(3.1,.12,.5,C.dark,[0,3.6,0]);const pulley=wheel(.3,[0,3.25,0]);
  const car=group([-.8,.8,0]);box(.9,.1,.8,C.dark,[0,0,0],car);box(.9,1,.07,C.light,[0,.5,-.4],car);box(.6,.15+p.payload/1500,.5,C.red,[0,.15+p.payload/3000,0],car);
  const cw=group([.8,2.4,0]);box(.45,.3+p.counter/1000,.6,C.steel,[0,0,0],cw);
  arrow([-.2,.2,.65],[0,-1,0],(p.payload+300)*g*.00013,C.dark,car);arrow([.2,.75,.65],[0,1,0],out[0].value*.00013,C.red,car);arrow([-.15,.1,.65],[0,-1,0],p.counter*g*.00013,C.dark,cw);arrow([.15,.4,.65],[0,1,0],out[1].value*.00013,C.red,cw);
  arrow([-1.3,1,.65],[0,1,0],p.speed*.5,C.blue);arrow([.1,1.1,.7],[0,1,0],p.accel*.7,C.red);
  const rope1=link([-.3,3.25,0],[-.8,1.8,0],.02,C.dark),rope2=link([.3,3.25,0],[.8,2.7,0],.02,C.dark);
  const stretch=(o,a,b)=>{o.position.copy(new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5));o.scale.y=new T.Vector3(...a).distanceTo(new T.Vector3(...b))/o.geometry.parameters.height;o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...b).sub(new T.Vector3(...a)).normalize());};
  ticks.push(t=>{const y=.65+((t*p.speed*.25)%.8);car.position.y=y;cw.position.y=3.1-y;pulley.rotation.z=-t*p.speed;stretch(rope1,[-.3,3.25,0],[-.8,y+1,0]);stretch(rope2,[.3,3.25,0],[.8,cw.position.y+.3,0]);});
  label(`Tcar ${num(out[0].value)} N`,[-.9,2.9,.8]);label(`Tcw ${num(out[1].value)} N`,[1,3.1,.8]);label(`a = ${p.accel} m/s² · P = ${num(out[2].value)} kW`,[0,.1,1.15]);
 }else if(id==='robot'){
  box(.9,.15,.9,C.dark,[-1.1,.1,0]);cyl(.23,.65,C.steel,[-1.1,.45,0]);const origin=[-1.1,.8,.15],L=p.reach*3.5,joint=group([-1.1,.8,0]);ball(.2,C.red,[0,0,0],joint);link([0,0,0],[L,0,0],.1,C.steel,joint);
  const tip=group([L,0,0],joint);box(.2,.35,.45,C.steel,[0,0,0],tip);for(const z of [-.22,.22])box(.45,.07,.07,C.dark,[.18,-.2,z],tip);box(.28,.18+p.payload*.15,.3,C.red,[.3,-.3,0],tip);const loadArrow=arrow([0,0,0],[0,-1,0],p.payload*g*.045,C.red);loadArrow.name='payload-weight';
  const I=(.8/3+p.payload)*p.reach**2;responseTrace(I,p.kd,p.kp,pi/6,L,origin,2);dimension([-1.1,.3,-.4],[-1.1+L,.3,-.4],null);
  ticks.push(t=>{const a=pi/6*stepResponse(I,p.kd,p.kp,(t%4));joint.rotation.z=a;loadArrow.position.set(-1.1+(L+.3)*Math.cos(a)+.3*Math.sin(a),.8+(L+.3)*Math.sin(a)-.3*Math.cos(a),.25);});label(`L ${num(p.reach,2)} m · hold ${num(out[0].value)} N·m · jaw ${num(out[1].value)} N`,[.1,.12,1]);label(`30° command · 2 s error ${num(out[3].value,2)}°`,[.4,2.5,.2]);
 }else if(id==='press'){
  box(3.6,.18,1.6,C.dark,[0,.1,0]);for(const x of [.45,1.65])box(.15,2.85,.4,C.steel,[x,1.6,-.25]);box(1.6,.2,.65,C.dark,[1.05,3,0]);box(1.4,.15,.9,C.steel,[1.05,.65,0]);
  const r1=p.master*.008,r2=p.ram*.008,c1=cyl(r1+.05,1.4,C.light,[-1.05,1.2,0]),c2=cyl(r2+.05,1.6,C.light,[1.05,2.15,0]);for(const c of [c1,c2]){c.material.transparent=true;c.material.opacity=.23;}
  const fluid1=cyl(r1,1.3,C.blue,[-1.05,1.15,0]),fluid2=cyl(r2,.7,C.blue,[1.05,2.45,0]);fluid1.name='press-fluid-master';fluid2.name='press-fluid-ram';
  const master=group([-1.05,1.8,0]),ram=group([1.05,2.1,0]);cyl(r1,.08,C.red,[0,0,0],master);cyl(.05,.6,C.steel,[0,.3,0],master);box(.55,.07,.3,C.dark,[0,.6,0],master);cyl(r2,.1,C.red,[0,0,0],ram);cyl(.08,.7,C.steel,[0,-.35,0],ram);box(.9,.12,.7,C.steel,[0,-.7,0],ram);
  master.name='press-master';ram.name='press-ram';
  const liquid=flow([[-1.05,.7,0],[-.6,.4,0],[0,.4,0],[.15,2.8,0],[1.05,2.8,0]],C.blue,12,p.stroke/60);
  arrow([-1.7,2.7,.3],[0,-1,0],p.force*.003,C.red);arrow([1.95,2.5,.3],[0,-1,0],out[1].value*.05,C.red);
  const s1=p.stroke*.008,s2=out[2].value*.008;line([[-1.5,1.8,.5],[-1.5,1.8-s1,.5]],C.blue);line([[1.65,2.1,.5],[1.65,2.1-s2,.5]],C.blue);
  ticks.push(t=>{const q=(t%4)/4;master.position.y=1.8-q*s1;ram.position.y=2.1-q*s2;const h1=1.3-q*s1,h2=.7+q*s2;fluid1.scale.y=h1/1.3;fluid1.position.y=.5+h1/2;fluid2.scale.y=h2/.7;fluid2.position.y=2.8-h2/2;liquid(t);});label(`${num(p.force)} N → ${num(out[1].value)} kN`,[0,3.3,.4]);label(`${num(p.stroke)} mm → ${num(out[2].value,2)} mm`,[0,.15,1]);label(`${num(out[0].value,2)} MPa · work ${num(out[3].value)} J`,[0,1.2,.7]);
 }else if(id==='pump'){
  const d=p.diameter/1000,rad=p.diameter*.003;for(const x of [-1.65,1.65])box(.7,.85,.8,C.light,[x,.5,0],model,{transparent:true,opacity:.3});box(.6,.55,.7,C.blue,[-1.65,.35,0]);const H=.35+p.lift*.12;box(.6,.55,.7,C.blue,[1.65,H,0]);
  cyl(.42,.45,C.red,[-.7,.65,0]).rotation.x=pi/2;const rotor=fan(.33,[-.7,.65,.28]);const count=2+Math.round(p.length/12),points=[[-1.65,.4,0],[-.7,.65,0]];
  for(let i=0;i<count;i++)points.push([i%2?.8:.1,.4+i*.15,-.15]);points.push([.8,H,0],[1.65,H,0]);
  for(let i=1;i<points.length;i++)link(points[i-1],points[i],rad,C.blue);const f=flow(points,C.blue,15,out[0].value/120);arrow([0,H+.4,.3],[1,0,0],out[0].value*.0025,C.blue);dimension([1.9,.35,.2],[1.9,H,.2],null);
  const bore=cyl(rad,.15,C.dark,[-1.1,1.9,0]);bore.rotation.x=pi/2;ring(rad,.025,C.steel,[-1.1,1.9,.1]);ticks.push(f,t=>rotor.rotation.z=-t*p.rpm/200);
  label(`${p.diameter} mm bore · enlarged`,[-1,2.25,.4]);label(`${p.length} m pipe · ${p.lift} m lift`,[.65,.2,1]);label(`${num(out[0].value)} L/min`,[.8,H+.7,.4]);
 }else if(id==='refrigerator'){
  const wall=.1+.26*(6-p.ua)/5;box(1.5,2.5,.1,new T.Color(C.blue).lerp(new T.Color(C.light),(p.setpoint-1)/10),[-.5,1.4,-.55]);for(const x of [-1.25,.25])box(wall,2.6,1.2,C.light,[x,1.4,0]);for(const y of [.15,2.65])box(1.6,wall,1.2,C.light,[-.5,y,0]);for(const y of [.8,1.5,2.1])box(1.3,.035,.9,C.steel,[-.5,y,0]);
  cyl(.25,.4,C.dark,[1,.4,0]);box(.1,.16+p.setpoint*.09,.1,C.blue,[-.8,.35+(.16+p.setpoint*.09)/2,.55]);for(let i=0;i<6;i++)link([.7,.85+i*.2,0],[1.5,.85+i*.2,0],.025,C.red);
  arrow([-2,1.5,.3],[1,0,0],out[0].value*.002,C.red);arrow([-.4,2,.6],[1,0,0],out[1].value*.002,C.blue);arrow([1.15,1.15,.3],[0,1,0],out[3].value*.002,C.red);arrow([.35,.3,.5],[1,0,0],p.power*.002,C.dark);
  box(.15,1.1,.15,C.steel,[-1.6,1,0]);box(.18,Math.min(1.1,out[2].value*.011),.18,out[2].value>100?C.red:C.blue,[-1.6,.45+Math.min(1.1,out[2].value*.011)/2,0]);
  const room=ball(.17,thermal(p.room*2),[-1.9,2.5,0]);label(`Room ${p.room} °C · cabinet ${p.setpoint} °C`,[-1.4,2.95,.2]);label(`Leak ${num(out[0].value)} W · duty ${num(out[2].value)}%`,[-.8,.15,1]);label(`Cold ${num(out[1].value)} + ${p.power} = hot ${num(out[3].value)} W`,[1.4,2.9,.4]);
 }else if(id==='espresso'){
  box(2.9,.15,1.5,C.dark,[0,.1,0]);box(2.7,2.4,.2,C.steel,[0,1.4,-.5]);const boiler=cyl(.5,1.7,C.light,[-.7,1.3,0]);boiler.material.transparent=true;boiler.material.opacity=.2;
  const level=.2+p.water*.003,heatFraction=Math.min(1,30/out[1].value);cyl(.43,level,thermal(20+(p.temp-20)*heatFraction),[-.7,.5+level/2,0]);
  const element=ring(.3,.05,C.red,[-.7,.5,.15]);element.rotation.x=pi/2;arrow([-1.55,.35,.3],[0,1,0],p.power*.00065,C.red);cyl(.28,.25,C.dark,[.8,1.6,.1]);cyl(.28,.3,C.light,[.8,.4,.1]);arrow([1.4,1.6,.25],[0,-1,0],out[3].value*.0003,C.red);
  const brew=flow([[.8,1.45,.1],[.8,.9,.1],[.8,.6,.1]],C.blue,6,1);ticks.push(brew);const dial=ring(.25,.03,C.light,[.8,2.3,-.3]);const needle=box(.025,.22,.02,C.red,[.8,2.32,-.25]);needle.rotation.z=-p.pressure/12*pi;
  // The 30 s comparison is fixed, so changing heater power is visible when paused.
  box(.9,.07,.1,C.steel,[-.7,2.55,.15]);box(.9*heatFraction,.1,.12,C.red,[-1.15+.45*heatFraction,2.55,.15]);label(`${p.power} W · ${num(out[1].value)} s warm-up`,[-.9,2.9,.3]);label(`${p.water} mL · ${p.temp} °C target`,[-.8,1.7,.7]);label(`${num(out[3].value)} N · 2 mL/s fixed`,[1,.9,.7]);
 }else if(id==='washer'){
  box(2.9,.15,1.7,C.dark,[0,.1,0]);for(const x of [-1.3,1.3])box(.1,2.4,.5,C.steel,[x,1.4,-.5]);const drum=group([0,1.55,0]);const shell=cyl(.75,.7,C.light,[0,0,0],drum);shell.rotation.x=pi/2;shell.material.transparent=true;shell.material.opacity=.25;const rotor=wheel(.65,[0,0,.4],drum);ball(.06+p.imbalance*.0003,C.red,[.55,0,.05],rotor);
  const w=p.rpm*pi/30,X=out[0].value*.02,phase=Math.atan2(p.damping*w,p.stiffness-35*w*w);for(const x of [-X,X])line([[x,.3,.6],[x,2.4,.6]],C.blue,.6);
  const springs=[];for(const side of [-1,1]){const coil=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(Array.from({length:121},(_,i)=>new T.Vector3(side*1.3-side*.55*i/120,1.55+.09*Math.cos(i*pi/10),.09*Math.sin(i*pi/10)))),120,.012+p.stiffness/700000,6,false),new T.MeshStandardMaterial({color:C.steel}));model.add(coil);coil.name='suspension-spring';coil.userData.side=side;coil.userData.rest=coil.geometry.attributes.position.array.slice();springs.push(coil);}const damper=cyl(.06+p.damping*.00015,.7,C.dark,[-.65,.55,.1]);damper.rotation.z=pi/2;const damperRod=link([-.3,.55,.1],[0,.55,.1],.025,C.steel),bracket=group([0,.55,.1]);link([0,0,0],[0,.35,0],.025,C.steel,bracket);
  arrow([.55,0,.15],[1,0,0],p.imbalance/1000*.2*w*w*.001,C.red,rotor);arrow([-.8,.25,.8],[1,0,0],out[2].value*.001,C.dark);
  ticks.push(t=>{const a=t*w/12,dx=X*Math.cos(a-phase);drum.position.x=dx;rotor.rotation.z=a;damperRod.position.x=(-.3+dx)/2;damperRod.scale.y=(.3+dx)/.3;bracket.position.x=dx;springs.forEach(s=>{const a=s.geometry.attributes.position,rest=s.userData.rest;for(let i=0;i<a.array.length;i+=3)a.array[i]=rest[i]+dx*Math.max(0,Math.min(1,(rest[i]-s.userData.side*1.3)/(-s.userData.side*.55)));a.needsUpdate=true;});});label(`±${num(out[0].value,2)} mm · motion ×20`,[0,2.85,.3]);label(`${num(out[2].value)} N transmitted`,[.7,.15,1]);
 }else if(id==='quadcopter'){
  const origin=[0,1.5,0],craft=group(origin),r=p.diameter*.0025;box(.55,.12+p.mass*.12,.4,C.dark,[0,0,0],craft);
  for(const x of [-1,1])for(const z of [-.8,.8]){link([0,0,0],[x,0,z],.04,C.steel,craft);const rotor=group([x,.1,z],craft);ring(r,.015,C.blue,[x,.18,z],craft).rotation.x=pi/2;box(r*2,.025,.06,C.light,[0,0,0],rotor);box(.06,.025,r*2,C.light,[0,0,0],rotor);arrow([x,.2,z],[0,1,0],out[0].value*.08,C.blue,craft);ticks.push(t=>rotor.rotation.y=t*15*(x*z>0?1:-1));}
  const weight=arrow([0,1.4,.25],[0,-1,0],p.mass*g*.08,C.red,model);weight.name='vehicle-weight';const I=.5*p.mass*.18**2;responseTrace(I,p.kd,p.kp,pi/18,1.6,[0,1.5,.8],1);arrow([-1.8,1.2,.4],[0,-1,0],Math.sqrt(p.mass*g/(2*1.225*4*pi*(p.diameter/2000)**2))*.06,C.blue);
  ticks.push(t=>{craft.rotation.z=pi/18*stepResponse(I,p.kd,p.kp,t%4);});label(`${num(out[0].value)} N / rotor · weight ${num(p.mass*g)} N`,[0,3,.2]);label(`${p.diameter} mm rotor · ${num(out[1].value)} W · 1 s error ${num(out[3].value,2)}°`,[0,.15,1]);
 }else if(id==='autoinjector'){
  const A=pi*.004**2,R=128*p.viscosity/1000*.012/(pi*(p.bore/1000)**4),tau=R*A*A/p.stiffness,xe=p.compression/1000-1/p.stiffness,x5=Math.min(.012,xe*(1-Math.exp(-5/tau))),drop=x5*65;
  const body=cyl(.34,2.4,C.light,[-.5,1.6,0]);body.material.transparent=true;body.material.opacity=.18;cyl(.25,.65,C.blue,[-.5,.95,0]);const plunger=cyl(.29,.08,C.dark,[-.5,1.45-drop,0]);link([-.5,.3,0],[-.5,.8,0],.025,C.steel);
  const coils=[],initial=.35+(35-p.compression)*.02;for(let i=0;i<10;i++){const coil=ring(.22,.012+p.stiffness*.00004,C.red,[-.5,2.65-i*(initial+drop)/9,0]);coil.rotation.x=pi/2;coils.push(coil);}
  line([[-.9,1.45-drop,.25],[-.1,1.45-drop,.25]],C.blue);ticks.push(t=>{const x=Math.min(.012,xe*(1-Math.exp(-(t%7)/tau))),travel=x*65;plunger.position.y=1.45-travel;coils.forEach((o,i)=>o.position.y=2.65-i*(initial+travel)/9);});
  const bore=p.bore*.85;ring(.4,.06,C.steel,[1.15,1.1,0]);cyl(bore,.08,C.blue,[1.15,1.1,.04]).rotation.x=pi/2;arrow([-.5,2.8,.5],[0,-1,0],out[0].value*.045,C.red);arrow([.05,.8,.4],[0,-1,0],Math.log1p((xe/tau)*1000)*.22,C.blue);
  const expelled=out[2].value*.5;cyl(.25,Math.max(.02,expelled),C.blue,[-.5,.17+expelled/2,.55]);dimension([-.95,1.45,0],[-.95,1.45-drop,0],null);label(`5 s: ${num(out[2].value,2)} mL · force ${num(out[0].value)} N`,[-.5,3.1,.4]);label(`${p.bore} mm needle bore · enlarged`,[1.05,1.85,.4]);label(`μ = ${p.viscosity} mPa·s`,[.65,.2,1]);
 }else if(id==='buggy'){
  const actual=Math.asin(p.height/p.length),angle=actual*3,L=3+p.length*.006,ramp=group([0,.3+L*.5*Math.sin(angle),0]);ramp.rotation.z=-angle;box(L,.1,1.35,C.steel,[0,0,0],ramp);
  const car=group([-L*.25,.32,0],ramp);car.name='buggy-motion';const body=new T.Mesh(new T.SphereGeometry(1,24,12),new T.MeshStandardMaterial({color:C.light}));body.scale.set(.85,.2,.28);car.add(body);const canopy=new T.Mesh(new T.SphereGeometry(1,20,12),new T.MeshStandardMaterial({color:C.dark}));canopy.position.set(.25,.14,0);canopy.scale.set(.27,.12,.22);car.add(canopy);box(.32,.06,.2,C.red,[-.3,.12,0],car);link([-.7,.07,0],[-1.02,.4,0],.025,C.dark,car);link([-1.02,.4,-.2],[-1.02,.4,.2],.025,C.dark,car);const wheels=[[-.55,-.32],[-.55,.32],[.5,0]].map(([x,z])=>wheel(.12,[x,-.1,z],car));
  const v=out[0].value/3.6,Froll=p.crr*p.mass*g*Math.cos(actual),Fdrag=.5*1.225*p.cda*v*v;arrow([.7,.65,1.25],[-1,0,0],Froll*.015,C.red);arrow([.7,1.05,1.25],[-1,0,0],Fdrag*.015,C.red);arrow([-1.3,.7,1.25],[1,0,0],p.mass*g*Math.sin(actual)*.015,C.blue);
  const area=ring(Math.sqrt(p.cda)*.8,.025,C.blue,[.9,.4,0],car);area.rotation.y=pi/2;dimension([-L/2,.1,1],[L/2,.1,1],null);const a=g*(Math.sin(actual)-p.crr*Math.cos(actual)),b=.5*1.225*p.cda/p.mass,travel=time=>Math.log(Math.cosh(Math.sqrt(a*b)*Math.min(time,out[1].value)))/b;const timeMarker=ball(.09,C.blue,[-L*.35+travel(20)/p.length*L*.7,.2,.55],ramp);timeMarker.name='buggy-20s';ticks.push(t=>{const s=travel((t%12)*3);car.position.x=-L*.35+s/p.length*L*.7;wheels.forEach(w=>w.rotation.z=-s/.19*.02);});label(`Blue marker: 20 s · exit ${num(out[0].value)} km/h`,[0,2.8,.3]);label(`h ${p.height} m · L ${p.length} m · rolling ${num(Froll)} N · drag ${num(Fdrag)} N`,[0,.1,1.4]);
 }else if(id==='datacenter'){
  const airColor=value=>new T.Color(C.blue).lerp(new T.Color(C.red),Math.max(0,Math.min(1,(value-10)/50)));
  for(const x of [-1,0,1]){box(.7,2.2,.8,C.dark,[x,1.25,0]);for(let j=0;j<7;j++)box(.58,.2,.04,C.steel,[x,.35+j*.27,.42]);arrow([x,1.15,1.1],[0,0,-1],p.flow*.08,C.blue);arrow([x,2.3,-.2],[0,1,0],p.load*.004,C.red);for(let i=0;i<3;i++)ball(.03,airColor(p.supply),[x-.2+i*.2,.4,.5]);box(.5,.1,.5,airColor(out[0].value),[x,2.45,0]);}
  const cold=flow([[-1.7,.4,1.2],[0,.4,1.2],[0,1.2,0]],airColor(p.supply),12,p.flow/5),hot=flow([[0,1.5,0],[0,2.4,-.8],[1.7,2.4,-.8]],airColor(out[0].value),12,p.flow/5);ticks.push(cold,hot);arrow([-1.6,.2,.6],[0,1,0],out[2].value*.004,C.dark);
  label(`${p.supply} °C supply → ${num(out[0].value)} °C exhaust`,[0,3.2,.5]);label(`${p.load} kW heat · ${p.flow} m³/s air`,[0,.1,1.2]);label(`Fan ${num(out[2].value)} kW`,[-1.6,1.4,.9]);
 }
 return {ticks,note:visualGuides[id].summary};
}
