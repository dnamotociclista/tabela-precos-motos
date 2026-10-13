// Coleta semanal de preços (roda no GitHub Actions). Node 20+, Playwright.
// Escreve data-<marca>.json, depois build.js gera meta.json.
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const PEND='data-pendentes.json';
const pend=fs.existsSync(PEND)?JSON.parse(fs.readFileSync(PEND,'utf8')):{};
const log=[];
const read=b=>fs.existsSync(`data-${b}.json`)?JSON.parse(fs.readFileSync(`data-${b}.json`,'utf8')):[];
const brl=s=>{const m=String(s).match(/(\d{1,3}(?:\.\d{3})+|\d{4,6})/);return m?parseInt(m[1].replace(/\./g,''),10):null};
const smart=n=>n.replace(/^(nov[ao]\s+)?(yamaha\s+|honda\s+)/i,'').split(/\s+/).map(w=>/\d|-|^(abs|dx|zr|xmax|nmax)$/i.test(w)?w.toUpperCase().replace(/70TH/,'70th'):w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(' ');

// aceita a nova lista de uma marca, com travas
function accept(brand,fresh){
  const old=read(brand);
  if(!fresh.length){log.push(`${brand}: coleta vazia, mantido o anterior`);return}
  if(old.length>0&&fresh.length<old.length*0.6){log.push(`${brand}: só ${fresh.length} de ${old.length} modelos, mantido o anterior`);return}
  const om=new Map(old.map(r=>[r.modelo,r]));
  const out=[];
  for(const r of fresh){
    const o=om.get(r.modelo);
    if(!(r.preco>=5000&&r.preco<=800000)){log.push(`${brand} ${r.modelo}: preço fora da faixa (${r.preco}), ignorado`);if(o)out.push(o);continue}
    if(o&&Math.abs(r.preco-o.preco)/o.preco>0.25){
      const k=brand+'|'+r.modelo;
      if(pend[k]===r.preco){delete pend[k];log.push(`${brand} ${r.modelo}: ${o.preco} -> ${r.preco} (confirmado em 2 coletas)`);out.push(r)}
      else{pend[k]=r.preco;log.push(`${brand} ${r.modelo}: variação >25% (${o.preco} -> ${r.preco}), aguardando 2ª coleta`);out.push(o)}
      continue;
    }
    if(o&&o.preco!==r.preco)log.push(`${brand} ${r.modelo}: ${o.preco} -> ${r.preco}`);
    if(!o)log.push(`${brand} ${r.modelo}: novo (${r.preco})`);
    out.push(r);
  }
  // modelos que sumiram ficam por até 2 coletas
  for(const o of old){
    const k='sumiu|'+brand+'|'+o.modelo;
    if(out.some(x=>x.modelo===o.modelo)){delete pend[k];continue}
    pend[k]=(pend[k]||0)+1;
    if(pend[k]<3){out.push(o);log.push(`${brand} ${o.modelo}: não apareceu, mantido (${pend[k]}/2)`)}
    else{delete pend[k];log.push(`${brand} ${o.modelo}: removido`)}
  }
  fs.writeFileSync(`data-${brand}.json`,JSON.stringify(out,null,1));
}

// 1) scrapers sem navegador (cada um grava data-*.json; reaplicamos as travas por cima)
for(const s of ['suzuki-grupo','shineray','ducati','harley']){
  try{
    const DF=()=>fs.readdirSync('.').filter(f=>/^data-[a-z-]+.json$/.test(f));
    const snap=Object.fromEntries(DF().map(f=>[f,fs.readFileSync(f,'utf8')]));
    execFileSync('node',[`scr-${s}.js`],{stdio:'inherit'});
    for(const f of DF()){
      const nw=fs.readFileSync(f,'utf8');
      if(snap[f]!==nw){
        if(snap[f]===undefined){continue}
        const fresh=JSON.parse(nw);fs.writeFileSync(f,snap[f]);accept(f.replace(/^data-|.json$/g,''),fresh);
      }
    }
  }catch(e){log.push(`scraper ${s} falhou: ${e.message.split('\n')[0]}`)}
}

const br=await chromium.launch();
const ctx=await br.newContext({userAgent:UA,locale:'pt-BR',viewport:{width:1366,height:900}});

async function honda(){
  const p=await ctx.newPage();
  await p.goto('https://www.honda.com.br/motos',{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForTimeout(4000);
  const links=await p.evaluate(()=>[...new Set([...document.querySelectorAll('a')].map(a=>a.href.split('#')[0]).filter(h=>/honda\.com\.br\/motos\/(street|adventure)\/[^/]+\/[^/]+\/?$|honda\.com\.br\/motos\/(off-road|sport|touring)\/[^/]+\/?$/.test(h)))]);
  const catOf=u=>/\/city\//.test(u)?'Urbana':/scooter/.test(u)?'Scooter':/naked/.test(u)?'Naked':/big-trail/.test(u)?'Big Trail':/crossover/.test(u)?'Crossover':/trail/.test(u)?'Trail':/off-road/.test(u)?'Off-road':/sport/.test(u)?'Esportiva':/touring/.test(u)?'Touring':'';
  const rows=[],seen=new Set();
  for(const u of links){
    try{
      const r=await p.evaluate(async u=>{const h=await (await fetch(u)).text();const d=new DOMParser().parseFromString(h,'text/html');const t=d.body.textContent.replace(/\s+/g,' ');const m=t.match(/A partir de R\$\s*([\d.]{5,9})/);return{h1:((d.querySelector('h1')||{}).textContent||'').trim(),p:m?m[1]:null}},u);
      if(!r.p||/n[aã]o encontrada/i.test(r.h1))continue;
      let name=smart(r.h1);
      if(/fireblade/i.test(name))name='CBR1000RR-R Fireblade SP';
      if(seen.has(name))continue;seen.add(name);
      rows.push({modelo:name,categoria:catOf(u),preco:brl(r.p),url:u});
    }catch(e){}
  }
  await p.close();accept('honda',rows);
}

async function yamaha(){
  const p=await ctx.newPage();
  await p.goto('https://www.yamaha-motor.com.br/motos',{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForTimeout(5000);
  for(let n=0;n<8;n++){
    const clicked=await p.evaluate(async()=>{window.scrollTo(0,document.body.scrollHeight);await new Promise(r=>setTimeout(r,800));const b=[...document.querySelectorAll('a,button,div')].find(e=>e.children.length===0&&/Ver mais produtos/.test(e.textContent));if(b){b.click();return true}return false});
    await p.waitForTimeout(2500);
    if(!clicked)break;
  }
  const items=await p.evaluate(()=>{const L=document.body.innerText.split('\n').map(s=>s.trim()).filter(Boolean);const out=[];for(let i=0;i<L.length;i++){if(L[i]==='A partir de'&&/^R\$/.test(L[i+1])){let j=i-1;while(j>0&&!/^Ano \d{4}$/.test(L[j]))j--;let k=j-1;if(/Garantia/.test(L[k]))k--;out.push({cat:L[k-1],nome:L[k],ano:+L[j].slice(4),preco:L[i+1]})}}return out});
  const byName=new Map();
  const catMap={'MT Series':'Naked','Racing':'Off-road'};
  for(const it of items){
    if(/MOVE BRASIL/i.test(it.nome))continue;
    const nome=smart(it.nome.replace(/\s+20\d\d$/,''));
    const o=byName.get(nome);
    if(o){if(o.ano>=it.ano)continue}
    byName.set(nome,{modelo:nome,categoria:catMap[it.cat]||it.cat,ano:it.ano,preco:brl(it.preco),url:'https://www.yamaha-motor.com.br/motos'});
  }
  await p.close();accept('yamaha',[...byName.values()]);
}

async function bmw(){
  const p=await ctx.newPage();
  await p.goto('https://www.bmw-motorrad.com.br/pt/models/modeloverview.html',{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForTimeout(5000);
  const items=await p.evaluate(()=>{const L=document.body.innerText.split('\n').map(s=>s.trim()).filter(Boolean);const cats=['Adventure','Roadster','Sport','Tour','Heritage','Urban Mobility'];let cat='';const out=[];L.forEach((l,i)=>{if(cats.indexOf(l)>-1)cat=l;const m=l.match(/^A partir de R\$\s*([\d.]+)\*?$/);if(m&&L[i-2])out.push({cat,nome:L[i-2],p:m[1]})});return out});
  const cm={Tour:'Touring','Urban Mobility':'Scooter'};
  const rows=items.filter(i=>/^[A-Z]{1,2}\s?\d/.test(i.nome)).map(i=>({modelo:i.nome,categoria:cm[i.cat]||i.cat,preco:brl(i.p),url:'https://www.bmw-motorrad.com.br/pt/models/modeloverview.html'}));
  await p.close();accept('bmw',rows);
}

async function voge(){
  const p=await ctx.newPage();
  await p.goto('https://vogebrasil.com.br',{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForTimeout(4000);
  const items=await p.evaluate(()=>{const L=document.body.innerText.split('\n').map(s=>s.trim()).filter(Boolean);const out=[];L.forEach((l,i)=>{if(/^R\$\s*[\d.]{5,}/.test(l))out.push({nome:L[i-1],p:l})});return out});
  const rows=items.map(i=>({modelo:i.nome,categoria:/^DS/i.test(i.nome)?'Adventure':'Scooter',preco:brl(i.p),url:'https://vogebrasil.com.br'}));
  await p.close();accept('voge',rows);
}

for(const [n,f] of [['honda',honda],['yamaha',yamaha],['bmw',bmw],['voge',voge]]){
  try{await f()}catch(e){log.push(`${n} falhou: ${e.message.split('\n')[0]} (mantido o anterior)`)}
}
await br.close();
fs.writeFileSync(PEND,JSON.stringify(pend,null,1));
fs.writeFileSync('ultima-coleta.txt',new Date().toISOString()+'\n'+log.join('\n')+'\n');
console.log(log.join('\n'));
execFileSync('node',['build.js'],{stdio:'inherit',env:{...process.env,DATA_ATUALIZACAO:new Date().toISOString().slice(0,10)}});
