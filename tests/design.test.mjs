import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const tokens=JSON.parse(readFileSync(new URL('../design/tokens.json',import.meta.url),'utf8'));
const {version}=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const luminance=hex=>{let rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
const contrast=(a,b)=>{let x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
for(const role of ['ink','muted','brand','reference','requirement'])assert.ok(contrast(tokens.colors[role],tokens.colors.paper)>=4.5,`${role} text contrast fails`);
assert.ok(contrast(tokens.colors.paper,tokens.colors.brand)>=4.5,'Reversed course identity fails contrast');
assert.equal(tokens.colors.brand,'#c41230');assert.equal(tokens.layout.radius,'0px');assert.ok(parseInt(tokens.type.caption)>=11);
const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8'),guide=readFileSync(new URL('../site/design/index.html',import.meta.url),'utf8');
assert.ok(html.includes('tokens.css?v='+version));assert.ok(html.includes('lab.css?v='+version));assert.ok(html.includes('app.js?v='+version));assert.ok(guide.includes('tokens.css?v='+version));assert.ok(guide.includes('guide.js?v='+version));
for(const file of ['site/app.js','site/models.js','site/design/guide.js']){const text=readFileSync(new URL('../'+file,import.meta.url),'utf8');for(const match of text.matchAll(/from '([^']+)'/g)){if(match[1].includes('vendor/'))continue;assert.ok(match[1].endsWith('?v='+version),`${file}: unversioned application module ${match[1]}`);}}
assert.ok(!html.includes('brand-mark'));assert.ok(!html.includes('textarea'));
console.log('Passed shared-token, identity, text contrast and static-asset version checks.');
