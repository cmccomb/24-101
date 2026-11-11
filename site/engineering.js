// Lesson claims, explicit boundaries, conservation accounts and editable requirements.
// Numerical models and SI conversions remain in systems.js.
export const lessons = {
  printer: {
    claim: 'Faster deposition requires more heating power.',
    problem: 'Increase throughput while staying within a heater power budget.',
    boundary: 'Heater and filament in the hot end', balance: 'Pheater = ṁcₚΔT + Q̇loss', kind: 'Energy rate', unit: 'W',
    criterion: {metric: 2, sense: 'max', target: 40, label: 'Available heater power'},
    sweep: ['speed', 2], roles: {speed:'Operating condition',layer:'Geometry',width:'Geometry',temp:'Operating condition'},
    interpretation: 'The material flow is proportional to speed, bead width and layer height. The required heater power also includes a fixed loss at a given nozzle temperature.'
  },
  laser: {
    claim: 'Cutting faster reduces the energy delivered per unit length.',
    problem: 'Compare the absorbed optical power with an assumed material-removal demand.',
    boundary: 'Incident beam and sheet interaction', balance: 'Poptical = Pabsorbed + Punabsorbed', kind: 'Energy rate', unit: 'W',
    criterion: {metric: 2, sense: 'min', target: 1, label: 'Absorbed power / removal demand'},
    sweep: ['speed', 2], roles: {power:'Operating condition',speed:'Operating condition',thick:'Geometry',kerf:'Geometry'},
    interpretation: 'The energy ratio is a necessary budget check within the assumed removal model. It does not establish cut quality, focus or material compatibility.'
  },
  heatpump: {
    claim: 'A smaller temperature lift increases heat-pump performance.',
    problem: 'Meet a heating demand with limited compressor power.',
    boundary: 'Complete heat-pump system', balance: 'Q̇hot = Q̇cold + Pcompressor', kind: 'Energy rate', unit: 'kW',
    criterion: {metric: 1, sense: 'min', target: 6, label: 'Required heating output'},
    sweep: ['outside', 1], roles: {outside:'Boundary condition',inside:'Boundary condition',input:'Operating condition',fraction:'Model assumption'},
    interpretation: 'COP is a heat-transfer ratio. The delivered heat includes both electrical input and energy extracted from outdoors. The Carnot calculation uses kelvin.'
  },
  refrigerator: {
    claim: 'A colder cabinet needs the compressor to run longer.',
    problem: 'Size cooling capacity to hold a cabinet setpoint in a warm room.',
    boundary: 'Refrigeration circuit while the compressor is running', balance: 'Q̇room = Q̇cold + Pelectric', kind: 'Power balance', unit: 'W',
    criterion: {metric: 2, sense: 'max', target: 100, maxTarget: 100, label: 'Maximum compressor duty'},
    sweep: ['room', 2], roles: {setpoint:'Operating target',room:'Boundary condition',ua:'Cabinet design',power:'Design capacity'},
    interpretation: 'A warmer room increases heat leaking into the cabinet and lowers cooling COP. The compressor can hold the setpoint only if its on-cycle capacity equals or exceeds the heat leak.'
  },
  espresso: {
    claim: 'Heating the water and boiler sets the warm-up time.',
    problem: 'Reach brewing temperature within a specified warm-up time.',
    boundary: 'Water and boiler during warm-up', balance: 'Eelectric = ΔUwater + ΔUboiler + Eloss', kind: 'Energy over warm-up', unit: 'kJ',
    criterion: {metric: 1, sense: 'max', target: 60, label: 'Maximum warm-up time'},
    sweep: ['power', 1], roles: {water:'Capacity',temp:'Operating condition',power:'Design capacity',pressure:'Operating condition'},
    interpretation: 'The stored thermal energy depends on the water and metal masses. More heater power changes the heating time, not the energy needed for the same temperature rise.'
  },
  otto: {
    claim: 'Compression ratio sets ideal Otto-cycle efficiency.',
    problem: 'Separate the effects of cycle design and engine speed on power.',
    boundary: 'Working gas over one ideal firing cycle', balance: 'Qin = Wnet + Qout', kind: 'Energy per firing', unit: 'J',
    criterion: {metric: 0, sense: 'min', target: 60, label: 'Required ideal efficiency'},
    sweep: ['ratio', 0], roles: {ratio:'Geometry',heat:'Operating condition',rpm:'Operating condition'},
    interpretation: 'RPM increases the number of firings per second. It does not change efficiency in this ideal cycle. Real friction, heat transfer and combustion are outside this model.'
  },
  turbine: {
    claim: 'The compressor consumes part of the turbine’s gross work.',
    problem: 'Choose a pressure ratio that leaves sufficient net shaft power.',
    boundary: 'Complete ideal Brayton cycle', balance: 'Q̇in = Pnet + Q̇out', kind: 'Energy rate', unit: 'kW',
    criterion: {metric: 0, sense: 'min', target: 250, label: 'Required net shaft power'},
    sweep: ['ratio', 0], roles: {ratio:'Design choice',hot:'Boundary condition',flow:'Operating condition'},
    interpretation: 'At fixed inlet and maximum temperatures, the pressure ratio for maximum net power differs from the pressure ratio for maximum efficiency.'
  },
  wind: {
    claim: 'Wind power scales with swept area and wind speed cubed.',
    problem: 'Size a rotor for a specified electrical output at a given wind speed.',
    boundary: 'Rotor and generator in a free-stream energy account', balance: 'Pwind = Pelectric + Pgenerator loss + Puncaptured', kind: 'Energy rate', unit: 'kW',
    criterion: {metric: 0, sense: 'min', target: 10, label: 'Required electrical output'},
    sweep: ['radius', 0], roles: {radius:'Geometry',wind:'Boundary condition',cp:'Model assumption'},
    interpretation: 'Radius enters as R² and wind speed as v³. The power coefficient is an assumed operating value, not a prediction from blade geometry.'
  },
  solar: {
    claim: 'Storage temperature depends on both heat input and thermal mass.',
    problem: 'Store useful energy without leaving the liquid-water model.',
    boundary: 'Well-mixed water store at four hours', balance: 'Q̇solar = Q̇loss + dU/dt', kind: 'Energy rate at four hours', unit: 'kW',
    criterion: {metric: 2, sense: 'min', target: 10, label: 'Required stored energy after four hours'},
    sweep: ['tank', 1], roles: {area:'Geometry',sun:'Boundary condition',tank:'Capacity',ua:'Thermal design'},
    interpretation: 'A larger tank reaches a lower temperature for a given input. The temperature calculation ceases to describe liquid water when it reaches 100 °C at atmospheric pressure.'
  },
  battery: {
    claim: 'At fixed voltage, doubling power quadruples resistive heating.',
    problem: 'Reject heat fast enough to meet a chosen pack-temperature requirement.',
    boundary: 'Lumped battery thermal mass at 20 minutes', balance: 'I²R = Q̇cooling + dU/dt', kind: 'Energy rate at 20 minutes', unit: 'kW',
    criterion: {metric: 2, sense: 'max', target: 45, label: 'Chosen temperature limit after 20 minutes'},
    sweep: ['power', 2], roles: {power:'Operating condition',resistance:'Electrical design',ua:'Thermal design',ambient:'Boundary condition'},
    interpretation: 'The temperature limit is a classroom design requirement, not a battery safety rating. Resistance and cooling conductance are held constant in the model.'
  },
  datacenter: {
    claim: 'Doubling airflow halves temperature rise but multiplies fan power by eight.',
    problem: 'Keep the server exhaust below a chosen limit while reducing fan power.',
    boundary: 'Server rack air stream; fan heat excluded', balance: 'PIT = ṁair cₚ(Tout − Tin)', kind: 'Energy rate', unit: 'kW',
    criterion: {metric: 0, sense: 'max', target: 40, label: 'Maximum server exhaust temperature'},
    sweep: ['flow', 0], roles: {load:'Operating condition',flow:'Operating condition',supply:'Boundary condition'},
    interpretation: 'The rack heat balance and fan system curve are separate models. Their intersection defines the tradeoff between exhaust temperature and fan energy.'
  },
  bicycle: {
    claim: 'A larger rear sprocket trades wheel speed for torque.',
    problem: 'Choose sprocket sizes that meet a hub torque requirement at a given crank torque.',
    boundary: 'Crank, chain and engaged rear hub at steady cadence', balance: 'τcrank ωcrank = τhub ωwheel', kind: 'Power balance', unit: 'W',
    criterion: {metric: 1, sense: 'min', target: 18, label: 'Required hub torque'},
    sweep: ['rear', 1], roles: {front:'Gear selection',rear:'Gear selection',cadence:'Operating condition',torque:'Rider input',radius:'Wheel geometry'},
    interpretation: 'At fixed crank torque and cadence, lowering the ratio increases hub torque by the same factor it decreases hub angular speed. Their product remains constant in the lossless model.'
  },
  buggy: {
    claim: 'A heavier buggy can lose a smaller fraction of its energy to drag.',
    problem: 'Predict freeroll speed from gravitational energy and resistance losses.',
    boundary: 'Buggy and driver over a straight descent from rest', balance: 'mgh = ½mv² + Erolling + Edrag', kind: 'Energy over descent', unit: 'kJ',
    criterion: {metric: 0, sense: 'min', target: 40, label: 'Required speed at the end of the slope'},
    sweep: ['mass', 0], roles: {mass:'Design choice',height:'Boundary condition',length:'Boundary condition',crr:'Contact property',cda:'Aerodynamic design'},
    interpretation: 'Gravity and rolling resistance scale with mass. At the same speed and drag area, aerodynamic resistance does not. Structural, turning and braking requirements remain separate.'
  },
  racecar: {
    claim: 'Acceleration shifts from a grip limit to a power limit.',
    problem: 'Reach 80 km/h within a specified time using limited tire grip and power.',
    boundary: 'Vehicle at 80 km/h; longitudinal force balance', balance: 'Fdrive = Frolling + Fdrag + ma', kind: 'Force at 80 km/h', unit: 'N',
    criterion: {metric: 0, sense: 'max', target: 4, label: 'Maximum 0–80 km/h time'},
    sweep: ['power', 0], roles: {mass:'Design choice',power:'Design capacity',grip:'Contact property',cda:'Aerodynamic design'},
    interpretation: 'At low speed, available tire force is limited by μmg. At higher speed, available power limits force through F = P/v. This model omits load transfer and downforce.'
  }
};

