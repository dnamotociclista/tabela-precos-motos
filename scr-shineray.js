const {get,brl,save}=require('./lib');
(async()=>{
 const h=await get('https://www.shineray.com.br');
 const rows=[],seen=new Set();
 const re=/Nome comercial<\/span>[\s\S]*?dynamic-field__content" >([^<]+)<[\s\S]*?A partir de:<\/span><br>\s*(R\$[^<]+)</g;
 let m;while((m=re.exec(h))){const n=m[1].trim(),p=brl(m[2]);if(p&&!seen.has(n)){seen.add(n);rows.push({modelo:n,categoria:'',preco:p,url:'https://www.shineray.com.br'})}}
 save('shineray',rows);
})();
