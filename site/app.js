import {systems, defaults, fmt} from './systems.js';
import {lessons, engineering, requirement, perturbation} from './engineering.js';
import {createViewer} from './models.js';

const $=id=>document.getElementById(id);
const connections={
  printer:'Temperature, heat and energy conservation connect the deposited volume to a required heating rate.',
  laser:'Power is energy per time. Dividing power by travel speed gives energy per length.',
  heatpump:'Absolute temperature, heat engines, refrigerators, and the first and second laws set performance limits.',
  espresso:'Heat capacity sets the stored energy. Pressure produces force; pressure times volume flow gives hydraulic power.',
  otto:'Thermodynamic processes, equations of state and the first law explain the ideal cycle.',
  turbine:'Energy conservation accounts for the compressor work, turbine work and heat exchange.',
  steam:'Heat-engine efficiency and the second law bound useful work. Heat capacity determines the cooling-water flow.',
  wind:'Kinetic energy, mass flow, torque and angular velocity connect the wind to shaft power.',
  solar:'Heat capacity and the first law set the storage balance. The exponential response extends the course concepts with a differential equation.',
  battery:'Heat capacity and energy conservation explain the thermal response. Current, voltage and Joule heating extend into 33-142.',
  datacenter:'Heat capacity and energy conservation connect heat rate, mass flow and temperature rise. The fan system curve extends into fluid mechanics.',
  fuelcell:'Energy conservation relates fuel energy and electrical work. Charge balance and cell voltage extend beyond Physics I.',
  buggy:'Newton’s laws, gravitational potential energy, kinetic energy and resistance forces explain freeroll.',
  racecar:'Newton’s laws, friction and kinetic energy explain acceleration. P = Fv relates power to available driving force.'
};

