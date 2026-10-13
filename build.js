// Gera page.html e meta.json a partir de data-*.json
// Uso: node build.js   (opcional: DATA_ATUALIZACAO=2026-10-13)
const fs=require('fs'),path=require('path');
const D=__dirname;
const BRANDS=[ // id do arquivo data-<id>.json, nome exibido
 ['honda','Honda'],['yamaha','Yamaha'],['suzuki','Suzuki'],['kawasaki','Kawasaki'],['bmw','BMW Motorrad'],['triumph','Triumph'],
 ['royal-enfield','Royal Enfield'],['harley-davidson','Harley-Davidson'],['ducati','Ducati'],['ktm','KTM'],['husqvarna','Husqvarna'],['gasgas','GASGAS'],
 ['haojue','Haojue'],['shineray','Shineray'],['dafra','Dafra'],['bajaj','Bajaj'],['avelloz','Avelloz'],['voltz','Voltz'],['benelli','Benelli'],
 ['cfmoto','CFMOTO'],['voge','Voge'],['zontes','Zontes'],['kymco','Kymco'],['mv-agusta','MV Agusta'],['aprilia','Aprilia'],['vespa','Vespa'],
 ['indian','Indian'],['can-am','Can-Am'],['hisun','Hisun']
];
function cat(raw){
  const s=(raw||'').toLowerCase();
  if(/quadri/.test(s))return 'Quadriciclo';
  if(/el[eé]tric/.test(s))return 'Elétrica';
  if(/scooter/.test(s))return 'Scooter';
  if(/off|racing|motocross|enduro/.test(s))return 'Off-road';
  if(/touring|tour|grand/.test(s))return 'Touring';
  if(/custom|cruiser|heritage|muscle/.test(s))return 'Custom';
  if(/sport|esport|supersport|racing/.test(s))return 'Esportiva';
  if(/adventure|trail|crossover|big trail|supreme/.test(s))return 'Trail / Adventure';
  if(/naked|street|roadster|streetfighter|mt series/.test(s))return 'Naked / Street';
  if(/urban|city|cub|trabalho|biz|pop/.test(s))return 'Urbana';
  return 'Outras';
}
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const fmt=n=>'R$ '+n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.');
const data=[];
for(const [id,nome] of BRANDS){
  const f=path.join(D,'data-'+id+'.json');
  if(!fs.existsSync(f))continue;
  const rows=JSON.parse(fs.readFileSync(f,'utf8')).filter(r=>r.preco>1000&&r.modelo).map(r=>({m:r.modelo.trim(),c:cat(r.categoria),p:r.preco,a:r.ano||0,u:r.url||''}));
  rows.sort((a,b)=>a.p-b.p);
  if(rows.length)data.push({id,nome,rows});
}
const total=data.reduce((n,b)=>n+b.rows.length,0);
const cats=[...new Set(data.flatMap(b=>b.rows.map(r=>r.c)))].sort();
const hoje=process.env.DATA_ATUALIZACAO||new Date().toISOString().slice(0,10);
const [yy,mm,dd]=hoje.split('-');
const dataBR=`${dd}/${mm}/${yy}`;
const mesAno=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][+mm-1]+' de '+yy;

const brandSections=data.map(b=>{
  const min=b.rows[0].p;
  const trs=b.rows.map(r=>`<tr data-c="${esc(r.c)}" data-p="${r.p}" data-s="${esc((b.nome+' '+r.m).toLowerCase())}"><td class="tp-m">${esc(r.m)}${r.a?`<small>ano ${r.a}</small>`:''}</td><td class="tp-ct">${esc(r.c)}</td><td class="tp-p">${fmt(r.p)}</td></tr>`).join('');
  return `<section class="tp-b" id="${b.id}" data-b="${b.id}"><div class="tp-bh"><h2>Preço das motos ${esc(b.nome)}</h2><span><b class="tp-n">${b.rows.length}</b> modelos · a partir de ${fmt(min)}</span></div><div class="tp-tw"><table><thead><tr><th>Modelo</th><th>Categoria</th><th>Preço sugerido</th></tr></thead><tbody>${trs}</tbody></table></div></section>`;
}).join('\n');

const brandOpts=data.map(b=>`<option value="${b.id}">${esc(b.nome)}</option>`).join('');
const catOpts=cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
const faq=[
 ['De onde vêm os preços da tabela?','Os valores são os preços públicos sugeridos divulgados nos sites oficiais das fabricantes e das marcas. Revisamos a tabela toda semana. Em cada atualização a data aparece no topo desta página.'],
 ['O preço inclui frete e emplacamento?','Não. Os valores são preços sugeridos de venda ao público, sem frete, emplacamento, IPVA, licenciamento ou acessórios. O valor final pode mudar conforme a concessionária, a região e as promoções do momento.'],
 ['Qual a diferença entre esta tabela e a tabela FIPE?','Esta página mostra o preço de moto nova (0 km) sugerido pelas fabricantes. A tabela FIPE mostra o valor médio de mercado, usado principalmente para motos usadas, seguro e financiamento. Para consultar a FIPE, use a nossa ferramenta gratuita.'],
 ['Qual é a moto mais barata do Brasil?','A tabela já vem ordenada do menor para o maior preço dentro de cada marca. Use o filtro de faixa de preço para ver só as motos mais baratas, como as de 110 e 125 cilindradas.'],
 ['Minha moto ou marca não está na lista. E agora?','Estamos ampliando a tabela com novas marcas e modelos. Alguns modelos não têm preço público divulgado pela fabricante e, por isso, ficam fora até a divulgação oficial.'],
 ['Posso confiar nos valores para fechar negócio?','Use a tabela como referência para comparar modelos. Antes de fechar a compra, confirme o valor final, o frete e as condições direto com a concessionária.']
];
const faqHtml=faq.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
const ld=JSON.stringify({"@context":"https://schema.org","@graph":[{"@type":"FAQPage","mainEntity":faq.map(([q,a])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}}))}]});

