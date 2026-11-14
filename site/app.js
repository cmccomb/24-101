import {visualGuides} from './physics-models.js?v=1.6.2';
import {weekFor, dateLabel, areas} from './course.js?v=1.6.2';
import {systems, extraSystems, allSystems, defaults, fmt} from './systems.js?v=1.6.2';
import {lessons, lessonFor, engineering, requirement, perturbation} from './engineering.js?v=1.6.2';
import {machines, laserMaterials, maxFileBytes, jobSystem, finishJob} from './fabrication.js?v=1.6.2';
import {createViewer} from './models.js?v=1.6.2';

const $=id=>document.getElementById(id);
const exampleParts={
  printer:[
    {file:'ender3-frame.gcode',label:'Hollow frame'},
    {file:'ender3-spacer.gcode',label:'Flanged spacer'}
  ],
  laser:[
    {file:'laser-linkage.svg',label:'Linkage plate'},
    {file:'laser-fit-coupon.svg',label:'Kerf-fit coupon'}
  ]
};
const connections={
  printer:'Temperature, heat and energy conservation connect the deposited volume to a required heating rate.',
  laser:'Power is energy per time. Dividing power by travel speed gives energy per length.',
  heatpump:'Absolute temperature, heat engines, refrigerators, and the first and second laws set performance limits.',
  espresso:'Heat capacity sets the stored energy. Pressure produces force; pressure times volume flow gives hydraulic power.',
  otto:'Thermodynamic processes, equations of state and the first law explain the ideal cycle.',
  turbine:'Energy conservation accounts for the compressor work, turbine work and heat exchange.',
  refrigerator:'Heat transfer through the walls sets the cooling load. The first law relates heat absorbed, electrical work and heat rejected.',
  wind:'Kinetic energy, mass flow, torque and angular velocity connect the wind to shaft power.',
  solar:'Heat capacity and the first law set the storage balance. The exponential response extends the course concepts with a differential equation.',
  battery:'Heat capacity and energy conservation explain the thermal response. Current, voltage and Joule heating extend into 33-142.',
  datacenter:'Heat capacity and energy conservation connect heat rate, mass flow and temperature rise. The fan system curve extends into fluid mechanics.',
  bicycle:'Friction, torque and work–energy connect hand effort to stopping distance and heat. Tire load transfer and brake fade are outside this introductory model.',
  elevator:'Newton’s second law gives each rope tension. Axial stress and regenerative drive behavior extend into later solid mechanics and controls courses.',
  robot:'Rotational Newton’s law, moments and friction set joint and jaw loads. PD feedback and second-order step response extend into later controls courses.',
  press:'Pascal’s principle relates pressure and piston force. Volume conservation trades displacement for force, while work conservation prevents energy multiplication.',
  excavator:'Pressure-area force and moment balance connect cylinder geometry to the load. Hydraulic flow and power extend into fluid mechanics.',
  pump:'Continuity and mechanical-energy balance relate flow, elevation and pressure head. Pump curves and friction loss extend into fluid mechanics.',
  washer:'Newton’s second law and spring–mass oscillations lead to a forced-vibration model. Phase, damping and isolation extend into vibrations.',
  quadcopter:'Newton’s laws connect thrust to weight and torque to roll acceleration. Actuator-disk flow and feedback control extend into later fluids and controls courses.',
  autoinjector:'Spring potential energy and work connect plunger motion to dissipation. Poiseuille resistance extends into fluid mechanics.',
  drivetrain:'Torque and angular speed determine rotational power. Rolling without slipping relates wheel angular speed to travel speed.',
  buggy:'Newton’s laws, gravitational potential energy, kinetic energy and resistance forces explain freeroll.',
  racecar:'Newton’s laws, friction and kinetic energy explain acceleration. P = Fv relates power to available driving force.'
};

let current=systems[0],params=defaults(current),result,account;
let sweepKey=lessonFor(current).sweep[0],sweepIndex=lessonFor(current).sweep[1],target=lessonFor(current).criterion.target;
const designs={},references={},targets={},files={},pendingFileSettings={};
let stateKey='laser',fileSequence=0,loadSequence=0,parserWorker;let samples=[],sampleKey,modelFrame;
const viewer=createViewer($('viewport'),error=>{
  $('loading').hidden=false;
  $('loading').textContent=`The 3D model needs WebGL. ${error.message} Inputs, equations and calculations remain available.`;
},showJobProgress);
if(viewer)$('loading').hidden=true;
else for(const id of ['play','restart','camera','cutaway','job-seek','job-rate','machine-view'])$(id).disabled=true;
function playbackLabel(){if(!viewer)return;$('play').textContent=viewer.playing?'Pause motion':'Play motion';$('play').setAttribute('aria-label',viewer.playing?'Pause animation':'Play animation');}
playbackLabel();