let current=systems[0],params=defaults(current),result,account,tab='inputs';
let sweepKey=lessons[current.id].sweep[0],sweepIndex=lessons[current.id].sweep[1],target=lessons[current.id].criterion.target;
const designs={},references={},targets={};let samples=[];
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
}
function controls(){
  const lesson=lessons[current.id];
  $('parameters').innerHTML=current.params.map(p=>`<div class="parameter"><div class="param-head"><label for="range-${p.key}">${p.label}</label><div class="param-value"><input id="number-${p.key}" data-key="${p.key}" type="number" min="${p.min}" max="${p.max}" step="${p.step}" value="${params[p.key]}" aria-label="${p.label}" aria-describedby="help-${p.key}"><span class="param-unit">${p.unit}</span></div></div><div class="param-role">${lesson.roles[p.key]}</div><input class="range" id="range-${p.key}" data-key="${p.key}" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${params[p.key]}" aria-describedby="help-${p.key}"><p class="param-help" id="help-${p.key}">${p.help}</p></div>`).join('');
  $('sweep-input').innerHTML=current.params.map(p=>`<option value="${p.key}">${p.label}${p.unit?` (${p.unit})`:''}</option>`).join('');
  $('sweep-input').value=sweepKey;
  $('sweep-output').innerHTML=result.metrics.map((m,i)=>`<option value="${i}">${m.label} (${m.unit})</option>`).join('');
  $('sweep-output').value=sweepIndex;
  const c=lesson.criterion;
  $('requirement-label').textContent=c.label;
  $('requirement-relation').textContent=c.sense==='max'?'≤':'≥';
  $('requirement-limit').value=target;
  $('requirement-unit').textContent=result.metrics[c.metric].unit;
}
function showResults(){
  const reference=references[current.id];
  $('metrics').innerHTML=result.metrics.map((m,i)=>{
    const ref=reference.result.metrics[i].value,difference=m.value-ref;
    const isTemperature=m.unit==='°C'||m.unit==='K';
    const change=isTemperature||Math.abs(ref)<1e-10?`${difference>0?'+':''}${fmt(difference)} ${m.unit}`:`${difference>0?'+':''}${fmt(100*difference/Math.abs(ref),1)}%`;
    return`<div class="metric"><div class="metric-label">${m.label}</div><div class="metric-value">${fmt(m.value)}<small>${m.unit}${account.valid?'':' †'}</small></div><div class="metric-reference">Reference: ${fmt(ref)} ${m.unit}</div><div class="metric-delta ${Math.abs(difference)>1e-8?'changed':''}">${Math.abs(difference)>1e-8?change:'No change'}</div></div>`;
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
  const [label,url]=current.sources[0];$('balance-source').innerHTML=`General principle: <a href="${url}" target="_blank" rel="noopener">${label}</a>. Model-specific constants and assumptions are in the Physics tab.`;
}
function showRequirement(){
  const status=requirement(current,result,target,account.valid),node=$('requirement-status');
  node.dataset.met=String(status.met);node.dataset.valid=String(status.valid);
  node.textContent=!status.valid?'Outside model applicability':status.met?'Requirement met within this model':'Requirement not met';
  $('requirement-margin').textContent=!status.valid?'Return to the model’s valid range before comparing this design with the requirement.':`${status.margin>=0?'Margin':'Shortfall'}: ${fmt(Math.abs(status.margin))} ${status.unit}. Current response: ${fmt(status.actual)} ${status.unit}.`;
}
function chart(){
  const p=current.params.find(p=>p.key===sweepKey),m=result.metrics[sweepIndex];samples=[];
  for(let i=0;i<=60;i++){
    const x=p.min+(p.max-p.min)*i/60,values={...params,[p.key]:x},r=current.calc(values),a=engineering(current,values,r);
    samples.push({x,y:r.metrics[sweepIndex].value,valid:a.valid});
  }
  const ys=samples.map(v=>v.y),showLimit=sweepIndex===lessons[current.id].criterion.metric;
  if(showLimit)ys.push(target);
  let low=Math.min(...ys),high=Math.max(...ys),span=high-low;
  if(span<1e-10){span=Math.max(Math.abs(high)*.15,1);low-=span*.5;high+=span*.5;}
  else{low-=span*.08;high+=span*.12;}
  if(Math.min(...ys)>=0)low=Math.max(0,low);
  const width=Math.max(320,Math.min(760,$('chart').clientWidth||760)),right=width-22,mid=(74+right)/2;
  $('chart').setAttribute('viewBox',`0 0 ${width} 320`);
  const X=x=>74+((x-p.min)/(p.max-p.min))*(right-74),Y=y=>250-((y-low)/(high-low))*220;
  let svg='';
  const tick=v=>Math.abs(v)<.001&&v!==0?v.toExponential(1):fmt(v,Math.abs(high-low)<1?3:1);
  for(let i=0;i<=4;i++){const y=low+(high-low)*i/4;svg+=`<line class="chart-grid" x1="74" x2="${right}" y1="${Y(y)}" y2="${Y(y)}"/><text class="chart-label" x="62" y="${Y(y)+4}" text-anchor="end">${tick(y)}</text>`;}
  for(let i=0;i<=4;i++){const x=p.min+(p.max-p.min)*i/4;svg+=`<text class="chart-label" x="${X(x)}" y="273" text-anchor="middle">${fmt(x,3)}</text>`;}
  if(showLimit)svg+=`<line class="chart-limit" x1="74" x2="${right}" y1="${Y(target)}" y2="${Y(target)}"/><text class="chart-limit-label" x="${right-2}" y="${Y(target)-7}" text-anchor="end">Requirement: ${fmt(target)} ${m.unit}</text>`;
  for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i];svg+=`<path class="chart-line ${a.valid&&b.valid?'':'invalid'}" d="M${X(a.x)},${Y(a.y)} L${X(b.x)},${Y(b.y)}"/>`;}
  const cx=X(params[p.key]),cy=Y(m.value);
  svg+=`<line class="chart-guide" x1="${cx}" x2="${cx}" y1="${cy}" y2="250"/><circle class="chart-point ${account.valid?'':'invalid'}" cx="${cx}" cy="${cy}" r="5"><title>Current design: ${fmt(params[p.key],3)} ${p.unit}; ${fmt(m.value)} ${m.unit}</title></circle>`;
  svg+=`<text class="chart-axis-label" x="${mid}" y="306" text-anchor="middle">${p.label}${p.unit?` (${p.unit})`:''}</text><text class="chart-axis-label" transform="translate(16 140) rotate(-90)" text-anchor="middle">${m.label} (${m.unit})</text>`;
  if(samples.some(s=>!s.valid))svg+='<text class="chart-label" x="74" y="15">Dashed gray: outside liquid-water model</text>';
  $('chart').innerHTML=svg;
  $('chart').setAttribute('aria-label',`${m.label} in ${m.unit} versus ${p.label} from ${p.min} to ${p.max} ${p.unit}. Current response ${fmt(m.value)} ${m.unit}.${showLimit?` Requirement ${target} ${m.unit}.`:''}`);
  const probe=perturbation(current,params,sweepKey,sweepIndex);
  const delta=probe.after-probe.before;
  $('local-response').textContent=`Changing ${p.label.toLowerCase()} from ${fmt(probe.from,3)} to ${fmt(probe.to,3)} ${p.unit} changes ${m.label.toLowerCase()} by ${delta>0?'+':''}${fmt(delta,3)} ${m.unit}.`;
}
function update(){result=current.calc(params);account=engineering(current,params,result);showResults();showAccount();showRequirement();chart();}
function setTab(name,focus=false){tab=name;for(const button of document.querySelectorAll('[data-tab]')){const active=button.dataset.tab===name;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;$(`panel-${button.dataset.tab}`).hidden=!active;}if(focus)$(`tab-${name}`).focus();}
function load(id,readHash=false){
  current=systems.find(s=>s.id===id)||systems[0];const lesson=lessons[current.id];
  params={...(designs[current.id]||defaults(current))};target=targets[current.id]??lesson.criterion.target;
  if(readHash){const q=new URLSearchParams(location.hash.split('?')[1]||'');for(const p of current.params){if(q.has(p.key)){const value=Number(q.get(p.key));if(Number.isFinite(value))params[p.key]=Math.min(p.max,Math.max(p.min,value));}}if(q.has('limit')){const value=Number(q.get('limit'));if(Number.isFinite(value)&&value>=0&&value<=1e9)target=value;}}
  references[current.id]??={params:defaults(current),result:current.calc(defaults(current))};
  designs[current.id]={...params};targets[current.id]=target;sweepKey=lesson.sweep[0];sweepIndex=lesson.sweep[1];result=current.calc(params);
  $('system-name').textContent=current.title;$('number').textContent=String(systems.indexOf(current)+1).padStart(2,'0');$('claim').textContent=lesson.claim;$('problem').textContent=lesson.problem;document.title=`${current.title} · 24-101`;
  $('schedule').hidden=!current.schedule;$('schedule').textContent=current.schedule||'';
  $('physics-topics').textContent=current.physics;$('assumptions').textContent=current.assumptions;$('cmu').textContent=current.cmu;$('physics-connection').textContent=connections[current.id];$('prompt').textContent=current.prompt;
  $('sources').innerHTML=current.sources.map(([label,url])=>`<a href="${url}" target="_blank" rel="noopener">${label}</a>`).join('');
  controls();update();showEquations();navigation();setTab(tab);viewer?.build(current.id,params,true);
}
function showEquations(){$('equations').innerHTML=result.equations.map(e=>`<article class="equation"><div class="eq-name">${e.name}</div><div class="formula">${e.formula}</div><p class="substitution">${e.substitution}</p></article>`).join('');}
function change(key,value){const p=current.params.find(p=>p.key===key);if(!p||!Number.isFinite(value))return;params[key]=Math.min(p.max,Math.max(p.min,value));designs[current.id]={...params};$(`range-${key}`).value=params[key];$(`number-${key}`).value=params[key];update();showEquations();viewer?.build(current.id,params,false);}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2200);}
function designURL(){const q=new URLSearchParams({...params,limit:target});return`${location.origin}${location.pathname}#${current.id}?${q}`;}

