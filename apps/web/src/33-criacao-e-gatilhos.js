  // ---------- Gatilhos e elementos escolhidos por cliente (valem para Ideias, Roteiro/Copy, Carrossel e Stories) ----------
  function prefsOf(id){var p=((DB_CLIENTS[id]||{}).prefs)||{};return {gUsar:p.gUsar||[],gEvitar:p.gEvitar||[],eUsar:p.eUsar||[],eEvitar:p.eEvitar||[]};}
  function libNomes(lib,keys){return (lib||[]).filter(function(x){return keys.indexOf(x.key)>=0}).map(function(x){return x.nome});}
  function prefsPrompt(){
    if(!state.client)return '';var p=prefsOf(state.client),L=[];
    var gu=libNomes(LIB.gatilhos,p.gUsar),ge=libNomes(LIB.gatilhos,p.gEvitar),eu=libNomes(LIB.elementos,p.eUsar),ee=libNomes(LIB.elementos,p.eEvitar);
    if(gu.length)L.push('Gatilhos mentais PREFERIDOS por este cliente (priorize): '+gu.join(', '));
    if(ge.length)L.push('Gatilhos mentais PROIBIDOS para este cliente (NUNCA use): '+ge.join(', '));
    if(eu.length)L.push('Elementos literários PREFERIDOS (priorize): '+eu.join(', '));
    if(ee.length)L.push('Elementos literários PROIBIDOS (NUNCA use): '+ee.join(', '));
    return L.length?('ESCOLHAS DO ESTRATEGISTA PARA ESTE CLIENTE:\n- '+L.join('\n- ')):'';
  }
  function prefChipsHtml(lib,usar,evitar,tipo){
    return '<div class="selgrid">'+(lib||[]).map(function(it){
      var st=usar.indexOf(it.key)>=0?'use':evitar.indexOf(it.key)>=0?'ban':'';
      return '<div class="selchip pchip '+st+'" data-pref="'+tipo+'" data-key="'+esc(it.key)+'" title="'+esc(it.descricao||'')+'"><b style="font-size:12px">'+(st==='use'?'✓ ':st==='ban'?'⛔ ':'')+esc(it.nome)+'</b></div>';
    }).join('')+'</div>';
  }
  function prefsCardHtml(){
    var id=state.client;if(!isDbClient(id)||state.clientView)return '';
    var p=prefsOf(id),n=p.gUsar.length+p.gEvitar.length+p.eUsar.length+p.eEvitar.length;
    return '<details class="card pad prefs" style="margin-bottom:16px"'+(n?'':' open')+'><summary style="cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span class="bt" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--faint)">Gatilhos e elementos deste cliente</span><span class="badge">'+(n?n+' escolhas':'a IA escolhe sozinha')+'</span></summary>'+
      '<div style="font-size:12px;color:var(--muted);margin:10px 0 12px">Clique para alternar: <b>neutro</b> → <b style="color:var(--good)">✓ usar</b> → <b style="color:var(--emo)">⛔ nunca usar</b>. Vale para as <b>Ideias</b>, o <b>Roteiro/Copy</b>, o <b>Carrossel</b> e os <b>Stories</b> deste cliente. Em cada peça você ainda pode ajustar antes de gerar.</div>'+
      '<div class="bt" style="font-size:11px;font-weight:600;color:var(--faint);margin-bottom:6px">GATILHOS MENTAIS</div>'+prefChipsHtml(LIB.gatilhos,p.gUsar,p.gEvitar,'g')+
      '<div class="bt" style="font-size:11px;font-weight:600;color:var(--faint);margin:14px 0 6px">ELEMENTOS LITERÁRIOS / NARRATIVOS</div>'+prefChipsHtml(LIB.elementos,p.eUsar,p.eEvitar,'e')+
      '<div style="display:flex;gap:10px;align-items:center;margin-top:14px"><button class="btn pri" id="prefsSave">Salvar escolhas</button><button class="btn ghost" id="prefsClear">Limpar</button><span id="prefsMsg" style="font-size:12px;color:var(--muted)"></span></div></details>';
  }
  function wirePrefs(){
    var box=document.querySelector('details.prefs');if(!box)return;
    box.addEventListener('click',function(e){var c=e.target.closest&&e.target.closest('.pchip');if(!c)return;
      var st=c.classList.contains('use')?'ban':c.classList.contains('ban')?'':'use';c.classList.remove('use','ban');if(st)c.classList.add(st);
      var b=c.querySelector('b');b.textContent=(st==='use'?'✓ ':st==='ban'?'⛔ ':'')+b.textContent.replace(/^(✓|⛔) /,'');
      var m=I("#prefsMsg");if(m){m.textContent="Não esqueça de salvar";m.style.color="var(--warn)";}});
    function col(t,cls){return Array.prototype.map.call(box.querySelectorAll('.pchip[data-pref="'+t+'"].'+cls),function(x){return x.getAttribute('data-key')});}
    I("#prefsSave").addEventListener('click',function(){
      var id=state.client,rec=DB_CLIENTS[id];if(!rec)return;
      var prefs={gUsar:col('g','use'),gEvitar:col('g','ban'),eUsar:col('e','use'),eEvitar:col('e','ban')};
      saveClientRecord(id,Object.assign({},rec,{prefs:prefs})).then(function(){toast("Escolhas salvas — os agentes deste cliente passam a seguir.");renderView(state.view);},function(){var m=I("#prefsMsg");if(m)m.textContent="Não consegui salvar";});
    });
    I("#prefsClear").addEventListener('click',function(){Array.prototype.forEach.call(box.querySelectorAll('.pchip'),function(c){c.classList.remove('use','ban');var b=c.querySelector('b');b.textContent=b.textContent.replace(/^(✓|⛔) /,'');});var m=I("#prefsMsg");if(m){m.textContent="Limpo — clique em Salvar";m.style.color="var(--warn)";}});
  }
  function keysByNome(lib,nomes){return (lib||[]).filter(function(x){return (nomes||[]).indexOf(x.nome)>=0}).map(function(x){return x.key});}
  function defaultTriggerKeys(funil){
    var names=funil==="fundo"?["Prova","Especificidade","Redução de risco"]:funil==="meio"?["Autoridade","Reciprocidade","Especificidade"]:["Curiosidade","Identificação","Contraste"];
    return names.map(function(n){var f=(LIB.gatilhos||[]).filter(function(g){return g.nome===n})[0];return f?f.key:null}).filter(Boolean);
  }
  function defaultElementKeys(funil){
    var names=funil==="topo"?["Open loop","Quebra de expectativa"]:["Contraste","Storytelling"];
    return names.map(function(n){var f=(LIB.elementos||[]).filter(function(e){return e.nome===n})[0];return f?f.key:null}).filter(Boolean);
  }
  function cfgFieldRow(label,id,value,tag){
    if(tag==='textarea')return '<div class="fld"><label for="'+id+'">'+esc(label)+'</label><textarea class="ta" id="'+id+'" style="min-height:56px">'+esc(value||'')+'</textarea></div>';
    return '<div class="fld"><label for="'+id+'">'+esc(label)+'</label><input id="'+id+'" value="'+esc(value||'')+'"></div>';
  }
  function configPanelHtml(idea){
    var dnaTom=(GENERATED.dna||[]).filter(function(x){return x.field==="tom"})[0];
    var pf=prefsOf(state.client);
    var gK=keysByNome(LIB.gatilhos,idea.gatilhos);if(!gK.length)gK=pf.gUsar.length?pf.gUsar:defaultTriggerKeys(idea.funil);
    var eK=keysByNome(LIB.elementos,idea.elementos);if(!eK.length)eK=pf.eUsar.length?pf.eUsar:defaultElementKeys(idea.funil);
    var gDefaults=gK.filter(function(k){return pf.gEvitar.indexOf(k)<0}).map(function(k){return {key:k}});
    var eDefaults=eK.filter(function(k){return pf.eEvitar.indexOf(k)<0}).map(function(k){return {key:k}});
    var gLib=(LIB.gatilhos||[]).filter(function(x){return pf.gEvitar.indexOf(x.key)<0}),eLib=(LIB.elementos||[]).filter(function(x){return pf.eEvitar.indexOf(x.key)<0});
    return '<div class="block"><div class="bt">Configuração antes de gerar <span class="tag-mock">edite tudo — a IA recomenda, você decide</span></div>'+
      '<div class="grid cols-2">'+
      '<div class="fld"><label for="cfFormato">Formato</label><select id="cfFormato">'+(LIB.formatos||[]).map(function(f){return '<option'+(f.nome===idea.format?' selected':'')+'>'+esc(f.nome)+'</option>'}).join('')+'</select></div>'+
      cfgFieldRow("Objetivo","cfObjetivo",idea.objetivo)+cfgFieldRow("Função estratégica","cfFuncao",idea.funcao)+
      '<div class="fld"><label for="cfFunil">Funil</label><select id="cfFunil">'+["topo","meio","fundo"].map(function(f){return '<option'+(f===idea.funil?' selected':'')+'>'+f+'</option>'}).join('')+'</select></div>'+
      cfgFieldRow("Jornada","cfJornada",idea.jornada)+cfgFieldRow("Emoção desejada","cfEmocao",idea.emocao)+cfgFieldRow("Ângulo","cfAngulo",idea.angulo)+
      cfgFieldRow("Tom","cfTom",dnaTom?dnaTom.value:"")+cfgFieldRow("CTA","cfCta",idea.cta)+
      '</div>'+
      cfgFieldRow("Persona","cfPersona",idea.persona,'textarea')+cfgFieldRow("Dor/Desejo","cfDorDesejo",idea.dorDesejo,'textarea')+cfgFieldRow("Big Message","cfBigMessage",idea.bigMessage,'textarea')+
      '<div class="bt" style="margin-top:14px">Gatilhos mentais</div><div id="cfGatilhos">'+chipSet(gLib,gDefaults,true)+'</div>'+
      '<div class="bt" style="margin-top:14px">Elementos literários/narrativos</div><div id="cfElementos">'+chipSet(eLib,eDefaults,false)+'</div>'+
      '</div>';
  }
  function readContentConfig(idea){
    function v(id,fb){var el=I(id);return el?el.value:fb;}
    return {format:v("#cfFormato",idea.format),objetivo:v("#cfObjetivo",idea.objetivo),funcao:v("#cfFuncao",idea.funcao),
      funil:v("#cfFunil",idea.funil),jornada:v("#cfJornada",idea.jornada),emocao:v("#cfEmocao",idea.emocao),
      angulo:v("#cfAngulo",idea.angulo),tom:v("#cfTom",""),cta:v("#cfCta",idea.cta),
      persona:v("#cfPersona",idea.persona),dorDesejo:v("#cfDorDesejo",idea.dorDesejo),bigMessage:v("#cfBigMessage",idea.bigMessage),
      gatilhos:Array.prototype.map.call(document.querySelectorAll('#cfGatilhos .selchip.sel'),function(el){return el.getAttribute('data-nome')}),
      elementos:Array.prototype.map.call(document.querySelectorAll('#cfElementos .selchip.sel'),function(el){return el.getAttribute('data-nome')})};
  }
  function buildReelPrompt(dnaText,cfg){
    return ['Você é Rima, redatora-chefe de um sistema de estratégia de conteúdo. Escreve em português do Brasil, para redes sociais, com voz humana e específica.','',
      contentGuardrails(),'','CLIENTE — CONTENT DNA (única fonte de verdade):',dnaText,'',
      'PEÇA A ESCREVER (Reel — '+cfg.format+'):','Persona: '+cfg.persona,'Tom de voz: '+(cfg.tom||'(use o tom do Content DNA)'),
      'Função estratégica: '+cfg.funcao+' (funil: '+cfg.funil+', jornada: '+cfg.jornada+')','Objetivo: '+cfg.objetivo,
      'Dor/Desejo desta peça: '+cfg.dorDesejo,'Ângulo: '+cfg.angulo,'Big Message: '+cfg.bigMessage,'Emoção-alvo: '+cfg.emocao+' (pode refinar, mas justifique)',
      'CTA base: '+cfg.cta,'Gatilhos mentais a usar: '+(cfg.gatilhos.join(', ')||'(escolha os mais adequados)'),
      'Elementos literários/narrativos a usar: '+(cfg.elementos.join(', ')||'(escolha os mais adequados)'),'',
      'Responda SOMENTE com um objeto JSON válido (sem markdown), no formato:',
      '{"headline":string,"roteiro":[{"label":string,"text":string}],"copyCurta":string,"copyMedia":string,"copyLonga":string,"cta":string,"emocao":string,"emocaoPor":string,"direcaoVisual":string}',
      'O roteiro segue Hook → Desenvolvimento → Retenção/Tensão → Payoff → CTA (5 passos). As 3 copies mantêm Hook + desenvolvimento + CTA.',
    ].join('\n');
  }
  function buildCarrosselPrompt(dnaText,cfg){
    return ['Você é Mosaico, especialista em Carrossel de um sistema de estratégia de conteúdo. Escreve em português do Brasil, com voz humana e específica.','',
      contentGuardrails(),'','CLIENTE — CONTENT DNA (única fonte de verdade):',dnaText,'',
      'PEÇA A ESCREVER (Carrossel — '+cfg.format+'):','Persona: '+cfg.persona,'Tom de voz: '+(cfg.tom||'(use o tom do Content DNA)'),
      'Função estratégica: '+cfg.funcao+' (funil: '+cfg.funil+')','Objetivo: '+cfg.objetivo,'Dor/Desejo: '+cfg.dorDesejo,
      'Big Message: '+cfg.bigMessage,'Emoção-alvo: '+cfg.emocao,'CTA base: '+cfg.cta,
      'Gatilhos: '+(cfg.gatilhos.join(', ')||'(escolha)'),'Elementos: '+(cfg.elementos.join(', ')||'(escolha)'),'',
      'Escreva de 6 a 8 slides (capa + desenvolvimento + CTA).',
      'Responda SOMENTE com JSON: {"capaHeadline":string,"hook":string,"estrutura":string,"slides":[{"papel":string,"titulo":string,"texto":string}],"copy":string,"cta":string,"emocao":string,"emocaoPor":string,"direcaoVisual":string}',
    ].join('\n');
  }
  function buildStoriesPrompt(dnaText,cfg){
    return ['Você é Enredo, especialista em Sequência de Stories de um sistema de estratégia de conteúdo. Escreve em português do Brasil, como fala real, natural, no tom do cliente.','',
      contentGuardrails(),'','CLIENTE — CONTENT DNA (única fonte de verdade):',dnaText,'',
      'PEÇA A ESCREVER (Stories):','Persona: '+cfg.persona,'Tom de voz: '+(cfg.tom||'(use o tom do Content DNA)'),
      'Função estratégica: '+cfg.funcao+' (funil: '+cfg.funil+')','Dor/Desejo: '+cfg.dorDesejo,'Emoção-alvo: '+cfg.emocao,
      'CTA base: '+cfg.cta,'Gatilhos: '+(cfg.gatilhos.join(', ')||'(escolha)'),'',
      cfg.funil==="fundo"?'Só aqui pode haver CTA de venda direto.':'NÃO transforme em venda: foco em relacionamento; CTA de conversa/seguir.',
      'Escreva 4 Stories em progressão real (cada um puxa o próximo).',
      'Responda SOMENTE com JSON: {"tipo":string,"stories":[{"papel":string,"fala":string,"interacao":string}],"cta":string,"emocao":string,"emocaoPor":string}',
    ].join('\n');
  }
  async function runGerarPeca(idx,kind){
    var it=GENERATED.calendar.items[idx];if(!it)return;
    var idea=it.idea,id=state.client;if(!CAP.sample){noAi();return;}
    var btn=document.querySelector('[data-genpeca="'+kind+'"]');if(btn)btn.disabled=true;
    var msg=I("#pecaMsg");setBusy(msg,"Pensando…");
    var cfg=readContentConfig(idea),dnaText=dnaCompact()+exemplosCompact();
    try{
      var patch={};
      if(kind==="reel"){
        var out=await CAP.sample.json(buildReelPrompt(dnaText,cfg),{modelTier:"complex",cache:false});
        patch.content={origem:"ia",ideaId:idea.id,headline:String(out.headline||idea.hook||idea.titulo),kind:"reel",
          copy:String(out.copyMedia||""),copyVariants:{curta:String(out.copyCurta||""),media:String(out.copyMedia||""),longa:String(out.copyLonga||"")},
          cta:String(out.cta||cfg.cta),gatilhos:cfg.gatilhos,recursos:cfg.elementos,gatilhosRec:[],elementosRec:[],
          emocao:String(out.emocao||cfg.emocao),emocaoPor:String(out.emocaoPor||""),direcaoVisual:String(out.direcaoVisual||""),
          roteiro:Array.isArray(out.roteiro)?out.roteiro.map(function(s){return {label:String(s.label||"—"),text:String(s.text||"")}}):[]};
      }else if(kind==="carrossel"){
        var out2=await CAP.sample.json(buildCarrosselPrompt(dnaText,cfg),{modelTier:"complex",cache:false});
        var slides=(Array.isArray(out2.slides)?out2.slides:[]).map(function(s,i){return {n:i+1,papel:String(s.papel||(i===0?"Capa":"Slide")),titulo:String(s.titulo||""),texto:String(s.texto||""),visual:String(out2.direcaoVisual||""),imagem:""};});
        patch.carousel={origem:"ia",capaHeadline:String(out2.capaHeadline||idea.titulo),hook:String(out2.hook||idea.hook),estrutura:String(out2.estrutura||""),
          slides:slides,copy:String(out2.copy||""),cta:String(out2.cta||cfg.cta),gatilhos:cfg.gatilhos,elementosLiterarios:cfg.elementos,
          emocao:String(out2.emocao||cfg.emocao),emocaoPor:String(out2.emocaoPor||""),direcaoVisual:String(out2.direcaoVisual||""),referencias:[]};
      }else{
        var out3=await CAP.sample.json(buildStoriesPrompt(dnaText,cfg),{modelTier:"default",cache:false});
        var storiesSteps=(Array.isArray(out3.stories)?out3.stories:[]).map(function(s,i){return {n:i+1,papel:String(s.papel||("Story "+(i+1))),fala:String(s.fala||""),visual:"",interacao:String(s.interacao||"")};});
        patch.stories={origem:"ia",tipo:String(out3.tipo||"Sequência"),objetivo:cfg.objetivo,contexto:"",emocao:String(out3.emocao||cfg.emocao),emocaoPor:String(out3.emocaoPor||""),
          percepcaoDesejada:"",narrativa:"",publico:cfg.persona,progressao:storiesSteps.map(function(s){return s.papel}),stories:storiesSteps,cta:String(out3.cta||cfg.cta),gatilhos:cfg.gatilhos};
      }
      await dbItemsCol("cos_calendar",id).doc(it.id).update(patch);
      Object.assign(it,patch);
      if(DB_STATE_CACHE[id]&&DB_STATE_CACHE[id].calendar){var cached=DB_STATE_CACHE[id].calendar.items.filter(function(x){return x.id===it.id})[0];if(cached)Object.assign(cached,patch);}
      openGenerated(idx);
    }catch(e){
      if(msg){msg.textContent=sampleErrCopy(e);msg.style.color="var(--warn)";}
      if(btn)btn.disabled=false;
    }
  }
  async function saveEditedField(itemId,path,value){
    var patch={};patch[path]=value;
    await dbItemsCol("cos_calendar",state.client).doc(itemId).update(patch);
  }
  function openGenerated(idx){
    var g=GENERATED,it=g.calendar.items[idx];if(!it)return;var x=it.idea,c=it.content,np=(g.notion||[])[idx];
    var db=isDbClient(state.client);
    var cvData=c?(c.copyVariants||{curta:c.copy,media:c.copy,longa:c.copy}):{curta:"",media:"",longa:""};
    var activeCv="media";
    var body='';
    var stOpts=["PLANNED","REVIEW","WAITING APPROVAL","IN PRODUCTION","APPROVED","PUBLISHED"];
    function efld(l,v){return '<div><div class="ql">'+esc(l)+'</div><div class="editable" contenteditable="true">'+esc(v)+'</div></div>';}
    var cli=state.clientView;
    if(!cli){
      body+='<div class="block"><div class="bt">Ficha do conteúdo <span class="tag-mock">editável</span></div><div class="metagrid">'
        +(db?'<div><div class="ql">Publicação — dia e horário</div><div style="display:flex;gap:6px"><input type="date" id="pubData" class="editable" value="'+esc(it.data)+'" style="flex:1;min-width:0"><input type="time" id="pubHora" class="editable" value="'+esc(itemHora(it))+'" style="width:96px"></div><div id="pubMsg" style="font-size:11px;color:var(--faint);margin-top:3px">'+(it.hora?'Horário próprio':'Horário da rotina ('+esc(surfLbl(x.surface))+')')+'</div></div>':efld("Data",it.data))+efld("Tema",x.tema)+efld("Pilar",(x.pilar||"").split(":")[0])+efld("Formato",x.surface+" + "+x.format)
        +'<div style="grid-column:1/-1">'+efld("Público/Persona",x.persona)+'</div>'
        +'<div><div class="ql">Status / Aprovação</div><select class="editable" style="width:100%">'+stOpts.map(function(s){return '<option'+(s===it.status?' selected':'')+'>'+s+'</option>'}).join('')+'</select></div>'
        +'</div></div>';
    }else{
      body+='<div class="block"><div class="bt">Ficha</div><div class="metagrid">'+meta("Quando",quando(it))+meta("Tema",x.tema)+meta("Formato",x.surface+" + "+x.format)+meta("Status",it.status)+'</div></div>';
    }
    if(!c&&db){
      // Ainda não produzido: painel de configuração + botão de gerar, em vez do conteúdo.
      body+=configPanelHtml(x);
      body+='<div style="text-align:right;margin-top:14px"><button class="btn pri genbtn" id="genPecaBtn" data-genpeca="reel" data-idx="'+idx+'">✦ Gerar Roteiro + Copy</button><span id="pecaMsg" style="margin-left:10px;font-size:12px;color:var(--muted)"></span></div>';
    }else if(c){
      if(isRascunho(c))body+='<div class="callout" style="background:var(--hyp-bg)"><span>✎</span><div class="em" style="color:var(--warn)"><b>Rascunho escrito sem IA.</b> Serve de base para revisar — não publique assim.'+(db?' Gere a versão final com IA nas abas acima ou reescreva e salve.':' Rode o pipeline com a chave da Anthropic para a prosa final.')+'</div></div>';
      body+='<div class="emo-hero"><div class="eh-l">♥ Emoção estratégica</div><div class="eh-v">'+esc(c.emocao)+'</div><div class="eh-w"><b>Por quê:</b> '+esc(c.emocaoPor)+'</div></div>';
      body+=skeletonHtml(x,c,"content");
      if(!cli){
        body+='<div class="block"><div class="bt">Contexto estratégico</div><div class="metagrid">'+meta("Objetivo",x.objetivo)+meta("Persona",x.persona)+'<div style="grid-column:1/-1">'+meta("Propósito",x.proposito)+'</div>'+meta("Jornada",x.jornada)+meta("Funil",x.funil)+meta("Função",x.funcao)+meta("Pilar",(x.pilar||"").split(":")[0])+meta("Tema / Subtema",x.tema+" / "+x.subtema)+'<div style="grid-column:1/-1">'+meta("Ângulo",x.angulo)+'</div><div style="grid-column:1/-1">'+meta("Justificativa",x.justificativa)+'</div></div></div>';
        if(x.formatRec){var fr=x.formatRec;body+='<div class="block"><div class="bt">Recomendação de formato — '+esc(fr.formato||"")+'</div><div style="font-size:12.5px;color:var(--muted);margin-bottom:9px"><b style="color:var(--ink)">Objetivo:</b> '+esc(fr.objetivo||"")+'</div><div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px">'+[["Produção",fr.producao],["Estrutura",fr.estrutura],["Narrativa",fr.narrativa],["Superfície",fr.superficie]].filter(function(d){return d[1]}).map(function(d){return '<span class="badge"><b style="color:var(--faint);font-weight:600">'+d[0]+':</b>&nbsp;'+esc(d[1])+'</span>'}).join('')+'</div><div style="font-size:12.5px;color:var(--muted)">'+esc(fr.justificativa)+'</div></div>';}
      }
      var steps=c.roteiro||c.slides||c.stories||[];
      body+='<div class="block"><div class="bt">'+(c.roteiro?"Roteiro — Hook → Desenvolvimento → Retenção/Tensão → Payoff → CTA":c.slides?"Estrutura do carrossel":"Sequência de Stories")+(db?' <span class="tag-mock">clique no texto pra editar</span>':'')+'</div>'+stepsHtml(steps.map(function(s){return [s.label,s.text]}),db&&!!c.roteiro)+'</div>';
      body+='<div class="block"><div class="bt">Copy / Legenda — mesma copy em 3 extensões</div><div class="cvtabs">'+[["curta","Curta"],["media","Média"],["longa","Longa"]].map(function(t){return '<button class="cvtab'+(t[0]==="media"?" on":"")+'" data-cv="'+t[0]+'">'+t[1]+'</button>'}).join('')+'</div><div class="copybox" id="copybox"'+(db?' contenteditable="true"':'')+'>'+esc(cvData.media)+'</div></div>';
      body+='<div class="block"><div class="bt">CTA</div><div style="font-size:14px;font-weight:600" id="reelCta"'+(db?' contenteditable="true"':'')+'>'+esc(c.cta)+'</div></div>';
      body+='<div class="block"><div class="bt">Direção visual</div><div style="font-size:13px;color:var(--muted)">'+esc(c.direcaoVisual)+'</div></div>';
      if(!cli&&np){
        var props=Object.keys(np.properties).map(function(k){return '<div class="fnbar" style="margin-bottom:6px"><span class="fnl mono" style="flex:0 0 130px;font-size:11px">'+esc(k)+'</span><span style="font-size:12.5px">'+esc(np.properties[k])+'</span></div>'}).join('');
        body+='<div class="block" style="border-style:dashed"><div class="bt">Prévia de sincronização com o Notion <span class="tag-mock">payload · sem chamada real</span></div>'+props+'</div>';
      }
      if(db)body+='<div style="text-align:right"><button class="btn pri" id="saveReelBtn" data-idx="'+idx+'">💾 Salvar edições</button></div>';
      if(db&&!cli)body+=metricsBlockHtml(it,idx);
    }
    var VIEWS={estrategia:body,carrossel:carouselHtml(it.carousel,x,idx),stories:storyHtml(it.stories,x,idx)};
    var tabsDef=[["estrategia","Estratégia"],["carrossel","🎠 Criar Carrossel"],["stories","📱 Criar Sequência de Stories"]];
    var tabs='<div class="crtabs" style="display:flex;gap:6px;padding:12px 20px 0;flex-wrap:wrap">'+tabsDef.map(function(t){return '<button class="preset crtab" data-tab="'+t[0]+'">'+t[1]+'</button>'}).join('')+'</div>';
    var html='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog"><div class="dh"><div style="min-width:0;flex:1"><div class="d-title">'+esc(c?c.headline:x.titulo)+'</div><div class="d-sub">'+esc(g.clientName)+' · '+esc(it.data)+' · '+esc(x.surface)+' + '+esc(x.format)+'</div></div><button class="icon-btn" id="dclose">✕</button></div>'+tabs+'<div class="db" id="drawerBody">'+body+'</div><div class="df"><button class="btn pri">Aprovar</button><button class="btn">Pedir ajuste</button><span class="badge '+(STCOL[it.status]||"badge")+'" style="margin-left:auto;align-self:center">'+it.status+'</span></div></aside>';
    I("#overlay").innerHTML=html;I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);document.addEventListener('keydown',escClose);
    function selTab(which){I("#drawerBody").innerHTML=VIEWS[which];I("#drawerBody").scrollTop=0;Array.prototype.forEach.call(document.querySelectorAll('.crtab'),function(b){b.style.background=b.getAttribute('data-tab')===which?'var(--brand-weak)':'';b.style.color=b.getAttribute('data-tab')===which?'var(--brand-ink)':'';b.style.borderColor=b.getAttribute('data-tab')===which?'transparent':'';});}
    Array.prototype.forEach.call(document.querySelectorAll('.crtab'),function(b){b.addEventListener('click',function(){selTab(b.getAttribute('data-tab'))})});
    // Interatividade do esqueleto: seleção de gatilhos/elementos + variantes de copy + geração + salvar edições.
    I("#drawerBody").addEventListener('click',function(e){
      var chip=e.target.closest&&e.target.closest('.selchip');
      if(chip){chip.classList.toggle('sel');return;}
      var cv=e.target.closest&&e.target.closest('.cvtab');
      if(cv){
        var box=I('#copybox');if(box){cvData[activeCv]=box.textContent;}
        var k=cv.getAttribute('data-cv');activeCv=k;
        if(box&&cvData[k]!=null)box.textContent=cvData[k];
        Array.prototype.forEach.call(document.querySelectorAll('.cvtab'),function(b){b.classList.toggle('on',b===cv)});
        return;
      }
      var gp=e.target.closest&&e.target.closest('[data-genpeca]');
      if(gp){runGerarPeca(+gp.getAttribute('data-idx'),gp.getAttribute('data-genpeca'));return;}
      var smt=e.target.closest&&e.target.closest('#saveMetBtn');
      if(smt){saveMetrics(+smt.getAttribute('data-idx'));return;}
      var sr=e.target.closest&&e.target.closest('#saveReelBtn');
      if(sr){
        var box2=I('#copybox');if(box2)cvData[activeCv]=box2.textContent;
        var roteiroEls=document.querySelectorAll('#drawerBody .sv[data-step]');
        var roteiro=(it.content.roteiro||[]).map(function(s,i){var el=roteiroEls[i];return {label:s.label,text:el?el.textContent:s.text};});
        var ctaEl=I('#reelCta');
        var patch={content:Object.assign({},it.content,{copyVariants:cvData,copy:cvData.media,roteiro:it.content.roteiro?roteiro:it.content.roteiro,cta:ctaEl?ctaEl.textContent:it.content.cta})};
        sr.disabled=true;sr.textContent="Salvando…";
        dbItemsCol("cos_calendar",state.client).doc(it.id).update(patch).then(function(){Object.assign(it.content,patch.content,{origem:"ia"});recordExample(state.client,"Reel/copy",it.content.headline,it.content.copy,"editado por você");sr.textContent="✓ Salvo";setTimeout(function(){sr.textContent="💾 Salvar edições";sr.disabled=false;},1200);});
        return;
      }
      var sc=e.target.closest&&e.target.closest('#saveCarrBtn');
      if(sc){
        var cr=it.carousel,capaEl=I('#crCapa'),copyEl=I('#crCopy'),ctaEl2=I('#crCta');
        var slides=(cr.slides||[]).map(function(s,i){var t=document.querySelector('[data-slide-t="'+i+'"]'),tx=document.querySelector('[data-slide-x="'+i+'"]');return Object.assign({},s,{titulo:t?t.textContent:s.titulo,texto:tx?tx.textContent:s.texto});});
        var patch2={carousel:Object.assign({},cr,{capaHeadline:capaEl?capaEl.textContent:cr.capaHeadline,copy:copyEl?copyEl.textContent:cr.copy,cta:ctaEl2?ctaEl2.textContent:cr.cta,slides:slides})};
        sc.disabled=true;sc.textContent="Salvando…";
        dbItemsCol("cos_calendar",state.client).doc(it.id).update(patch2).then(function(){Object.assign(it.carousel,patch2.carousel);recordExample(state.client,"Carrossel",it.carousel.capaHeadline,it.carousel.copy,"editado por você");sc.textContent="✓ Salvo";setTimeout(function(){sc.textContent="💾 Salvar edições";sc.disabled=false;},1200);});
        return;
      }
      var ss=e.target.closest&&e.target.closest('#saveStoBtn');
      if(ss){
        var sq=it.stories,ctaEl3=I('#stCta');
        var stories=(sq.stories||[]).map(function(s,i){var f=document.querySelector('[data-story-fala="'+i+'"]');return Object.assign({},s,{fala:f?f.textContent:s.fala});});
        var patch3={stories:Object.assign({},sq,{cta:ctaEl3?ctaEl3.textContent:sq.cta,stories:stories})};
        ss.disabled=true;ss.textContent="Salvando…";
        dbItemsCol("cos_calendar",state.client).doc(it.id).update(patch3).then(function(){Object.assign(it.stories,patch3.stories);recordExample(state.client,"Stories",it.stories.cta,(it.stories.stories||[]).map(function(s){return s.fala}).join(" / "),"editado por você");ss.textContent="✓ Salvo";setTimeout(function(){ss.textContent="💾 Salvar edições";ss.disabled=false;},1200);});
        return;
      }
    });
    selTab('estrategia');
    function savePub(){var dd=I("#pubData"),hh=I("#pubHora");if(!dd||!hh||!isIsoDate(dd.value))return;var patch={data:dd.value,hora:padT(hh.value||itemHora(it))};
      dbItemsCol("cos_calendar",state.client).doc(it.id).update(patch).then(function(){Object.assign(it,patch);var m=I("#pubMsg");if(m)m.textContent="✓ Salvo — "+quando(it);renderCal();},function(){var m=I("#pubMsg");if(m)m.textContent="Não consegui salvar";});}
    if(db&&I("#pubData")){I("#pubData").addEventListener('change',savePub);I("#pubHora").addEventListener('change',savePub);}
    Array.prototype.forEach.call(document.querySelectorAll('.df .btn'),function(b){b.addEventListener('click',async function(){
      var span=b.parentNode.querySelector('span');
      if(!db){span.textContent="Ação registrada (prévia)";return;}
      var aprovar=b.classList.contains('pri'),st=aprovar?"APPROVED":"REVIEW";
      try{
        await dbItemsCol("cos_calendar",state.client).doc(it.id).update({status:st});
        it.status=st;span.textContent=st;span.className="badge "+(aprovar?"act":"prog");
        if(aprovar){
          var cc=it.content,cr=it.carousel;
          if(cc&&!isRascunho(cc))await recordExample(state.client,"Reel/copy",cc.headline,cc.copy,"aprovado");
          else if(cr)await recordExample(state.client,"Carrossel",cr.capaHeadline,cr.copy,"aprovado");
          toast(cc&&isRascunho(cc)&&!cr?"Aprovado. (Rascunho sem IA não entra na memória de voz.)":"Aprovado — esta peça agora ensina a voz do cliente nas próximas gerações.");
        }
        renderCal();
      }catch(e){span.textContent="Não consegui salvar";}
    })});
  }
  function renderContentList(){
    if(genOn()){I("#contentList").innerHTML=GENERATED.calendar.items.map(genCard).join('');wireGen('#contentList [data-gen]');return;}
    I("#contentList").innerHTML=CONTENT.map(contentCard).join('');wireContent('#contentList [data-content]');
  }
  function renderApprovals(){
    if(genOn()){var g=GENERATED.calendar.items.map(function(it,i){return {it:it,i:i}}).filter(function(o){return o.it.status==="WAITING APPROVAL"||o.it.status==="REVIEW"});I("#approvalList").innerHTML=g.map(function(o){return genCard(o.it,o.i)}).join('');wireGen('#approvalList [data-gen]');return;}
    var items=CONTENT.filter(function(x){return x.status==="WAITING APPROVAL"||x.status==="REVIEW"});I("#approvalList").innerHTML=items.map(contentCard).join('');wireContent('#approvalList [data-content]');
  }
  var DIAS_PADRAO={1:[3],2:[2,4],3:[2,3,5],4:[2,3,4,5],5:[1,2,3,4,5],6:[1,2,3,4,5,6],7:[0,1,2,3,4,5,6]};
  function diasPostOf(){if(state.diasPost&&state.diasPostCli===state.client)return state.diasPost;var r=rotinaOf(state.client);return (r.diasPost&&r.diasPost.length)?r.diasPost.slice():DIAS_PADRAO[3].slice();}
  // Datas de publicação: a partir de amanhã, só nos dias da semana escolhidos.
  function slotsFor(days,dias){var out=[],d=new Date();d.setHours(12,0,0,0);for(var k=1;k<=days;k++){var x=new Date(d.getTime());x.setDate(d.getDate()+k);if(dias.indexOf(x.getDay())>=0)out.push(fmtD(x));}return out;}
  async function runGerarPlanejamento(days){
    var id=state.client;
    var ideas=(GENERATED.ideas||[]).slice();if(!ideas.length)return;
    var btn=I("#genPlanBtn");if(btn)btn.disabled=true;
    var msg=I("#planMsg");setBusy(msg,"Montando o calendário…");
    try{
      var dias=diasPostOf(),slots=slotsFor(days,dias),total=slots.length,mix=mixDoCliente(id);
      if(!total){if(msg){msg.textContent="Escolha ao menos um dia de postagem.";msg.style.color="var(--warn)";}if(btn)btn.disabled=false;return;}
      // Período longo: completa as ideias (sem repetir) antes de montar o calendário.
      for(var tent=0;ideas.length<total&&CAP.sample&&tent<6;tent++){
        setBusy(msg,"Criando mais ideias para "+total+" postagens ("+ideas.length+" de "+total+")…");
        if(state.client!==id)throw new Error("cliente trocado");
        var n=await gerarIdeiasCore(id,true,Math.min(15,total-ideas.length));ideas=(GENERATED.ideas||[]).slice();if(!n)break;
      }
      var capT=capOf(id);
      if(capT&&CAP.sample){
        var semanas={};slots.forEach(function(ds){var d=parseD(ds);d.setDate(d.getDate()-((d.getDay()+6)%7));var k=fmtD(d);semanas[k]=(semanas[k]||0)+1;});
        var precisaSG=Object.keys(semanas).reduce(function(a,k){return a+Math.max(0,semanas[k]-capT.grav)},0);
        for(var t2=0;t2<4;t2++){var temSG=ideas.filter(function(x){return !precisaGravar(x.surface)}).length;if(temSG>=precisaSG)break;
          if(state.client!==id)throw new Error("cliente trocado");
          setBusy(msg,"Criando ideias de carrossel (sem gravação) para caber na rotina do cliente…");
          var n2=await gerarIdeiasCore(id,true,Math.min(15,precisaSG-temSG),true);ideas=(GENERATED.ideas||[]).slice();if(!n2)break;}
      }
      setBusy(msg,"Montando o calendário…");
      var wTopo=Math.round(total*mix.topo/100),wMeio=Math.round(total*mix.meio/100),wFundo=total-wTopo-wMeio;
      var byFunnel={topo:ideas.filter(function(i){return i.funil==="topo"}),meio:ideas.filter(function(i){return i.funil==="meio"}),fundo:ideas.filter(function(i){return i.funil==="fundo"})};
      var order=[];
      // Sem repetir ideia enquanto houver ideia nova; intercala topo/meio/fundo ao longo do período.
      var usadas=[];
      var cap=capOf(id),gravSem={};
      function semanaDe(ds){var d=parseD(ds);d.setDate(d.getDate()-((d.getDay()+6)%7));return fmtD(d);}
      function take(stage,slot){
        var lim=cap&&(gravSem[semanaDe(slot)]||0)>=cap.grav;
        var livres=ideas.filter(function(x){return usadas.indexOf(x)<0});
        if(lim){var sg=livres.filter(function(x){return !precisaGravar(x.surface)});var sgF=sg.filter(function(x){return x.funil===stage});var pick=sgF[0]||sg[0];if(pick){usadas.push(pick);return pick;}}
        if(cap){var gv=livres.filter(function(x){return precisaGravar(x.surface)});var gvF=gv.filter(function(x){return x.funil===stage});var pk=gvF[0]||gv[0];if(pk){usadas.push(pk);var w0=semanaDe(slot);gravSem[w0]=(gravSem[w0]||0)+1;return pk;}}
        var r0=take0(stage);if(precisaGravar(r0.surface)){var w=semanaDe(slot);gravSem[w]=(gravSem[w]||0)+1;}return r0;
      }
      function take0(stage){var pool=byFunnel[stage].filter(function(x){return usadas.indexOf(x)<0});if(!pool.length)pool=ideas.filter(function(x){return usadas.indexOf(x)<0});if(!pool.length){usadas=[];pool=ideas.slice();}usadas.push(pool[0]);return pool[0];}
      var ord2=[],ct={topo:0,meio:0,fundo:0},tt={topo:wTopo,meio:wMeio,fundo:wFundo};
      for(var z=0;z<total;z++){var best="topo",bs=-1;["topo","meio","fundo"].forEach(function(st){var sc=tt[st]?(tt[st]-ct[st])/tt[st]:-1;if(sc>bs){bs=sc;best=st;}});ct[best]++;ord2.push(take(best,slots[z]));}
      order=ord2;
      var items=order.map(function(idea,i){
        return {ord:i,id:"cal-"+(i+1),data:slots[i],idea:idea,content:null,carousel:null,stories:null,
          status:i===0?"WAITING APPROVAL":i<3?"REVIEW":"PLANNED"};
      });
      var col2=dbItemsCol("cos_calendar",id);
      await clearCollection(col2);
      await Promise.all(items.map(function(it){return col2.doc(it.id).set(it);}));
      var meta={periodDays:days,diasPost:dias,total:total,mix:{topo:wTopo,meio:wMeio,fundo:wFundo},updatedAt:new Date().toISOString()};
      if(DB_CLIENTS[id]){var rr=Object.assign({},rotinaOf(id),{diasPost:dias});await saveClientRecord(id,Object.assign({},DB_CLIENTS[id],{rotina:rr}));}
      await dbDoc("cos_meta/"+id).set(meta);
      if(DB_STATE_CACHE[id])DB_STATE_CACHE[id].calendar={total:items.length,mix:meta.mix,items:items};
      if(state.client===id){GENERATED.calendar={total:items.length,mix:meta.mix,items:items};state.period=days;renderCal();renderKpis();}
    }catch(e){
      if(msg){msg.textContent="Não deu pra montar agora — tenta de novo.";msg.style.color="var(--warn)";}
      if(btn)btn.disabled=false;
    }
  }
