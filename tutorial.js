(()=>{
'use strict';
const $=s=>document.querySelector(s),key='neoortho.tutorial.v1.seen';
let handled=false;try{handled=localStorage.getItem(key)==='yes';}catch{}
const remember=()=>{handled=true;try{localStorage.setItem(key,'yes');}catch{}};
const visible=e=>!!e&&!e.closest('[hidden]')&&e.getBoundingClientRect().width>0;
const context=()=>visible($('#collaboratorsView'))?'people':visible($('#functionsView'))?'module':visible($('#menuView'))?'menu':null;
const pickVisible=(root,selectors)=>{for(const sel of selectors){const found=root.matches?.(sel)?root:root.querySelector?.(sel);if(visible(found))return found;}return null;};
function resolveTarget(el){
  if(!el)return null;
  if(el.id==='collabRows'){
    const selected=pickVisible(el,['.team-person.selected','.collab-row.selected','[aria-selected="true"]','.selected']);
    if(selected)return selected;
    const firstItem=pickVisible(el,['.team-person','.collab-row','button,[role="button"]']);
    if(firstItem)return firstItem;
  }
  if(el.matches('input,textarea,select')){
    return el.closest('.team-search,.field,.toolbar,.input,.search-input,.search-shell,.control,.input-wrap,.filter-shell')||el;
  }
  if(el.matches('.team-tab,[role="tab"]')) return el;
  if(el.matches('button,.access-card,.shortcut-actions button,[role="button"]')) return el;
  if(el.matches('.metrics,.table-scroll,.empty-state,.bi-grid,.audit-list,.team-filter-row')) return el;
  if(el.matches('.work-heading,h1,h2,h3,h4,h5,h6')){
    return el.closest('.work-heading,.team-header,.portal-hero,.workspace-side')||el;
  }
  const direct=pickVisible(el,[
    '.team-search','.field','.toolbar','.metrics','.table-scroll','.empty-state','.bi-grid','.audit-list',
    '.team-filter-row','.team-tab','button','.access-card','.shortcut-actions button','[role="button"]'
  ]);
  if(direct)return direct;
  const container=el.closest('.team-search,.field,.toolbar,.metrics,.table-scroll,.empty-state,.bi-grid,.audit-list,.team-filter-row,.team-tab,button,.access-card,.shortcut-actions button,[role="button"],.work-heading,.team-header,.portal-hero,.workspace-side');
  return visible(container)?container:el;
}
function parseColor(value){
  if(!value)return null;
  const v=String(value).trim().toLowerCase();
  if(v==='transparent'||v==='none'||v==='initial'||v==='inherit')return null;
  if(v.startsWith('#')){
    let h=v.slice(1);
    if(h.length===3||h.length===4)h=[...h].map(c=>c+c).join('');
    if(h.length===6)return {r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16),a:1};
    if(h.length===8)return {r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16),a:parseInt(h.slice(6,8),16)/255};
  }
  const m=v.match(/rgba?\(([^)]+)\)/);
  if(m){
    const parts=m[1].split(',').map(x=>x.trim());
    const num=x=>x.endsWith('%')?parseFloat(x)*2.55:parseFloat(x);
    if(parts.length>=3)return {r:num(parts[0]),g:num(parts[1]),b:num(parts[2]),a:parts.length>3?parseFloat(parts[3]):1};
  }
  return null;
}
function isVeryLightColor(value){
  const c=parseColor(value);
  if(!c||c.a===0)return false;
  const lum=(0.299*c.r)+(0.587*c.g)+(0.114*c.b);
  return lum>=230;
}
const tutorialTextColor='#4f4459';
function currentTarget(){return resolveTarget($(steps[index]?.selector));}
function getHighlightPadding(el,isButtonLike){
  if(!el)return 0;
  if(isButtonLike) return 0;
  if(el.matches('input,textarea,select,.team-search,.field,.toolbar,.team-filter-row,.metrics,.table-scroll,.empty-state,.bi-grid,.audit-list')) return 0;
  if(el.matches('.team-person,.collab-row,[aria-selected="true"],.selected,.team-tab,[role="tab"]')) return 0;
  if(el.matches('h1,h2,h3,h4,h5,h6,.work-heading,.portal-hero,.team-header,.workspace-side')) return 8;
  return 6;
}

