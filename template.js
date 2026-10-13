(function(){
var SRC='https://dnamotociclista.github.io/tabela-precos-motos/meta.json';
var q=document.getElementById('tp-q'),mk=document.getElementById('tp-marca'),cat=document.getElementById('tp-cat'),fx=document.getElementById('tp-faixa'),ord=document.getElementById('tp-ord');
var go=document.getElementById('tp-go'),clr=document.getElementById('tp-clear');
var cnt=document.getElementById('tp-count'),empty=document.getElementById('tp-empty'),list=document.getElementById('tp-list');
var hint0=cnt.textContent;
function norm(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[\s\-]+/g,'')}
function search(){
  var t=norm(q.value.trim()),b=mk.value,c=cat.value,f=fx.value,lo=0,hi=1e9,total=0,brands=0;
  if(!(t||b||c||f)){
    cnt.textContent='Preencha o modelo ou escolha marca, categoria ou faixa de preço antes de pesquisar.';
    return;
  }
  if(f){var p=f.split('-');lo=+p[0];hi=+p[1]}
  [].slice.call(list.querySelectorAll('.tp-b')).forEach(function(s){
    var show=0,rows=[].slice.call(s.querySelectorAll('tbody tr'));
    rows.sort(function(x,y){return ord.value==='desc'?y.dataset.p-x.dataset.p:x.dataset.p-y.dataset.p});
    var tb=s.querySelector('tbody');
    rows.forEach(function(r){
      tb.appendChild(r);
      var pr=+r.dataset.p,ok=true;
      if(t){ok=norm(r.dataset.s).indexOf(t)>-1}
      if(ok){if(c){ok=r.dataset.c===c}}
      if(ok){if(f){ok=pr>=lo?pr<hi:false}}
      r.hidden=!ok;
      if(ok)show++;
    });
    var hide=show===0;
    if(!hide){if(b){hide=s.dataset.b!==b}}
    s.hidden=hide;
    if(!hide){total+=show;brands++;s.querySelector('.tp-n').textContent=show}
  });
  list.hidden=false;
  clr.hidden=false;
  cnt.textContent=total+' '+(total===1?'modelo encontrado':'modelos encontrados')+' em '+brands+' '+(brands===1?'marca':'marcas');
  empty.hidden=total>0;
  list.scrollIntoView({behavior:'smooth',block:'start'});
}
function reset(){
  q.value='';mk.value='';cat.value='';fx.value='';ord.value='asc';
  list.hidden=true;empty.hidden=true;clr.hidden=true;cnt.textContent=hint0;
}
go.addEventListener('click',search);
q.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();search()}});
clr.addEventListener('click',reset);
// Preços ao vivo: o GitHub Actions atualiza meta.json toda semana. Se falhar, vale a tabela embutida na página.
try{
  fetch(SRC+'?h='+Math.floor(Date.now()/3600000)).then(function(r){return r.ok?r.json():null}).then(function(d){
    if(!d){return}
    if(!(d.total>=50)){return}
    list.innerHTML=d.list;
    var kb=mk.value,kc=cat.value;
    mk.innerHTML='<option value="">Todas as marcas</option>'+d.brands;mk.value=kb;
    cat.innerHTML='<option value="">Todas as categorias</option>'+d.cats;cat.value=kc;
    var dt=document.getElementById('tp-data');if(dt){dt.textContent=d.data}
    hint0=hint0.replace(/Temos \d+ motos de \d+ marcas\./,'Temos '+d.total+' motos de '+d.marcas+' marcas.');
    if(list.hidden){cnt.textContent=hint0}
  }).catch(function(){});
}catch(e){}
})();
