import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),tokens=JSON.parse(readFileSync(new URL('design/tokens.json',root),'utf8'));
const kebab=s=>s.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
const lines=['/* Generated from design/tokens.json. Run npm run tokens. */',':root {'];
for(const [name,value] of Object.entries(tokens.colors))lines.push(`  --color-${kebab(name)}: ${value};`);
lines.push(`  --font-sans: ${tokens.font};`);
for(const category of ['type','layout','motion'])for(const [name,value] of Object.entries(tokens[category]))lines.push(`  --${category}-${name}: ${value};`);
for(const value of tokens.space)lines.push(`  --space-${value}: ${value}px;`);
lines.push('}','');
const model={steel:'structure',dark:'structureDark',light:'structureLight',red:'heat',orange:'heat',blue:'fluid',green:'fluid',gold:'light',background:'surface',grid:'line',paper:'paper'};
const palette=Object.fromEntries(Object.entries(model).map(([name,token])=>[name,parseInt(tokens.colors[token].slice(1),16)]));
const outputs={'site/tokens.css':lines.join('\n'),'site/theme.js':'// Generated from design/tokens.json. Run npm run tokens.\nexport const modelColors=Object.freeze('+JSON.stringify(palette,null,2)+');\n'};
let mismatch=false;
for(const [path,content] of Object.entries(outputs)){
  const url=new URL(path,root);
  if(process.argv.includes('--check')){let actual='';try{actual=readFileSync(url,'utf8');}catch{}if(actual!==content){console.error(`${path} differs from design/tokens.json`);mismatch=true;}}
  else writeFileSync(url,content);
}
if(mismatch)process.exitCode=1;
else console.log(process.argv.includes('--check')?'Design tokens match CSS and 3D theme.':'Generated CSS and 3D theme from design/tokens.json.');