function navigation(){
  $('system-list').innerHTML=systems.map((s,i)=>`<button class="nav-item" data-system="${s.id}" ${s.id===current.id?'aria-current="page"':''}><span class="nav-number">${String(i+1).padStart(2,'0')}</span>${s.title}</button>`).join('')+`<details class="further-systems"><summary>Further systems</summary>${extraSystems.map(s=>`<button class="nav-item" data-system="${s.id}">${s.title}</button>`).join('')}</details>`;
  $('system-select').innerHTML='<optgroup label="Monday systems">'+systems.map((s,i)=>`<option value="${s.id}">${i+1}. ${s.title}</option>`).join('')+'</optgroup><optgroup label="Further systems">'+extraSystems.map(s=>`<option value="${s.id}">${s.title}</option>`).join('')+'</optgroup>';

}
function controls(){
  const lesson=lessonFor(current);
  $('parameters').innerHTML=current.params.map(p=>`<div class="parameter"><div class="param-head"><label for="range-${p.key}">${p.label}</label><div class="param-value"><input id="number-${p.key}" data-key="${p.key}" type="number" min="${p.min}" max="${p.max}" step="${p.step}" value="${params[p.key]}" aria-label="${p.label}" aria-describedby="help-${p.key} model-note"><span class="param-unit">${p.unit}</span></div></div><input class="range" id="range-${p.key}" data-key="${p.key}" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${params[p.key]}" aria-describedby="help-${p.key} model-note"><span class="sr-only" id="help-${p.key}">${p.unit} ${p.help}</span></div>`).join('');
  $('input-definitions').innerHTML=current.params.map(p=>`<dt>${p.label}</dt><dd>${lesson.roles[p.key]}. ${p.help}</dd>`).join('');
  $('sweep-input').innerHTML=current.params.map(p=>`<option value="${p.key}">${p.label}</option>`).join('');
  $('sweep-input').value=sweepKey;
  $('sweep-output').innerHTML=result.metrics.map((m,i)=>`<option value="${i}">${m.label}</option>`).join('');
  $('sweep-output').value=sweepIndex;
  const c=lesson.criterion;
  $('requirement-label').textContent=c.label;
  $('requirement-relation').textContent=c.sense==='max'?'≤':'≥';
  $('requirement-limit').max=c.maxTarget??1e9;
  $('requirement-limit').value=target;
  $('requirement-unit').textContent=result.metrics[c.metric].unit;
}
function showResults(){
  const reference=references[stateKey];
  $('metrics').innerHTML=result.metrics.map((m,i)=>{
    const ref=reference.result.metrics[i].value,difference=m.value-ref;
    const absolute=['°C','K','%'].includes(m.unit)||Math.abs(ref)<1e-10;
    const change=absolute?`${difference>0?'+':''}${fmt(difference)} ${m.unit==='%'?'pp':m.unit}`:`${difference>0?'+':''}${fmt(100*difference/Math.abs(ref),1)}%`;
    return`<div class="metric"><div class="metric-label">${m.label}</div><div class="metric-value">${fmt(m.value)}<small>${m.unit}${account.valid?'':' †'}</small></div><div class="metric-reference">Ref. ${fmt(ref)}${Math.abs(difference)>1e-8?`<span class="metric-delta changed" aria-label="Change from reference: ${change}">${change}</span>`:''}</div></div>`;
  }).join('');
  $('reference-inputs').textContent='Reference inputs'+(reference.material?' ('+laserMaterials[reference.material].label+')':'')+': '+current.params.map(p=>`${p.label.toLowerCase()} ${fmt(reference.params[p.key],3)} ${p.unit}`).join('; ')+'.';
  $('validity').hidden=account.valid;
  $('validity').textContent='† '+account.validity;
}
function showAccount(){
  $('balance-title').textContent=account.kind;
  $('balance-unit').textContent=account.unit;
  $('balance-equation').textContent=account.balance;
  $('boundary').textContent=account.boundary;
  $('input-heading').textContent=account.unit==='N'?'Driving force':'Input';
  $('output-heading').textContent=account.unit==='N'?'Resistance and momentum change':'Output and accumulation';
  const rows=terms=>terms.map(t=>`<div class="account-term ${t.stored?'stored':''}"><span>${t.label}</span><span class="quantity">${fmt(t.value,3)}<small>${account.unit}</small></span></div>`).join('');
  $('balance-input').innerHTML=rows(account.input);
  $('balance-output').innerHTML=rows(account.output);
  $('residual').textContent=`Numerical balance residual: ${Math.abs(account.residual)<1e-8?'< 10⁻⁸':fmt(Math.abs(account.residual),8)} ${account.unit}. Closure checks the accounting; applicability depends on the assumptions.`;
  $('interpretation').textContent=account.interpretation;
  const [label,url]=current.sources[0];$('balance-source').innerHTML=`General principle: <a href="${url}" target="_blank" rel="noopener">${label}</a>. See Physics and assumptions for model-specific constants.`;
}
function showRequirement(){
  const status=requirement(current,result,target,account.valid),node=$('requirement-status');
  node.dataset.met=String(status.met);node.dataset.valid=String(status.valid);
  const cannotHoldSetpoint=current.id==='refrigerator'&&status.actual>100;
  node.textContent=!status.valid?'Outside model range':status.met?'Requirement met':cannotHoldSetpoint?'Setpoint cannot be held':'Requirement not met';
  $('requirement-margin').textContent=status.valid?`${status.margin>=0?'Margin':'Shortfall'}: ${fmt(Math.abs(status.margin))} ${status.unit==='%'?'pp':status.unit}`:'';
}
function chart(){
  const p=current.params.find(def=>def.key===sweepKey),m=result.metrics[sweepIndex];
  const key=JSON.stringify([stateKey,current.material,current.job?.bounds,current.job?.travelLength,sweepKey,sweepIndex,...current.params.filter(def=>def.key!==sweepKey).map(def=>params[def.key])]);
  if(key!==sampleKey){
    sampleKey=key;
    const count=p.integer?p.max-p.min:60;
    samples=Array.from({length:count+1},(_,i)=>{
      const x=p.min+(p.max-p.min)*i/count,values={...params,[p.key]:x},r=current.calc(values);
      return {x,y:r.metrics[sweepIndex].value,valid:engineering(current,values,r).valid};
    });
  }
  const node=$('chart'),width=node.clientWidth,height=node.clientHeight;
  if(!width)return;
  const ys=[...samples.map(s=>s.y),m.value];
  let low=Math.min(...ys),high=Math.max(...ys),span=high-low;
  if(span<1e-10){span=Math.max(Math.abs(high)*.15,1);low-=span*.5;high+=span*.5;}
  else{low-=span*.08;high+=span*.12;}
  if(Math.min(...ys)>=0)low=Math.max(0,low);

  const left=49,right=width-23,bottom=height-36,mid=(left+right)/2;
  node.setAttribute('viewBox',`0 0 ${width} ${height}`);
  const X=x=>left+((x-p.min)/(p.max-p.min))*(right-left),Y=y=>bottom-((y-low)/(high-low))*(bottom-24);
  let svg=`<text class="chart-axis-label" x="${left}" y="13">${m.label} (${m.unit})</text>`;
  const tick=v=>Math.abs(v)<.001&&v!==0?v.toExponential(1):fmt(v,high-low<1?3:1);
  for(let i=0;i<=4;i++){
    const y=low+(high-low)*i/4;
    svg+=`<line class="chart-grid" x1="${left}" x2="${right}" y1="${Y(y)}" y2="${Y(y)}"/><text class="chart-label" x="${left-6}" y="${Y(y)+4}" text-anchor="end">${tick(y)}</text>`;
  }
  const ticks=width<350?2:4;
  for(let i=0;i<=ticks;i++){
    const x=p.min+(p.max-p.min)*i/ticks,value=p.integer?Math.round(x):x;
    svg+=`<text class="chart-label" x="${X(value)}" y="${bottom+16}" text-anchor="middle">${fmt(value,3)}</text>`;
  }
  const compareLimit=sweepIndex===lessonFor(current).criterion.metric,showLimit=compareLimit&&target>=low&&target<=high;
  if(showLimit)svg+=`<line class="chart-limit" x1="${left}" x2="${right}" y1="${Y(target)}" y2="${Y(target)}"/>`;
  const paths=['',''];
  for(let i=1;i<samples.length;i++){
    const a=samples[i-1],b=samples[i],index=a.valid&&b.valid?0:1;
    const previousValid=i>1&&samples[i-2].valid&&a.valid;
    const start=i===1||previousValid!==(index===0);
    paths[index]+=`${start?`M${X(a.x)},${Y(a.y)}`:''}L${X(b.x)},${Y(b.y)}`;
  }
  paths.forEach((d,index)=>{if(d)svg+=`<path class="chart-line ${index?'invalid':''}" d="${d}"/>`;});
  const cx=X(params[p.key]),cy=Y(m.value);
  svg+=`<line class="chart-guide" x1="${cx}" x2="${cx}" y1="${cy}" y2="${bottom}"/><circle class="chart-point ${account.valid?'':'invalid'}" cx="${cx}" cy="${cy}" r="5"><title>Current design: ${fmt(params[p.key],3)} ${p.unit}, ${fmt(m.value)} ${m.unit}</title></circle>`;
  svg+=`<text class="chart-axis-label" x="${mid}" y="${height-4}" text-anchor="middle">${p.label}${p.unit?` (${p.unit})`:''}</text>`;
  node.innerHTML=svg;
  node.setAttribute('aria-label',`${m.label} in ${m.unit} versus ${p.label} from ${p.min} to ${p.max} ${p.unit}. Current response ${fmt(m.value)} ${m.unit}.`);
  const notes=[];
  if(compareLimit)notes.push(showLimit?`Dashed blue: ${fmt(target)} ${m.unit} requirement.`:`${fmt(target)} ${m.unit} requirement is ${target>high?'above':'below'} the plotted range.`);
  if(samples.some(s=>!s.valid))notes.push(current.job?'Dashed gray: outside the machine envelope.':current.id==='autoinjector'?'Dashed gray: outside the assumed laminar-flow range.':'Dashed gray: outside the liquid-water model.');
  $('plot-note').textContent=notes.join(' ');
  $('plot-note').hidden=notes.length===0;
}
function showLocalResponse(){
  const p=current.params.find(def=>def.key===sweepKey),m=result.metrics[sweepIndex];
  const probe=perturbation(current,params,sweepKey,sweepIndex);
  const delta=probe.after-probe.before;
  $('local-response').textContent=`Changing ${p.label.toLowerCase()} from ${fmt(probe.from,3)} to ${fmt(probe.to,3)} ${p.unit} changes ${m.label.toLowerCase()} by ${delta>0?'+':''}${fmt(delta,3)} ${m.unit==='%'?'percentage points':m.unit}.`;
}
function update(){result=current.calc(params);account=engineering(current,params,result);showResults();showAccount();showRequirement();chart();showLocalResponse();showEquations();showJobSummary();}
function load(id,readHash=false){
  const source=allSystems.find(s=>s.id===id)||systems[0];
  const file=files[source.id],query=new URLSearchParams(location.hash.split('?')[1]||'');
  if(readHash&&file&&query.get('mode')==='file'){
    file.enabled=true;
    if(laserMaterials[query.get('material')])file.material=query.get('material');
  }
  current=file?.enabled?jobSystem(source,file.job,file.material):source;
  stateKey=current.job?`${current.id}:file:${file.sequence}`:current.id;
  const lesson=lessonFor(current);
  const needsFile=readHash&&current.id===id&&query.get('mode')==='file'&&!current.job;
  if(needsFile)pendingFileSettings[current.id]=query;
  params={...(designs[stateKey]||defaults(current))};target=targets[stateKey]??lesson.criterion.target;
  if(readHash&&!needsFile&&current.id===id){const q=new URLSearchParams(location.hash.split('?')[1]||'');for(const p of current.params){if(q.has(p.key)){const value=Number(q.get(p.key));if(Number.isFinite(value))params[p.key]=normalize(p,value);}}if(q.has('limit')){const value=Number(q.get('limit'));if(Number.isFinite(value)&&value>=0&&value<=(lesson.criterion.maxTarget??1e9))target=value;}}
  references[stateKey]??={params:defaults(current),result:current.calc(defaults(current)),material:current.material};
  designs[stateKey]={...params};targets[stateKey]=target;sweepKey=lesson.sweep[0];sweepIndex=lesson.sweep[1];result=current.calc(params);
  $('system-name').textContent=current.title;$('number').textContent=weekFor(current.id)?String(weekFor(current.id).week).padStart(2,'0'):'+';$('claim').textContent=lesson.claim;$('problem').textContent=lesson.problem;document.title=`${current.title} · 24-101`;
  const week=weekFor(current.id);
  $('course-context').textContent=week?`Week ${week.week} · Project ${week.project} · ${week.meeting?dateLabel(week.meeting):'Make-up date TBD'}`:'Further exploration';
  $('monday-plan').hidden=!week;
  if(week){
    $('demonstration').textContent=week.demo;
    $('design-considerations').textContent=week.design;
    $('coverage').textContent=week.coverage.map(key=>areas[key]).join(' · ');
    $('wednesday-method').textContent=`Wednesday, ${dateLabel(week.wednesday)}: ${week.method}. ${week.deliverable}`;
    $('project-transfer').textContent=week.transfer;
  }
  const schedule=week?.id==='buggy'?`Monday immediately before Spring Carnival · ${dateLabel(week.meeting)}, ${week.meeting.slice(0,4)}`:current.schedule;
  $('schedule').hidden=!schedule;$('schedule').textContent=schedule||'';
  $('physics-topics').textContent=current.physics;$('assumptions').textContent=current.assumptions;$('cmu').textContent=current.cmu;$('physics-connection').textContent=connections[current.id]||lesson.interpretation;$('prompt').textContent=current.prompt;
  $('sources').innerHTML=current.sources.map(([label,url])=>`<a href="${url}" target="_blank" rel="noopener">${label}</a>`).join('');
  $('system-select').value=current.id;
  for(const button of document.querySelectorAll('[data-system]')){
    if(button.dataset.system===current.id)button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
  }
  controls();
  update();
  cancelAnimationFrame(modelFrame);
  modelFrame=0;
  syncFileUI();
  showVisualNote();
  buildModel(true);
  if(needsFile)fileStatus('Load the same file to apply the shared job settings.');
}
function showEquations(){$('equations').innerHTML=result.equations.map(e=>`<article class="equation"><div class="eq-name">${e.name}</div><div class="formula">${e.formula}</div><p class="substitution">${e.substitution}</p></article>`).join('');}
function normalize(p,value){return Math.min(p.max,Math.max(p.min,p.integer?Math.round(value):value));}
function refreshModel(){
  if(!viewer||modelFrame)return;
  modelFrame=requestAnimationFrame(()=>{modelFrame=0;buildModel(false);});
}
function showVisualNote(key){
  const guide=visualGuides[current.id];
  if(current.job){
    const printer=current.id==='printer',cues=printer?{speed:'Blue arrow: feed override. Nominal playback timing uses the adjusted feeds.',flow:'Enlarged cursor area: extrusion override. The sliced paths remain fixed.',temp:'Cursor color: nozzle temperature. Heating demand updates with the material throughput.'}:{speed:'Blue arrow: cut speed. Nominal job time changes with travel speed.',power:'Cursor color: optical power. Compare absorbed energy with the removal demand.',thick:'Stock depth shows material thickness. The imported outline remains fixed.',kerf:'Enlarged cursor width shows the kerf assumption. Compare the resulting removal demand.'};
    $('model-note').textContent=cues[key]||'Blue: feed setting. Red: heater or absorbed optical power. Enlarged cursor: temperature and extrusion/kerf; paths follow the file.';
  }else $('model-note').textContent=guide?.[key]||guide?.summary||'Schematic motion; calculations retain physical units.';
}
function change(input,commit=false){
  const key=input.dataset.key,p=current.params.find(def=>def.key===key);
  if(!p)return;
  const value=input.valueAsNumber;
  const inRange=value>=p.min&&value<=p.max&&(!p.integer||Number.isInteger(value));
  if(Number.isFinite(value)&&(commit||inRange)){
    const next=normalize(p,value);
    if(next!==params[key]){
      params[key]=next;
      designs[stateKey]={...params};
      $(`range-${key}`).value=next;
      if(input.type==='range')$(`number-${key}`).value=next;
      update();
      refreshModel();
      showVisualNote(key);
    }
  }
  if(commit){
    if(input.type==='number')input.value=params[key];
    announce();
  }
}
function announce(){
  const m=result.metrics[lessonFor(current).criterion.metric];
  $('result-announcement').textContent=`${m.label}: ${fmt(m.value)} ${m.unit}. ${$('requirement-status').textContent}.`;
}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2200);}
function designURL(){const q=new URLSearchParams({...params,limit:target,...(current.job?{mode:'file',material:current.material||'pla'}:{})});return`${location.origin}${location.pathname}#${current.id}?${q}`;}

