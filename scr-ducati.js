const {get,brl,save}=require('./lib');
(async()=>{
 const h=await get('https://www.ducati.com/br/pt/home');
 const rows=[],seen=new Set();
 for(const b of h.split('<div class="title').slice(1)){
  const n=(b.match(/^[^>]*>([^<]+)</)||[])[1];
  const blk=b.slice(0,b.search(/<div class="title|$/ ) );
  const nxt=b.indexOf('<div class="title',10);const seg=nxt>0?b.slice(0,nxt):b;
  const pm=seg.match(/sem inclusão de frete: (?:a partir de )?(R\$[\d.,]+)/);
  if(n&&pm&&!seen.has(n.trim())){seen.add(n.trim());rows.push({modelo:n.trim(),categoria:'',preco:brl(pm[1]),url:'https://www.ducati.com/br/pt/home'})}
 }
 save('ducati',rows);
})();
