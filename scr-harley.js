const {get,brl,save}=require('./lib');
(async()=>{
 const h=await get('https://www.harley-davidson.com/br/pt/index.html');
 const rows=[],seen=new Set();
 const re=/<h4[^>]*>([^<]+)<\/h4>[\s\S]{0,1500}?A partir de(?:\s|<[^>]*>)*R\$\s*([\d.]+)/g;
 let m;while((m=re.exec(h))){const n=m[1].trim();if(!seen.has(n)){seen.add(n);rows.push({modelo:n,categoria:'',preco:brl(m[2]),url:'https://www.harley-davidson.com/br/pt/index.html'})}}
 save('harley-davidson',rows);
})();