function buildModel(reset){
  if(!viewer)return;
  if(current.job)viewer.buildJob(current.job,params,current.material,reset);
  else viewer.build(current.id,params,reset);
  playbackLabel();
}
function fileStatus(message,error=false){
  $('file-status').textContent=message;
  $('file-status').dataset.error=String(error);
  $('file-status').hidden=!message;
}
function syncFileUI(){
  const supported=Boolean(machines[current.id]),job=current.job;
  $('fabrication').hidden=!supported;
  $('job-playback').hidden=!job;
  $('machine-view').hidden=!job;
  $('job-mechanism').hidden=!files[current.id];
  $('job-mechanism').textContent=job?'Mechanism':'Loaded job';
  $('job-center').hidden=!job||current.id!=='laser';
  $('stock-label').hidden=!job||current.id!=='laser';
  $('machine-details').hidden=!supported;
  $('model-caption').textContent=supported?machines[current.id].name+(job?' · gray planned path, red completed path':' · schematic geometry and motion'):'Schematic geometry and motion';
  $('camera').textContent=job?'Fit job':'Reset view';
  if(!supported)return;
  $('file-label').textContent=current.id==='printer'?'Load G-code':'Load SVG / DXF';
  $('job-file').accept=current.id==='printer'?'.gcode,.gco,.gc':'.svg,.dxf';
  $('job-file').value='';
  $('job-example').innerHTML='<option value="" disabled>Choose a part…</option>'+exampleParts[current.id].map(part=>`<option value="${part.file}">${part.label}</option>`).join('');
  $('job-example').value=job?.exampleFile||'';
  $('machine-details').textContent=machines[current.id].detail;
  $('job-material').value=current.material||'acrylic';
  const dimensions=job?.bounds.max.map((max,axis)=>fmt(max-job.bounds.min[axis]));
  fileStatus(job?`${job.name} · ${dimensions.slice(0,current.id==='printer'?3:2).join(' × ')} mm path`:'');
}
function showJobSummary(){
  const job=current.job;
  $('job-summary').hidden=!job;
  $('job-notes').hidden=!job;
  if(!job)return;
  const dimensions=job.bounds.max.map((max,axis)=>fmt(max-job.bounds.min[axis]));
  $('job-summary').textContent=current.id==='printer'
    ? `${job.name} · ${job.layers.length} deposition heights · ${dimensions.join(' × ')} mm · ${fmt(job.filament*Math.PI*1.75**2/4*.00124*params.flow/100)} g PLA`
    : `${job.name} · ${dimensions.slice(0,2).join(' × ')} mm · ${fmt(job.cutLength)} mm of cuts · ${laserMaterials[current.material].label}`;
  $('job-notes').textContent=[...job.warnings,'Time is based on commanded constant feed. Preview settings apply to this simulation.'].join(' ');
}
function clockText(seconds){
  const rounded=Math.max(0,Math.floor(seconds));
  return `${Math.floor(rounded/60)}:${String(rounded%60).padStart(2,'0')}`;
}
function showJobProgress(progress,elapsed,duration,height){
  if(!current.job)return;
  if(document.activeElement!==$('job-seek'))$('job-seek').value=Math.round(progress*1000);
  const layer=current.id==='printer'?` · Z ${fmt(height)} mm`:'';
  $('job-clock').textContent=`${clockText(elapsed)} / ${clockText(duration)}${layer}`;
  $('job-seek').setAttribute('aria-valuetext',$('job-clock').textContent);
  playbackLabel();
}
function parseInWorker(text,kind){
  parserWorker?.terminate();
  const worker=new Worker(new URL('./fabrication-worker.js?v=1.6.2',import.meta.url),{type:'module'});
  parserWorker=worker;
  return new Promise((resolve,reject)=>{
    worker.onmessage=({data})=>{worker.terminate();if(parserWorker===worker)parserWorker=null;data.error?reject(new Error(data.error)):resolve(data.job);};
    worker.onerror=()=>{worker.terminate();reject(new Error('The file parser could not complete. Try a smaller exported job.'));};
    worker.postMessage({text,kind});
  });
}
async function loadJob(file,id=current.id,exampleFile=null){
  const sequence=++loadSequence;
  try{
    if(!file||file.size>maxFileBytes)throw new Error('Choose a file up to 20 MB.');
    if(current.id===id){
      fileStatus('Reading toolpath…');
      $('fabrication').setAttribute('aria-busy','true');
    }
    const extension=file.name.split('.').at(-1).toLowerCase();
    if(id==='printer'&&!['gcode','gco','gc'].includes(extension))throw new Error('Slice the model using the Cura Ender-3 profile, then load the exported .gcode file.');
    if(id==='laser'&&!['svg','dxf'].includes(extension))throw new Error('Export the cutting outlines as a millimeter-scale SVG or DXF.');
    const text=await file.text();
    let job;
    if(extension==='svg'){
      if(file.size>2*1024*1024)throw new Error('Simplify the SVG to under 2 MB before previewing.');
      const {parseSVG}=await import('./fabrication-svg.js?v=1.6.2');
      job=parseSVG(text);
    }else job=await parseInWorker(text,id);
    if(sequence!==loadSequence)return;
    job.name=file.name;
    job.exampleFile=exampleFile;
    const saved=pendingFileSettings[id];
    const material=laserMaterials[saved?.get('material')]?saved.get('material'):'acrylic';
    files[id]={job,material,enabled:true,sequence:++fileSequence};
    const effective=jobSystem(systems.find(s=>s.id===id),job,material);
    const key=`${id}:file:${files[id].sequence}`,values=defaults(effective);
    if(saved){
      for(const p of effective.params)if(saved.has(p.key)){
        const value=Number(saved.get(p.key));
        if(Number.isFinite(value))values[p.key]=normalize(p,value);
      }
      const limit=Number(saved.get('limit'));
      if(saved.has('limit')&&Number.isFinite(limit)&&limit>=0&&limit<=1e9)targets[key]=limit;
      delete pendingFileSettings[id];
    }
    designs[key]=values;
    if(current.id===id)load(id);
  }catch(error){
    if(sequence===loadSequence&&current.id===id){
      fileStatus(error.message,true);
      $('job-example').value=current.job?.exampleFile||'';
    }
  }finally{
    if(sequence===loadSequence){
      $('fabrication').removeAttribute('aria-busy');
      if(current.id===id)$('job-file').value='';
    }
  }
}
$('job-file').addEventListener('change',e=>{if(e.target.files[0])loadJob(e.target.files[0]);});
$('job-example').addEventListener('change',async e=>{
  const id=current.id,part=exampleParts[id].find(part=>part.file===e.target.value);
  if(!part)return;
  const request=++loadSequence;
  fileStatus('Loading example…');
  try{
    const response=await fetch(new URL('./examples/'+part.file,import.meta.url));
    if(!response.ok)throw new Error('The example could not be loaded.');
    const text=await response.text();
    if(request!==loadSequence)return;
    await loadJob(new File([text],part.file,{type:'text/plain'}),id,part.file);
  }catch(error){
    if(request===loadSequence&&current.id===id){
      fileStatus(error.message,true);
      $('job-example').value=current.job?.exampleFile||'';
    }
  }
});
$('job-mechanism').addEventListener('click',()=>{files[current.id].enabled=!current.job;load(current.id);});
$('job-material').addEventListener('change',e=>{files[current.id].material=e.target.value;load(current.id);});
$('job-center').addEventListener('click',()=>{
  const job=current.job,area=machines.laser.area;
  const shift=job.bounds.min.map((min,axis)=>(area[axis]-(job.bounds.max[axis]-min))/2-min);
  const segments=[];
  let previous=[0,0,0];
  for(const segment of job.segments){
    const from=segment.from.map((v,i)=>v+shift[i]),to=segment.to.map((v,i)=>v+shift[i]);
    if(segment.active&&from.some((v,i)=>Math.abs(v-previous[i])>1e-8))segments.push({from:previous,to:from,active:false});
    segments.push({...segment,from:segment.active?from:previous,to});
    previous=to;
  }
  files[current.id].job=finishJob('laser',segments,{name:job.name,warnings:job.warnings,exampleFile:job.exampleFile});
  load(current.id);
});
$('job-seek').addEventListener('input',e=>{viewer?.setPlaying(false);viewer?.setProgress(Number(e.target.value)/1000);playbackLabel();});
$('job-rate').addEventListener('change',e=>viewer?.setRate(Number(e.target.value)));
$('machine-view').addEventListener('click',()=>viewer?.machineView(current.id));

