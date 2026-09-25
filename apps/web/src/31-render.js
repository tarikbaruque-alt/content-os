  // ---------- render ----------
  function buildNav(){
    var CURTO={agenda:"Agenda",config:"Ajustes"};
    var item=function(it){return '<a data-view="'+it[0]+'"><span class="ni">'+(iconeUI(NAV_ICONE[it[0]])||IC[it[0]]||"")+'</span><span class="nl">'+esc(it[1])+'</span>'+(CURTO[it[0]]?'<span class="nl-c">'+CURTO[it[0]]+'</span>':'')+'<b class="nav-n" hidden></b></a>'};
    if(state.clientView){I("#nav").innerHTML=CLIENT_NAV[0].items.map(item).join('');I("#nav2").innerHTML="";}
    else{I("#nav").innerHTML=NAV[0].items.map(item).join('');I("#nav2").innerHTML=NAV2.map(item).join('');}
    Array.prototype.forEach.call(document.querySelectorAll('.side .nav a'),function(a){a.addEventListener('click',function(){var v=a.getAttribute('data-view');go(v==="clients"&&!state.clientView?"clients":v)})});
    var lg=I("#logoMark");if(lg&&!lg.innerHTML)lg.innerHTML=iconeUI("logomark");
    marcarNav(state.view);
    if(typeof atualizarContadorPropostas==="function")atualizarContadorPropostas();
  }
  function marcarNav(v){
    var alvo=state.clientView?v:(abaDoCliente(v)||v==="ativos"?"clients":v==="propostas"?"overview":v);
    Array.prototype.forEach.call(document.querySelectorAll('.side .nav a'),function(a){a.classList.toggle('active',a.getAttribute('data-view')===alvo)});
  }
  // Cabeçalho da página do cliente: troca de cliente + abas das etapas + sub-abas.
  function renderCliHead(v){
    var h=I("#cliHead"),aba=abaDoCliente(v),naLista=(v==="clients"||v==="ativos");
    var mostra=!state.clientView&&((aba&&state.client)||naLista);
    h.hidden=!mostra;I("#clientview").hidden=!(aba&&state.client&&!state.clientView);
    I("#clientSwitch").hidden=!aba;
    if(!mostra){return;}
    if(naLista){
      I("#cliTabs").innerHTML='<nav class="tabs" aria-label="Clientes">'+CLIENTES_TABS.map(function(t){return '<button class="tab'+(t[0]===v?' on':'')+'" data-tab-ir="'+t[0]+'">'+esc(t[1])+'</button>'}).join('')+'</nav>';
      I("#cliSub").innerHTML="";
    }else{
      I("#cliTabs").innerHTML=trilhoHtml(state.client,v);
      var subs=PLANEJAR_SUBS.indexOf(v)>=0?PLANEJAR_SUBS:[];
      I("#cliSub").innerHTML=(subs.length?subs.map(function(x){return '<button class="sub'+(x===v?' on':'')+'" data-tab-ir="'+x+'">'+esc(SUB_LBL[x]||x)+'</button>'}).join(''):'')+
        (v==="operacao"?'<span class="pp-m">O que os agentes fizeram para este cliente.</span>':'');
      I("#cliFaixa").innerHTML=faixaHtml(state.client);
      ligarProcesso(h);
    }
    I("#cliFaixa").hidden=naLista;I("#comoRoda").hidden=naLista;
    Array.prototype.forEach.call(h.querySelectorAll('[data-tab-ir]:not(.tr-et)'),function(b){b.addEventListener('click',function(){go(b.getAttribute('data-tab-ir'))})});
    if(!naLista&&aba)ligarTrilho(h);
  }
  // Dispatca a renderização da view v, usado por go() e também por
  // setClient() quando o estado de um cliente real termina de carregar do db
  // (assíncrono), sem duplicar a lista de views em dois lugares.
  function renderView(v){
    if(v==="dna")renderDNA(); if(v==="strategy")renderStrategy(); if(v==="research")renderResearch(); if(v==="editorial")renderEditorial(); if(v==="ideas")renderIdeas(); if(v==="formats")renderFormats(); if(v==="analyze")renderAnalyze(); if(v==="distribution")renderDistribution(); if(v==="plan")renderPlan(); if(v==="config")renderConfig();
    if(v==="agenda")renderAgendaGeral(); if(v==="dashboard")renderDashboard(); if(v==="content")renderContentList(); if(v==="calendar")renderCal(); if(v==="approvals")renderApprovals(); if(v==="performance")renderPerf(); if(v==="propostas")renderPropostas(); if(v==="agents")renderAgents(); if(v==="operacao")renderOperacao(); if(v==="clients")renderClients(); if(v==="overview"){renderKpis();renderOverviewContent();renderCobrancaBanner();renderBackupBanner();} if(v==="ativos")renderAtivos();
    renderStatus(v);
  }
  function go(v){
    if(state.clientView&&["overview","strategy","editorial","formats","content","calendar"].indexOf(v)<0)v="overview";
    if(v==="agenda"&&state.view!=="agenda")AG_ITENS=null;
    state.view=v;
    marcarNav(v);
    var aba=abaDoCliente(v),needs=!!aba||["plan","content","analyze","distribution"].indexOf(v)>=0,noCli=needs&&!state.client;
    Array.prototype.forEach.call(document.querySelectorAll('.view'),function(s){s.hidden=noCli||s.getAttribute('data-view')!==v});
    var nh=I("#noClientHero");if(nh)nh.hidden=!noCli;
    var t=TITLES[v]||["",v];
    if(aba&&state.client&&!state.clientView){I("#crumb").textContent="Clientes";I("#ptitle").textContent=clientName(state.client);}
    else{I("#crumb").textContent=t[0]==="Trabalho"||t[0]==="Fluxo"||t[0]==="Sistema"?"":t[0];I("#ptitle").textContent=t[1];}
    renderCliHead(v);
    // "Novo cliente" só onde se cuida da carteira: nas outras telas o botão roxo é o do processo.
    var nb=I("#newClientBtn");if(nb)nb.hidden=!(v==="clients"||v==="ativos"||!CLIENTS.length)||state.clientView;
    var ri=I("#comoRodaIc");if(ri&&!ri.innerHTML)ri.innerHTML=iconeUI("settings");
    if(!noCli)renderView(v);else renderStatus(v);
    window.scrollTo({top:0});
  }
  function renderPipe(){if(!I("#pipe"))return;I("#pipe").innerHTML=PIPE.map(function(s,i){return '<span class="step'+(i===0?' on':'')+'">'+s+'</span>'+(i<PIPE.length-1?'<span class="arr">→</span>':'')}).join('')}
  function kpiCard(l,v,s){return '<div class="stat"><span class="st-l">'+l+'</span><div class="st-v tnum">'+v+'</div>'+(s?'<div class="st-s">'+s+'</div>':'')+'</div>'}
  // Hoje: três números do cliente em foco. Cada um responde "o que eu preciso fazer?".
  function renderKpis(){
    var el=I("#kpis");if(!el)return;
    var itens=genOn()?GENERATED.calendar.items:[],hoje=new Date().toISOString().slice(0,10),em7=new Date(Date.now()+7*864e5).toISOString().slice(0,10);
    var pend=(typeof PROPOSTAS!=="undefined"?PROPOSTAS:[]).filter(function(p){return p.status==="pendente"}).length;
    var aprovar=itens.filter(function(it){return (it.status==="WAITING APPROVAL"||it.status==="REVIEW")&&(it.content||it.carousel||it.stories)}).length;
    var semana=itens.filter(function(it){return it.data>=hoje&&it.data<=em7}).length;
    el.innerHTML=kpiCard("Propostas dos agentes",String(pend),pend?"esperando sua decisão":"nada esperando")+
      kpiCard("Peças para aprovar",String(aprovar),state.client?esc(clientName(state.client)):"escolha um cliente")+
      kpiCard("Posts nos próximos 7 dias",String(semana),state.client?esc(clientName(state.client)):"");
  }
  function contentCard(x){
    return '<div class="card content-card" data-content="'+x.id+'"><div class="cc-h">'+esc(x.headline)+'</div><div class="cc-m">'+esc(clientName(x.client))+' · '+esc(x.surface)+' + '+esc(x.format)+'</div><div class="cc-tags"><span class="badge '+(STCOL[x.status]||'badge')+'">'+x.status+'</span><span class="pill st-INSIGHT">'+esc(x.funcao)+'</span><span class="pill emo-pill">♥ '+esc(x.emocao)+'</span></div></div>';
  }
  function wireContent(sel){Array.prototype.forEach.call(document.querySelectorAll(sel),function(el){el.addEventListener('click',function(){openContent(el.getAttribute('data-content'))})})}
  function renderOverviewContent(){
    var ov=I("#ovSteps");
    if(ov){
      ov.innerHTML=!CLIENTS.length?'<div class="card empty-hero"><div class="eh-t" style="margin-bottom:14px">Cadastre o primeiro cliente. A Íris lê o briefing, e o planejamento do mês começa em cadeia: estratégia, linha editorial, ideias e calendário.</div><button class="btn pri" id="ovNewClient">Novo cliente</button></div>':nextStepsHtml();
      var nb=I("#ovNewClient");if(nb)nb.addEventListener('click',openNewClientModal);
      wireSteps(ov);
    }
    if(typeof renderMaestroChat==="function")renderMaestroChat();
    if(typeof renderBriefingAviso==="function")renderBriefingAviso();
    if(typeof renderPropostasResumo==="function")renderPropostasResumo();
    var oc=I("#ovContent");if(!oc)return;
    var hoje=new Date().toISOString().slice(0,10),prox=genOn()?GENERATED.calendar.items.map(function(it,i){return {it:it,i:i}}).filter(function(o){return !o.it.data||o.it.data>=hoje}).slice(0,4):[];
    oc.innerHTML=pecasTabelaHtml(prox,state.client?'Nenhuma publicação marcada.':'Escolha um cliente para ver as publicações.');
    wireGen('#ovContent [data-gen]');
    var ir=document.querySelector('[data-ir="calendar"]');if(ir&&!ir._ok){ir._ok=1;ir.addEventListener('click',function(){if(state.client)go("calendar");else go("clients");});}
  }

  // Etapa do trabalho em que o cliente está (o mesmo processo das abas).
  function etapaDo(id){
    var g=DB_STATE_CACHE[id]||(GENERATED_ALL||{})[id]||{},itens=(g.calendar&&g.calendar.items)||[];
    if((g.dna||[]).length<5)return ["Entender","dna","prog"];
    if(!g.strategy||!(g.editorial||[]).length||!(g.ideas||[]).length)return ["Planejar",!g.strategy?"strategy":!(g.editorial||[]).length?"editorial":"ideas","prog"];
    if(!itens.length)return ["Calendário","calendar","prog"];
    return ["Em execução","calendar","act"];
  }
  function renderClients(){
    var el=I("#clientTable");if(!el)return;
    var linhas=CLIENTS.map(function(c){var e=etapaDo(c.id),g=DB_STATE_CACHE[c.id]||{},itens=(g.calendar&&g.calendar.items)||[];
      var feitos=itens.filter(function(it){return it.content||it.carousel||it.stories}).length;
      return '<tr data-client="'+esc(c.id)+'"><td><div class="cel-cli"><span class="av-cli" style="background:'+avc(c.av)+'">'+esc(c.name.charAt(0))+'</span><span><b>'+esc(c.name)+'</b><small>'+esc(c.niche||"sem nicho")+'</small></span></div></td>'+
        '<td><span class="chip '+e[2]+'">'+esc(e[0])+'</span></td>'+
        '<td>'+(itens.length?'<div class="prog-l"><i style="width:'+Math.round(feitos/itens.length*100)+'%"></i></div><small>'+feitos+' de '+itens.length+' peças escritas</small>':'<small>sem calendário</small>')+'</td>'+
        '<td class="acao"><button class="btn" data-abrir="'+esc(c.id)+'" data-etapa="'+e[1]+'">Abrir</button></td></tr>';}).join('');
    el.innerHTML=CLIENTS.length?'<div class="tabela"><table><thead><tr><th>Cliente</th><th>Etapa</th><th>Peças do calendário</th><th></th></tr></thead><tbody>'+linhas+'</tbody></table></div>':
      '<div class="card empty-hero"><div class="eh-t" style="margin-bottom:14px">Nenhum cliente ainda. Cadastre o primeiro: a Íris lê o briefing e o planejamento começa sozinho.</div><button class="btn pri" id="clientAddCard">Novo cliente</button></div>';
    Array.prototype.forEach.call(el.querySelectorAll('tr[data-client]'),function(tr){tr.addEventListener('click',function(){var b=tr.querySelector('[data-abrir]');setClient(tr.getAttribute('data-client'));go(b.getAttribute('data-etapa'));})});
    var ad=I("#clientAddCard");if(ad)ad.addEventListener('click',openNewClientModal);
    // carrega o estado de quem ainda não foi aberto, para a etapa aparecer certa
    var faltam=CLIENTS.filter(function(c){return isDbClient(c.id)&&!DB_STATE_CACHE[c.id]});
    if(faltam.length&&!state.carregandoTabela){state.carregandoTabela=true;Promise.all(faltam.map(function(c){return loadDbClientState(c.id)})).then(function(){state.carregandoTabela=false;if(state.view==="clients")renderClients();},function(){state.carregandoTabela=false;});}
    if(typeof renderBriefingLink==="function")renderBriefingLink();
    var bt=I("#briefTools");if(bt){bt.innerHTML=briefToolsHtml();var b1=I("#bfForm");if(b1)b1.addEventListener('click',openBriefFormModal);var b2=I("#bfImport");if(b2)b2.addEventListener('click',openBriefImportModal);var b3=I("#inboxRefresh");if(b3)b3.addEventListener('click',renderInbox);}
  }
  function busyHtml(text){return '<span class="spinner"></span>'+esc(text);}
  function setBusy(el,text){if(!el)return;el.innerHTML=busyHtml(text);el.classList.add('busy');}
  function clearBusy(el){if(!el)return;el.classList.remove('busy');}
  function sampleErrCopy(e){
    var code=e&&e.code;
    if(code==="not_granted")return "Você precisa permitir que este painel use IA, aparece um aviso do Claude na primeira chamada.";
    if(code==="rate_limited")return "O Claude pediu uma pausa (limite de uso da sua conta ou outra aba do painel usando a IA). Seu texto está salvo, feche outras abas do painel e tente de novo em 1 minuto.";
    if(code==="cancelled")return "Cancelado.";
    if(code==="prompt_too_large")return "Muita informação de uma vez, tenta com um texto mais curto.";
    if(code==="invalid_json")return "A IA não respondeu num formato que eu consegui ler, tenta de novo.";
    if(code==="refused"||code==="empty_completion")return "A IA não conseguiu responder a isso, tenta reformular.";
    if(code==="not_declared"||code==="sampling_disabled"||code==="capability_disabled"||code==="capability_removed")return "IA ao vivo indisponível neste painel agora.";
    return "Algo deu errado ("+(code||"erro")+"), tenta de novo.";
  }
  // rate_limited: a plataforma pede que a página NÃO repita sozinha, só
  // travamos o botão por um tempo, com contagem, e a pessoa clica de novo.
  function cooldownBtn(btn,e,secs){
    if(!btn||!e||e.code!=="rate_limited")return false;
    var label=btn.textContent,left=secs||60;btn.disabled=true;
    var tick=function(){if(!btn.isConnected)return;if(left<=0){btn.disabled=false;btn.textContent=label;return;}btn.textContent="Aguarde "+left+"s";left--;setTimeout(tick,1000);};
    tick();return true;
  }
  async function saveDna(id,entries){
    await dbDoc("cos_dna/"+id).set({entries:entries});
    if(DB_STATE_CACHE[id])DB_STATE_CACHE[id].dna=entries;
    if(state.client===id){GENERATED.dna=entries;renderDNA();renderKpis();}
  }
  function buildIrisPrompt(name,briefing){
    return ['Você é Íris, o agente de Inteligência do Content OS. Sua tarefa é ENTENDER profundamente um cliente e estruturar o Content DNA a partir do material fornecido.',
      '', 'REGRAS INEGOCIÁVEIS:',
      '1. NUNCA invente informações, fontes, números, resultados ou depoimentos.',
      '2. Só afirme como FACT o que estiver declarado no texto abaixo, o resto é HYPOTHESIS ou INSIGHT.',
      '3. Estados possíveis: FACT (fato declarado), HYPOTHESIS (suposição plausível), INSIGHT (interpretação derivada de fatos), STRATEGIC_DECISION (decisão já tomada), LEARNING (aprendizado com evidência de performance).',
      '',
      'CAMPOS CANÔNICOS, use exatamente estas chaves em "field" quando a informação existir (uma sugestão por ocorrência: cada dor real vira uma sugestão separada com field "dores"):',
      '- section "audience", field "persona": resumo de 1 frase da persona/público principal',
      '- section "audience", field "dores": cada dor/problema real',
      '- section "audience", field "desejos": cada desejo/resultado desejado',
      '- section "audience", field "objecoes": cada objeção real levantada pelo público',
      '- section "business", field "oferta": o que é vendido/oferecido',
      '- section "business", field "ticket": ticket médio/preço, se declarado',
      '- section "positioning", field "diferenciais": o que diferencia o cliente',
      '- section "positioning", field "posicionamento": autoridade, prova, tempo de mercado',
      '- section "communication", field "tom": tom de voz',
      '- section "voice_of_customer", field "frase": frases literais do cliente ou do público',
      '- section "strategic_memory", field "decisao": decisões estratégicas já tomadas',
      '- section "strategic_memory", field "aprendizado": aprendizados com evidência de performance',
      '',
      'Cliente: '+name,
      'Material fornecido (fonte a citar: "Briefing informado no painel"):',
      briefing,
      '',
      'Responda SOMENTE com um JSON no formato: {"suggestions":[{"section":string,"field":string,"value":string,"state":string}]}. Sem markdown, sem texto fora do JSON.',
    ].join('\n');
  }
  async function runIrisLive(){
    var id=state.client,briefing=(I("#dnaBriefing").value||"").trim();
    if(!briefing){I("#dnaMsg").textContent="Cole um briefing primeiro.";I("#dnaMsg").style.color="var(--warn)";return;}
    if(!CAP.sample){noAi();return;}
    I("#dnaRun").disabled=true;setBusy(I("#dnaMsg"),"Analisando…");
    // Briefing do formulário colado aqui: aplica ficha, metas e rotina (frequência,
    // dias, gravação) como no "Importar briefing", senão o calendário sai no padrão.
    var pb=parseBriefing(briefing);
    if(pb&&isDbClient(id)){try{await saveClientRecord(id,Object.assign(fichaDoBriefing(id,pb),{briefing:briefing}));}catch(e){}}
    try{
      var out=await CAP.sample.json(buildIrisPrompt(byId(id).name,briefing),{modelTier:"default",cache:false});
      var sugs=(out&&out.suggestions)||[];
      var entries=(GENERATED.dna||[]).slice();
      sugs.forEach(function(s){if(!s||!s.field||!s.value)return;
        entries.push({section:s.section||"business",field:String(s.field),value:String(s.value),state:s.state||"HYPOTHESIS",status:"pending",src:"Briefing informado no painel"});});
      await saveDna(id,entries);
      I("#dnaMsg").textContent=sugs.length+" sugestões, revise e aprove abaixo.";I("#dnaMsg").style.color="var(--good)";
    }catch(e){I("#dnaMsg").textContent=sampleErrCopy(e);I("#dnaMsg").style.color="var(--warn)";if(cooldownBtn(I("#dnaRun"),e,60))return;}
    var btn=I("#dnaRun");if(btn)btn.disabled=false;
  }
  function quadro(titulo,apoio,acoes,corpo,extra){
    return '<section class="quadro"'+(extra||'')+'><div class="q-head"><div><h3>'+titulo+'</h3>'+(apoio?'<p>'+apoio+'</p>':'')+'</div>'+(acoes?'<div class="q-acoes">'+acoes+'</div>':'')+'</div>'+corpo+'</section>';
  }
  function dnaOnboardingHtml(){
    var br=(DB_CLIENTS[state.client]||{}).briefing||"";
    return quadro("Briefing","O que o cliente contou. A Íris lê e sugere registros para o Content DNA; nada vira fato sem você aprovar.",'',
      '<div class="fld" style="margin:0"><label for="dnaBriefing" class="sr">Briefing</label><textarea class="ta" id="dnaBriefing" placeholder="Cole o briefing, a entrevista ou as anotações da reunião">'+esc(br)+'</textarea></div>'+
      '<div class="q-rodape"><span id="briefSaved" class="pp-m">'+(br?"Salvo":"O texto fica salvo sozinho")+'</span><span class="spacer"></span><span id="dnaMsg" class="pp-m"></span><button class="btn pri genbtn" id="dnaRun">Analisar com a Íris</button></div>');
  }
  function dnaManualHtml(){
    return '<details class="dobra q-dobra"><summary>Adicionar um registro à mão</summary><div class="grid cols-2"><div class="fld"><label for="dnaSec">Seção</label><select id="dnaSec">'+SECORDER.map(function(s){return '<option value="'+s+'">'+SECLBL[s]+'</option>'}).join('')+'</select></div>'+
      '<div class="fld"><label for="dnaField">Campo</label><input id="dnaField" placeholder="dores, desejos, persona, oferta, tom"></div></div>'+
      '<div class="fld"><label for="dnaVal">Registro</label><textarea class="ta" id="dnaVal" style="min-height:72px"></textarea></div>'+
      '<button class="btn" id="dnaAddManual">Adicionar como aprovado</button></details>';
  }
  async function addManualDna(){
    var id=state.client,sec=I("#dnaSec").value,field=(I("#dnaField").value||"").trim(),val=(I("#dnaVal").value||"").trim();
    if(!field||!val)return;
    var entries=(GENERATED.dna||[]).slice();
    entries.push({section:sec,field:field,value:val,state:"FACT",status:"approved",src:"Preenchido manualmente"});
    await saveDna(id,entries);
    I("#dnaField").value="";I("#dnaVal").value="";
  }
  // ---- Referências & Concorrentes, sempre digitadas por você, nunca inventadas pela IA
  // (a IA não navega a internet; ela só usa o que você descrever aqui como inspiração). ----
  async function saveRefs(id,items){
    await dbDoc("cos_refs/"+id).set({items:items});
    if(DB_STATE_CACHE[id])DB_STATE_CACHE[id].refs=items;
    if(state.client===id){GENERATED.refs=items;renderDNA();}
  }
  async function addRef(){
    var id=state.client,nome=(I("#refNome").value||"").trim(),tipo=I("#refTipo").value,desc=(I("#refDesc").value||"").trim();
    if(!nome)return;
    var items=(GENERATED.refs||[]).slice();
    if(items.length>=5){I("#refMsg").textContent="Máximo de 5, remova uma antes de adicionar outra.";I("#refMsg").style.color="var(--warn)";return;}
    items.push({nome:nome,tipo:tipo,descricao:desc});
    await saveRefs(id,items);
    I("#refNome").value="";I("#refDesc").value="";
  }
  async function removeRef(i){
    var id=state.client,items=(GENERATED.refs||[]).slice();
    items.splice(i,1);
    await saveRefs(id,items);
  }
  function refsBlockHtml(){
    var items=GENERATED.refs||[];
    var linhas=items.map(function(r,i){return '<div class="linha"><div class="l-main"><b>'+esc(r.nome)+'</b>'+(r.descricao?'<small>'+esc(r.descricao)+'</small>':'')+'</div><span class="chip">'+esc(r.tipo)+'</span><button class="icon-btn sm" data-refrm="'+i+'" title="Remover" aria-label="Remover">'+iconeUI("linha-trash")+'</button></div>';}).join('');
    var form=items.length<5?'<div class="grid cols-3 q-form"><div class="fld"><label for="refNome">Perfil</label><input id="refNome" placeholder="@perfil"></div><div class="fld"><label for="refTipo">Tipo</label><select id="refTipo"><option>Referência de estilo</option><option>Concorrente direto</option></select></div><div class="fld"><label for="refDesc">O que você percebe nele</label><input id="refDesc" placeholder="Usa humor, mostra bastidores"></div></div><button class="btn" id="refAdd">Adicionar referência</button><span id="refMsg" class="pp-m" style="margin-left:10px"></span>':'';
    return quadro("Referências e concorrentes","Até 5 perfis reais que você conhece. A Musa usa como inspiração de ângulo e tom, sem copiar nem citar.",'',
      (linhas||'<div class="vazio">Nenhuma referência ainda.</div>')+form);
  }
  var ESTADO_PT={FACT:["Fato","act"],HYPOTHESIS:["Hipótese","warn"],INSIGHT:["Insight","prog"],STRATEGIC_DECISION:["Decisão",""],LEARNING:["Aprendizado","act"]};
  function dnaEntryHtml(x,i){
    var e=ESTADO_PT[x.state]||[x.state,""],db=isDbClient(state.client),pend=x.status!=="approved";
    return '<tr class="entry" data-i="'+i+'">'+(db?'<td class="sel-c">'+(pend?'<button class="cbx" data-sel="'+i+'" role="checkbox" aria-checked="false" aria-label="Selecionar '+esc(x.field)+'"></button>':'<span class="tr-marca feita pequena">'+iconeUI("check-filled")+'</span>')+'</td>':'')+'<td><b>'+esc(x.field)+'</b><small>'+esc(SECLBL[x.section]||x.section)+'</small></td>'+
      '<td class="e-reg"><div data-role="val">'+esc(x.value)+'</div><small>'+esc(x.src||"")+'</small></td>'+
      '<td><span class="chip '+e[1]+'">'+esc(e[0])+'</span></td>'+
      '<td><span class="chip '+(pend?'warn':'act')+'">'+(pend?'Pendente':'Aprovado')+'</span></td>'+
      '<td class="acao nowrap">'+(db?(pend?'<button class="btn sm" data-act="approve">Aprovar</button>':'')+
        '<button class="icon-btn sm" data-act="edit" title="Editar" aria-label="Editar">'+iconeUI("edit")+'</button><button class="icon-btn sm" data-act="reject" title="Remover" aria-label="Remover">'+iconeUI("linha-trash")+'</button>':'')+'</td></tr>';
  }
  function dnaTabelaHtml(list){
    var linhas=list.map(function(x,i){return [x,i]}).sort(function(a,b){return (a[0].status==="approved")-(b[0].status==="approved")||SECORDER.indexOf(a[0].section)-SECORDER.indexOf(b[0].section)});
    var pend=list.filter(function(x){return x.status!=="approved"}).length;
    var db=isDbClient(state.client),aprov=list.length-pend;
    var lote=db&&pend?'<div class="lote-bar"><button class="cbx" id="dnaSelTodos" role="checkbox" aria-checked="false" aria-label="Selecionar todos os pendentes"></button><span id="dnaSelN">Selecionar</span><span class="spacer"></span><button class="btn" id="dnaAprTodos">Aprovar todos ('+pend+')</button><button class="btn pri" id="dnaAprSel" disabled>Aprovar selecionados</button></div>':'';
    return quadro("Content DNA",list.length?aprov+' aprovado'+(aprov===1?'':'s')+(pend?', '+pend+' esperando você':'')+(aprov<DNA_MINIMO?'. Com '+DNA_MINIMO+' aprovados, o planejamento começa.':''):'Ainda vazio. Analise o briefing com a Íris ou adicione à mão.','',
      lote+(list.length?'<div class="tabela"><table><thead><tr>'+(db?'<th class="sel-c"></th>':'')+'<th>Campo</th><th>Registro</th><th>Estado</th><th>Situação</th><th></th></tr></thead><tbody>'+linhas.map(function(p){return dnaEntryHtml(p[0],p[1])}).join('')+'</tbody></table></div>':'')+
      (isDbClient(state.client)?dnaManualHtml():''));
  }
  // Aprovação em lote: seleciona os pendentes e aprova de uma vez (um único registro no banco).
  function wireDnaLote(){
    var q=I("#dnaSections");if(!q)return;var sel={};
    var tbl=q.querySelector('.tabela');if(tbl&&tbl.closest('.quadro'))tbl.closest('.quadro').id="dnaQuadro";
    function atualizar(){var ids=Object.keys(sel).filter(function(k){return sel[k]}),tot=q.querySelectorAll('[data-sel]').length;
      q.querySelectorAll('[data-sel]').forEach(function(b){b.setAttribute('aria-checked',sel[b.getAttribute('data-sel')]?'true':'false')});
      var t=I("#dnaSelTodos");if(t)t.setAttribute('aria-checked',ids.length===0?'false':ids.length===tot?'true':'mixed');
      var n=I("#dnaSelN");if(n)n.textContent=ids.length?ids.length+' selecionado'+(ids.length>1?'s':''):'Selecionar';
      var a=I("#dnaAprSel");if(a)a.disabled=!ids.length;}
    q.querySelectorAll('[data-sel]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-sel');sel[k]=!sel[k];atualizar();})});
    var t=I("#dnaSelTodos");if(t)t.addEventListener('click',function(){var todos=t.getAttribute('aria-checked')==='true';q.querySelectorAll('[data-sel]').forEach(function(b){sel[b.getAttribute('data-sel')]=!todos});atualizar();});
    async function aprovar(idx,bt){bt.disabled=true;var entries=(GENERATED.dna||[]).slice();idx.forEach(function(i){entries[i]=Object.assign({},entries[i],{status:"approved"})});
      try{await saveDna(state.client,entries);toast(idx.length+' registro'+(idx.length>1?'s':'')+' aprovado'+(idx.length>1?'s':'')+'.');}catch(e){bt.disabled=false;toast("Não consegui aprovar: "+(e.message||e));}}
    var as=I("#dnaAprSel");if(as)as.addEventListener('click',function(){aprovar(Object.keys(sel).filter(function(k){return sel[k]}).map(Number),as)});
    var at=I("#dnaAprTodos");if(at)at.addEventListener('click',function(){aprovar([].map.call(q.querySelectorAll('[data-sel]'),function(b){return +b.getAttribute('data-sel')}),at)});
  }
  function wireDnaActions(){
    if(!isDbClient(state.client)){
      Array.prototype.forEach.call(document.querySelectorAll('#dnaSections .e-actions .btn'),function(b){b.addEventListener('click',function(){b.closest('.e-actions').innerHTML='<span style="font-size:12px;color:var(--muted)">Ação registrada (prévia)</span>'})});
      return;
    }
    Array.prototype.forEach.call(document.querySelectorAll('#dnaSections .entry'),function(el){
      var i=+el.getAttribute('data-i');
      Array.prototype.forEach.call(el.querySelectorAll('[data-act]'),function(b){
        b.addEventListener('click',async function(){
          var act=b.getAttribute('data-act'),entries=(GENERATED.dna||[]).slice();
          if(act==="approve"){entries[i]=Object.assign({},entries[i],{status:"approved"});await saveDna(state.client,entries);}
          else if(act==="reject"){entries.splice(i,1);await saveDna(state.client,entries);}
          else if(act==="edit"){
            var valEl=el.querySelector('[data-role="val"]');valEl.contentEditable="true";valEl.focus();
            b.innerHTML="Salvar";b.classList.add("txt");b.setAttribute('data-act','save-edit');
            b.addEventListener('click',async function saveEdit(){
              var entries2=(GENERATED.dna||[]).slice();entries2[i]=Object.assign({},entries2[i],{value:valEl.textContent.trim()});
              await saveDna(state.client,entries2);
            },{once:true});
          }
        });
      });
    });
  }
  function renderDNA(){
    var t=I("#dnaTitle");if(t)t.textContent="";
    if(isDbClient(state.client)){
      var list=GENERATED.dna||[];
      I("#dnaSections").innerHTML=(list.length?dnaTabelaHtml(list)+dnaOnboardingHtml():dnaOnboardingHtml()+dnaTabelaHtml(list))+fichaHtml()+refsBlockHtml();
      I("#dnaRun").addEventListener('click',runIrisLive);
      wireFicha();wireBriefingAutosave();
      I("#dnaAddManual").addEventListener('click',addManualDna);
      var refAddBtn=I("#refAdd");if(refAddBtn)refAddBtn.addEventListener('click',addRef);
      Array.prototype.forEach.call(document.querySelectorAll('[data-refrm]'),function(b){b.addEventListener('click',function(){removeRef(+b.getAttribute('data-refrm'));})});
      wireDnaActions();wireDnaLote();
      return;
    }
    I("#dnaSections").innerHTML=dnaTabelaHtml(DNA[state.client]||[]);
    wireDnaActions();
  }
  var MIX_TONS=[1,.7,.48,.3];
  var MIX_TONS=[1,.7,.48,.3];
  function drawStratMix(){
    var sp=GENERATED.strategy,box=I("#stratMix");if(!box)return;
    var sel=sp.paths.filter(function(p){return state.stratSel.indexOf(p.key)>=0});
    if(!sel.length){box.innerHTML='<div class="vazio">Marque ao menos um caminho na tabela abaixo.</div>';return;}
    var pcts=largestRemainder(sel.map(function(p){return Math.max(1,p.relevancia-25)}),100);
    box.innerHTML='<div class="mixbar">'+sel.map(function(p,i){return '<i style="flex:'+pcts[i]+' 1 0;opacity:'+(MIX_TONS[i]||.2)+'" title="'+esc(p.nome)+' '+pcts[i]+'%"></i>'}).join('')+'</div>'+
      '<div class="mixleg">'+sel.map(function(p,i){return '<span><i style="opacity:'+(MIX_TONS[i]||.2)+'"></i><b>'+pcts[i]+'%</b> '+esc(p.nome)+'</span>'}).join('')+'</div>';
  }
  function renderStrategyPaths(el){
    var g=GENERATED,sp=g.strategy;
    sp.paths=(sp.paths||[]).map(function(p){return Object.assign({funcoes:[],emocoes:[],metricas:[],relevancia:50},p)});
    if(!state.stratSel)state.stratSel=(sp.mix||[]).map(function(m){return m.key});
    if(!state.stratSel.length)state.stratSel=sp.paths.slice(0,3).map(function(p){return p.key});
    var db=isDbClient(state.client);
    var linha=function(l,v){return v?'<div class="kv"><span>'+l+'</span><div>'+esc(v)+'</div></div>':''};
    var h=quadro("Big Message",sp.mudancas?esc(sp.mudancas):'',db?'<button class="btn" id="regenStratBtn">Gerar de novo</button>':'',
      '<p class="bigmsg">'+esc(sp.bigMessage||"")+'</p>'+linha("Posicionamento",sp.posicionamento)+linha("Para quem falamos",sp.persona)+linha("Percepção a construir",sp.percepcao));
    h+=quadro("Mix do mês","Quanto de cada caminho entra no calendário. Marque e desmarque na tabela para ajustar.",'','<div id="stratMix"></div>');
    var ordem=sp.paths.slice().sort(function(a,b){return b.relevancia-a.relevancia});
    h+=quadro("Caminhos estratégicos","Ordenados pela aderência ao Content DNA deste cliente.",'',
      '<div class="tabela"><table><thead><tr><th></th><th>Caminho</th><th>Funil</th><th>Relevância</th><th>Funções</th><th>Métricas</th></tr></thead><tbody>'+
      ordem.map(function(p){var on=state.stratSel.indexOf(p.key)>=0;
        return '<tr data-path="'+esc(p.key)+'" class="'+(on?'sel':'')+'"><td class="ck">'+(on?iconeUI("checkbox-on"):'<i class="cb-vazio"></i>')+'</td>'+
          '<td><b class="cel-t">'+esc(p.nome)+'</b><small>'+esc([p.quando,p.porque].filter(Boolean).join(". "))+'</small></td>'+
          '<td><span class="chip">'+esc(p.funil||"")+'</span></td>'+
          '<td class="nowrap"><div class="prog-l"><i style="width:'+Math.max(0,Math.min(100,+p.relevancia||0))+'%"></i></div><small>'+esc(String(p.relevancia))+' de 100</small></td>'+
          '<td>'+esc(p.funcoes.join(", "))+'</td><td>'+esc(p.metricas.join(", "))+'</td></tr>';}).join('')+'</tbody></table></div>');
    el.innerHTML=h;
    drawStratMix();
    Array.prototype.forEach.call(el.querySelectorAll('[data-path]'),function(c){c.addEventListener('click',function(){
      var k=c.getAttribute('data-path'),i=state.stratSel.indexOf(k);
      if(i>=0)state.stratSel.splice(i,1);else state.stratSel.push(k);
      renderStrategyPaths(el);
    })});
    var rb=I("#regenStratBtn");if(rb)rb.addEventListener('click',function(){GENERATED.strategy=null;renderStrategy();});
  }
  function dnaCompact(){
    var d=(GENERATED.dna||[]).filter(function(x){return x.status!=="rejected"}).map(function(x){return '- ['+x.section+'/'+x.field+'] ('+x.state+') '+x.value}).join('\n');
    return [fichaCompact(),d].filter(Boolean).join('\n')||'(nenhum registro ainda)';
  }
  function buildStrategyPrompt(name,dnaText){
    var mp=metasPrompt();if(mp)dnaText=dnaText+'\n\n'+mp;
    var archNames=["Autoridade","Posicionamento","Rapport / Relacionamento","Educação","Diferenciação","Construção de Categoria","Comunidade","Geração de Demanda","Quebra de Objeções","Prova","Desejo","Conversão / Vendas","Lançamento","Crescimento de Audiência","Marca Pessoal"];
    return ['Você é Átlas, o agente de Estratégia do Content OS. A partir do Content DNA real abaixo, construa a estratégia de conteúdo deste cliente.',
      '', 'REGRA: nunca invente fatos além do que está no Content DNA. Use termos/linguagem reais do cliente quando possível.',
      '', 'Cliente: '+name, 'CONTENT DNA:', dnaText, '',
      'Escolha de 5 a 8 CAMINHOS ESTRATÉGICOS relevantes da lista abaixo (pode adaptar o nome), cada um com: quando usar, por que, objetivo, funil (topo/meio/fundo), jornada, 2-3 funções estratégicas, 1-2 emoções, 2-3 métricas, e relevância de 0 a 100 (aderência a ESTE cliente).',
      'Caminhos possíveis: '+archNames.join(', '), '',
      'Responda SOMENTE com JSON:',
      '{"posicionamento":string,"bigMessage":string,"persona":string,"percepcao":string,"pilares":[string,string,string,string],',
      '"paths":[{"key":string,"nome":string,"quando":string,"porque":string,"objetivo":string,"funil":"topo"|"meio"|"fundo","jornada":string,"funcoes":[string],"emocoes":[string],"metricas":[string],"relevancia":number}],',
      '"mix":[{"key":string,"nome":string,"pct":number}]}',
      'O "mix" é um subconjunto de 2-4 caminhos (chaves que aparecem em "paths") cujos pct somam 100, o combo recomendado para este mês.',
    ].join('\n');
  }
  async function runGerarEstrategia(){
    var id=state.client;if(!CAP.sample){noAi();return;}
    var btn=I("#genStratBtn");if(btn)btn.disabled=true;
    var msg=I("#stratMsg");setBusy(msg,"Pensando…");
    try{
      var out=await CAP.sample.json(buildStrategyPrompt(byId(id).name,dnaCompact()),{modelTier:"complex",cache:false});
      await salvarEstrategia(id,out);
    }catch(e){
      if(msg){msg.textContent=sampleErrCopy(e);msg.style.color="var(--warn)";}
      if(btn)btn.disabled=false;
    }
  }
  async function salvarEstrategia(id,out){
    var strat={posicionamento:String(out.posicionamento||""),bigMessage:String(out.bigMessage||""),persona:String(out.persona||""),percepcao:String(out.percepcao||""),
      pilares:Array.isArray(out.pilares)?out.pilares.map(String):[],paths:Array.isArray(out.paths)?out.paths:[],mix:Array.isArray(out.mix)?out.mix:[]};
    if(out.mudancas)strat.mudancas=String(out.mudancas);
    await dbDoc("cos_strategy/"+id).set(strat);
    if(DB_STATE_CACHE[id])DB_STATE_CACHE[id].strategy=strat;
    if(state.client===id){GENERATED.strategy=strat;state.stratSel=null;renderStrategy();}
  }
  function vazioQuadro(titulo,texto,botao){
    return '<section class="quadro"><div class="vazio-t"><b>'+titulo+'</b><span>'+texto+'</span></div>'+(botao||'')+'</section>';
  }
  function renderStrategyEmpty(el){
    var hasDna=GENERATED&&GENERATED.dna&&GENERATED.dna.length;
    el.innerHTML=hasDna?vazioQuadro("A estratégia ainda não foi gerada.","O Átlas lê o Content DNA e propõe posicionamento, Big Message e os caminhos do mês.",'<div class="q-rodape"><button class="btn pri genbtn" id="genStratBtn">Gerar estratégia</button><span id="stratMsg" class="pp-m"></span></div>'):
      vazioQuadro("Falta o Content DNA.","A estratégia nasce do que o cliente é. Preencha o DNA na aba Entender.",'<div class="q-rodape"><button class="btn pri" data-ir-aba="dna">Ir para Entender</button></div>');
    var btn=I("#genStratBtn");if(btn)btn.addEventListener('click',runGerarEstrategia);
    ligarIrAba(el);
  }
  function ligarIrAba(el){Array.prototype.forEach.call(el.querySelectorAll('[data-ir-aba]'),function(b){b.addEventListener('click',function(){go(b.getAttribute('data-ir-aba'))})});}
  function renderStrategy(){
    var el=I('.view[data-view="strategy"]');
    if(GENERATED&&GENERATED.strategy){return renderStrategyPaths(el);}
    if(isDbClient(state.client)){return renderStrategyEmpty(el);}
    var s=STRATEGY[state.client];
    if(!s){el.innerHTML=emptyView("Estratégia, "+clientName(state.client),"Ainda sem estratégia para este cliente. Gere o Content DNA e rode o Átlas para criar a estratégia.");return;}
    el.innerHTML='<div class="section-head" style="margin-top:6px"><div><h3>Estratégia'+' <span class="tag-mock">demonstração</span></h3><p>Definida por <b>Átlas</b> a partir do Content DNA.</p></div></div>'+
      '<div class="grid cols-2"><div class="card pad"><div class="bt" style="font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:6px">Posicionamento</div><div style="font-size:14px">'+esc(s.posicionamento)+'</div></div>'+
      '<div class="card pad" style="background:var(--brand-weak);border-color:transparent"><div class="bt" style="font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--brand-ink);margin-bottom:6px">Big Message</div><div style="font-size:15px;font-family:var(--font-display);font-weight:700;color:var(--brand-ink)">'+esc(s.bigmsg)+'</div></div></div>'+
      '<div class="card pad" style="margin-top:16px"><div class="metagrid"><div><div class="mk">Objetivos</div><div class="mv">'+s.objetivos.join(' · ')+'</div></div><div><div class="mk">Jornada</div><div class="mv">'+esc(s.jornada)+'</div></div><div style="grid-column:1/-1"><div class="mk">Percepção que queremos construir</div><div class="mv">'+esc(s.percepcao)+'</div></div><div><div class="mk">Crenças a construir</div><div class="mv chips">'+s.construir.map(function(x){return '<span class="badge act">'+esc(x)+'</span>'}).join('')+'</div></div><div><div class="mk">Crenças a desafiar</div><div class="mv chips">'+s.desafiar.map(function(x){return '<span class="badge prog">'+esc(x)+'</span>'}).join('')+'</div></div></div></div>';
  }
  function researchItemHtml(r){
    return '<div class="ritem"><span class="pill st-STRATEGIC_DECISION" style="height:fit-content">'+esc(r.tipo)+'</span><div><div class="ri-t">'+esc(r.insight)+'</div><div class="ri-m">'+(r.url?'<a href="'+esc(r.url)+'" target="_blank" rel="noopener">'+esc(r.origem)+'</a>':esc(r.origem))+(r.data?' · '+esc(r.data.split("-").reverse().join("/")):'')+(r.relevancia&&r.relevancia!==""?' · '+esc(r.relevancia):'')+'</div></div></div>';
  }
  function buildResearchPrompt(name,dnaText){
    return ['Você é Radar, o agente de Pesquisa do Content OS. A partir do Content DNA real abaixo, aponte oportunidades de conteúdo ANCORADAS no que já se sabe sobre o cliente, dores, objeções e diferenciais reais.',
      '', 'REGRA CRÍTICA: você NÃO tem acesso à internet. NUNCA invente tendências de mercado, dados de concorrentes ou pesquisa externa, isso exigiria acesso web/API real, que você não tem. Só derive oportunidades do Content DNA fornecido.',
      '', 'Cliente: '+name, 'CONTENT DNA:', dnaText, '',
      'Gere de 3 a 5 oportunidades. Responda SOMENTE com JSON: {"items":[{"tipo":string,"insight":string,"origem":string,"relevancia":string}]}',
      '"tipo" ex.: "Pauta quente","Oportunidade","Ângulo de autoridade". "origem" deve citar que vem do Content DNA (não fonte externa).',
    ].join('\n');
  }
  async function runGerarPesquisa(){
    var id=state.client;if(!CAP.sample){noAi();return;}
    var btn=I("#genResBtn");if(btn)btn.disabled=true;
    var msg=I("#resMsg");setBusy(msg,"Pensando…");
    try{
      var out=await CAP.sample.json(buildResearchPrompt(byId(id).name,dnaCompact()),{modelTier:"quick",cache:false});
      await salvarPesquisa(id,out);
    }catch(e){
      if(msg){msg.textContent=sampleErrCopy(e);msg.style.color="var(--warn)";}
      if(btn)btn.disabled=false;
    }
  }
  // Pesquisa com link (a do agente Radar, que busca na web) ou sem (a do botão, que só lê o DNA).
  async function salvarPesquisa(id,out){
    var today=new Date().toISOString().slice(0,10);
    var items=(Array.isArray(out.items)?out.items:[]).map(function(r){var it={tipo:String(r.tipo||"Oportunidade"),insight:String(r.insight||""),origem:String(r.origem||"Derivado do Content DNA"),data:String(r.data||today),relevancia:String(r.relevancia||"")};if(r.url)it.url=String(r.url);return it;});
    if(!items.some(function(i){return i.url}))items.push({tipo:"Nota",insight:"Sinais tirados do próprio Content DNA, sem pesquisa na web. Para pesquisa com fonte, rode o agente Radar.",origem:"Sistema",data:today,relevancia:""});
    await dbDoc("cos_research/"+id).set({items:items});
    if(DB_STATE_CACHE[id])DB_STATE_CACHE[id].research=items;
    if(state.client===id){GENERATED.research=items;renderResearch();}
  }
  function pesquisaCompact(){
    var r=((GENERATED&&GENERATED.research)||[]).filter(function(x){return x.tipo!=="Nota"});if(!r.length)return "";
    return 'PESQUISA APROVADA (use as pautas que fizerem sentido para este cliente; cite a fonte quando usar):\n'+r.slice(0,10).map(function(x){return '- ['+x.tipo+'] '+x.insight+(x.url?' ('+x.origem+', '+x.data+')':'')}).join('\n');
  }
  function renderResearch(){
    var el=I('.view[data-view="research"]'),db=isDbClient(state.client);
    var itens=((GENERATED&&GENERATED.research)||[]).filter(function(r){return r.tipo!=="Nota"});
    if(itens.length){
      var web=itens.some(function(r){return r.url});
      el.innerHTML=quadro("Pesquisa",web?"Pautas da web, cada uma com fonte e data. O Radar atualiza toda segunda.":"Sinais tirados do Content DNA, sem busca na web. Para pesquisa com fonte, rode o Radar na aba Operação.",
        db?'<button class="btn" id="genResBtn">Gerar de novo</button>':'',
        '<div class="tabela"><table><thead><tr><th>Tipo</th><th>Pauta</th><th>Fonte</th><th>Data</th><th>Relevância</th></tr></thead><tbody>'+itens.map(function(r){
          return '<tr><td><span class="chip">'+esc(r.tipo)+'</span></td><td class="e-reg">'+esc(r.insight)+'</td><td>'+(r.url?'<a class="lnk" href="'+esc(r.url)+'" target="_blank" rel="noopener">'+esc(r.origem)+'</a>':'<span class="pp-m">'+esc(r.origem)+'</span>')+'</td>'+
            '<td class="nowrap">'+esc((r.data||"").split("-").reverse().join("/"))+'</td><td>'+(r.relevancia&&r.relevancia!==""?'<span class="chip '+(r.relevancia==="alta"?'act':'')+'">'+esc(r.relevancia)+'</span>':'')+'</td></tr>';}).join('')+'</tbody></table></div><span id="resMsg" class="pp-m"></span>');
      var btn=I("#genResBtn");if(btn)btn.addEventListener('click',runGerarPesquisa);
      return;
    }
    var hasDna=GENERATED&&GENERATED.dna&&GENERATED.dna.length;
    el.innerHTML=hasDna?vazioQuadro("Nenhuma pesquisa ainda.","O Radar pesquisa na web o que o público deste cliente está vendo e traz pautas com fonte. Rode pela aba Operação, ou gere sinais a partir do DNA aqui.",'<div class="q-rodape"><button class="btn pri genbtn" id="genResBtn">Gerar a partir do DNA</button><span id="resMsg" class="pp-m"></span></div>'):
      vazioQuadro("Falta o Content DNA.","Preencha o DNA na aba Entender.",'<div class="q-rodape"><button class="btn pri" data-ir-aba="dna">Ir para Entender</button></div>');
    var btn2=I("#genResBtn");if(btn2)btn2.addEventListener('click',runGerarPesquisa);
    ligarIrAba(el);
  }
  function editorialTreeHtml(ed){
    return ed.map(function(p){
      return quadro(esc((p.pilar||"").split(":")[0]),esc(p.territorio||""),'',
        (p.temas||[]).map(function(t){return '<div class="linha"><div class="l-main"><b>'+esc(t.tema)+'</b>'+
          ((t.subtemas||[]).length?'<small>Subtemas: '+esc(t.subtemas.join(", "))+'</small>':'')+((t.topicos||[]).length?'<small>Tópicos: '+esc(t.topicos.join(", "))+'</small>':'')+'</div></div>'}).join(''));
    }).join('');
  }
  function buildEditorialPrompt(name,strategy){
    var ppw=state.client?diasPostOf().length:3,cp=capacidadePrompt();
    var mp2=metasPrompt();
    return [mp2,cp?cp+'\nCom '+ppw+' postagens por semana, priorize '+(ppw<=2?'2 a 3':ppw<=4?'3 a 4':'4 a 5')+' pilares realmente ativos, frequência baixa pede poucas frentes, repetidas com consistência.\n':'','Você é Bússola, o agente de Linha Editorial do Content OS. A partir dos pilares estratégicos abaixo, construa a árvore editorial: Pilar, Território, Temas, Subtemas, Tópicos.',
      '', 'REGRA: nada genérico, ancore tudo no negócio real do cliente (persona, Big Message, pilares).',
      '', 'Cliente: '+name,
      'Pilares estratégicos: '+((strategy&&strategy.pilares)||[]).join(' | '),
      'Persona: '+((strategy&&strategy.persona)||''),
      'Big Message: '+((strategy&&strategy.bigMessage)||''),
      '', 'Para CADA pilar, crie 1 território e 2 temas; cada tema com 2-3 subtemas e 2-3 tópicos.',
      'Responda SOMENTE com JSON: {"pilares":[{"pilar":string,"territorio":string,"temas":[{"tema":string,"subtemas":[string],"topicos":[string]}]}]}',
    ].join('\n');
  }
  async function runGerarEditorial(){
    var id=state.client;if(!CAP.sample){noAi();return;}
    var btn=I("#genEdBtn");if(btn)btn.disabled=true;
    var msg=I("#edMsg");setBusy(msg,"Pensando…");
    try{
      var out=await CAP.sample.json(buildEditorialPrompt(byId(id).name,GENERATED.strategy),{modelTier:"default",cache:false});
      await salvarEditorial(id,out);
    }catch(e){
      if(msg){msg.textContent=sampleErrCopy(e);msg.style.color="var(--warn)";}
      if(btn)btn.disabled=false;
    }
  }
  async function salvarEditorial(id,out){
    var pilares=Array.isArray(out.pilares)?out.pilares:[];
    await dbDoc("cos_editorial/"+id).set({pilares:pilares});
    if(DB_STATE_CACHE[id])DB_STATE_CACHE[id].editorial=pilares;
    if(state.client===id){GENERATED.editorial=pilares;renderEditorial();}
  }
  function renderEditorial(){
    var el=I('.view[data-view="editorial"]'),db=isDbClient(state.client);
    if(GENERATED&&GENERATED.editorial&&GENERATED.editorial.length){
      el.innerHTML=(db?'<div class="toolbar"><span class="pp-m">'+GENERATED.editorial.length+' pilares, feitos a partir da estratégia aprovada.</span><span class="spacer"></span><span id="edMsg" class="pp-m"></span><button class="btn" id="genEdBtn">Gerar de novo</button></div>':'')+editorialTreeHtml(GENERATED.editorial);
      var btn=I("#genEdBtn");if(btn)btn.addEventListener('click',runGerarEditorial);
      return;
    }
    var hasStrat=GENERATED&&GENERATED.strategy;
    el.innerHTML=hasStrat?vazioQuadro("A linha editorial ainda não foi gerada.","A Bússola traduz a estratégia em pilares, territórios, temas e tópicos.",'<div class="q-rodape"><button class="btn pri genbtn" id="genEdBtn">Gerar linha editorial</button><span id="edMsg" class="pp-m"></span></div>'):
      vazioQuadro("Falta a estratégia.","A linha editorial nasce da estratégia aprovada.",'<div class="q-rodape"><button class="btn pri" data-ir-aba="strategy">Ir para Estratégia</button></div>');
    var btn2=I("#genEdBtn");if(btn2)btn2.addEventListener('click',runGerarEditorial);
    ligarIrAba(el);
  }
  function formatSurface(nome){
    var f=(LIB.formatos||[]).filter(function(x){return x.nome===nome})[0];
    return (f&&f.superficie)||"Reel";
  }
  async function clearCollection(colRef){
    var snap=await colRef.get();
    await Promise.all(snap.docs.map(function(d){return colRef.doc(d.id).delete();}));
  }
  function refsCompact(){
    return (GENERATED.refs||[]).map(function(r){return '- ['+r.tipo+'] '+r.nome+(r.descricao?': '+r.descricao:'')}).join('\n');
  }
  function buildIdeasPrompt(name,strategy,editorial,dnaText,opts){
    opts=opts||{};var qtd=opts.count||15,ja=opts.existentes||[];
    var pilares=((strategy&&strategy.pilares)||[]).join(' | ');
    var temas=[];(editorial||[]).forEach(function(p){(p.temas||[]).forEach(function(t){temas.push(t.tema)})});
    var formatos=(LIB.formatos||[]).map(function(f){return f.nome}).join(', ');
    var refs=refsCompact();
    return ['Você é Musa, o agente de Ideias do Content OS. Gere '+qtd+' ideias de conteúdo REAIS para este cliente, cada uma ancorada no Content DNA e na estratégia, nunca genéricas, nunca intercambiáveis entre marcas.',
      '', 'Cliente: '+name, 'CONTENT DNA:', dnaText,
      'Big Message: '+((strategy&&strategy.bigMessage)||''), 'Persona: '+((strategy&&strategy.persona)||''), 'Pilares: '+pilares,
      temas.length?('Temas editoriais disponíveis: '+temas.join(' | ')):'',
      refs?('REFERÊNCIAS E CONCORRENTES informados pelo cliente (use só como inspiração de ângulo/tom/formato, NUNCA copie, cite o nome ou mencione esses perfis no conteúdo gerado):\n'+refs):'',
      'Formatos possíveis (escolha um por ideia): '+formatos, formatGuidePrompt(), perfCompact(), pesquisaCompact(), '',
      'Gatilhos mentais disponíveis: '+(LIB.gatilhos||[]).map(function(g){return g.nome}).join(', '),
      'Elementos literários disponíveis: '+(LIB.elementos||[]).map(function(e){return e.nome}).join(', '),
      prefsPrompt(), capacidadePrompt(), metasPrompt(),
      opts.soSemGravacao?'IMPORTANTE: TODAS estas ideias devem ser em formato que NÃO exige o cliente gravar, escolha só formatos de Carrossel da lista (ex.: Checklist, Passo a Passo, Comparação, Case).':'',
      ja.length?('Estas ideias JÁ EXISTEM no calendário, NÃO repita, NÃO faça variações delas, traga ângulos novos:\n- '+ja.slice(0,80).join('\n- ')):'', '',
      'Distribua pelo funil: '+(function(){var mx=mixDoCliente(state.client);return '~'+mx.topo+'% topo, ~'+mx.meio+'% meio, ~'+mx.fundo+'% fundo';})()+'. Cubra funções variadas: Descoberta, Conscientização, Educação, Autoridade, Identificação, Experiência Própria, Experiência Compartilhada, Prova, Quebra de Objeção, Consideração, Conversão.',
      'Cada ideia precisa de: título, conceito (1 frase), ângulo, dor/desejo específico usado, função/objetivo, propósito (1 frase: de onde a persona sai e pra onde vai), emoção-alvo, hook (frase de abertura real), CTA, formato escolhido + objetivo do formato + por que esse formato, e justificativa (por que não serve pra outra marca).',
      '', 'Responda SOMENTE com JSON: {"ideas":[{"titulo":string,"conceito":string,"angulo":string,"dorDesejo":string,"funcao":string,"funil":"topo"|"meio"|"fundo","jornada":string,"emocao":string,"pilar":string,"tema":string,"proposito":string,"formato":string,"formatoObjetivo":string,"formatoJustificativa":string,"hook":string,"cta":string,"justificativa":string,"gatilhos":[string],"elementos":[string]}]}',
      'Em "gatilhos" escolha 2-3 nomes da lista de gatilhos e em "elementos" 1-2 nomes da lista de elementos, exatamente como escritos, respeitando as escolhas do estrategista.',
    ].filter(Boolean).join('\n');
  }
  // Gera ideias. append=true acrescenta às existentes (sem repetir), usado por "Gerar mais" e pelo calendário de 45/60/90 dias.
  async function gerarIdeiasCore(id,append,count,soSemGravacao){
    var atuais=append?((GENERATED.ideas||[]).slice()):[];
    var out=await CAP.sample.json(buildIdeasPrompt(byId(id).name,GENERATED.strategy,GENERATED.editorial,dnaCompact(),{count:count||15,soSemGravacao:!!soSemGravacao,existentes:atuais.map(function(x){return x.titulo})}),{modelTier:"complex",cache:false});
    return salvarIdeias(id,out,append);
  }
  // Grava ideias (do botão ou de uma proposta da Musa aprovada). append=true acrescenta sem apagar.
  async function salvarIdeias(id,out,append){
    var atuais=append?((GENERATED.ideas||[]).slice()):[];
    var raw=Array.isArray(out.ideas)?out.ideas:[];
    var strat=GENERATED.strategy||{},pf=prefsOf(id),base=atuais.reduce(function(m,x){var n=+(String(x.id||"").split("-")[1])||0;return Math.max(m,n,(x.ord||0)+1)},0);
    function okNomes(lib,arr,ban){var ks=keysByNome(lib,arr).filter(function(k){return ban.indexOf(k)<0});return (lib||[]).filter(function(x){return ks.indexOf(x.key)>=0}).map(function(x){return x.nome});}
    var novas=raw.map(function(x,j){var i=base+j;
        return {id:"idea-"+(i+1),ord:i,gatilhos:okNomes(LIB.gatilhos,x.gatilhos,pf.gEvitar),elementos:okNomes(LIB.elementos,x.elementos,pf.eEvitar),titulo:String(x.titulo||""),conceito:String(x.conceito||""),angulo:String(x.angulo||""),
          persona:strat.persona||"",dorDesejo:String(x.dorDesejo||""),objetivo:String(x.funcao||""),proposito:String(x.proposito||""),
          bigMessage:strat.bigMessage||"",funcao:String(x.funcao||""),funil:["topo","meio","fundo"].indexOf(x.funil)>=0?x.funil:"topo",
          jornada:String(x.jornada||""),emocao:String(x.emocao||""),percepcao:strat.percepcao||"",
          pilar:String(x.pilar||""),tema:String(x.tema||""),subtema:"",
          surface:formatSurface(x.formato),format:String(x.formato||""),
          formatRec:{formato:String(x.formato||""),objetivo:String(x.formatoObjetivo||""),justificativa:String(x.formatoJustificativa||"")},
          hook:String(x.hook||""),cta:String(x.cta||""),justificativa:String(x.justificativa||"")};
      });
    var col=dbItemsCol("cos_ideas",id);
    if(!append)await clearCollection(col);
    if(SB&&novas.length)await gravarTravado(novas.map(function(idea){return {path:"cos_ideas/"+id+"/items/"+idea.id,data:idea}}));
    else await Promise.all(novas.map(function(idea){return col.doc(idea.id).set(idea);}));
    var ideas=atuais.concat(novas);
    if(DB_STATE_CACHE[id])DB_STATE_CACHE[id].ideas=ideas;
    if(state.client===id)GENERATED.ideas=ideas;
    return novas.length;
  }
  async function runGerarIdeias(ev,append){
    var id=state.client;if(!CAP.sample){noAi();return;}
    var btn=I(append?"#moreIdeasBtn":"#genIdeasBtn");if(btn)btn.disabled=true;
    var msg=I("#ideasMsg");setBusy(msg,append?"Criando mais 15 ideias, sem repetir as atuais…":"Pensando…");
    try{
      await gerarIdeiasCore(id,!!append,15);
      if(state.client===id)renderIdeas();
    }catch(e){
      if(msg){msg.textContent=sampleErrCopy(e);msg.style.color="var(--warn)";}
      if(btn)btn.disabled=false;
    }
  }
  function renderIdeas(){
    var el=I('.view[data-view="ideas"]'),db=isDbClient(state.client),gi=(GENERATED&&GENERATED.ideas)||[];
    var barra='<div class="toolbar"><span class="pp-m">'+(gi.length?gi.length+' ideias':'')+'</span><span class="spacer"></span><span id="ideasMsg" class="pp-m"></span>'+
      (db?'<button class="btn" id="prefsOpen">Preferências de criação</button>'+(gi.length?'<button class="btn" id="genIdeasBtn" title="Apaga as atuais e gera outras">Gerar do zero</button><button class="btn pri" id="moreIdeasBtn"><span class="bi">'+iconeUI("mais")+'</span>Gerar mais 15</button>':''):'')+'</div>';
    if(gi.length){
      el.innerHTML=barra+'<div class="tabela"><table><thead><tr><th>Ideia</th><th>Formato</th><th>Funil</th><th>Função</th><th>Gancho</th></tr></thead><tbody>'+gi.map(function(x,i){var fr=x.formatRec||{};
        return '<tr data-ideia="'+i+'"><td class="e-reg"><b class="cel-t">'+esc(x.titulo)+'</b><small>'+esc(x.angulo||x.conceito||"")+'</small></td><td>'+esc(fr.formato||x.format||"")+'<small>'+esc(surfLbl(x.surface))+'</small></td>'+
          '<td><span class="chip">'+esc(x.funil||"")+'</span></td><td>'+esc(x.funcao||"")+'</td><td class="e-reg">'+esc(x.hook||"")+'</td></tr>';}).join('')+'</tbody></table></div>';
      Array.prototype.forEach.call(el.querySelectorAll('[data-ideia]'),function(tr){tr.addEventListener('click',function(){abrirIdeia(+tr.getAttribute('data-ideia'))})});
    }else{
      var hasEd=GENERATED&&GENERATED.editorial&&GENERATED.editorial.length;
      el.innerHTML=barra+(hasEd?vazioQuadro("Nenhuma ideia ainda.","A Musa cruza estratégia, linha editorial, pesquisa e o que já performou, e propõe uma ideia por data do calendário.",'<div class="q-rodape"><button class="btn pri genbtn" id="genIdeasBtn">Gerar ideias</button></div>'):
        vazioQuadro("Falta a linha editorial.","As ideias nascem da linha editorial.",'<div class="q-rodape"><button class="btn pri" data-ir-aba="editorial">Ir para Linha editorial</button></div>'));
      ligarIrAba(el);
    }
    var gb=I("#genIdeasBtn");if(gb)gb.addEventListener('click',function(){if(!gi.length||confirm("Apagar as ideias atuais e gerar outras do zero?"))runGerarIdeias(null,false);});
    var mb=I("#moreIdeasBtn");if(mb)mb.addEventListener('click',function(){runGerarIdeias(null,true);});
    var po=I("#prefsOpen");if(po)po.addEventListener('click',abrirPrefs);
  }
  function gavetaHtml(titulo,sub,corpo,rodape){
    return '<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" aria-label="'+esc(titulo)+'"><div class="dh"><div style="flex:1;min-width:0"><div class="d-title">'+esc(titulo)+'</div>'+(sub?'<div class="d-sub">'+esc(sub)+'</div>':'')+'</div><button class="icon-btn" id="dclose" aria-label="Fechar">'+iconeUI("x-fechar")+'</button></div><div class="db">'+corpo+'</div>'+(rodape?'<div class="df">'+rodape+'</div>':'')+'</aside>';
  }
  function abrirGaveta(titulo,sub,corpo,rodape){
    I("#overlay").innerHTML=gavetaHtml(titulo,sub,corpo,rodape);
    I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);document.addEventListener('keydown',escClose);
  }
  function abrirIdeia(i){
    var x=(GENERATED.ideas||[])[i];if(!x)return;var fr=x.formatRec||{};
    var kv=function(l,v){return v?'<div class="kv"><span>'+l+'</span><div>'+esc(v)+'</div></div>':''};
    abrirGaveta(x.titulo,(fr.formato||x.format||"")+" · "+(x.funil||""),
      '<div class="block">'+kv("Conceito",x.conceito)+kv("Ângulo",x.angulo)+kv("Dor ou desejo",x.dorDesejo)+kv("Gancho",x.hook)+kv("Chamada",x.cta)+'</div>'+
      '<div class="block">'+kv("Função",x.funcao)+kv("Jornada",x.jornada)+kv("Emoção",x.emocao)+kv("Pilar",(x.pilar||"").split(":")[0])+kv("Tema",x.tema)+'</div>'+
      '<div class="block">'+kv("Propósito",x.proposito)+kv("Por que este formato",fr.justificativa)+kv("Por que esta ideia",x.justificativa)+kv("Gatilhos",(x.gatilhos||[]).join(", "))+kv("Elementos literários",(x.elementos||[]).join(", "))+'</div>');
  }
  function abrirPrefs(){
    abrirGaveta("Preferências de criação",clientName(state.client),prefsCardHtml());
    wirePrefs();
  }
