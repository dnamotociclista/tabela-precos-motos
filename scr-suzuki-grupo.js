// Site do grupo Suzuki lista Suzuki, Haojue, Zontes, Kymco e Hisun com preço
const {get,brl,save}=require('./lib');
(async()=>{
 const h=(await get('https://www.suzukimotos.com.br'))+(await get('https://haojuemotos.com.br'));
 const out={};
 const parts=h.split('<div class="product" data-brand="').slice(1);
 for(const p of parts){
  const brand=p.slice(0,p.indexOf('"'));
  const cat=(p.match(/data-categories='\["?([^"\]]*)/)||[])[1]||'';
  const link=(p.match(/class="name"/)&&p.match(/href="([^"]+)"\s+class="name"/)||[])[1]||'';
  const name=(p.match(/class="name">([^<]+)/)||[])[1];
  const price=brl((p.match(/class="price">([^<]*)/)||[])[1]);
  if(!name||!price)continue;
  const L=(out[brand]=out[brand]||[]);if(L.some(x=>x.modelo===name.trim()))continue;L.push({modelo:name.trim(),categoria:cat,preco:price,url:link});
 }
 for(const b in out)save(b,out[b]);
})();
