  // ---- Calendário geral (aba própria na coluna esquerda) ----
  // Todas as peças de todos os clientes. Modos: próximas semanas (padrão, olha para
  // frente), mês, semana e lista. Camadas: publicações (com a situação e o atraso de
  // cada peça, as vagas da rotina, feriados, datas comerciais e campanhas) e produção
  // (o que gravar em cada dia). Arrastar muda a data com as regras de mudancaDeData.
  var AG_ITENS=null,AG_CARREGANDO=false,AG_DIAS=["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
  var AG_ETAPAS=["texto","revisao","aprovacao","ajuste","producao","pronta","publicar","publicada"];
  function agInicioMes(d){return new Date(d.getFullYear(),d.getMonth(),1);}
  function agSegunda(d){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x;}
  function agCor(cid){var c=CLIENTS.filter(function(x){return x.id===cid})[0];return avc(c?c.av:0);}
  function agEditavel(){return !!CAP.db&&!state.clientView&&!document.body.classList.contains("so-leitura");}
  function agClientes(){return Object.keys(DB_CLIENTS).filter(function(id){return !clienteArquivado(id)}).map(function(id){return {id:id,nome:clientName(id)}}).sort(function(a,b){return a.nome.localeCompare(b.nome)});}
  function agDoCache(){
    var out=[];
    agClientes().forEach(function(c){var g=DB_STATE_CACHE[c.id];if(g)(g.calendar.items||[]).forEach(function(it){if(isIsoDate(it.data))out.push({cid:c.id,it:it});});});
    return out;
  }
  async function agCarregar(){
    if(AG_CARREGANDO)return;AG_CARREGANDO=true;
    var out=[];
    for(var c of agClientes()){
      var g=DB_STATE_CACHE[c.id];
      if(g){(g.calendar.items||[]).forEach(function(it){if(isIsoDate(it.data))out.push({cid:c.id,it:it});});continue;}
      try{var snap=await dbItemsCol("cos_calendar",c.id).get();snap.docs.forEach(function(d){var it=d.data();if(it&&isIsoDate(it.data))out.push({cid:c.id,it:it});});}catch(e){}
    }
    AG_ITENS=out;AG_CARREGANDO=false;
    if(state.view==="agenda")renderAgendaGeral();
    if(state.view==="overview")renderHojeOperacao();
  }
  function agHora(o){return itemHora(o.it,rotinaOf(o.cid));}
  // Filtro de clientes, etapa, formato e "só atrasadas", na ordem do dia e da hora.
  function agVisiveis(semEtapa){
    var f=state.agFiltro,hoje=fmtD(new Date());
    return (AG_ITENS||[]).filter(function(o){
      if(f&&f.indexOf(o.cid)<0)return false;
      if(state.agFormato&&(o.it.idea||{}).surface!==state.agFormato)return false;
      if(semEtapa)return true;
      var s=(state.agEtapa||state.agAtrasadas)?situacaoPeca(o.it,o.cid,hoje):null;
      if(state.agEtapa&&(!s||s.etapa!==state.agEtapa))return false;
      if(state.agAtrasadas&&(!s||!s.atraso))return false;
      return true;
    }).sort(function(a,b){return (a.it.data+agHora(a)).localeCompare(b.it.data+agHora(b))});
  }
  function agPorDia(lista){var m={};lista.forEach(function(o){(m[o.it.data]=m[o.it.data]||[]).push(o)});return m;}
  function agEvHtml(o,cheio){
    var it=o.it,x=it.idea||{},s=situacaoPeca(it,o.cid),cls=s?' sit-'+s.etapa+(s.atraso?' atraso':''):'';
    return '<div class="ag-ev'+cls+(cheio?' cheio':'')+'" data-ag-cli="'+esc(o.cid)+'" data-ag-id="'+esc(it.id)+'"'+(agEditavel()?' draggable="true"':'')+' style="--c:'+agCor(o.cid)+'" title="'+esc(pecaTitulo(it)+", "+clientName(o.cid)+(s?", "+s.txt:""))+'">'+
      '<span class="ag-ev-t">'+esc(pecaTitulo(it))+'</span>'+
      '<span class="ag-ev-m">'+(cheio?esc(agHora(o))+' · ':'')+esc(clientName(o.cid))+(cheio?' · '+esc(surfLbl(x.surface)):'')+'</span>'+
      (s?'<span class="ag-sit">'+(s.atraso?'atrasada, ':'')+esc(s.curto)+'</span>':'')+(cheio&&s?'<span class="ag-ev-m ag-sit-txt">'+esc(s.txt)+'</span>':'')+'</div>';
  }
  function agTitulo(ref,modo){
    if(modo==="semana"||modo==="semanas"||modo==="lista"){var ini=agSegunda(ref),fim=new Date(ini);fim.setDate(ini.getDate()+(modo==="semana"?6:modo==="lista"?55:34));
      if(modo!=="semana"&&fmtD(ini)===fmtD(agSegunda(new Date())))return modo==="lista"?"Próximas 8 semanas":"Próximas 5 semanas";
      return ini.getDate()+(ini.getMonth()!==fim.getMonth()?' de '+MESES_LONGOS[ini.getMonth()]:'')+' a '+fim.getDate()+' de '+MESES_LONGOS[fim.getMonth()]+' '+fim.getFullYear();}
    var n=MESES_LONGOS[ref.getMonth()];return n.charAt(0).toUpperCase()+n.slice(1)+' '+ref.getFullYear();
  }
  // Produção: cada peça ainda não publicada grava no dia de produção dela (prazosDe).
  function agProducaoPorDia(lista){var m={};lista.forEach(function(o){if(o.it.status==="PUBLISHED")return;var p=prazosDe(o.it,o.cid);if(!p)return;
    var k=p.producao,g=(m[k]=m[k]||{}),c=(g[o.cid]=g[o.cid]||[]);c.push(o);});return m;}
  // Vagas: dia de postar da rotina, de hoje até a última peça planejada do cliente, sem peça.
  // Depois da última peça não é vaga, é o período que o Cronos ainda vai montar.
  function agVagas(inicio,n,lista){
    var hoje=fmtD(new Date()),ultima={},tem={},out={};
    (AG_ITENS||[]).forEach(function(o){if(!ultima[o.cid]||o.it.data>ultima[o.cid])ultima[o.cid]=o.it.data;tem[o.cid+"|"+o.it.data]=1;});
    var clis=agClientes().filter(function(c){return ultima[c.id]&&(!state.agFiltro||state.agFiltro.indexOf(c.id)>=0)});
    for(var i=0;i<n;i++){var d=new Date(inicio);d.setDate(inicio.getDate()+i);var iso=fmtD(d);if(iso<hoje)continue;
      clis.forEach(function(c){if(iso>ultima[c.id])return;var r=rotinaOf(c.id),dias=(r.diasPost&&r.diasPost.length?r.diasPost:DIAS_PADRAO[3]).map(Number);
        if(dias.indexOf(d.getDay())>=0&&!tem[c.id+"|"+iso])(out[iso]=out[iso]||[]).push(c.id);});}
    return out;
  }
  function agCampanhasDoDia(iso){var out=[];agClientes().forEach(function(c){if(state.agFiltro&&state.agFiltro.indexOf(c.id)<0)return;var cp=campanhaNoDia(c.id,iso);if(cp)out.push({cid:c.id,cp:cp});});return out;}
  function agListaHtml(lista,ref){
    var ini=fmtD(agSegunda(ref)),fim=somaDias(ini,55),sel=lista.filter(function(o){return o.it.data>=ini&&o.it.data<=fim}),h='',sem='';
    if(!sel.length)return '<p class="pp-m" style="margin-top:16px">Nada neste período com esses filtros.</p>';
    h+='<div class="tabela agc-lista"><table><thead><tr><th>Quando</th><th>Cliente</th><th>Peça</th><th>Situação</th><th></th></tr></thead><tbody>';
    sel.forEach(function(o){var it=o.it,s=situacaoPeca(it,o.cid),w=semanaIso(it.data);
      if(w!==sem){h+='<tr class="sem-clique agc-sem"><td colspan="5">Semana de '+esc(dataBR(w))+'</td></tr>';sem=w;}
      h+='<tr data-ag-abrir="'+esc(o.cid)+'|'+esc(it.id)+'"'+(s&&s.atraso?' class="linha-atraso"':'')+'><td class="nowrap">'+esc(dataBR(it.data))+' · '+esc(agHora(o))+'</td>'+
        '<td><span class="agc-cor" style="--c:'+agCor(o.cid)+'"></span>'+esc(clientName(o.cid))+'</td>'+
        '<td><b class="cel-t">'+esc(pecaTitulo(it))+'</b><small>'+esc(surfLbl((it.idea||{}).surface))+'</small></td>'+
        '<td>'+(s?'<span class="chip'+(s.atraso?' warn':s.etapa==="publicada"||s.etapa==="pronta"?' act':'')+'">'+(s.atraso?'atrasada, ':'')+esc(s.curto)+'</span><small>'+esc(s.txt)+'</small>':'')+'</td>'+
        '<td class="acao"><button class="btn">Abrir</button></td></tr>';});
    return h+'</tbody></table></div>';
  }
  function renderAgendaGeral(dir){
    var el=I("#agendaGeral");if(!el)return;
    // A peça arrastada some no redesenho e o dragend pode não chegar: o estado de arrasto zera aqui.
    el.classList.remove("arrastando-algo");
    if(!Object.keys(DB_CLIENTS).length){el.innerHTML=vazioQuadro("Nenhum cliente ainda.","Cadastre um cliente e monte o calendário dele. As peças de todos os clientes aparecem juntas aqui.",'<button class="btn pri" data-ag-ir="clients">Ir para Clientes</button>');agLigar(el);return;}
    if(!AG_ITENS){el.innerHTML='<div class="ag-carregando">Carregando as peças dos clientes</div>';agCarregar();return;}
    var modo=state.agModo||"semanas",camada=state.agCamada||"pub",ref=state.agRef?new Date(state.agRef):new Date(),hoje=fmtD(new Date());
    var lista=agVisiveis(),porDia=agPorDia(lista),base=agVisiveis(true);
    var nAtr=base.filter(function(o){var s=situacaoPeca(o.it,o.cid,hoje);return s&&s.atraso}).length;
    var formatos=[];(AG_ITENS||[]).forEach(function(o){var s=(o.it.idea||{}).surface;if(s&&formatos.indexOf(s)<0)formatos.push(s);});
    var h='<div class="ag-topo"><div class="ag-nav"><h2 class="ag-mes">'+esc(agTitulo(ref,modo))+'</h2>'+
      '<button class="icon-btn sm ag-seta ant" data-ag-passo="-1" aria-label="Anterior">'+iconeUI("seta-cima")+'</button><button class="icon-btn sm ag-seta prox" data-ag-passo="1" aria-label="Próximo">'+iconeUI("seta-cima")+'</button>'+
      '<button class="btn" data-ag-hoje>Hoje</button></div>'+
      '<div class="ag-direita">'+(SB?'<button class="btn" data-ag-assinar>Assinar a agenda da equipe</button>':'')+'<div class="subtabs">'+[["semanas","Próximas semanas"],["mes","Mês"],["semana","Semana"],["lista","Lista"]].map(function(m){return '<button class="sub'+(modo===m[0]?' on':'')+'" data-ag-modo="'+m[0]+'">'+m[1]+'</button>'}).join('')+'</div></div></div>';
    var clis=agClientes();
    if(clis.length>1)h+='<div class="ag-filtro">'+clis.map(function(c){var on=!state.agFiltro||state.agFiltro.indexOf(c.id)>=0;return '<button class="ag-cli'+(on?' on':'')+'" data-ag-cli-f="'+esc(c.id)+'" style="--c:'+agCor(c.id)+'"><i></i>'+esc(c.nome)+'</button>'}).join('')+'</div>';
    h+='<div class="agc-filtros">'+(modo!=="lista"?'<div class="subtabs"><button class="sub'+(camada==="pub"?' on':'')+'" data-ag-camada="pub">Publicações</button><button class="sub'+(camada==="prod"?' on':'')+'" data-ag-camada="prod">Produção</button></div>':'')+
      '<select data-ag-f="etapa" aria-label="Filtrar por etapa"><option value="">Todas as etapas</option>'+AG_ETAPAS.map(function(k){return '<option value="'+k+'"'+(state.agEtapa===k?' selected':'')+'>'+esc(SIT[k][0])+'</option>'}).join('')+'</select>'+
      '<select data-ag-f="formato" aria-label="Filtrar por formato"><option value="">Todos os formatos</option>'+formatos.map(function(s){return '<option value="'+esc(s)+'"'+(state.agFormato===s?' selected':'')+'>'+esc(surfLbl(s))+'</option>'}).join('')+'</select>'+
      '<button class="btn'+(state.agAtrasadas?' pri':'')+'" data-ag-atrasadas aria-pressed="'+(state.agAtrasadas?'true':'false')+'">Atrasadas ('+nAtr+')</button></div>';
    if(modo==="lista"){h+=agListaHtml(lista,ref);el.innerHTML=h;agLigar(el);return;}
    var anim=dir?' ag-anim'+(dir>0?'-d':'-e'):'';
    h+='<div class="ag-grade '+(modo==="semana"?'semana':'mes')+anim+'"><div class="ag-cab">'+AG_DIAS.map(function(d,i){return '<div'+(i>4?' class="fds"':'')+'>'+d+'</div>'}).join('')+'</div><div class="ag-dias">';
    var ini=modo==="mes"?agSegunda(agInicioMes(ref)):agSegunda(ref),n=modo==="semana"?7:modo==="semanas"?35:42,mes=ref.getMonth();
    if(modo==="mes"){var ult=new Date(ref.getFullYear(),mes+1,0);var fimGrade=new Date(ini);fimGrade.setDate(ini.getDate()+35);if(fimGrade>ult)n=35;}
    var prod=camada==="prod"?agProducaoPorDia(lista):null,vagas=camada==="pub"&&!state.agEtapa&&!state.agAtrasadas?agVagas(ini,n,lista):{};
    for(var i=0;i<n;i++){
      var d=new Date(ini);d.setDate(ini.getDate()+i);var iso=fmtD(d),evs=porDia[iso]||[],fora=modo==="mes"&&d.getMonth()!==mes,sel=state.agDia===iso;
      var lim=modo==="semana"?99:3,datas=datasDoDia(iso),camps=agCampanhasDoDia(iso),vg=vagas[iso]||[];
      h+='<div class="ag-dia'+(fora?' fora':'')+(iso===hoje?' hoje':'')+(i%7>4?' fds':'')+(sel?' sel':'')+(iso<hoje?' passado':'')+'" data-ag-dia="'+iso+'">'+
        '<div class="ag-num"><span>'+(d.getDate()===1&&modo!=="semana"?d.getDate()+' '+MESES_LONGOS[d.getMonth()].slice(0,3):d.getDate())+'</span>'+(evs.length?'<i class="ag-conta">'+evs.length+'</i>':'')+'</div>'+
        (datas.length?'<span class="ag-data '+esc(datas[0].tipo)+'" title="'+esc(datas.map(function(x){return x.nome+", "+dataTipoTxt(x)}).join(" · "))+'">'+esc(datas[0].nome)+'</span>':'')+
        camps.map(function(c){var ini1=c.cp.inicio===iso||i===0||d.getDay()===1;return '<span class="ag-camp" style="--c:'+agCor(c.cid)+'" title="Campanha de '+esc(clientName(c.cid))+': '+esc(c.cp.nome)+'">'+(ini1?esc(c.cp.nome):'&nbsp;')+'</span>'}).join('')+
        '<div class="ag-evs">';
      if(prod){var gp=prod[iso]||{};h+=Object.keys(gp).map(function(cid){var ps=gp[cid];return '<div class="ag-ev prod" data-ag-prod="'+esc(cid)+'" style="--c:'+agCor(cid)+'" title="'+esc(ps.map(function(o){return pecaTitulo(o.it)+", vai ao ar "+dataBR(o.it.data)}).join(" · "))+'"><span class="ag-ev-t">Gravar '+ps.length+' peça'+(ps.length>1?'s':'')+'</span><span class="ag-ev-m">'+esc(clientName(cid))+'</span></div>'}).join('');}
      else h+=evs.slice(0,lim).map(function(o){return agEvHtml(o,modo==="semana")}).join('')+(evs.length>lim?'<button class="ag-mais" data-ag-mais="'+iso+'">mais '+(evs.length-lim)+'</button>':'');
      h+=(vg.length?'<button class="ag-vaga" data-ag-mais="'+iso+'" title="Dia de postar sem peça: '+esc(vg.map(clientName).join(", "))+'">'+vg.length+' vaga'+(vg.length>1?'s':'')+'</button>':'')+'</div>'+
        '<div class="ag-pontos">'+evs.slice(0,4).map(function(o){return '<i style="background:'+agCor(o.cid)+'"></i>'}).join('')+'</div></div>';
    }
    h+='</div></div>';
    // Lista do dia escolhido: no celular a grade só mostra pontos, e é aqui que se lê; no computador traz vagas, datas e o que gravar.
    var ds=state.agDia;
    if(ds){var dEv=porDia[ds]||[],dVg=vagas[ds]||[],dDt=datasDoDia(ds),dPr=prod?(prod[ds]||{}):null;
      h+='<div class="ag-lista-dia"><div class="bt">'+esc(dataBR(ds))+'</div>'+
        dDt.map(function(x){return '<p class="pp-m" style="margin:0">'+esc(x.nome)+', '+esc(dataTipoTxt(x))+'</p>'}).join('')+
        agCampanhasDoDia(ds).map(function(c){return '<p class="pp-m" style="margin:0">Campanha de '+esc(clientName(c.cid))+': '+esc(c.cp.nome)+', até '+esc(dataBR(c.cp.fim))+'</p>'}).join('')+
        (dPr?Object.keys(dPr).map(function(cid){return dPr[cid].map(function(o){return '<div class="ag-ev cheio" data-ag-cli="'+esc(cid)+'" data-ag-id="'+esc(o.it.id)+'" style="--c:'+agCor(cid)+'"><span class="ag-ev-t">Gravar: '+esc(pecaTitulo(o.it))+'</span><span class="ag-ev-m">'+esc(clientName(cid))+' · vai ao ar '+esc(dataBR(o.it.data))+'</span></div>'}).join('')}).join(''):dEv.map(function(o){return agEvHtml(o,true)}).join(''))+
        dVg.map(function(cid){return '<div class="ag-vaga-linha"><span>Vaga de <b>'+esc(clientName(cid))+'</b>: dia de postar pela rotina, sem peça.</span><button class="btn" data-ag-ideias="'+esc(cid)+'">Ver ideias</button></div>'}).join('')+'</div>';}
    if(!(AG_ITENS||[]).length)h+='<p class="pp-m" style="margin-top:16px">Nenhuma peça com data ainda. Quando o Cronos distribuir as ideias de um cliente, elas aparecem aqui.</p>';
    el.innerHTML=h;agLigar(el);
  }
  function agLigar(el){
    el.querySelectorAll('[data-ag-ir]').forEach(function(b){b.addEventListener('click',function(){go(b.getAttribute('data-ag-ir'))})});
    var asn=el.querySelector('[data-ag-assinar]');if(asn)asn.addEventListener('click',function(){abrirLinkPublico("agenda",null);});
    el.querySelectorAll('[data-ag-passo]').forEach(function(b){b.addEventListener('click',function(){
      var p=+b.getAttribute('data-ag-passo'),ref=state.agRef?new Date(state.agRef):new Date(),modo=state.agModo||"semanas";
      if(modo==="mes")ref=new Date(ref.getFullYear(),ref.getMonth()+p,1);else ref.setDate(ref.getDate()+7*p);
      state.agRef=ref.getTime();state.agDia=null;renderAgendaGeral(p);})});
    var hj=el.querySelector('[data-ag-hoje]');if(hj)hj.addEventListener('click',function(){var velho=state.agRef;state.agRef=null;state.agDia=fmtD(new Date());renderAgendaGeral(velho&&velho<Date.now()?1:velho?-1:0);});
    el.querySelectorAll('[data-ag-modo]').forEach(function(b){b.addEventListener('click',function(){state.agModo=b.getAttribute('data-ag-modo');renderAgendaGeral();})});
    el.querySelectorAll('[data-ag-camada]').forEach(function(b){b.addEventListener('click',function(){state.agCamada=b.getAttribute('data-ag-camada');renderAgendaGeral();})});
    el.querySelectorAll('[data-ag-f]').forEach(function(s){s.addEventListener('change',function(){if(s.getAttribute('data-ag-f')==="etapa")state.agEtapa=s.value||null;else state.agFormato=s.value||null;renderAgendaGeral();})});
    var at=el.querySelector('[data-ag-atrasadas]');if(at)at.addEventListener('click',function(){state.agAtrasadas=!state.agAtrasadas;renderAgendaGeral();});
    el.querySelectorAll('[data-ag-cli-f]').forEach(function(b){b.addEventListener('click',function(){
      var id=b.getAttribute('data-ag-cli-f'),todos=agClientes().map(function(c){return c.id}),f=state.agFiltro?state.agFiltro.slice():todos.slice(),i=f.indexOf(id);
      if(i>=0)f.splice(i,1);else f.push(id);
      state.agFiltro=f.length===todos.length||!f.length?null:f;renderAgendaGeral();})});
    el.querySelectorAll('[data-ag-abrir]').forEach(function(tr){tr.addEventListener('click',function(){var v=tr.getAttribute('data-ag-abrir').split("|");agAbrir(v[0],v[1]);})});
    el.querySelectorAll('[data-ag-ideias]').forEach(function(b){b.addEventListener('click',function(){setClient(b.getAttribute('data-ag-ideias'));go("ideas");})});
    el.querySelectorAll('[data-ag-prod]').forEach(function(ev){ev.addEventListener('click',function(e){e.stopPropagation();state.agDia=ev.closest('.ag-dia').getAttribute('data-ag-dia');renderAgendaGeral();})});
    el.querySelectorAll('.ag-ev[data-ag-id]').forEach(function(ev){
      ev.addEventListener('click',function(e){e.stopPropagation();agAbrir(ev.getAttribute('data-ag-cli'),ev.getAttribute('data-ag-id'));});
      ev.addEventListener('dragstart',function(e){e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",ev.getAttribute('data-ag-cli')+"|"+ev.getAttribute('data-ag-id'));ev.classList.add('arrastando');el.classList.add('arrastando-algo');});
      ev.addEventListener('dragend',function(){ev.classList.remove('arrastando');el.classList.remove('arrastando-algo');el.querySelectorAll('.ag-dia.alvo').forEach(function(d){d.classList.remove('alvo')});});
    });
    el.querySelectorAll('.ag-dia').forEach(function(dia){
      dia.addEventListener('click',function(){state.agDia=state.agDia===dia.getAttribute('data-ag-dia')?null:dia.getAttribute('data-ag-dia');renderAgendaGeral();});
      if(!agEditavel())return;
      dia.addEventListener('dragover',function(e){e.preventDefault();e.dataTransfer.dropEffect="move";dia.classList.add('alvo');});
      dia.addEventListener('dragleave',function(e){if(!dia.contains(e.relatedTarget))dia.classList.remove('alvo');});
      dia.addEventListener('drop',function(e){e.preventDefault();dia.classList.remove('alvo');var v=(e.dataTransfer.getData("text/plain")||"").split("|");if(v.length===2)agMover(v[0],v[1],dia.getAttribute('data-ag-dia'));});
    });
    el.querySelectorAll('[data-ag-mais]').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();state.agDia=b.getAttribute('data-ag-mais');renderAgendaGeral();var l=el.querySelector('.ag-lista-dia');if(l)l.scrollIntoView({behavior:"smooth",block:"nearest"});})});
  }
  async function agMover(cid,id,novaData){
    var o=(AG_ITENS||[]).filter(function(x){return x.cid===cid&&x.it.id===id})[0];if(!o||o.it.data===novaData)return;
    var m=mudancaDeData(cid,o.it,novaData);if(!m){renderAgendaGeral();return;}
    var antes={};Object.keys(m.patch).forEach(function(k){antes[k]=o.it[k];});
    function aplica(p){Object.assign(o.it,p);var g=DB_STATE_CACHE[cid];if(g)(g.calendar.items||[]).forEach(function(it){if(it.id===id&&it!==o.it)Object.assign(it,p);});}
    aplica(m.patch);renderAgendaGeral();
    try{await dbItemsCol("cos_calendar",cid).doc(id).update(m.patch);
      toast(pecaTitulo(o.it)+" foi para "+dataBR(novaData)+"."+(m.patch.clientStatus===null?" A aprovação do cliente foi reaberta.":"")+(m.avisos.length?" Atenção: "+m.avisos.join("; ")+".":""));}
    catch(e){aplica(antes);renderAgendaGeral();toast("Não consegui mover a peça. Tente de novo.");}
  }
  // Abrir uma peça de qualquer cliente: carrega o cliente, abre a mesma gaveta do calendário dele.
  async function agAbrir(cid,id){
    if(state.client!==cid){state.client=cid;GENERATED=await loadDbClientState(cid);setClient(cid);}
    var itens=(GENERATED&&GENERATED.calendar&&GENERATED.calendar.items)||[],idx=-1;
    itens.forEach(function(it,i){if(it.id===id)idx=i;});
    if(idx<0)return;
    openGenerated(idx);
    var ov=I("#overlay");if(!ov||ov._agObs)return;
    // Fechou a gaveta: troca as peças do cliente editado (sem lista, recarrega tudo).
    ov._agObs=new MutationObserver(function(){if(ov.children.length)return;
      if(state.view!=="agenda"&&state.view!=="overview")return;
      AG_ITENS=AG_ITENS?agMesclar():null;
      if(state.view==="agenda")renderAgendaGeral();else renderHojeOperacao();});
    ov._agObs.observe(ov,{childList:true});
  }
  // Depois de editar na gaveta, o cache do cliente tem a versão nova: troca só as peças dele.
  function agMesclar(){
    var doCache=agDoCache(),comCache={};doCache.forEach(function(o){comCache[o.cid]=1});
    return doCache.concat((AG_ITENS||[]).filter(function(o){return !comCache[o.cid]}));
  }