const css=fs.readFileSync(path.join(D,'template.css'),'utf8');
const js=fs.readFileSync(path.join(D,'template.js'),'utf8');
const html=`<style>
${css}
</style>
<div id="tp">
<nav class="tp-nav"><div class="tp-in"><a href="/" aria-label="DNA Motociclista"><img decoding="async" src="https://dnamotociclista.com.br/wp-content/uploads/2026/09/dna-logo.png" alt="DNA Motociclista" height="34"></a><div class="tn-tabs"><a class="tn tn-preco on" href="/tabela-de-precos/" aria-current="page"><span class="tl">Tabela de preços</span><span class="ts">Preços</span></a><a class="tn tn-fipe" href="/consultar-tabela-fipe/"><span class="tl">Tabela FIPE</span><span class="ts">FIPE</span></a><a class="tn tn-lic" href="/licenciamento/">Licenciamento</a><a class="tn tn-ipva" href="/ipva/">IPVA</a></div></div></nav>
<header class="tp-hero"><div class="tp-in">
<span class="tp-pill"><i></i>Atualizada em <span id="tp-data">${dataBR}</span></span>
<h1>Tabela de preços de motos <span>0 km de todas as marcas</span></h1>
<p class="tp-lead">Compare o preço sugerido de ${total} motos novas à venda no Brasil. Filtre por marca, categoria e faixa de preço. Revisada toda semana a partir dos sites das fabricantes.</p>
<div class="tp-tool" id="busca">
<div class="tp-fg">
<input type="search" id="tp-q" class="full" placeholder="Digite o modelo (ex.: CG 160, Hornet, MT-07)" aria-label="Buscar moto" autocomplete="off">
<select id="tp-marca" aria-label="Marca"><option value="">Todas as marcas</option>${brandOpts}</select>
<select id="tp-cat" aria-label="Categoria"><option value="">Todas as categorias</option>${catOpts}</select>
<select id="tp-faixa" aria-label="Faixa de preço"><option value="">Qualquer preço</option><option value="0-20000">Até R$ 20 mil</option><option value="20000-35000">R$ 20 a 35 mil</option><option value="35000-60000">R$ 35 a 60 mil</option><option value="60000-100000">R$ 60 a 100 mil</option><option value="100000-9999999">Acima de R$ 100 mil</option></select>
<select id="tp-ord" class="full" aria-label="Ordenar"><option value="asc">Menor preço primeiro</option><option value="desc">Maior preço primeiro</option></select>
<button type="button" class="tp-go full" id="tp-go"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.3-4.3"></path></svg>Pesquisar</button>
<button type="button" class="tp-clear" id="tp-clear" hidden>Limpar pesquisa</button>
</div>
<p class="tp-hint" id="tp-count">Digite um modelo ou escolha marca, categoria ou faixa de preço e clique em Pesquisar. Temos ${total} motos de ${data.length} marcas.</p>
</div>
</div></header>
<div class="tp-in">
<div id="tp-list" hidden>
${brandSections}
</div>
<p class="tp-empty" id="tp-empty" hidden>Nenhuma moto encontrada com esses filtros. Tente limpar a busca.</p>
<section class="tp-s">
<span class="tp-eb">Dúvidas</span>
<h2 class="tp-title">Perguntas frequentes sobre preços de motos</h2>
<div class="tp-faq">${faqHtml}</div>
</section>
<section class="tp-s tp-see"><span class="tp-eb">Veja também</span><h2 class="tp-title">Outras ferramentas para o motociclista</h2><div class="tp-g"><a class="tp-c" href="/consultar-tabela-fipe/"><b>Tabela FIPE</b><span>Valor médio de mercado da sua moto</span></a><a class="tp-c" href="/licenciamento/"><b>Licenciamento</b><span>Prazos por estado e final da placa</span></a><a class="tp-c" href="/ipva/"><b>IPVA</b><span>Calendário e calculadora por estado</span></a><a class="tp-c" href="/ficha-tecnica-moto/"><b>Fichas técnicas</b><span>Consulte a ficha da sua moto</span></a></div></section>
</div>
<div class="tp-cta"><h2>Quanto vale a sua moto hoje?</h2><p>Consulte grátis o valor médio da tabela FIPE em poucos segundos.</p><a href="/consultar-tabela-fipe/">Consultar tabela FIPE</a></div>
<footer class="tp-foot"><p>Preços públicos sugeridos pelas fabricantes, em ${mesAno}, sem frete e sujeitos a alteração sem aviso. Confirme o valor final na concessionária.</p><p style="margin-top:6px">© DNA Motociclista · <a href="/politica-de-privacidade/">Política de privacidade</a></p></footer>
</div>
<script type="application/ld+json">${ld}</script>
<script>
${js}
</script>
`;
fs.writeFileSync(path.join(D,'page.html'),html);
fs.writeFileSync(path.join(D,'meta.json'),JSON.stringify({data:dataBR,total,marcas:data.length,list:brandSections,brands:brandOpts,cats:catOpts}));
console.log('page.html',html.length,'bytes;',data.length,'marcas;',total,'modelos');
console.log(data.map(b=>b.nome+' '+b.rows.length).join(' | '));
