// Marcas sem preço público nos sites oficiais: usa a lista de motos novas (zero km) da Tabela FIPE
// (https://www.tabelafipebrasil.com/motos/<MARCA>/novas). Valor FIPE zero km do mês, não é preço de tabela da fábrica.
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BRANDS=[ // slug na tabelafipebrasil, id do arquivo, nome
 ['KAWASAKI','kawasaki'],['TRIUMPH','triumph'],['ROYAL-ENFIELD','royal-enfield'],['KTM','ktm'],['HUSQVARNA','husqvarna'],
 ['DAFRA','dafra'],['BAJAJ','bajaj'],['AVELLOZ','avelloz'],['CFMOTO','cfmoto'],['VESPA','vespa'],['PIAGGIO','piaggio']
];
const RULES=[ // [regex no nome, categoria]
 [/citycom|maxsym|joyride|adxtg|cruisym|gtv|sxl|vxl|(^| )xmax|(^| )nmax/i,'Scooter'],
 [/(^| )nhx? ?[0-9]|ibex|norden|890 smt|expedition/i,'Trail / Adventure'],
 [/cl- ?c 450|tracker 400|701 supermoto|^az ?[0-9]/i,'Naked / Street'],
 [/^(KX|KLX|SX|XC|EXC|TC|TE|FE|FC|TX|MC|CRF)\b|MOTOCROSS|ENDURO/i,'Off-road'],
 [/vespa|primavera|sprint|gts|sei giorni|liberty|medley|beverly|mp3/i,'Scooter'],
 [/himalayan|tiger|versys|adventure|\badv\b|desert|scram 411|dl\s?\d|xre|lander/i,'Trail / Adventure'],
 [/ninja|\brc\b|daytona|zx-|panigale|rs 660|rr\b/i,'Esportiva'],
 [/vulcan|eliminator|bobber|speedmaster|rocket|classic|bonneville|thruxton|meteor|shotgun|interceptor|continental|goan|hunter|scrambler|thunderbird|bullet|650 twin|super meteor|chief|scout/i,'Custom'],
 [/duke|\bz\s?\d|speed|trident|street triple|dominar|pulsar|guerrilla|nk|z\d|svartpilen|vitpilen|mt-|hornet/i,'Naked / Street']
];
const catOf=n=>{for(const [re,c] of RULES)if(re.test(n))return c;return 'Outras'};
const title=s=>s.replace(/\s+/g,' ').trim().split(' ').map(w=>(w.length<=3||/\d|-|\//.test(w))?w.toUpperCase():w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(' ').replace(/ ,/g,',');
const brl=s=>{const m=String(s).match(/(\d{1,3}(?:\.\d{3})+)(?:,\d{2})?/);return m?parseInt(m[1].replace(/\./g,''),10):null};
const {execFileSync}=require('child_process');
async function get(u){
  for(let i=0;i<4;i++){
    try{
      const out=execFileSync('curl',['-sL','-m','40','-A','Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126','-w','\n__HTTP__%{http_code}',u],{maxBuffer:20*1024*1024}).toString();
      const code=out.slice(out.lastIndexOf('__HTTP__')+8).trim();
      if(code==='200')return out.slice(0,out.lastIndexOf('__HTTP__'));
      if(code==='429'||code==='403'){await sleep(8000*(i+1));continue}
      throw new Error(u+' '+code);
    }catch(e){if(i===3)throw e;await sleep(5000)}
  }
  throw new Error(u+' bloqueado');
}
(async()=>{
  for(const [slug,id] of BRANDS){
    try{
      const u=`https://www.tabelafipebrasil.com/motos/${slug}/novas`;
      const h=await get(u);
      const L=h.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<[^>]*>/g,'\n').split('\n').map(s=>s.trim()).filter(Boolean);
      const rows=[],seen=new Set();
      for(let i=0;i<L.length-2;i++){
        if(/^\d{6}-\d$/.test(L[i])&&/^R\$/.test(L[i+2])){
          if(/^(ap[eé]|e-cargo|e-passenger)/i.test(L[i+1]))continue;
          const nome=title(L[i+1]),preco=brl(L[i+2]);
          if(!preco||seen.has(nome))continue;seen.add(nome);
          rows.push({modelo:nome,categoria:catOf(L[i+1]),preco,url:u,fonte:'FIPE zero km'});
        }
      }
      if(rows.length){fs.writeFileSync(__dirname+'/data-'+id+'.json',JSON.stringify(rows,null,1));console.log(id,rows.length)}
      else console.log(id,'sem linhas');
    }catch(e){console.log(id,'erro',e.message)}
    await sleep(4000);
  }
})();