$('system-list').addEventListener('click',e=>{const button=e.target.closest('[data-system]');if(button)location.hash=button.dataset.system;});
$('system-select').addEventListener('change',e=>{location.hash=e.target.value;});
$('parameters').addEventListener('input',e=>change(e.target));
$('parameters').addEventListener('change',e=>change(e.target,true));
$('parameters').addEventListener('focusout',e=>{
  const input=e.target;
  if(input.type==='number'&&input.valueAsNumber!==params[input.dataset.key])change(input,true);
});
const evidence=document.querySelector('.evidence');
const switches=document.querySelectorAll('.evidence-switch button');
for(const button of switches){
  button.addEventListener('click',()=>{
    evidence.dataset.view=button.dataset.view;
    for(const other of switches)other.setAttribute('aria-pressed',String(other===button));
    chart();
  });
}
$('reset').addEventListener('click',()=>{
  params=defaults(current);
  designs[stateKey]={...params};
  controls();
  update();
  refreshModel();
  showVisualNote();
  announce();
});
$('baseline').addEventListener('click',()=>{references[stateKey]={params:{...params},result:current.calc(params),material:current.material};showResults();toast('Reference updated.');});
$('sweep-input').addEventListener('change',e=>{sweepKey=e.target.value;chart();showLocalResponse();});
$('sweep-output').addEventListener('change',e=>{sweepIndex=Number(e.target.value);chart();showLocalResponse();});
$('requirement-limit').addEventListener('input',e=>{const value=e.target.valueAsNumber;if(Number.isFinite(value)&&e.target.validity.valid){target=value;targets[stateKey]=value;showRequirement();chart();}});
$('requirement-limit').addEventListener('change',e=>{e.target.value=target;announce();});
$('requirement-limit').addEventListener('blur',e=>{if(e.target.valueAsNumber!==target)e.target.value=target;});
$('play').addEventListener('click',()=>{if(viewer){viewer.setPlaying(!viewer.playing);playbackLabel();}});
$('restart').addEventListener('click',()=>viewer?.restart());
$('parameters').addEventListener('focusin',e=>{if(e.target.dataset.key)showVisualNote(e.target.dataset.key);});
$('camera').addEventListener('click',()=>viewer?.resetCamera(current.id));
$('cutaway').addEventListener('change',e=>viewer?.setCutaway(e.target.checked));
$('share').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(designURL());toast(current.job?'Settings link copied. Load the same file to restore the job.':'Design link copied.');}catch{const input=document.createElement('textarea');input.value=designURL();document.body.append(input);input.select();const ok=document.execCommand('copy');input.remove();toast(ok?'Design link copied.':'Clipboard unavailable. The selected system is in the address bar.');}});
$('csv').addEventListener('click',()=>{const p=current.params.find(p=>p.key===sweepKey),m=result.metrics[sweepIndex],quote=v=>'"'+String(v).replaceAll('"','""')+'"';const csv=[`${quote(p.label+' ('+p.unit+')')},${quote(m.label+' ('+m.unit+')')},within_model_assumptions`,...samples.map(s=>`${s.x},${s.y},${s.valid}`)].join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'})),link=document.createElement('a');link.href=url;link.download=`${current.id}-${sweepKey}-study.csv`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
function hashSystem(){return location.hash.slice(1).split('?')[0];}
window.addEventListener('hashchange',()=>{
  const id=hashSystem();
  if(!id||allSystems.some(s=>s.id===id)){
    load(id||'laser',true);
    window.scrollTo(0,0);
  }
});
navigation();
load(hashSystem()||'laser',true);
const chartObserver=new ResizeObserver(chart);
chartObserver.observe($('chart'));
const evidenceObserver=new ResizeObserver(entries=>{
  document.documentElement.style.setProperty('--evidence-height',entries[0].contentRect.height+'px');
});
evidenceObserver.observe(document.querySelector('.live-evidence'));
window.mechELab={systems,get current(){return current;},get params(){return{...params};},get result(){return result;},get account(){return account;},get target(){return target;},get frames(){return viewer?.frames||0;}};