$('system-list').addEventListener('click',e=>{const button=e.target.closest('[data-system]');if(button)location.hash=button.dataset.system;});
$('parameters').addEventListener('input',e=>{if(e.target.type==='range')change(e.target.dataset.key,Number(e.target.value));});
$('parameters').addEventListener('change',e=>{if(e.target.type==='number')change(e.target.dataset.key,Number(e.target.value));});
for(const button of document.querySelectorAll('[data-tab]')){
  button.addEventListener('click',()=>setTab(button.dataset.tab));
  button.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();setTab(e.key==='Home'?'inputs':e.key==='End'?'physics':tab==='inputs'?'physics':'inputs',true);});
}
$('reset').addEventListener('click',()=>{params=defaults(current);designs[current.id]={...params};controls();update();showEquations();viewer?.build(current.id,params,false);});
$('baseline').addEventListener('click',()=>{references[current.id]={params:{...params},result:current.calc(params)};showResults();toast('Reference updated.');});
$('sweep-input').addEventListener('change',e=>{sweepKey=e.target.value;chart();});
$('sweep-output').addEventListener('change',e=>{sweepIndex=Number(e.target.value);chart();});
$('requirement-limit').addEventListener('input',e=>{const value=Number(e.target.value);if(e.target.value!==''&&Number.isFinite(value)&&value>=0&&value<=1e9){target=value;targets[current.id]=value;showRequirement();chart();}});
$('play').addEventListener('click',()=>{if(viewer){viewer.setPlaying(!viewer.playing);playbackLabel();}});
$('camera').addEventListener('click',()=>viewer?.resetCamera(current.id));
$('cutaway').addEventListener('change',e=>viewer?.setCutaway(e.target.checked));
$('share').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(designURL());toast('Design link copied.');}catch{const input=document.createElement('textarea');input.value=designURL();document.body.append(input);input.select();const ok=document.execCommand('copy');input.remove();toast(ok?'Design link copied.':'Clipboard unavailable. The selected system is in the address bar.');}});
$('csv').addEventListener('click',()=>{const p=current.params.find(p=>p.key===sweepKey),m=result.metrics[sweepIndex],quote=v=>'"'+String(v).replaceAll('"','""')+'"';const csv=[`${quote(p.label+' ('+p.unit+')')},${quote(m.label+' ('+m.unit+')')},within_model_assumptions`,...samples.map(s=>`${s.x},${s.y},${s.valid}`)].join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'})),link=document.createElement('a');link.href=url;link.download=`${current.id}-${sweepKey}-study.csv`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
window.addEventListener('hashchange',()=>load(location.hash.slice(1).split('?')[0],true));
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(chart,120);});
load(location.hash.slice(1).split('?')[0]||'printer',true);
window.mechELab={systems,get current(){return current;},get params(){return{...params};},get result(){return result;},get account(){return account;},get target(){return target;},get frames(){return viewer?.frames||0;}};
