const fs=require('fs');
exports.get=async(u)=>{const r=await fetch(u,{headers:{'user-agent':'Mozilla/5.0','accept-language':'pt-BR'},redirect:'follow'});if(!r.ok)throw new Error(u+' '+r.status);return r.text()};
exports.brl=s=>{const m=String(s).match(/(\d{1,3}(?:\.\d{3})+|\d{4,6})(?:,\d{2})?/);return m?parseInt(m[1].replace(/\./g,''),10):null};
exports.save=(brand,rows)=>{fs.writeFileSync(__dirname+'/data-'+brand+'.json',JSON.stringify(rows,null,1));console.log(brand,rows.length)};