const term=(label,value,stored=false)=>({label,value,stored});
export function engineering(s,p,r=s.calc(p)) {
  const l=lessons[s.id],m=r.metrics.map(v=>v.value);let input=[],output=[];
  switch(s.id){
    case 'printer': input=[term('Heater demand',m[2])];output=[term('Filament heating',m[1]),term('Ambient loss',.08*(p.temp-25))];break;
    case 'laser': input=[term('Incident optical power',p.power)];output=[term('Absorbed by sheet',.7*p.power),term('Unabsorbed',.3*p.power)];break;
    case 'heatpump': input=[term('Compressor input',p.input),term('Heat from outdoors',m[2])];output=[term('Heat to room',m[1])];break;
    case 'refrigerator': input=[term('Heat absorbed at evaporator',m[1]),term('Compressor electrical input',p.power)];output=[term('Heat rejected to room',m[3])];break;
    case 'espresso':{let d=p.temp-20,qw=p.water/1000*4180*d/1000,qb=.2*900*d/1000;input=[term('Electrical energy',(qw+qb)/.8)];output=[term('Water energy increase',qw,true),term('Boiler energy increase',qb,true),term('Assumed losses',(qw+qb)*.25)];break;}
    case 'otto': input=[term('Heat per firing',p.heat)];output=[term('Net cycle work',m[2]),term('Heat rejected',p.heat-m[2])];break;
    case 'turbine':{let k=p.ratio**(2/7),qin=p.flow*1.005*(p.hot-288*k),qout=p.flow*1.005*(p.hot/k-288);input=[term('Heat addition',qin)];output=[term('Net shaft power',m[0]),term('Heat rejection',qout)];break;}
    case 'wind':{let raw=.5*1.225*Math.PI*p.radius**2*p.wind**3/1000,shaft=raw*p.cp;input=[term('Free-stream power',raw)];output=[term('Electrical output',m[0]),term('Generator loss',shaft-m[0]),term('Uncaptured flow energy',raw-shaft)];break;}
    case 'solar':{let q=.65*p.area*p.sun/1000,loss=p.ua*(m[1]-20)/1000;input=[term('Collected solar heat',q)];output=[term('Heat loss',loss),term('Rate of energy storage',q-loss,true)];break;}
    case 'battery':{let cooling=p.ua*(m[2]-p.ambient)/1000;input=[term('Resistive heating',m[1])];output=[term('Cooling rate',cooling),term('Rate of energy storage',m[1]-cooling,true)];break;}
    case 'datacenter':input=[term('IT electrical power',p.load)];output=[term('Heat carried by air',1.2*p.flow*1005*m[1]/1000)];break;
    case 'bicycle': input=[term('Crank input',p.torque*p.cadence*Math.PI/30)];output=[term('Hub output',m[1]*m[0]*Math.PI/30)];break;
    case 'buggy':{let energy=p.mass*9.81*p.height/1000,kinetic=.5*p.mass*(m[0]/3.6)**2/1000,roll=p.crr*p.mass*9.81*Math.sqrt(1-(p.height/p.length)**2)*p.length/1000;input=[term('Gravitational energy',energy)];output=[term('Final kinetic energy',kinetic,true),term('Rolling loss',roll),term('Aerodynamic loss',energy-kinetic-roll)];break;}
    case 'racecar':{let v=80/3.6,drive=Math.min(p.grip*p.mass*9.81,p.power*1000/v),roll=.015*p.mass*9.81,drag=.5*1.225*p.cda*v*v;input=[term('Driving force',drive)];output=[term('Rolling resistance',roll),term('Aerodynamic drag',drag),term('Momentum-change rate (ma)',drive-roll-drag,true)];break;}
  }
  const total=input.reduce((a,t)=>a+t.value,0),residual=total-output.reduce((a,t)=>a+t.value,0);
  const valid=s.id!=='solar'||m[1]<100;
  return {...l,input,output,total,residual,valid,validity:valid?'Within stated model assumptions.':'Liquid-water model exceeded: T ≥ 100 °C. Values beyond this boundary are extrapolations.'};
}

export function requirement(s,r,target,valid=true){const c=lessons[s.id].criterion,actual=r.metrics[c.metric].value;return{...c,target,actual,met:valid&&(c.sense==='max'?actual<=target:actual>=target),valid,unit:r.metrics[c.metric].unit,margin:c.sense==='max'?target-actual:actual-target};}

export function perturbation(s,p,key,index){const def=s.params.find(v=>v.key===key),base=p[key],wanted=base*1.1;let next=Math.min(def.max,Math.max(def.min,wanted));if(Math.abs(next-base)<1e-10)next=Math.max(def.min,base*.9);if(Math.abs(base)<1e-10)next=Math.min(def.max,base+.1*(def.max-def.min));if(def.integer)next=Math.round(next);const before=s.calc(p).metrics[index].value,after=s.calc({...p,[key]:next}).metrics[index].value;return{from:base,to:next,inputPercent:base?100*(next-base)/Math.abs(base):null,before,after,outputPercent:before?100*(after-before)/Math.abs(before):null};}
