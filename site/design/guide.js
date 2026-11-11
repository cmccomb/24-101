import {systems,defaults,fmt} from '../systems.js?v=1.3.1';
const root=getComputedStyle(document.documentElement);
for(const swatch of document.querySelectorAll('[data-token]'))swatch.querySelector('code').textContent=root.getPropertyValue('--color-'+swatch.dataset.token).trim().toUpperCase();
const system=systems.find(s=>s.id==='printer'),initial=defaults(system),reference=system.calc(initial);
let speed=initial.speed;
function draw(){
  const values={...initial,speed},result=system.calc(values),metrics=document.getElementById('demo-metrics');
  metrics.innerHTML=result.metrics.map((m,i)=>`<div class="metric"><div class="metric-label">${m.label}</div><div class="metric-value">${fmt(m.value)}<small>${m.unit}</small></div><div class="metric-reference">Reference: ${fmt(reference.metrics[i].value)} ${m.unit}</div></div>`).join('');
  const status=document.getElementById('demo-status'),met=result.metrics[2].value<=20;status.dataset.met=String(met);status.textContent=(met?'Requirement met':'Requirement not met')+`: ${fmt(result.metrics[2].value)} W required.`;
  const svg=document.getElementById('demo-chart'),width=Math.max(320,Math.min(650,svg.clientWidth||650)),right=width-20,X=x=>60+(x-10)/140*(right-60),Y=y=>230-(y-14)/8*200;svg.setAttribute('viewBox',`0 0 ${width} 290`);
  let content='';for(const y of [14,16,18,20,22])content+=`<line class="chart-grid" x1="60" x2="${right}" y1="${Y(y)}" y2="${Y(y)}"/><text class="chart-label" x="48" y="${Y(y)+4}" text-anchor="end">${y}</text>`;
  for(const x of [10,55,100,150])content+=`<text class="chart-label" x="${X(x)}" y="250" text-anchor="middle">${x}</text>`;
  const points=Array.from({length:61},(_,i)=>{let x=10+140*i/60,y=system.calc({...initial,speed:x}).metrics[2].value;return`${i?'L':'M'}${X(x)},${Y(y)}`;}).join(' ');
  content+=`<path class="chart-line" d="${points}"/><line class="chart-limit" x1="60" x2="${right}" y1="${Y(20)}" y2="${Y(20)}"/><text class="chart-limit-label" x="${right}" y="${Y(20)-7}" text-anchor="end">Requirement: 20 W</text><circle class="chart-point" cx="${X(speed)}" cy="${Y(result.metrics[2].value)}" r="5"/><text class="chart-axis-label" x="${(60+right)/2}" y="282" text-anchor="middle">Print speed (mm/s)</text><text class="chart-axis-label" transform="translate(15 130) rotate(-90)" text-anchor="middle">Required heater power (W)</text>`;svg.innerHTML=content;
  svg.setAttribute('aria-label',`Required heater power versus print speed. Current speed ${speed} mm/s requires ${fmt(result.metrics[2].value)} W. Requirement 20 W.`);
}
function change(value){if(!Number.isFinite(value))return;speed=Math.min(150,Math.max(10,value));document.getElementById('demo-speed').value=speed;document.getElementById('demo-number').value=speed;draw();}
document.getElementById('demo-speed').addEventListener('input',e=>change(Number(e.target.value)));
document.getElementById('demo-number').addEventListener('change',e=>change(Number(e.target.value)));
window.addEventListener('resize',draw);draw();
