  // ---------- render ----------
  function buildNav(){
    var src=state.clientView?CLIENT_NAV:NAV;
    I("#nav").innerHTML=src.map(function(grp){return '<div class="nav-group"><div class="lbl">'+grp.g+'</div>'+grp.items.map(function(it){return '<a data-view="'+it[0]+'">'+(IC[it[0]]||"")+'<span>'+it[1]+'</span></a>'}).join('')+'</div>'}).join('');
    Array.prototype.forEach.call(document.querySelectorAll('#nav a'),function(a){a.addEventListener('click',function(){go(a.getAttribute('data-view'))})});
    var a2=I("#nav a[data-view=\""+state.view+"\"]");if(a2)a2.classList.add("active");
  }
  // Dispatca a renderização da view v — usado por go() e também por
  // setClient() quando o estado de um cliente real termina de carregar do db
  // (assíncrono), sem duplicar a lista de views em dois lugares.
  function renderView(v){
    if(v==="dna")renderDNA(); if(v==="strategy")renderStrategy(); if(v==="research")renderResearch(); if(v==="editorial")renderEditorial(); if(v==="ideas")renderIdeas(); if(v==="formats")renderFormats(); if(v==="analyze")renderAnalyze(); if(v==="distribution")renderDistribution(); if(v==="plan")renderPlan(); if(v==="config")renderConfig();
    if(v==="content")renderContentList(); if(v==="calendar")renderCal(); if(v==="approvals")renderApprovals(); if(v==="overview"){renderKpis();renderOverviewContent();renderCobrancaBanner();renderBackupBanner();} if(v==="ativos")renderAtivos();
    renderStatus(v);
  }
  function go(v){
    if(state.clientView&&["overview","strategy","editorial","formats","content","calendar"].indexOf(v)<0)v="overview";
    state.view=v;
    Array.prototype.forEach.call(document.querySelectorAll('#nav a'),function(a){a.classList.toggle('active',a.getAttribute('data-view')===v)});
    var needs=["dna","plan","strategy","research","editorial","ideas","formats","content","calendar","approvals","performance"].indexOf(v)>=0,noCli=needs&&!state.client;
    Array.prototype.forEach.call(document.querySelectorAll('.view'),function(s){s.hidden=noCli||s.getAttribute('data-view')!==v});
    var nh=I("#noClientHero");if(nh)nh.hidden=!noCli;
    var t=TITLES[v]||["",v];I("#crumb").textContent=t[0];I("#ptitle").textContent=t[1];
    if(!noCli)renderView(v);else renderStatus(v);
    window.scrollTo({top:0});
  }
  function renderPipe(){I("#pipe").innerHTML=PIPE.map(function(s,i){return '<span class="step'+(i===0?' on':'')+'">'+s+'</span>'+(i<PIPE.length-1?'<span class="arr">→</span>':'')}).join('')}
  function kpiCard(l,v,s){return '<div class="card kpi"><span class="k-lbl">'+l+'</span><div class="k-val tnum">'+v+'</div><div class="k-sub">'+s+'</div></div>'}
  function renderKpis(){
    var active=AGENTS.filter(function(a){return a.s==="active"}).length;
    var calCount=genOn()?GENERATED.calendar.items.length:CONTENT.length;
    var dnaCount=(genOn()&&GENERATED.dna)?GENERATED.dna.length:(DNA[state.client]||[]).length;
    I("#kpis").innerHTML=
      kpiCard("Clientes",String(CLIENTS.length),CLIENTS.length+" nichos distintos")+
      kpiCard("Agentes",active+" <span style='font-size:15px;color:var(--faint)'>/ "+AGENTS.length+"</span>",active+" ativos (veja Agentes)")+
      kpiCard("Registros no Content DNA",String(dnaCount),genOn()?"gerado pela Íris":"exemplo")+
      kpiCard("Conteúdos no calendário",String(calCount),genOn()?"plano real do mês":"demonstração");
  }
  function contentCard(x){
    return '<div class="card content-card" data-content="'+x.id+'"><div class="cc-h">'+esc(x.headline)+'</div><div class="cc-m">'+esc(clientName(x.client))+' · '+esc(x.surface)+' + '+esc(x.format)+'</div><div class="cc-tags"><span class="badge '+(STCOL[x.status]||'badge')+'">'+x.status+'</span><span class="pill st-INSIGHT">'+esc(x.funcao)+'</span><span class="pill emo-pill">♥ '+esc(x.emocao)+'</span></div></div>';
  }
  function wireContent(sel){Array.prototype.forEach.call(document.querySelectorAll(sel),function(el){el.addEventListener('click',function(){openContent(el.getAttribute('data-content'))})})}
  function renderOverviewContent(){
    var ov=I("#ovSteps");
    if(ov){
      ov.innerHTML=!CLIENTS.length?'<div class="card empty-hero" style="margin-top:16px"><div class="eh-ic">＋</div><div class="eh-t" style="margin-bottom:14px">Comece cadastrando o <b>primeiro cliente</b>. Cada agente se alimenta do anterior: Ficha → Content DNA → Estratégia → Linha Editorial → Ideias → Formatos → Calendário.</div><button class="btn pri genbtn" id="ovNewClient">+ Novo cliente</button></div>':nextStepsHtml();
      var nb=I("#ovNewClient");if(nb)nb.addEventListener('click',openNewClientModal);
      wireSteps(ov);
    }
    if(genOn()){I("#ovContent").innerHTML=GENERATED.calendar.items.slice(0,4).map(genCard).join('');wireGen('#ovContent [data-gen]');return;}
    I("#ovContent").innerHTML=CONTENT.slice(0,4).map(contentCard).join('');wireContent('#ovContent [data-content]');
  }

  function renderClients(){
    var cards=CLIENTS.map(function(c){var g=(GENERATED_ALL||{})[c.id]||DB_STATE_CACHE[c.id];
      var n=g&&g.dna?g.dna.length:(DNA[c.id]||[]).length,ct=g&&g.calendar?g.calendar.items.length:CONTENT.filter(function(x){return x.client===c.id}).length;
      var blank=isDbClient(c.id)&&!n&&!ct;
      return '<div class="card pad" style="cursor:pointer" data-client="'+c.id+'"><div style="display:flex;gap:12px;align-items:center"><div style="width:40px;height:40px;border-radius:11px;display:grid;place-items:center;color:#fff;font-family:var(--font-display);font-weight:700;background:'+avc(c.av)+'">'+c.name.charAt(0)+'</div><div><div style="font-family:var(--font-display);font-weight:700;font-size:15px">'+esc(c.full)+'</div><div style="font-size:12px;color:var(--muted)">'+esc(c.niche)+'</div></div></div><div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">'+(blank?'<span class="badge">em branco — pronto pra preencher</span>':'<span class="badge">'+n+' registros DNA</span><span class="badge">'+ct+' conteúdos</span>')+'</div></div>'}).join('');
    var addCard='<div class="card pad dashed-add" style="cursor:pointer;display:flex;align-items:center;justify-content:center;min-height:96px;border-style:dashed;color:var(--muted)" id="clientAddCard"><div style="text-align:center"><div style="font-size:22px;line-height:1">+</div><div style="font-size:12.5px;font-weight:600;margin-top:4px">Novo cliente</div></div></div>';
    I("#clientCards").innerHTML=cards+addCard;
    Array.prototype.forEach.call(document.querySelectorAll('[data-client]'),function(el){el.addEventListener('click',function(){setClient(el.getAttribute('data-client'));go('dna')})});
    I("#clientAddCard").addEventListener('click',openNewClientModal);
    var bt=I("#briefTools");if(bt){bt.innerHTML=briefToolsHtml();var b1=I("#bfForm");if(b1)b1.addEventListener('click',openBriefFormModal);var b2=I("#bfImport");if(b2)b2.addEventListener('click',openBriefImportModal);var b3=I("#inboxRefresh");if(b3)b3.addEventListener('click',renderInbox);}
  }
  function busyHtml(text){return '<span class="spinner"></span>'+esc(text);}
  function setBusy(el,text){if(!el)return;el.innerHTML=busyHtml(text);el.classList.add('busy');}
  function clearBusy(el){if(!el)return;el.classList.remove('busy');}
  function sampleErrCopy(e){
    var code=e&&e.code;
    if(code==="not_granted")return "Você precisa permitir que este painel use IA — aparece um aviso do Claude na primeira chamada.";
    if(code==="rate_limited")return "O Claude pediu uma pausa (limite de uso da sua conta ou outra aba do painel usando a IA). Seu texto está salvo — feche outras abas do painel e tente de novo em 1 minuto.";
    if(code==="cancelled")return "Cancelado.";
    if(code==="prompt_too_large")return "Muita informação de uma vez — tenta com um texto mais curto.";
    if(code==="invalid_json")return "A IA não respondeu num formato que eu consegui ler — tenta de novo.";
    if(code==="refused"||code==="empty_completion")return "A IA não conseguiu responder a isso — tenta reformular.";
    if(code==="not_declared"||code==="sampling_disabled"||code==="capability_disabled"||code==="capability_removed")return "IA ao vivo indisponível neste painel agora.";
    return "Algo deu errado ("+(code||"erro")+") — tenta de novo.";
  }
  // rate_limited: a plataforma pede que a página NÃO repita sozinha — só
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
      '2. Só afirme como FACT o que estiver declarado no texto abaixo — o resto é HYPOTHESIS ou INSIGHT.',
      '3. Estados possíveis: FACT (fato declarado), HYPOTHESIS (suposição plausível), INSIGHT (interpretação derivada de fatos), STRATEGIC_DECISION (decisão já tomada), LEARNING (aprendizado com evidência de performance).',
      '',
      'CAMPOS CANÔNICOS — use exatamente estas chaves em "field" quando a informação existir (uma sugestão por ocorrência: cada dor real vira uma sugestão separada com field "dores"):',
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
    // dias, gravação) como no "Importar briefing" — senão o calendário sai no padrão.
    var pb=parseBriefing(briefing);
    if(pb&&isDbClient(id)){try{await saveClientRecord(id,Object.assign(fichaDoBriefing(id,pb),{briefing:briefing}));}catch(e){}}
    try{
      var out=await CAP.sample.json(buildIrisPrompt(byId(id).name,briefing),{modelTier:"default",cache:false});
      var sugs=(out&&out.suggestions)||[];
      var entries=(GENERATED.dna||[]).slice();
      sugs.forEach(function(s){if(!s||!s.field||!s.value)return;
        entries.push({section:s.section||"business",field:String(s.field),value:String(s.value),state:s.state||"HYPOTHESIS",status:"pending",src:"Briefing informado no painel"});});
      await saveDna(id,entries);
      I("#dnaMsg").textContent=sugs.length+" sugestões — revise e aprove abaixo.";I("#dnaMsg").style.color="var(--good)";
    }catch(e){I("#dnaMsg").textContent=sampleErrCopy(e);I("#dnaMsg").style.color="var(--warn)";if(cooldownBtn(I("#dnaRun"),e,60))return;}
    var btn=I("#dnaRun");if(btn)btn.disabled=false;
  }
  function dnaOnboardingHtml(){
    return '<div class="card pad" style="margin-bottom:16px"><div class="bt" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--faint);margin-bottom:10px">Preencher com a Íris (opcional)</div>'+
      '<div class="fld"><label for="dnaBriefing">Cole um briefing, entrevista ou anotações do cliente</label><textarea class="ta" id="dnaBriefing" placeholder="Ex.: Vendo X, meu público é Y, a maior dor deles é Z…">'+esc((DB_CLIENTS[state.client]||{}).briefing||"")+'</textarea><div id="briefSaved" style="font-size:11px;color:var(--faint)">'+((DB_CLIENTS[state.client]||{}).briefing?"✓ Briefing salvo — fica aqui para as próximas vezes":"O texto fica salvo automaticamente")+'</div></div>'+
      '<button class="btn pri genbtn" id="dnaRun">✦ Analisar com a Íris</button><span id="dnaMsg" style="margin-left:10px;font-size:12px;color:var(--muted)"></span>'+
      '<div style="font-size:11px;color:var(--faint);margin-top:10px">Cada sugestão vem marcada como pendente — nada vira fato sem você aprovar.</div></div>'+
      '<div class="card pad" style="margin-bottom:16px"><div class="bt" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--faint);margin-bottom:10px">Ou adicionar um registro manual</div>'+
      '<div class="grid cols-2"><div class="fld"><label for="dnaSec">Seção</label><select id="dnaSec">'+SECORDER.map(function(s){return '<option value="'+s+'">'+SECLBL[s]+'</option>'}).join('')+'</select></div>'+
      '<div class="fld"><label for="dnaField">Campo (ex.: dores, desejos, persona, oferta, tom)</label><input id="dnaField" placeholder="dores"></div></div>'+
      '<div class="fld"><label for="dnaVal">Valor</label><textarea class="ta" id="dnaVal" style="min-height:70px"></textarea></div>'+
      '<button class="btn" id="dnaAddManual">+ Adicionar (já aprovado — você digitou)</button></div>';
  }
  async function addManualDna(){
    var id=state.client,sec=I("#dnaSec").value,field=(I("#dnaField").value||"").trim(),val=(I("#dnaVal").value||"").trim();
    if(!field||!val)return;
    var entries=(GENERATED.dna||[]).slice();
    entries.push({section:sec,field:field,value:val,state:"FACT",status:"approved",src:"Preenchido manualmente"});
    await saveDna(id,entries);
    I("#dnaField").value="";I("#dnaVal").value="";
  }
  // ---- Referências & Concorrentes — sempre digitadas por você, nunca inventadas pela IA
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
    if(items.length>=5){I("#refMsg").textContent="Máximo de 5 — remova uma antes de adicionar outra.";I("#refMsg").style.color="var(--warn)";return;}
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
    var list=items.map(function(r,i){return '<div class="entry"><div class="e-top"><span class="pill st-INSIGHT">'+esc(r.tipo)+'</span><span class="e-field">'+esc(r.nome)+'</span><button class="btn ghost" data-refrm="'+i+'" style="margin-left:auto;padding:3px 9px;font-size:11px">Remover</button></div>'+(r.descricao?'<div class="e-val">'+esc(r.descricao)+'</div>':'')+'</div>';}).join('');
    return '<div class="card pad" style="margin-bottom:16px"><div class="bt" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--faint);margin-bottom:6px">Referências & Concorrentes <span class="tag-mock">até 5 · digitados por você</span></div>'+
      '<div style="font-size:11.5px;color:var(--faint);margin-bottom:12px">A IA não navega a internet — ela nunca inventa perfis. Digite aqui contas reais que você já conhece (referência de estilo ou concorrente direto) e o porquê; a Musa usa isso como inspiração de ângulo/tom ao gerar ideias — nunca copia nem cita o nome deles no conteúdo final.</div>'+
      (list||'<div style="font-size:12.5px;color:var(--faint);margin-bottom:10px">Nenhuma referência ainda.</div>')+
      (items.length<5?'<div class="grid cols-2" style="margin-top:12px"><div class="fld"><label for="refNome">Nome / @</label><input id="refNome" placeholder="@perfilreal"></div><div class="fld"><label for="refTipo">Tipo</label><select id="refTipo"><option>Referência de estilo</option><option>Concorrente direto</option></select></div></div><div class="fld"><label for="refDesc">O que você percebe nele (opcional)</label><input id="refDesc" placeholder="Ex.: usa muito humor, foca em antes/depois…"></div><button class="btn" id="refAdd">+ Adicionar referência</button><span id="refMsg" style="margin-left:10px;font-size:12px;color:var(--muted)"></span>':'')+
      '</div>';
  }
  function dnaEntryHtml(x,i){
    return '<div class="entry" data-i="'+i+'"><div class="e-top"><span class="pill mono st-'+x.state+'">'+STLBL[x.state]+'</span><span class="e-field">'+esc(x.field)+'</span>'+(x.status==="approved"?'<span class="badge act" style="margin-left:auto">✓ aprovado</span>':'<span class="badge prog" style="margin-left:auto">pendente</span>')+'</div><div class="e-val" data-role="val">'+esc(x.value)+'</div><div class="e-prov">↳ '+esc(x.src)+'</div>'+
      (isDbClient(state.client)?'<div class="e-actions">'+(x.status!=="approved"?'<button class="btn pri" data-act="approve">Aprovar</button>':'')+'<button class="btn" data-act="edit">Editar</button><button class="btn ghost" data-act="reject">Remover</button></div>':(x.status==="pending"?'<div class="e-actions"><button class="btn pri">Aprovar</button><button class="btn">Editar</button><button class="btn ghost">Rejeitar</button></div>':''))+'</div>';
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
            b.textContent="Salvar";b.setAttribute('data-act','save-edit');
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
    var c=byId(state.client);I("#dnaTitle").textContent="Content DNA — "+c.name;
    if(isDbClient(state.client)){
      var list=GENERATED.dna||[],h=fichaHtml()+dnaOnboardingHtml()+refsBlockHtml();
      SECORDER.forEach(function(sec){var items=list.map(function(x,i){return [x,i]}).filter(function(p){return p[0].section===sec});if(!items.length)return;
        h+='<div class="card dna-sec"><h4>'+SECLBL[sec]+'<span class="ct">'+items.length+'</span></h4>'+items.map(function(p){return dnaEntryHtml(p[0],p[1])}).join('')+'</div>';});
      I("#dnaSections").innerHTML=h;
      I("#dnaRun").addEventListener('click',runIrisLive);
      wireFicha();wireBriefingAutosave();
      I("#dnaAddManual").addEventListener('click',addManualDna);
      var refAddBtn=I("#refAdd");if(refAddBtn)refAddBtn.addEventListener('click',addRef);
      Array.prototype.forEach.call(document.querySelectorAll('[data-refrm]'),function(b){b.addEventListener('click',function(){removeRef(+b.getAttribute('data-refrm'));})});
      wireDnaActions();
      return;
    }
    var list=DNA[state.client]||[];
    var h="";SECORDER.forEach(function(sec){var items=list.filter(function(x){return x.section===sec});if(!items.length)return;
      h+='<div class="card dna-sec"><h4>'+SECLBL[sec]+'<span class="ct">'+items.length+'</span></h4>'+items.map(function(x,i){return dnaEntryHtml(x,i)}).join('')+'</div>'});
    I("#dnaSections").innerHTML=h;
    wireDnaActions();
  }
  function drawStratMix(){
    var sp=GENERATED.strategy,box=I("#stratMix");if(!box)return;
    var sel=sp.paths.filter(function(p){return state.stratSel.indexOf(p.key)>=0});
    if(!sel.length){box.innerHTML='<div style="font-size:12.5px;color:var(--faint)">Selecione ao menos um caminho abaixo.</div>';return;}
    var w=sel.map(function(p){return Math.max(1,p.relevancia-25)});
    var pcts=largestRemainder(w,100);
    var seg=sel.map(function(p,i){return '<div class="seg" style="flex:'+pcts[i]+' 1 0;background:'+avc(i)+'">'+pcts[i]+'%</div>'}).join('');
    var list=sel.map(function(p,i){return '<span class="badge" style="border-color:transparent;background:var(--surface-2)"><span style="width:8px;height:8px;border-radius:50%;background:'+avc(i)+';display:inline-block"></span> '+pcts[i]+'% '+esc(p.nome)+'</span>'}).join(' ');
    box.innerHTML='<div class="stack">'+seg+'</div><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:11px">'+list+'</div>';
  }
  function renderStrategyPaths(el){
    var g=GENERATED,sp=g.strategy;
    sp.paths=(sp.paths||[]).map(function(p){return Object.assign({funcoes:[],emocoes:[],metricas:[],relevancia:50},p)});
    if(!state.stratSel)state.stratSel=(sp.mix||[]).map(function(m){return m.key});
    if(!state.stratSel.length)state.stratSel=sp.paths.slice(0,3).map(function(p){return p.key});
    var h='<div class="section-head" style="margin-top:6px"><div><h3>Estratégia — '+esc(g.clientName.split("—")[0].trim())+' <span class="statuspill lvl-func" style="vertical-align:middle">Funcional</span></h3><p><b>Átlas</b> não entrega "uma" estratégia: propõe caminhos, explica quando/por que usar cada um e recomenda um <b>mix</b>. Clique nos caminhos para combinar o seu.</p></div></div>'+
      (isDbClient(state.client)?'<div style="margin:-6px 0 14px"><button class="btn" id="regenStratBtn">↻ Gerar de novo</button></div>':'');
    h+='<div class="card pad"><div class="bt" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--faint);margin-bottom:10px">Mix estratégico do mês</div><div id="stratMix"></div></div>';
    // Big Message + percepção
    h+='<div class="grid cols-2" style="margin-top:16px"><div class="card pad" style="background:var(--brand-weak);border-color:transparent"><div class="bt" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--brand-ink);margin-bottom:6px">Big Message</div><div style="font-size:14px;font-family:var(--font-display);font-weight:700;color:var(--brand-ink)">'+esc(sp.bigMessage)+'</div></div>'+
      '<div class="card pad"><div class="bt" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--faint);margin-bottom:6px">Percepção a construir</div><div style="font-size:13.5px">'+esc(sp.percepcao)+'</div></div></div>';
    // Caminhos
    h+='<div class="section-head"><div><h3>Caminhos estratégicos possíveis</h3><p>Ranqueados pela aderência ao Content DNA. Os do mix ficam destacados.</p></div></div>';
    h+='<div class="clist">'+sp.paths.map(function(p){
      var on=state.stratSel.indexOf(p.key)>=0;
      return '<div class="card pad" data-path="'+p.key+'" style="cursor:pointer;'+(on?'border-color:var(--brand);box-shadow:0 0 0 1px var(--brand) inset':'')+'">'+
        '<div style="display:flex;align-items:center;gap:8px"><div style="font-family:var(--font-display);font-weight:700;font-size:15px;flex:1">'+esc(p.nome)+'</div><span class="pill '+(on?'st-INSIGHT':'')+'" style="'+(on?'':'background:var(--surface-2);color:var(--muted)')+'">'+p.relevancia+'</span>'+(on?'<span class="badge act">no mix</span>':'')+'</div>'+
        '<div style="font-size:12px;color:var(--muted);margin-top:6px">'+esc(p.quando)+' '+esc(p.porque)+'</div>'+
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">'+p.funcoes.map(function(f){return '<span class="pill st-INSIGHT">'+esc(f)+'</span>'}).join('')+p.emocoes.map(function(e){return '<span class="pill emo-pill">♥ '+esc(e)+'</span>'}).join('')+'</div>'+
        '<div style="font-size:11.5px;color:var(--faint);margin-top:9px"><b style="color:var(--muted)">Métricas:</b> '+p.metricas.join(" · ")+'</div></div>';
    }).join('')+'</div>';
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
      'O "mix" é um subconjunto de 2-4 caminhos (chaves que aparecem em "paths") cujos pct somam 100 — o combo recomendado para este mês.',
    ].join('\n');
  }
  async function runGerarEstrategia(){
    var id=state.client;if(!CAP.sample){noAi();return;}
    var btn=I("#genStratBtn");if(btn)btn.disabled=true;
    var msg=I("#stratMsg");setBusy(msg,"Pensando…");
    try{
      var out=await CAP.sample.json(buildStrategyPrompt(byId(id).name,dnaCompact()),{modelTier:"complex",cache:false});
      var strat={posicionamento:String(out.posicionamento||""),bigMessage:String(out.bigMessage||""),persona:String(out.persona||""),percepcao:String(out.percepcao||""),
        pilares:Array.isArray(out.pilares)?out.pilares.map(String):[],paths:Array.isArray(out.paths)?out.paths:[],mix:Array.isArray(out.mix)?out.mix:[]};
      await dbDoc("cos_strategy/"+id).set(strat);
      if(DB_STATE_CACHE[id])DB_STATE_CACHE[id].strategy=strat;
      if(state.client===id){GENERATED.strategy=strat;state.stratSel=null;renderStrategy();}
    }catch(e){
      if(msg){msg.textContent=sampleErrCopy(e);msg.style.color="var(--warn)";}
      if(btn)btn.disabled=false;
    }
  }
  function renderStrategyEmpty(el){
    var hasDna=GENERATED&&GENERATED.dna&&GENERATED.dna.length;
    el.innerHTML='<div class="section-head" style="margin-top:6px"><div><h3>Estratégia — '+esc(clientName(state.client))+'</h3><p><b>Átlas</b> lê o Content DNA e propõe posicionamento, Big Message e caminhos estratégicos — nada genérico.</p></div></div>'+
      '<div class="card empty-hero"><div class="eh-ic">◈</div>'+
      (hasDna?'<div class="eh-t" style="margin-bottom:16px">Ainda não gerada.</div><button class="btn pri genbtn" id="genStratBtn">✦ Gerar Estratégia</button><span id="stratMsg" style="margin-left:10px;font-size:12px;color:var(--muted)"></span>'
        :'<div class="eh-t">Preencha o <b>Content DNA</b> primeiro — a estratégia nasce dele, não é genérica.</div>')+'</div>';
    var btn=I("#genStratBtn");if(btn)btn.addEventListener('click',runGerarEstrategia);
  }
  function renderStrategy(){
    var el=I('.view[data-view="strategy"]');
    if(GENERATED&&GENERATED.strategy){return renderStrategyPaths(el);}
    if(isDbClient(state.client)){return renderStrategyEmpty(el);}
    var s=STRATEGY[state.client];
    if(!s){el.innerHTML=emptyView("Estratégia — "+clientName(state.client),"Ainda sem estratégia para este cliente. Gere o Content DNA e rode o Átlas para criar a estratégia.");return;}
    el.innerHTML='<div class="section-head" style="margin-top:6px"><div><h3>Estratégia — '+clientName(state.client)+' <span class="tag-mock">demonstração</span></h3><p>Definida por <b>Átlas</b> a partir do Content DNA.</p></div></div>'+
      '<div class="grid cols-2"><div class="card pad"><div class="bt" style="font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:6px">Posicionamento</div><div style="font-size:14px">'+esc(s.posicionamento)+'</div></div>'+
      '<div class="card pad" style="background:var(--brand-weak);border-color:transparent"><div class="bt" style="font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--brand-ink);margin-bottom:6px">Big Message</div><div style="font-size:15px;font-family:var(--font-display);font-weight:700;color:var(--brand-ink)">'+esc(s.bigmsg)+'</div></div></div>'+
      '<div class="card pad" style="margin-top:16px"><div class="metagrid"><div><div class="mk">Objetivos</div><div class="mv">'+s.objetivos.join(' · ')+'</div></div><div><div class="mk">Jornada</div><div class="mv">'+esc(s.jornada)+'</div></div><div style="grid-column:1/-1"><div class="mk">Percepção que queremos construir</div><div class="mv">'+esc(s.percepcao)+'</div></div><div><div class="mk">Crenças a construir</div><div class="mv chips">'+s.construir.map(function(x){return '<span class="badge act">'+esc(x)+'</span>'}).join('')+'</div></div><div><div class="mk">Crenças a desafiar</div><div class="mv chips">'+s.desafiar.map(function(x){return '<span class="badge prog">'+esc(x)+'</span>'}).join('')+'</div></div></div></div>';
  }
  function researchItemHtml(r){
    return '<div class="ritem"><span class="pill st-STRATEGIC_DECISION" style="height:fit-content">'+esc(r.tipo)+'</span><div><div class="ri-t">'+esc(r.insight)+'</div><div class="ri-m">↳ '+esc(r.origem)+(r.relevancia&&r.relevancia!=="—"?' · '+esc(r.relevancia):'')+'</div></div></div>';
  }
  function buildResearchPrompt(name,dnaText){
    return ['Você é Radar, o agente de Pesquisa do Content OS. A partir do Content DNA real abaixo, aponte oportunidades de conteúdo ANCORADAS no que já se sabe sobre o cliente — dores, objeções e diferenciais reais.',
      '', 'REGRA CRÍTICA: você NÃO tem acesso à internet. NUNCA invente tendências de mercado, dados de concorrentes ou pesquisa externa — isso exigiria acesso web/API real, que você não tem. Só derive oportunidades do Content DNA fornecido.',
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
      var today=new Date().toISOString().slice(0,10);
      var items=(Array.isArray(out.items)?out.items:[]).map(function(r){return {tipo:String(r.tipo||"Oportunidade"),insight:String(r.insight||""),origem:String(r.origem||"Derivado do Content DNA"),data:today,relevancia:String(r.relevancia||"—")};});
      items.push({tipo:"Nota",insight:"Pesquisa externa real (tendências, concorrentes, palavras-chave) exige acesso web/API — não fabricada.",origem:"Sistema",data:today,relevancia:"—"});
      await dbDoc("cos_research/"+id).set({items:items});
      if(DB_STATE_CACHE[id])DB_STATE_CACHE[id].research=items;
      if(state.client===id){GENERATED.research=items;renderResearch();}
    }catch(e){
      if(msg){msg.textContent=sampleErrCopy(e);msg.style.color="var(--warn)";}
      if(btn)btn.disabled=false;
    }
  }
  function renderResearch(){
    var el=I('.view[data-view="research"]');
    if(GENERATED&&GENERATED.research&&GENERATED.research.length){
      el.innerHTML='<div class="section-head" style="margin-top:6px"><div><h3>Pesquisa — '+esc(clientName(state.client))+' <span class="statuspill lvl-func" style="vertical-align:middle">Funcional</span></h3><p><b>Radar</b> — sinais internos derivados do Content DNA, com fonte. Pesquisa externa (tendências, concorrentes) exige acesso web/API — nunca inventada.</p></div></div>'+
        (isDbClient(state.client)?'<div style="margin:-6px 0 14px"><button class="btn" id="genResBtn">↻ Gerar de novo</button><span id="resMsg" style="margin-left:10px;font-size:12px;color:var(--muted)"></span></div>':'')+
        '<div class="card pad">'+GENERATED.research.map(researchItemHtml).join('')+'</div>';
      var btn=I("#genResBtn");if(btn)btn.addEventListener('click',runGerarPesquisa);
      return;
    }
    if(isDbClient(state.client)){
      var hasDna=GENERATED&&GENERATED.dna&&GENERATED.dna.length;
      el.innerHTML='<div class="section-head" style="margin-top:6px"><div><h3>Pesquisa — '+esc(clientName(state.client))+'</h3><p><b>Radar</b> — sinais internos derivados do Content DNA. Pesquisa externa exige acesso web/API.</p></div></div>'+
        '<div class="card empty-hero"><div class="eh-ic">◎</div>'+(hasDna?'<button class="btn pri genbtn" id="genResBtn">✦ Gerar Pesquisa</button><span id="resMsg" style="margin-left:10px;font-size:12px;color:var(--muted)"></span>':'<div class="eh-t">Preencha o Content DNA primeiro.</div>')+'</div>';
      var btn2=I("#genResBtn");if(btn2)btn2.addEventListener('click',runGerarPesquisa);
      return;
    }
    var items=RESEARCH[state.client]||[];
    if(!items.length){el.innerHTML=emptyView("Pesquisa — "+clientName(state.client),"Sem pesquisa de exemplo para este cliente ainda.");return;}
    el.innerHTML='<div class="section-head" style="margin-top:6px"><div><h3>Pesquisa — '+clientName(state.client)+' <span class="tag-mock">demonstração</span></h3><p><b>Radar</b> — inteligência externa com fonte e data. Nunca inventa tendências.</p></div></div>'+
      '<div class="card pad">'+items.map(function(r){return '<div class="ritem"><span class="pill st-STRATEGIC_DECISION" style="height:fit-content">'+esc(r[0])+'</span><div><div class="ri-t">'+esc(r[1])+'</div><div class="ri-m">↳ '+esc(r[2])+'</div></div></div>'}).join('')+'</div>';
  }
  function editorialTreeHtml(ed){
    return '<div class="tree">'+ed.map(function(p){
      return '<div class="pil"><div class="h"><span style="width:8px;height:8px;border-radius:50%;background:var(--brand)"></span>'+esc((p.pilar||"").split(":")[0])+'<span class="role" style="margin-left:8px;font-weight:500">· '+esc(p.territorio)+'</span></div><div class="b" style="flex-direction:column;align-items:stretch;gap:10px">'+
        (p.temas||[]).map(function(t){return '<div style="border:1px solid var(--line-2);border-radius:10px;padding:10px 12px"><div style="font-family:var(--font-display);font-weight:700;font-size:13px;margin-bottom:7px">'+esc(t.tema)+'</div><div style="display:flex;gap:6px;flex-wrap:wrap"><span style="font-size:10px;color:var(--faint);font-weight:600;align-self:center">SUBTEMAS</span>'+(t.subtemas||[]).map(function(s){return '<span class="badge">'+esc(s)+'</span>'}).join('')+'</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><span style="font-size:10px;color:var(--faint);font-weight:600;align-self:center">TÓPICOS</span>'+(t.topicos||[]).map(function(s){return '<span class="pill st-INSIGHT">'+esc(s)+'</span>'}).join('')+'</div></div>'}).join('')+
      '</div></div>';
    }).join('');
  }
  function buildEditorialPrompt(name,strategy){
    var ppw=state.client?diasPostOf().length:3,cp=capacidadePrompt();
    var mp2=metasPrompt();
    return [mp2,cp?cp+'\nCom '+ppw+' postagens por semana, priorize '+(ppw<=2?'2 a 3':ppw<=4?'3 a 4':'4 a 5')+' pilares realmente ativos — frequência baixa pede poucas frentes, repetidas com consistência.\n':'','Você é Bússola, o agente de Linha Editorial do Content OS. A partir dos pilares estratégicos abaixo, construa a árvore editorial: Pilar → Território → Temas → Subtemas → Tópicos.',
      '', 'REGRA: nada genérico — ancore tudo no negócio real do cliente (persona, Big Message, pilares).',
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
      var pilares=Array.isArray(out.pilares)?out.pilares:[];
      await dbDoc("cos_editorial/"+id).set({pilares:pilares});
      if(DB_STATE_CACHE[id])DB_STATE_CACHE[id].editorial=pilares;
      if(state.client===id){GENERATED.editorial=pilares;renderEditorial();}
    }catch(e){
      if(msg){msg.textContent=sampleErrCopy(e);msg.style.color="var(--warn)";}
      if(btn)btn.disabled=false;
    }
  }
  function renderEditorial(){
    var el=I('.view[data-view="editorial"]');
    if(GENERATED&&GENERATED.editorial&&GENERATED.editorial.length){
      el.innerHTML='<div class="section-head" style="margin-top:6px"><div><h3>Linha Editorial — '+clientName(state.client)+'</h3><p><b>Bússola</b> — Pilar → Território → Tema → Subtemas & Tópicos. Gerado a partir do Content DNA. Impede conteúdo aleatório.</p></div></div>'+
        (isDbClient(state.client)?'<div style="margin:-6px 0 14px"><button class="btn" id="genEdBtn">↻ Gerar de novo</button><span id="edMsg" style="margin-left:10px;font-size:12px;color:var(--muted)"></span></div>':'')+
        editorialTreeHtml(GENERATED.editorial);
      var btn=I("#genEdBtn");if(btn)btn.addEventListener('click',runGerarEditorial);
      return;
    }
    if(isDbClient(state.client)){
      var hasStrat=GENERATED&&GENERATED.strategy;
      el.innerHTML='<div class="section-head" style="margin-top:6px"><div><h3>Linha Editorial — '+esc(clientName(state.client))+'</h3><p><b>Bússola</b> — Pilar → Território → Tema → Subtemas & Tópicos, a partir da Estratégia.</p></div></div>'+
        '<div class="card empty-hero"><div class="eh-ic">⌗</div>'+(hasStrat?'<button class="btn pri genbtn" id="genEdBtn">✦ Gerar Linha Editorial</button><span id="edMsg" style="margin-left:10px;font-size:12px;color:var(--muted)"></span>':'<div class="eh-t">Gere a <b>Estratégia</b> primeiro.</div>')+'</div>';
      var btn2=I("#genEdBtn");if(btn2)btn2.addEventListener('click',runGerarEditorial);
      return;
    }
    var pil=EDITORIAL[state.client]||[];
    if(!pil.length){el.innerHTML=emptyView("Linha Editorial — "+clientName(state.client),"Sem linha editorial de exemplo para este cliente ainda.");return;}
    el.innerHTML='<div class="section-head" style="margin-top:6px"><div><h3>Linha Editorial — '+clientName(state.client)+' <span class="tag-mock">demonstração</span></h3><p><b>Bússola</b> — Pilar → Território → Tema. Impede conteúdo aleatório.</p></div></div>'+
      '<div class="tree">'+pil.map(function(p){return '<div class="pil"><div class="h"><span style="width:8px;height:8px;border-radius:50%;background:var(--brand)"></span>'+esc(p[0])+'</div><div class="b">'+p[1].map(function(t){return '<span class="badge">'+esc(t)+'</span>'}).join('')+'</div></div>'}).join('')+'</div>';
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
    return ['Você é Musa, o agente de Ideias do Content OS. Gere '+qtd+' ideias de conteúdo REAIS para este cliente, cada uma ancorada no Content DNA e na estratégia — nunca genéricas, nunca intercambiáveis entre marcas.',
      '', 'Cliente: '+name, 'CONTENT DNA:', dnaText,
      'Big Message: '+((strategy&&strategy.bigMessage)||''), 'Persona: '+((strategy&&strategy.persona)||''), 'Pilares: '+pilares,
      temas.length?('Temas editoriais disponíveis: '+temas.join(' | ')):'',
      refs?('REFERÊNCIAS E CONCORRENTES informados pelo cliente (use só como inspiração de ângulo/tom/formato — NUNCA copie, cite o nome ou mencione esses perfis no conteúdo gerado):\n'+refs):'',
      'Formatos possíveis (escolha um por ideia): '+formatos, formatGuidePrompt(), perfCompact(), '',
      'Gatilhos mentais disponíveis: '+(LIB.gatilhos||[]).map(function(g){return g.nome}).join(', '),
      'Elementos literários disponíveis: '+(LIB.elementos||[]).map(function(e){return e.nome}).join(', '),
      prefsPrompt(), capacidadePrompt(), metasPrompt(),
      opts.soSemGravacao?'IMPORTANTE: TODAS estas ideias devem ser em formato que NÃO exige o cliente gravar — escolha só formatos de Carrossel da lista (ex.: Checklist, Passo a Passo, Comparação, Case).':'',
      ja.length?('Estas ideias JÁ EXISTEM no calendário — NÃO repita, NÃO faça variações delas, traga ângulos novos:\n- '+ja.slice(0,80).join('\n- ')):'', '',
      'Distribua pelo funil: '+(function(){var mx=mixDoCliente(state.client);return '~'+mx.topo+'% topo, ~'+mx.meio+'% meio, ~'+mx.fundo+'% fundo';})()+'. Cubra funções variadas: Descoberta, Conscientização, Educação, Autoridade, Identificação, Experiência Própria, Experiência Compartilhada, Prova, Quebra de Objeção, Consideração, Conversão.',
      'Cada ideia precisa de: título, conceito (1 frase), ângulo, dor/desejo específico usado, função/objetivo, propósito (1 frase: de onde a persona sai e pra onde vai), emoção-alvo, hook (frase de abertura real), CTA, formato escolhido + objetivo do formato + por que esse formato, e justificativa (por que não serve pra outra marca).',
      '', 'Responda SOMENTE com JSON: {"ideas":[{"titulo":string,"conceito":string,"angulo":string,"dorDesejo":string,"funcao":string,"funil":"topo"|"meio"|"fundo","jornada":string,"emocao":string,"pilar":string,"tema":string,"proposito":string,"formato":string,"formatoObjetivo":string,"formatoJustificativa":string,"hook":string,"cta":string,"justificativa":string,"gatilhos":[string],"elementos":[string]}]}',
      'Em "gatilhos" escolha 2-3 nomes da lista de gatilhos e em "elementos" 1-2 nomes da lista de elementos — exatamente como escritos, respeitando as escolhas do estrategista.',
    ].filter(Boolean).join('\n');
  }
  // Gera ideias. append=true acrescenta às existentes (sem repetir) — usado por "Gerar mais" e pelo calendário de 45/60/90 dias.
  async function gerarIdeiasCore(id,append,count,soSemGravacao){
    var atuais=append?((GENERATED.ideas||[]).slice()):[];
    var out=await CAP.sample.json(buildIdeasPrompt(byId(id).name,GENERATED.strategy,GENERATED.editorial,dnaCompact(),{count:count||15,soSemGravacao:!!soSemGravacao,existentes:atuais.map(function(x){return x.titulo})}),{modelTier:"complex",cache:false});
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
    await Promise.all(novas.map(function(idea){return col.doc(idea.id).set(idea);}));
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
    var el=I('.view[data-view="ideas"]');
    if(GENERATED&&GENERATED.ideas&&GENERATED.ideas.length){
      var g=GENERATED,gi=g.ideas||[];
      el.innerHTML='<div class="section-head" style="margin-top:6px"><div><h3>Ideias — '+clientName(state.client)+'</h3><p><b>Musa</b> — cada ideia nasce do cruzamento Content DNA + estratégia + persona + performance, com formato recomendado por objetivo. Não é uma lista de "30 ideias".</p></div></div>'+
        (isDbClient(state.client)?prefsCardHtml()+'<div style="margin:-6px 0 14px;display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span class="badge">'+gi.length+' ideias</span><button class="btn pri" id="moreIdeasBtn">＋ Gerar mais 15 ideias</button><button class="btn" id="genIdeasBtn" title="Apaga as atuais e gera outras">↻ Gerar do zero</button><span id="ideasMsg" style="font-size:12px;color:var(--muted)"></span></div>':'')+
        '<div class="clist">'+gi.map(function(x){
          var fr=x.formatRec||{};
          return '<div class="card pad"><div style="font-family:var(--font-display);font-weight:700;font-size:14.5px;line-height:1.25">'+esc(x.titulo)+'</div>'+
            '<div style="font-size:12.5px;color:var(--muted);margin-top:5px">'+esc(x.conceito)+'</div>'+
            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:11px"><span class="badge">'+esc(fr.formato||x.format||'')+'</span><span class="pill st-INSIGHT">'+esc(x.funcao)+'</span><span class="pill emo-pill">♥ '+esc(x.emocao)+'</span><span class="badge">'+esc(x.jornada)+'</span><span class="badge">'+esc(x.surface||'')+'</span></div>'+
            ((x.gatilhos&&x.gatilhos.length)||(x.elementos&&x.elementos.length)?'<div style="margin-top:9px;font-size:11.5px;color:var(--muted)"><b style="color:var(--ink)">Gatilhos:</b> '+esc((x.gatilhos||[]).join(', ')||'—')+' · <b style="color:var(--ink)">Elementos:</b> '+esc((x.elementos||[]).join(', ')||'—')+'</div>':'')+
            (fr.objetivo?'<div style="margin-top:10px;font-size:12px;color:var(--muted)"><b style="color:var(--ink)">Objetivo do formato:</b> '+esc(fr.objetivo)+'</div>':'')+
            '<div style="margin-top:12px;font-size:12.5px"><span class="mono" style="font-size:10.5px;color:var(--brand-ink);font-weight:600">HOOK</span> · '+esc(x.hook)+'</div>'+
            '<div style="margin-top:6px;font-size:12.5px"><span class="mono" style="font-size:10.5px;color:var(--faint);font-weight:600">CTA</span> · '+esc(x.cta)+'</div>'+
            (x.proposito?'<div style="margin-top:10px;font-size:12px;color:var(--muted);border-top:1px solid var(--line-2);padding-top:9px"><b style="color:var(--ink)">Propósito:</b> '+esc(x.proposito)+'</div>':'')+
            (fr.justificativa?'<div style="margin-top:6px;font-size:12px;color:var(--muted)"><b style="color:var(--ink)">Por que este formato:</b> '+esc(fr.justificativa)+'</div>':'')+
            (x.justificativa?'<div style="margin-top:6px;font-size:12px;color:var(--muted)"><b style="color:var(--ink)">Por que esta ideia:</b> '+esc(x.justificativa)+'</div>':'')+
            '</div>';
        }).join('')+'</div>';
      var gb=I("#genIdeasBtn");if(gb)gb.addEventListener('click',function(){if(confirm("Apagar as ideias atuais e gerar outras do zero?"))runGerarIdeias(null,false);});
      var mb=I("#moreIdeasBtn");if(mb)mb.addEventListener('click',function(){runGerarIdeias(null,true);});
      wirePrefs();
      return;
    }
    if(isDbClient(state.client)){
      var hasEd=GENERATED&&GENERATED.editorial&&GENERATED.editorial.length;
      el.innerHTML='<div class="section-head" style="margin-top:6px"><div><h3>Ideias — '+esc(clientName(state.client))+'</h3><p><b>Musa</b> — cada ideia nasce do cruzamento Content DNA + estratégia + persona, com formato recomendado por objetivo.</p></div></div>'+prefsCardHtml()+
        '<div class="card empty-hero"><div class="eh-ic">✦</div>'+(hasEd?'<button class="btn pri genbtn" id="genIdeasBtn">✦ Gerar Ideias</button><span id="ideasMsg" style="margin-left:10px;font-size:12px;color:var(--muted)"></span>':'<div class="eh-t">Gere a <b>Linha Editorial</b> primeiro.</div>')+'</div>';
      var gb2=I("#genIdeasBtn");if(gb2)gb2.addEventListener('click',function(){runGerarIdeias(null,false);});wirePrefs();
      return;
    }
    var items=IDEAS[state.client]||[];
    if(!items.length){el.innerHTML=emptyView("Ideias — "+clientName(state.client),"Sem ideias de exemplo para este cliente ainda.");return;}
    el.innerHTML='<div class="section-head" style="margin-top:6px"><div><h3>Ideias — '+clientName(state.client)+' <span class="tag-mock">demonstração</span></h3><p><b>Musa</b> — cada ideia nasce do cruzamento Content DNA + estratégia + persona + performance. Não é uma lista de “30 ideias”.</p></div></div>'+
      '<div class="clist">'+items.map(function(x){
        return '<div class="card pad"><div style="font-family:var(--font-display);font-weight:700;font-size:14.5px;line-height:1.25">'+esc(x.titulo)+'</div>'+
          '<div style="font-size:12.5px;color:var(--muted);margin-top:5px">'+esc(x.conceito)+'</div>'+
          '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:11px"><span class="badge">'+esc(x.formato)+'</span><span class="pill st-INSIGHT">'+esc(x.funcao)+'</span><span class="pill emo-pill">♥ '+esc(x.emocao)+'</span><span class="badge">'+esc(x.jornada)+'</span></div>'+
          '<div style="margin-top:12px;font-size:12.5px"><span class="mono" style="font-size:10.5px;color:var(--brand-ink);font-weight:600">HOOK</span> · '+esc(x.hook)+'</div>'+
          '<div style="margin-top:6px;font-size:12.5px"><span class="mono" style="font-size:10.5px;color:var(--faint);font-weight:600">CTA</span> · '+esc(x.cta)+'</div>'+
          '<div style="margin-top:10px;font-size:12px;color:var(--muted);border-top:1px solid var(--line-2);padding-top:9px"><b style="color:var(--ink)">Por quê:</b> '+esc(x.just)+'</div></div>';
      }).join('')+'</div>';
  }
