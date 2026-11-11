import {systems, defaults, fmt} from './systems.js?v=1.3.1';
import {lessons, engineering, requirement, perturbation} from './engineering.js?v=1.3.1';
import {createViewer} from './models.js?v=1.3.1';

const $=id=>document.getElementById(id);
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
  bicycle:'Torque and angular speed determine rotational power. Rolling without slipping relates wheel angular speed to travel speed.',
  buggy:'Newton’s laws, gravitational potential energy, kinetic energy and resistance forces explain freeroll.',
  racecar:'Newton’s laws, friction and kinetic energy explain acceleration. P = Fv relates power to available driving force.'
};

let current=systems[0],params=defaults(current),result,account;
let sweepKey=lessons[current.id].sweep[0],sweepIndex=lessons[current.id].sweep[1],target=lessons[current.id].criterion.target;
const designs={},references={},targets={};let samples=[],sampleKey,modelFrame;
const viewer=createViewer($('viewport'),error=>{
  $('loading').hidden=false;
  $('loading').textContent=`The 3D model needs WebGL. ${error.message} Inputs, equations and calculations remain available.`;
});
if(viewer)$('loading').hidden=true;
else for(const id of ['play','camera','cutaway'])$(id).disabled=true;
function playbackLabel(){if(!viewer)return;$('play').textContent=viewer.playing?'Pause motion':'Play motion';$('play').setAttribute('aria-label',viewer.playing?'Pause animation':'Play animation');}
playbackLabel();

