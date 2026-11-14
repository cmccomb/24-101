// The candidate order is stable; a term calendar resolves the Carnival swap.
export const candidateOrder=['laser','printer','bicycle','elevator','robot','excavator','pump','refrigerator','espresso','washer','quadcopter','autoinjector','buggy','datacenter'];
export const projects=[
 {id:1,start:1,end:3,title:'Bounded design sprint',outcome:'A tested prototype, a measurable requirement and a short design rationale.'},
 {id:2,start:4,end:7,title:'Structured design project',outcome:'A justified concept, a prototype and evidence from a planned test.'},
 {id:3,start:8,end:14,title:'Integrated design project',outcome:'An integrated solution with stakeholder evidence, engineering analysis and documented iteration.'}
];
export const areas={manufacturing:'Manufacturing and materials',solids:'Statics and solids',mechanisms:'Mechanisms',thermo:'Thermodynamics',heat:'Heat transfer',fluids:'Fluids',dynamics:'Dynamics and vibration',sensing:'Sensing and actuation',controls:'Controls',modeling:'Numerical or experimental modeling',human:'Human-centered product design'};
export const calendar={term:'Spring 2027',carnival:'2027-04-15',source:'https://www.cmu.edu/hub/calendar/docs/2627-academic-calendar.pdf',carnivalSource:'https://www.cmu.edu/engage/events/spring-carnival',
 mondays:['2027-01-18','2027-01-25','2027-02-01','2027-02-08','2027-02-15','2027-02-22','2027-03-01','2027-03-15','2027-03-22','2027-03-29','2027-04-05','2027-04-12','2027-04-19','2027-04-26'],
 makeups:{'2027-01-18':null},note:'Classes begin Tuesday, January 19. Monday, January 18 is the MLK closure. The week 1 laser-cutter demonstration needs a course-specific make-up meeting; its date is not yet assigned. Spring break is March 8–12. Carnival is April 15–17.'};
