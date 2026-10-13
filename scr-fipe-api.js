// Atualiza o preço (FIPE zero km, ano 32000) dos modelos que têm "codigo" usando a API pública da FIPE.
// Não descobre modelos novos; só atualiza os já listados. Quem lista os modelos é scr-fipe-novas.js (roda no PC).
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ids=fs.readdirSync(__dirname).filter(f=>/^data-[a-z-]+\.json$/.test(f)).map(f=>f.replace(/^data-|\.json$/g,''));
(async()=>{
  let calls=0,ok=0,fail=0,parar=false;
  for(const id of ids){
    if(parar)break;
    const file=__dirname+'/data-'+id+'.json';
    const rows=JSON.parse(fs.readFileSync(file,'utf8'));
    if(!rows.some(r=>r.codigo))continue;
    let mudou=0;
    for(const r of rows){
      if(!r.codigo||calls>=440)continue;
      calls++;
      try{
        const res=await fetch('https://fipe.parallelum.com.br/api/v2/motorcycles/'+r.codigo+'/years/32000-1',{headers:{'user-agent':'dnamotociclista-tabela/1.0'}});
        if(res.status===429){parar=true;console.log('limite da API atingido');break}
        if(!res.ok){fail++;continue}
        const j=await res.json();
        const m=String(j.price||'').match(/(\d{1,3}(?:\.\d{3})+)/);
        if(!m){fail++;continue}
        const p=parseInt(m[1].replace(/\./g,''),10);
        ok++;
        if(p!==r.preco){r.preco=p;mudou++}
      }catch(e){fail++}
      await sleep(120);
    }
    if(mudou)fs.writeFileSync(file,JSON.stringify(rows,null,1));
    console.log(id,'atualizados',mudou);
  }
  console.log('chamadas',calls,'ok',ok,'falhas',fail);
})();