function navigation(){
  let category='';
  $('system-list').innerHTML=systems.map((s,i)=>{
    let heading='';if(s.category!==category){category=s.category;heading=`<div class="nav-group">${category}</div>`;}
    return`${heading}<button class="nav-item" data-system="${s.id}" ${s.id===current.id?'aria-current="page"':''}><span class="nav-number">${String(i+1).padStart(2,'0')}</span>${s.title}</button>`;
  }).join('');
  $('system-select').innerHTML=systems.map((s,i)=>`<option value="${s.id}">${i+1}. ${s.title}</option>`).join('');
}
function controls(){
  const lesson=lessons[current.id];
  $('parameters').innerHTML=current.params.map(p=>`<div class="parameter"><div class="param-head"><label for="range-${p.key}">${p.label}</label><div class="param-value"><input id="number-${p.key}" data-key="${p.key}" type="number" min="${p.min}" max="${p.max}" step="${p.step}" value="${params[p.key]}" aria-label="${p.label}" aria-describedby="help-${p.key}"><span class="param-unit">${p.unit}</span></div></div><input class="range" id="range-${p.key}" data-key="${p.key}" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${params[p.key]}" aria-describedby="help-${p.key}"><span class="sr-only" id="help-${p.key}">${p.unit} ${p.help}</span></div>`).join('');
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
  const reference=references[current.id];
  $('metrics').innerHTML=result.metrics.map((m,i)=>{
    const ref=reference.result.metrics[i].value,difference=m.value-ref;
    const absolute=['°C','K','%'].includes(m.unit)||Math.abs(ref)<1e-10;
    const change=absolute?`${difference>0?'+':''}${fmt(difference)} ${m.unit==='%'?'pp':m.unit}`:`${difference>0?'+':''}${fmt(100*difference/Math.abs(ref),1)}%`;
    return`<div class="metric"><div class="metric-label">${m.label}</div><div class="metric-value">${fmt(m.value)}<small>${m.unit}${account.valid?'':' †'}</small></div><div class="metric-reference">Ref. ${fmt(ref)}${Math.abs(difference)>1e-8?`<span class="metric-delta changed" aria-label="Change from reference: ${change}">${change}</span>`:''}</div></div>`;
  }).join('');
  $('reference-inputs').textContent='Reference inputs: '+current.params.map(p=>`${p.label.toLowerCase()} ${fmt(reference.params[p.key],3)} ${p.unit}`).join('; ')+'.';
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
  const key=JSON.stringify([current.id,sweepKey,sweepIndex,...current.params.filter(def=>def.key!==sweepKey).map(def=>params[def.key])]);
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
  const compareLimit=sweepIndex===lessons[current.id].criterion.metric,showLimit=compareLimit&&target>=low&&target<=high;
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
  if(samples.some(s=>!s.valid))notes.push('Dashed gray: outside the liquid-water model.');
  $('plot-note').textContent=notes.join(' ');
  $('plot-note').hidden=notes.length===0;
}
function showLocalResponse(){
  const p=current.params.find(def=>def.key===sweepKey),m=result.metrics[sweepIndex];
  const probe=perturbation(current,params,sweepKey,sweepIndex);
  const delta=probe.after-probe.before;
  $('local-response').textContent=`Changing ${p.label.toLowerCase()} from ${fmt(probe.from,3)} to ${fmt(probe.to,3)} ${p.unit} changes ${m.label.toLowerCase()} by ${delta>0?'+':''}${fmt(delta,3)} ${m.unit==='%'?'percentage points':m.unit}.`;
}
function update(){result=current.calc(params);account=engineering(current,params,result);showResults();showAccount();showRequirement();chart();showLocalResponse();showEquations();}
function load(id,readHash=false){
  current=systems.find(s=>s.id===id)||systems[0];const lesson=lessons[current.id];
  params={...(designs[current.id]||defaults(current))};target=targets[current.id]??lesson.criterion.target;
  if(readHash&&current.id===id){const q=new URLSearchParams(location.hash.split('?')[1]||'');for(const p of current.params){if(q.has(p.key)){const value=Number(q.get(p.key));if(Number.isFinite(value))params[p.key]=normalize(p,value);}}if(q.has('limit')){const value=Number(q.get('limit'));if(Number.isFinite(value)&&value>=0&&value<=(lesson.criterion.maxTarget??1e9))target=value;}}
  references[current.id]??={params:defaults(current),result:current.calc(defaults(current))};
  designs[current.id]={...params};targets[current.id]=target;sweepKey=lesson.sweep[0];sweepIndex=lesson.sweep[1];result=current.calc(params);
  $('system-name').textContent=current.title;$('number').textContent=String(systems.indexOf(current)+1).padStart(2,'0');$('claim').textContent=lesson.claim;$('problem').textContent=lesson.problem;document.title=`${current.title} · 24-101`;
  $('schedule').hidden=!current.schedule;$('schedule').textContent=current.schedule||'';
  $('physics-topics').textContent=current.physics;$('assumptions').textContent=current.assumptions;$('cmu').textContent=current.cmu;$('physics-connection').textContent=connections[current.id];$('prompt').textContent=current.prompt;
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
  viewer?.build(current.id,params,true);
}
function showEquations(){$('equations').innerHTML=result.equations.map(e=>`<article class="equation"><div class="eq-name">${e.name}</div><div class="formula">${e.formula}</div><p class="substitution">${e.substitution}</p></article>`).join('');}
function normalize(p,value){return Math.min(p.max,Math.max(p.min,p.integer?Math.round(value):value));}
function refreshModel(){
  if(!viewer||modelFrame)return;
  modelFrame=requestAnimationFrame(()=>{modelFrame=0;viewer.build(current.id,params,false);});
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
      designs[current.id]={...params};
      $(`range-${key}`).value=next;
      if(input.type==='range')$(`number-${key}`).value=next;
      update();
      refreshModel();
    }
  }
  if(commit){
    if(input.type==='number')input.value=params[key];
    announce();
  }
}
function announce(){
  const m=result.metrics[lessons[current.id].criterion.metric];
  $('result-announcement').textContent=`${m.label}: ${fmt(m.value)} ${m.unit}. ${$('requirement-status').textContent}.`;
}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2200);}
function designURL(){const q=new URLSearchParams({...params,limit:target});return`${location.origin}${location.pathname}#${current.id}?${q}`;}

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
  designs[current.id]={...params};
  controls();
  update();
  refreshModel();
  announce();
});
$('baseline').addEventListener('click',()=>{references[current.id]={params:{...params},result:current.calc(params)};showResults();toast('Reference updated.');});
$('sweep-input').addEventListener('change',e=>{sweepKey=e.target.value;chart();showLocalResponse();});
$('sweep-output').addEventListener('change',e=>{sweepIndex=Number(e.target.value);chart();showLocalResponse();});
$('requirement-limit').addEventListener('input',e=>{const value=e.target.valueAsNumber;if(Number.isFinite(value)&&e.target.validity.valid){target=value;targets[current.id]=value;showRequirement();chart();}});
$('requirement-limit').addEventListener('change',e=>{e.target.value=target;announce();});
$('requirement-limit').addEventListener('blur',e=>{if(e.target.valueAsNumber!==target)e.target.value=target;});
$('play').addEventListener('click',()=>{if(viewer){viewer.setPlaying(!viewer.playing);playbackLabel();}});
$('camera').addEventListener('click',()=>viewer?.resetCamera(current.id));
$('cutaway').addEventListener('change',e=>viewer?.setCutaway(e.target.checked));
$('share').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(designURL());toast('Design link copied.');}catch{const input=document.createElement('textarea');input.value=designURL();document.body.append(input);input.select();const ok=document.execCommand('copy');input.remove();toast(ok?'Design link copied.':'Clipboard unavailable. The selected system is in the address bar.');}});
$('csv').addEventListener('click',()=>{const p=current.params.find(p=>p.key===sweepKey),m=result.metrics[sweepIndex],quote=v=>'"'+String(v).replaceAll('"','""')+'"';const csv=[`${quote(p.label+' ('+p.unit+')')},${quote(m.label+' ('+m.unit+')')},within_model_assumptions`,...samples.map(s=>`${s.x},${s.y},${s.valid}`)].join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'})),link=document.createElement('a');link.href=url;link.download=`${current.id}-${sweepKey}-study.csv`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
function hashSystem(){return location.hash.slice(1).split('?')[0];}
window.addEventListener('hashchange',()=>{
  const id=hashSystem();
  if(!id||systems.some(s=>s.id===id)){
    load(id||'printer',true);
    window.scrollTo(0,0);
  }
});
navigation();
load(hashSystem()||'printer',true);
const chartObserver=new ResizeObserver(chart);
chartObserver.observe($('chart'));
window.mechELab={systems,get current(){return current;},get params(){return{...params};},get result(){return result;},get account(){return account;},get target(){return target;},get frames(){return viewer?.frames||0;}};