export function resolveOrder(mondays,carnival){
 if(mondays.length!==14||new Set(mondays).size!==14||mondays.some((d,i)=>new Date(d+'T12:00:00Z').getUTCDay()!==1||(i>0&&d<=mondays[i-1])))throw Error('Provide 14 distinct, ordered instructional Mondays.');
 const day=new Date(carnival+'T12:00:00Z');if(!Number.isFinite(+day))throw Error('Invalid Carnival date.');
 const daysBack=(day.getUTCDay()+6)%7||7;day.setUTCDate(day.getUTCDate()-daysBack);
 const monday=day.toISOString().slice(0,10),slot=mondays.indexOf(monday),order=[...candidateOrder];
 if(slot<2)throw Error('Carnival Monday must be an instructional week after the two fixed fabrication weeks.');
 const from=order.indexOf('buggy');[order[slot],order[from]]=[order[from],order[slot]];return order;
}
const sessions={
 laser:['Laser cutter',['manufacturing','heat','modeling','human'],'Cut a kerf-fit coupon; measure slot fit against the drawing.','Compare line energy and removal demand, then examine kerf, stock thickness, joints and material selection.','Treat fit as a measurable user requirement.'],
 printer:['FDM 3D printer',['manufacturing','heat','sensing','controls','modeling'],'Compare the frame and spacer toolpaths on TechSpark’s Ender-3 rack profile.','Calculate material throughput and heater demand; consider layer orientation, supports, tolerance and temperature feedback.','Use a fabrication constraint to revise the prototype.'],
 bicycle:['Bicycle brake and wheel',['solids','mechanisms','dynamics','human'],'Spin a wheel and apply a disc brake; compare hand effort and stopping distance.','Draw the lever, rotor and tire free-body diagrams; calculate torque, grip limit, stopping distance and heat.','Translate hand comfort and stopping performance into requirements.'],
 elevator:['Elevator',['solids','mechanisms','sensing','controls','human'],'Raise a model car and counterweight with different payloads.','Calculate rope tensions, axial stress and signed shaft power; consider braking, redundancy and accessible ride quality.','Separate stakeholder needs from technical specifications.'],
 robot:['Robot arm and gripper',['solids','mechanisms','sensing','controls','modeling','human'],'Command a joint step, vary gains, then lift a known mass with friction jaws.','Calculate gravity torque, jaw force and feedback response; consider reach, compliance, sensing and pinch points.','Build a needs-to-specifications trace for the active concept.'],
 excavator:['Hydraulic excavator',['solids','mechanisms','fluids','sensing'],'Move a syringe-driven boom; vary the cylinder attachment point.','Use pressure-area force and moment balance; consider linkage leverage, cylinder flow, seals and tipping.','Compare concepts using the same load case and constraints.'],
 pump:['Centrifugal pump and piping loop',['fluids','sensing','modeling'],'Measure flow and pressure in a transparent recirculating loop.','Intersect pump and system curves; compare static lift, pipe loss and input power with measurements.','Test the chosen concept against its measurable requirement.'],
 refrigerator:['Refrigerator / heat pump',['thermo','heat','controls','modeling','human'],'Measure cabinet and room temperatures and observe compressor cycling.','Calculate heat leak, COP, cooling capacity and duty; reverse the heat-pump viewpoint and consider insulation and service access.','Define stakeholders and system boundaries for the integrated project.'],
 espresso:['Espresso machine',['thermo','heat','fluids','sensing','human'],'Time a water-only boiler warm-up and compare a pressure reading with brew-face force.','Break down water and boiler heat capacity, heat-up time and hydraulic power; consider cleaning, ergonomics and thermal control.','Use an order-of-magnitude estimate to screen concepts.'],
 washer:['Washing machine suspension',['dynamics','solids','modeling','human'],'Sweep the speed of an eccentric-mass rig through resonance.','Calculate forced vibration, natural frequency and transmitted force; consider damping, isolation, balance and noise.','Allocate interfaces and performance budgets across subsystems.'],
 quadcopter:['Quadcopter',['dynamics','fluids','sensing','controls','modeling'],'Use the simulation or a restrained rig to compare roll feedback gains.','Calculate hover thrust and ideal induced power, then roll response; consider IMU feedback, mass placement and guards.','Plan repeatable tests and record a model-versus-test discrepancy.'],
 autoinjector:['Autoinjector',['mechanisms','fluids','solids','human','modeling'],'Use a spring-driven bench syringe with a generic liquid and a visible plunger.','Calculate spring force, pressure, viscous resistance and displacement; consider trigger force, indication and manufacturing tolerances.','Refine the design using cost, service and user evidence.'],
 buggy:['CMU Buggy',['dynamics','solids','fluids','modeling','human'],'Compare coast-down predictions with a small cart or recorded freeroll data.','Account for gravitational energy, rolling loss and aerodynamic drag; consider braking, visibility, driver fit and structure.','Evaluate materials, fabrication and sustainability before final build.'],
 datacenter:['Data-center cooling system',['thermo','heat','fluids','sensing','controls','modeling'],'Measure air temperatures across a heated box at several fan settings.','Calculate air heat balance and fan-power scaling; consider hot spots, recirculation, sensing and facility energy.','Explain an integrated tradeoff with measured evidence.']
};
const methods=[
 ['Process, project brief, users and team formation','P1: agree on the brief, users and team roles.'],
 ['Observation, needs and measurable specifications','P1: submit observed needs and a measurable specification.'],
 ['Rapid prototyping, demonstration and retrospective','P1: demonstrate, test and reflect on the prototype.'],
 ['Project planning, stakeholders and team charter','P2: launch with a charter, milestones and stakeholder map.'],
 ['Customer needs and target specifications','P2: submit a needs-to-specifications trace.'],
 ['Concept generation and systematic selection','P2: compare alternatives and justify the selected concept.'],
 ['Concept testing and prototype review','P2: present test evidence and a retrospective.'],
 ['Stakeholder research and agile planning','P3: launch with a research plan and iteration backlog.'],
 ['Specifications, concepts and downselection','P3: baseline specifications and select an initial concept.'],
 ['Product architecture and industrial design','P3: define interfaces, user interaction and subsystem budgets.'],
 ['Prototyping, testing, iteration and robust design','P3: run a test, assess variability and record a revision.'],
 ['Sustainability, manufacturing and supply chain','P3: review materials, fabrication and procurement.'],
 ['Refinement, economics, service and intellectual property','P3: resolve test findings and prepare a cost/service rationale.'],
 ['Integration, demonstration, communication and retrospective','P3: demonstrate the integrated design and submit the evidence.']
];
export const weeks=resolveOrder(calendar.mondays,calendar.carnival).map((id,i)=>{
 const [title,coverage,demo,design,transfer]=sessions[id],monday=calendar.mondays[i],wed=new Date(monday+'T12:00:00Z');wed.setUTCDate(wed.getUTCDate()+2);
 return {week:i+1,id,title,coverage,demo,design,transfer,monday,meeting:Object.hasOwn(calendar.makeups,monday)?calendar.makeups[monday]:monday,wednesday:wed.toISOString().slice(0,10),method:methods[i][0],deliverable:methods[i][1],project:projects.find(p=>i+1>=p.start&&i+1<=p.end).id};
});
export const weekFor=id=>weeks.find(w=>w.id===id);
export const dateLabel=date=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