const popup=document.createElement('dialog');popup.id='welcomeTutorial';popup.innerHTML='<div class="guide-eyebrow">BEM-VINDO AO PORTAL</div><h2>Quer conhecer o caminho?</h2><p>Um passeio rápido mostra onde encontrar cada função. Você pode avançar no seu ritmo e sair quando quiser.</p><p class="guide-note">Depois, o botão Tutorial continua disponível no menu e em cada aba.</p><div class="guide-actions"><button id="skipWelcome" type="button">Agora não</button><button id="startWelcome" type="button" class="guide-primary">Sim, mostrar tutorial →</button></div>';
document.body.append(popup);
// Um único diálogo modal mantém o teclado no tutorial. O recorte ilumina o botão sem executá-lo.
const tour=document.createElement('dialog');tour.id='guidedTour';tour.setAttribute('aria-label','Tutorial guiado');tour.innerHTML='<div id="guideMask" aria-hidden="true"></div><div id="guideClone" aria-hidden="true"></div><div id="guideSpot" aria-hidden="true"></div><section id="guideCard"><div class="guide-top"><span id="guideCount"></span><button id="closeGuide" aria-label="Fechar tutorial" type="button">✕</button></div><div id="guideText" aria-live="polite" aria-atomic="true"><h2 id="guideTitle"></h2><p id="guideDescription"></p></div><div class="guide-progress" aria-hidden="true"><i id="guideProgress"></i></div><div class="guide-actions"><button id="guideBack" type="button">← Anterior</button><button id="guideNext" type="button" class="guide-primary">Próximo →</button></div></section>';
document.body.append(tour);
let steps=[],index=0,returnFocus=null,scrollMemory=0,activeContext=null;
const step=(selector,title,text)=>({selector,title,text});
function buildSteps(c){
if(c==='menu')return [
step('#menuHeading','Seu menu principal','Este é o ponto de partida. Pessoas e Estrutura organizam os acessos por assunto.'),
step('[data-module="Colaboradores"]','Colaboradores','Abra a lista da equipe. Escolha uma pessoa para ver o perfil, editar os dados e consultar o acompanhamento.'),
step('[data-module="Férias e ausências"]','Férias e ausências','Registre períodos e veja sobreposições na mesma área e turno. A cobertura mostra quantas pessoas estarão disponíveis na data escolhida.'),
step('[data-module="Avaliações e feedbacks"]','Avaliações e feedbacks','Registre o contexto de cada ocorrência e sua variação na nota. A pontuação é apoio à análise, com escala de zero a dez.'),
step('[data-module="Máquinas e equipamentos"]','Máquinas e equipamentos','Cadastre identificação, área, turnos de utilização e recursos vinculados aos equipamentos.'),
step('[data-module="Dimensionamento de equipe"]','Dimensionamento de equipe','Compare operadores disponíveis e necessários. A regra considera um operador para cada três máquinas por área e turno.'),
step('[data-module="Áreas de apoio"]','Áreas de apoio','Planeje o quadro das áreas de suporte e registre a máquina vinculada e a justificativa.'),
step('[data-module="Indicadores"]','Indicadores','Consulte os resumos de pessoas, máquinas, ausências e distribuição da equipe.'),
step('[data-module="Histórico de alterações"]','Histórico de alterações','Consulte inclusões, alterações e exclusões feitas nesta demonstração.'),
step('#logout','Encerrar acesso','Sair retorna à tela de login demonstrativo. Nesta versão, recarregar a página apaga as alterações feitas nos cadastros.'),
step('#menuView [data-help]','Rever quando precisar','Use Tutorial para repetir este passeio. Cada aba também oferece seu próprio tutorial.')];
if(c==='people')return [
step('#collabHeading','Conheça sua equipe','A lista fica de um lado e o perfil da pessoa selecionada do outro. Os registros iniciais são exemplos da prévia.'),
step('#collabSearch','Encontre uma pessoa','Pesquise por nome, matrícula, área, turno ou cargo. Use Ctrl+K no Windows para ir direto à busca.'),
step('.team-filter-row','Filtre a lista','Escolha todos, ativos ou ausentes para reduzir a lista exibida.'),
step('#collabRows','Selecione o colaborador','Clique em uma pessoa para atualizar o perfil ao lado. O destaque indica quem está selecionado.'),
step('#newCollaborator','Adicionar colaborador','Abre o formulário de cadastro. Preencha os campos obrigatórios e salve o registro.'),
step('#editCollaborator','Editar dados','Altera os dados da pessoa selecionada. Confira o nome antes de salvar.'),
step('.team-tab[data-tab="overview"]','Visão geral','Mostra as informações do perfil selecionado.'),
step('.team-tab[data-tab="journey"]','Jornada','Esta seção ainda apresenta eventos demonstrativos. Não representa um registro real de ponto.'),
step('.team-tab[data-tab="development"]','Desenvolvimento','Os níveis de competências desta seção ainda são exemplos visuais.'),
step('#historyCollaborator','Acompanhamento','Consulta o perfil e os registros de acompanhamento disponíveis nesta versão.'),
step('#backToMenu','Voltar ao portal','Retorna ao menu principal para abrir outra área.')];
const title=$('#workspace h1')?.textContent||'Esta aba';
return [step('#workspace .work-heading',title,'Esta tela reúne as ações e informações deste assunto. Os registros desta prévia ficam apenas na sessão atual.'),
step('#add','Novo registro','Abre o formulário desta área. Campos com asterisco são obrigatórios. Cadastre primeiro as pessoas ou máquinas necessárias aos vínculos.'),
step('#workspace .metrics','Resumo da área','Os totais refletem os registros cadastrados. Eles não são alterados pelo filtro da lista.'),
step('#searchRecords','Pesquisar registros','Digite um termo para localizar registros na lista desta aba.'),
step('#areaFilter','Filtrar área','Escolha uma área para exibir apenas os registros relacionados.'),
step('#workspace .table-scroll','Consultar e editar','Consulte as linhas. Quando disponíveis, use Editar para corrigir e × para excluir; a exclusão pede confirmação.'),
step('#workspace .empty-state','Começar o cadastro','Sem registros ainda. Use o botão de adicionar para iniciar; as outras informações serão preenchidas a partir dos cadastros.'),
step('#export','Exportar lista','Baixa um CSV com as colunas da lista e os registros que atendem aos filtros atuais.'),
step('#coverageDate','Cobertura da equipe','Escolha uma data para conferir os totais de pessoas, ausentes e disponíveis por área e turno.'),
step('#sizingDate','Data do planejamento','Selecione a data usada para considerar o vínculo e as ausências dos operadores.'),
step('#future','Simular aquisições','Marque esta opção para incluir também as máquinas planejadas no cálculo de operadores necessários.'),
step('#sizingResult','Comparar necessidade e disponibilidade','Saldo negativo indica falta de operadores; saldo positivo indica excedente. O cálculo é por área e turno.'),
step('#exportSizing','Exportar planejamento','Baixa a comparação do cenário selecionado em CSV.'),
step('#workspace .bi-grid','Ler os indicadores','Compare a distribuição por turno, cargo e área. Os resumos usam os registros da sessão.'),
step('#workspace .audit-list','Consultar alterações','Abra um evento para conferir os valores antes e depois. O responsável é simulado nesta prévia.'),
step('#exportAudit','Exportar histórico','Baixa os eventos do histórico em um arquivo JSON.'),
step('#backup','Guardar uma cópia','Baixa os dados da sessão em JSON. Esta versão ainda não possui reimportação; recarregar a página apaga as alterações.'),
step('#home','Voltar ao menu','Retorna ao portal. O tutorial desta aba continua disponível no cabeçalho.')];
}
function installHelp(root,slot,c){if(!root||root.querySelector('[data-help]'))return;const container=root.querySelector(slot);if(!container)return;const b=document.createElement('button');b.type='button';b.className='tutorial-help';b.dataset.help=c;b.innerHTML='<span aria-hidden="true">?</span> Tutorial';b.setAttribute('aria-label',c==='menu'?'Tutorial do menu':'Tutorial desta aba');b.onclick=()=>start(c);container.append(b);}
function refresh(){installHelp($('#menuView'),'.portal-account','menu');installHelp($('#collaboratorsView'),'.portal-account','people');installHelp($('#functionsView'),'.portal-account','module');if(!handled&&context()==='menu'&&!popup.open&&!tour.open&&!document.querySelector('dialog[open]')){popup.showModal();}if(tour.open&&context()!==activeContext)finish();}
function start(c){if(popup.open)popup.close();remember();steps=buildSteps(c).filter(s=>visible($(s.selector)));if(!steps.length)return;returnFocus=document.activeElement;scrollMemory=$('#nextScreen').scrollTop;activeContext=c;index=0;document.body.classList.add('tutorial-active');tour.showModal();paint();$('#guideNext').focus();}
function finish(){document.body.classList.remove('tutorial-active');if(!tour.open)return;const clone=$('#guideClone');if(clone)clone.innerHTML='';tour.close();$('#nextScreen').scrollTop=scrollMemory;const focus=visible(returnFocus)?returnFocus:document.querySelector(`[data-help="${context()}"]`);focus?.focus({preventScroll:true});}
function paint(){const st=steps[index],el=currentTarget();if(!visible(el)){steps.splice(index,1);if(!steps.length)return finish();index=Math.min(index,steps.length-1);return paint();}$('#guideTitle').textContent=st.title;$('#guideDescription').textContent=st.text;$('#guideCount').textContent=`PASSO ${index+1} DE ${steps.length}`;$('#guideProgress').style.width=((index+1)/steps.length*100)+'%';$('#guideBack').disabled=index===0;$('#guideNext').textContent=index===steps.length-1?'Concluir ✓':'Próximo →';el.scrollIntoView({block:'center',inline:'nearest',behavior:'auto'});requestAnimationFrame(position);} 
function position(){
if(!tour.open)return;
const el=currentTarget();if(!el)return;
const r=el.getBoundingClientRect(),spot=$('#guideSpot'),card=$('#guideCard'),vw=innerWidth,vh=innerHeight;
const targetStyle=getComputedStyle(el);
const explicitRadius=(targetStyle.borderRadius&&targetStyle.borderRadius!=='0px')?targetStyle.borderRadius:'';
const isButtonLike=el.matches('button,.access-card,.shortcut-actions button,[role="button"]');
const highlightPadding=getHighlightPadding(el,isButtonLike);
const radius=explicitRadius||(isButtonLike?'14px':'18px');

// Padroniza o destaque visual. Botões/cards usam a caixa exata do elemento.
// Títulos e textos curtos recebem uma folga pequena para não encostar nas letras.
const left=Math.max(1,r.left-highlightPadding),top=Math.max(1,r.top-highlightPadding),right=Math.min(vw-1,r.right+highlightPadding),bottom=Math.min(vh-1,r.bottom+highlightPadding);
const spotWidth=Math.max(0,right-left),spotHeight=Math.max(0,bottom-top);
Object.assign(spot.style,{left:left+'px',top:top+'px',width:spotWidth+'px',height:spotHeight+'px',borderRadius:radius});

// O blur cobre a tela inteira. Em seguida desenhamos uma cópia do alvo exatamente
// no mesmo tamanho da área destacada. Assim, tudo o que estiver dentro da borda
// roxa fica branco e com as mesmas dimensões do destaque.
const mask=$('#guideMask');
Object.assign(mask.style,{left:'0px',top:'0px',width:vw+'px',height:vh+'px'});
const cloneHost=$('#guideClone');
cloneHost.innerHTML='';
cloneHost.className=''; cloneHost.classList.add('guide-clone-white'); if(isButtonLike) cloneHost.classList.add('button-like');
Object.assign(cloneHost.style,{left:left+'px',top:top+'px',width:spotWidth+'px',height:spotHeight+'px',borderRadius:radius});
const clone=el.cloneNode(true);
clone.removeAttribute('id');
clone.setAttribute('aria-hidden','true');
clone.classList.add('guide-clone-base'); if(isButtonLike)clone.classList.add('guide-clone-buttonlike');
const cloneOffsetX=r.left-left, cloneOffsetY=r.top-top;
const copyComputed=(src,dst)=>{
  const cs=getComputedStyle(src);
  for(const prop of cs){
    try{dst.style.setProperty(prop,cs.getPropertyValue(prop),cs.getPropertyPriority(prop));}catch{}
  }
  if(isVeryLightColor(cs.color))dst.style.color=tutorialTextColor;
  if(isVeryLightColor(cs.caretColor))dst.style.caretColor=tutorialTextColor;
  if(isVeryLightColor(cs.fill))dst.style.fill=tutorialTextColor;
  if(isVeryLightColor(cs.stroke))dst.style.stroke=tutorialTextColor;
  if(src.matches?.('input,textarea,select,button,[role="button"],label,span,strong,small,p,h1,h2,h3,h4,h5,h6,td,th,dd,dt,a')){
    if(!cs.color || isVeryLightColor(cs.color))dst.style.color=tutorialTextColor;
  }
  const sc=[...src.children],dc=[...dst.children];
  for(let i=0;i<Math.min(sc.length,dc.length);i++)copyComputed(sc[i],dc[i]);
};
copyComputed(el,clone);
Object.assign(clone.style,{position:'absolute',left:cloneOffsetX+'px',top:cloneOffsetY+'px',width:r.width+'px',height:r.height+'px',margin:'0',pointerEvents:'none',boxSizing:'border-box',transform:'none',filter:'none',opacity:'1'});
cloneHost.append(clone);

const cw=Math.min(390,vw-24);card.style.width=cw+'px';card.style.maxHeight='calc(100dvh - 24px)';
const ch=card.offsetHeight;
// Posição padronizada: no menu, a fileira de Pessoas sempre explica por baixo
// e a fileira de Estrutura sempre explica por cima. Nunca troca para os lados.
const workspace=el.closest('.workspace');
let placement;
if(workspace?.classList.contains('workspace-people'))placement='below';
else if(workspace?.classList.contains('workspace-structure'))placement='above';
else placement=(r.top+r.height/2)<=(vh/2)?'below':'above';

let x=r.left+(r.width-cw)/2;
x=Math.max(12,Math.min(vw-cw-12,x));
let y=placement==='below'?bottom+16:top-ch-16;
// Se a tela for pequena, mantém o eixo vertical escolhido e apenas limita o painel
// à área visível; ele não pula mais para a esquerda/direita do item destacado.
y=Math.max(12,Math.min(vh-ch-12,y));
card.dataset.placement=placement;
card.style.left=x+'px';card.style.top=y+'px';
}
$('#guideNext').onclick=()=>{if(index===steps.length-1)finish();else{index++;paint();}};$('#guideBack').onclick=()=>{if(index){index--;paint();}};$('#closeGuide').onclick=finish;tour.addEventListener('cancel',e=>{e.preventDefault();finish();});popup.addEventListener('cancel',remember);$('#skipWelcome').onclick=()=>{remember();popup.close();};$('#startWelcome').onclick=()=>start('menu');window.addEventListener('resize',position);$('#nextScreen').addEventListener('scroll',position,{passive:true});
// Só observa mudanças de tela e recriação dos cabeçalhos, sem monitorar o próprio tutorial.
let scheduled=false;new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;refresh();});}}).observe($('#nextScreen'),{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});refresh();
})();
