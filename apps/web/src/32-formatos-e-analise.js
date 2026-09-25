  // ---------- Formatos por nicho (Musa) ----------
  // Fonte única: src/pipeline/formats.ts + niche-formats.ts, embutidos em
  // NICHE_FORMATS por `npm run panel:sync`. A detecção abaixo espelha
  // detectNiche() do pipeline.
  var NF=NICHE_FORMATS;
  function nfNorm(s){return String(s||"").toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');}
  function nfRx(m){return new RegExp('(^|[^a-z0-9])'+m.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));}
  function nfDetect(texts){
    for(var i=0;i<texts.length;i++){
      var t=nfNorm(texts[i]);if(!t)continue;
      var best=null,bs=0;
      NF.perfis.forEach(function(p){var sc=p.match.filter(function(m){return nfRx(m).test(t)}).length;if(sc>bs){best=p;bs=sc;}});
      if(best)return {perfil:best,from:texts[i]};
    }
    return {perfil:NF.generico,from:""};
  }
  function nfProfile(key){if(key===NF.generico.key)return NF.generico;return NF.perfis.filter(function(p){return p.key===key})[0]||null;}
  function nfFormato(key){return NF.formatos.filter(function(f){return f.key===key})[0]||null;}
  function nfFormatoByNome(nome){var n=nfNorm(nome);return NF.formatos.filter(function(f){return nfNorm(f.nome)===n})[0]||null;}
  function dnaVal(field){return ((GENERATED&&GENERATED.dna)||[]).filter(function(x){return x.field===field&&x.status!=="rejected"}).map(function(x){return x.value}).join(" · ");}
  function currentNiche(){
    var c=byId(state.client)||{},fm=GENERATED&&GENERATED.formats;
    if(fm&&fm.perfil){var p=nfProfile(fm.perfil);if(p)return {perfil:p,from:"",manual:true};}
    var fi=(DB_CLIENTS[state.client]||{}).ficha||{};
    return nfDetect([c.niche,dnaVal("nicho"),fi.oferta,dnaVal("oferta"),dnaVal("posicionamento"),c.name]);
  }
  // Guia efetivo: perfil do nicho + (opcional) personalização da IA feita sobre ele.
  function formatGuide(){
    var nz=currentNiche(),p=nz.perfil,fm=GENERATED&&GENERATED.formats,ia=fm&&fm.ia&&fm.ia.perfil===p.key?fm.ia:null;
    var formatos=p.formatos.map(function(f){var d=nfFormato(f.key)||{};return {key:f.key,nome:d.nome||f.key,descricao:d.descricao||"",superficie:d.superficie||"",producao:d.producao||"",papel:f.papel,porque:f.porque,comoFazer:f.comoFazer}});
    if(ia&&Array.isArray(ia.formatos)){
      var iaF=ia.formatos.map(function(x){var d=nfFormatoByNome(x.nome);if(!d)return null;
        return {key:d.key,nome:d.nome,descricao:d.descricao,superficie:d.superficie,producao:d.producao,papel:["Carro-chefe","Apoio","Pontual"].indexOf(x.papel)>=0?x.papel:"Apoio",porque:String(x.porque||""),comoFazer:String(x.comoFazer||"")};
      }).filter(Boolean);
      if(iaF.length)formatos=iaF;
    }
    var evitar=(ia&&Array.isArray(ia.evitar)&&ia.evitar.length)?ia.evitar.map(function(e){var d=nfFormatoByNome(e.formato||"");return {pratica:String(e.pratica||""),porque:String(e.porque||""),key:d?d.key:undefined}}):p.evitar;
    var picks={};formatos.forEach(function(f){picks[f.key]=f});
    var avoid={};evitar.forEach(function(e){if(e.key)avoid[e.key]=e});
    var rank={"Carro-chefe":0,"Apoio":1,"Pontual":2,"Livre":3,"Com cuidado":4};
    var opcoes=NF.formatos.map(function(f){var pk=picks[f.key],av=avoid[f.key];
      return {key:f.key,nome:f.nome,descricao:f.descricao,superficie:f.superficie,producao:f.producao,fit:pk?pk.papel:(av?"Com cuidado":"Livre"),nota:av?(av.pratica+": "+av.porque):(pk?pk.porque:"")};
    }).sort(function(a,b){return rank[a.fit]-rank[b.fit]});
    var sup=(ia&&Array.isArray(ia.superficies)&&ia.superficies.length)?ia.superficies:p.superficies;
    return {perfil:p,from:nz.from,manual:!!nz.manual,ia:!!ia,generico:p.key===NF.generico.key,
      leitura:(ia&&ia.leitura)||p.leitura,formatos:formatos,superficies:sup,producao:p.producao,
      cadencia:(ia&&ia.cadencia)||p.cadencia,series:(ia&&Array.isArray(ia.series)&&ia.series.length)?ia.series:p.series,
      evitar:evitar,cuidados:p.cuidados,opcoes:opcoes};
  }
  // Resumo para o prompt da Musa (Ideias): a IA prioriza os formatos do nicho.
  function formatGuidePrompt(){
    var g=formatGuide(),by=function(papel){return g.formatos.filter(function(f){return f.papel===papel}).map(function(f){return f.nome}).join(', ')};
    return ['GUIA DE FORMATOS DO NICHO ('+g.perfil.nome+'), distribua a maior parte das ideias nestes formatos:',
      '- Carro-chefe: '+by("Carro-chefe"), '- Apoio: '+by("Apoio"), '- Pontual: '+by("Pontual"),
      '- Evite / use com cuidado: '+g.evitar.map(function(e){return e.pratica+' ('+e.porque+')'}).join('; '),
      '- Cuidados: '+g.cuidados.join(' ')].join('\n');
  }
  var FIT_CLS={"Carro-chefe":"fit-cc","Apoio":"fit-ap","Pontual":"fit-po","Livre":"fit-li","Com cuidado":"fit-cu"};
  function fitBadge(fit){return '<span class="fit '+(FIT_CLS[fit]||"fit-li")+'">'+esc(fit)+'</span>';}
  function renderFormats(){
    var el=I('.view[data-view="formats"]');
    if(!state.client){el.innerHTML=emptyView("Formatos","Cadastre ou escolha um cliente para ver o guia de formatos do nicho dele.");return;}
    var g=formatGuide(),cv=state.clientView,canAi=!cv&&isDbClient(state.client)&&aiAvailable();
    var origem=g.manual?'Nicho escolhido manualmente.':(g.generico?'Não identifiquei o nicho com segurança, informe o nicho no cadastro ou no Content DNA, ou escolha abaixo.':'Identificado a partir de: “'+esc(String(g.from).slice(0,90))+(String(g.from).length>90?'…':'')+'”');
    var opts=NF.perfis.concat([NF.generico]).map(function(p){return '<option value="'+p.key+'"'+(p.key===g.perfil.key?' selected':'')+'>'+esc(p.nome)+'</option>'}).join('');
    var PAPEL_CHIP={"Carro-chefe":"act","Apoio":"prog"},FIT_CHIP={"Carro-chefe":"act","Apoio":"prog","Com cuidado":"warn","Evitar":"warn"};
    var h=quadro(esc(g.perfil.nome)+(g.ia?' <span class="chip prog">personalizado pela IA</span>':''),cv?'':origem,
      cv?'':'<label class="sr" for="fmtNiche">Trocar nicho</label><select id="fmtNiche">'+opts+'</select>'+(canAi?'<button class="btn pri genbtn" id="fmtAiBtn">Personalizar com IA</button>':''),
      '<p class="texto">'+esc(g.leitura)+'</p><span id="fmtMsg" class="pp-m"></span>');
    h+=quadro("Formatos recomendados","Em ordem de prioridade. Carro-chefe é a base do perfil; apoio complementa; pontual é de vez em quando.",'',
      '<div class="tabela"><table><thead><tr><th></th><th>Formato</th><th>Papel</th><th>Por quê</th><th>Como fazer</th></tr></thead><tbody>'+g.formatos.map(function(f,i){
        return '<tr class="sem-clique"><td class="ck pp-m">'+(i+1)+'</td><td><b class="cel-t">'+esc(f.nome)+'</b><small>'+esc(f.superficie)+' · '+esc(f.producao)+'</small></td><td><span class="chip '+(PAPEL_CHIP[f.papel]||"")+'">'+esc(f.papel)+'</span></td><td class="e-reg">'+esc(f.porque)+'</td><td class="e-reg">'+esc(f.comoFazer)+'</td></tr>';}).join('')+'</tbody></table></div>');
    var sup=g.superficies;
    h+=quadro("Mix de superfícies",'','','<div class="mixbar">'+sup.map(function(x,i){return '<i style="flex:'+x.pct+' 1 0;opacity:'+(MIX_TONS[i]||.2)+'"></i>'}).join('')+'</div>'+
      '<div class="mixleg">'+sup.map(function(x,i){return '<span><i style="opacity:'+(MIX_TONS[i]||.2)+'"></i><b>'+x.pct+'%</b> '+esc(x.superficie)+'</span>'}).join('')+'</div>'+
      '<div style="margin-top:16px"><div class="kv"><span>Produção</span><div>'+esc(g.producao.nivel)+'. '+esc(g.producao.porque)+'</div></div><div class="kv"><span>Cadência</span><div>'+esc(g.cadencia)+'</div></div>'+
      (g.series.length?'<div class="kv"><span>Séries fixas</span><div>'+esc(g.series.join(", "))+'. Mesmo nome, mesma abertura e mesmo dia criam hábito.</div></div>':'')+'</div>');
    h+=quadro("O que evitar",'','',g.evitar.map(function(e){return '<div class="linha"><div class="l-main"><b>'+esc(e.pratica)+'</b><small>'+esc(e.porque)+'</small></div></div>'}).join('')+
      (g.cuidados.length?'<div class="bt" style="margin-top:20px">Cuidados éticos e regulatórios</div>'+g.cuidados.map(function(c){return '<div class="linha"><div class="l-main"><small style="color:var(--ink)">'+esc(c)+'</small></div></div>'}).join(''):''));
    if(!cv)h+=perfCardHtml();
    h+='<details class="quadro dobra-q"><summary class="q-head"><div><h3>Toda a biblioteca de formatos</h3><p>Cada formato com o encaixe neste nicho. Livre é para usar quando a ideia pedir.</p></div></summary>'+
      '<div class="tabela"><table><thead><tr><th>Formato</th><th>Encaixe</th><th>Descrição</th></tr></thead><tbody>'+g.opcoes.map(function(o){
        return '<tr class="sem-clique"><td><b class="cel-t">'+esc(o.nome)+'</b><small>'+esc(o.superficie)+' · '+esc(o.producao)+'</small></td><td><span class="chip '+(FIT_CHIP[o.fit]||"")+'">'+esc(o.fit)+'</span></td><td class="e-reg">'+esc(o.descricao)+(o.fit==="Com cuidado"&&o.nota?'<small>'+esc(o.nota)+'</small>':'')+'</td></tr>';}).join('')+'</tbody></table></div></details>';
    h+='<p class="pp-m">Heurísticas de mercado para começar. Ajuste com os resultados reais do cliente. Regras de conselhos profissionais mudam: confira a versão vigente.</p>';
    el.innerHTML=h;
    var sel=I("#fmtNiche");if(sel)sel.addEventListener('change',function(){saveFormatsNiche(this.value)});
    var ab=I("#fmtAiBtn");if(ab)ab.addEventListener('click',runPersonalizarFormatos);
  }
  async function saveFormatsNiche(key){
    var id=state.client,rec={perfil:key,ia:null};if(!GENERATED)return;
    GENERATED.formats=rec;if(DB_STATE_CACHE[id])DB_STATE_CACHE[id].formats=rec;
    renderFormats();
    if(isDbClient(id)&&CAP.db){try{await dbDoc("cos_formats/"+id).set(rec);}catch(e){var m=I("#fmtMsg");if(m){m.textContent="Não consegui salvar a escolha, tente de novo.";m.style.color="var(--warn)";}}}
  }
  function buildFormatsPrompt(name,dnaText,g){
    var lib=NF.formatos.map(function(f){return f.nome+' ('+f.superficie+', '+f.producao+'): '+f.descricao}).join('\n');
    return ['Você é Musa, o agente de Formatos do Content OS. Personalize o guia de formatos deste cliente a partir do Content DNA real e do guia-base do nicho abaixo.',
      '', 'REGRAS: use SOMENTE formatos da biblioteca (nome exato). Não invente dados, resultados ou provas. Respeite os cuidados éticos/regulatórios do nicho. Seja específico para ESTE cliente (oferta, persona, dores, tom), não para o nicho em geral.',
      '', 'Cliente: '+name, 'CONTENT DNA:', dnaText, '',
      'GUIA-BASE DO NICHO ('+g.perfil.nome+'):', 'Leitura: '+g.perfil.leitura,
      'Formatos: '+g.perfil.formatos.map(function(f){var d=nfFormato(f.key);return (d?d.nome:f.key)+' ['+f.papel+']'}).join('; '),
      'Mix: '+g.perfil.superficies.map(function(s){return s.superficie+' '+s.pct+'%'}).join(', '), 'Cadência: '+g.perfil.cadencia,
      'Evitar: '+g.perfil.evitar.map(function(e){return e.pratica}).join('; '), 'Cuidados: '+g.perfil.cuidados.join(' '),
      perfCompact()?('\n'+perfCompact()+'\nPriorize o que os dados reais mostram, sem descartar formatos com poucos posts.'):'', '', 'BIBLIOTECA DE FORMATOS:', lib, '',
      'Entregue 5 a 6 formatos em ordem de prioridade (2 Carro-chefe, 2-3 Apoio, 1 Pontual), cada um com "porque" (ligado à persona/dor/oferta deste cliente) e "comoFazer" (instrução prática de gravação/estrutura, 1-2 frases). Ajuste o mix de superfícies (soma 100), a cadência e 3 séries/quadros com nome próprio para este cliente. Liste 2-3 práticas a evitar (use "formato" com o nome da biblioteca quando o alerta for sobre um formato; senão "").',
      '', 'Responda SOMENTE com JSON: {"leitura":string,"formatos":[{"nome":string,"papel":"Carro-chefe"|"Apoio"|"Pontual","porque":string,"comoFazer":string}],"superficies":[{"superficie":string,"pct":number}],"cadencia":string,"series":[string],"evitar":[{"pratica":string,"porque":string,"formato":string}]}',
    ].join('\n');
  }
  async function runPersonalizarFormatos(){
    var id=state.client;if(!CAP.sample){noAi();return;}
    var btn=I("#fmtAiBtn");if(btn)btn.disabled=true;
    var msg=I("#fmtMsg");setBusy(msg,"Personalizando para este cliente…");
    try{
      var g=formatGuide();
      var out=await CAP.sample.json(buildFormatsPrompt(byId(id).name,dnaCompact(),g),{modelTier:"complex",cache:false});
      var sup=Array.isArray(out.superficies)?out.superficies.filter(function(s){return s&&s.superficie&&+s.pct>0}).map(function(s){return {superficie:String(s.superficie),pct:Math.round(+s.pct)}}):[];
      if(sup.length){var pc=largestRemainder(sup.map(function(s){return s.pct}),100);sup.forEach(function(s,i){s.pct=pc[i]});}
      var ia={perfil:g.perfil.key,leitura:String(out.leitura||""),formatos:Array.isArray(out.formatos)?out.formatos:[],superficies:sup,
        cadencia:String(out.cadencia||""),series:Array.isArray(out.series)?out.series.map(String):[],evitar:Array.isArray(out.evitar)?out.evitar:[],at:new Date().toISOString()};
      var rec={perfil:g.manual?g.perfil.key:null,ia:ia};
      await dbDoc("cos_formats/"+id).set(rec);
      if(DB_STATE_CACHE[id])DB_STATE_CACHE[id].formats=rec;
      if(state.client===id){GENERATED.formats=rec;renderFormats();}
    }catch(e){
      if(msg){msg.textContent=sampleErrCopy(e);msg.style.color="var(--warn)";}
      if(btn)btn.disabled=false;
    }
  }
  function renderStatus(v){var s=STATUS[v]||["mock",""];var el=I("#statuspill");if(!el)return;el.className="statuspill lvl-"+s[0];el.textContent=LVL[s[0]];el.title=s[1];}
  function emptyView(title,msg){return '<div class="section-head" style="margin-top:6px"><div><h3>'+title+' <span class="tag-mock">demonstração</span></h3></div></div><div class="card pad" style="text-align:center;color:var(--muted);padding:28px"><div style="font-size:13px">'+esc(msg)+'</div></div>'}

  // ---- Análise ao vivo (Íris) ----
  function anRenderResult(res){
    var counts={};["FACT","HYPOTHESIS","INSIGHT","STRATEGIC_DECISION","LEARNING"].forEach(function(s){counts[s]=res.suggestions.filter(function(x){return x.state===s}).length});
    var bySec={};res.suggestions.forEach(function(s){(bySec[s.section]=bySec[s.section]||[]).push(s)});
    var h='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px"><b style="font-family:var(--font-display);font-size:15px">'+res.suggestions.length+' sugestões</b>';
    ["FACT","INSIGHT","STRATEGIC_DECISION","LEARNING","HYPOTHESIS"].forEach(function(s){if(counts[s])h+='<span class="pill mono st-'+s+'">'+STLBL[s]+' '+counts[s]+'</span>'});
    h+='</div><div style="font-size:11.5px;color:var(--faint);margin-bottom:14px">Guardrails: '+(res.downgraded?res.downgraded+' FACT sem fonte, HYPOTHESIS':'nenhuma invenção detectada')+' · exige aprovação humana</div>';
    SECORDER.forEach(function(sec){var items=bySec[sec];if(!items)return;
      h+='<div style="margin-bottom:12px"><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--faint);margin-bottom:7px">'+SECLBL[sec]+'</div>';
      items.forEach(function(x){h+='<div class="entry" style="margin-bottom:7px"><div class="e-top"><span class="pill mono st-'+x.state+'">'+STLBL[x.state]+'</span><span class="e-field">'+esc(x.field)+'</span></div><div class="e-val">'+esc(x.value)+'</div><div class="e-prov">↳ '+esc(x.src)+'</div></div>'});
      h+='</div>';
    });
    h+=state.client&&DB_CLIENTS[state.client]?'<button class="btn" id="anGoDna">Abrir o Content DNA do cliente</button><div style="font-size:11.5px;color:var(--faint);margin-top:8px">Para gravar no cliente, cole o briefing no campo “Briefing” da aba Content DNA.</div>':'<div style="font-size:11.5px;color:var(--faint)">Teste livre: para gravar, cadastre ou selecione um cliente e use a aba Content DNA.</div>';
    return h;
  }
  function runAnalyze(){
    var txt=I("#anTxt").value,src=I("#anSrc").value;
    if(!txt.trim()){I("#anOut").innerHTML='<div style="color:var(--muted);font-size:13px">Cole um briefing ao lado e clique em <b>Analisar com a Íris</b>.</div>';return;}
    var res=irisExtract(txt,src);
    I("#anOut").innerHTML=anRenderResult(res);
    var g=I("#anGoDna");if(g)g.addEventListener('click',function(){go("dna")});
  }
  function renderAnalyze(){
    var el=I('.view[data-view="analyze"]');var anCli=state.client&&DB_CLIENTS[state.client];
    el.innerHTML='<div class="section-head" style="margin-top:6px"><div><h3>Análise IA, Íris</h3><p>Cole um briefing e a Íris estrutura o Content DNA <b>ao vivo</b>, com a mesma lógica coberta por testes. Nada vira fato sem sua aprovação.</p></div></div>'+
      '<div class="grid cols-2"><div class="card pad"><div class="fld"><label for="anNome">Cliente</label><input id="anNome" value="'+esc(anCli?(anCli.name||"")+(anCli.niche?", "+anCli.niche:""):"")+'" placeholder="Nome do cliente, nicho"></div><div class="fld"><label for="anSrc">Fonte (proveniência)</label><input id="anSrc" value="Briefing de onboarding, '+new Date().toLocaleDateString("pt-BR")+'"></div><div class="fld"><label for="anTxt">Briefing do cliente</label><textarea class="ta" id="anTxt" placeholder="Cole aqui o briefing: o que o cliente vende, público, dores, desejos, objeções, diferencial, provas, tom de voz…">'+esc(anCli&&anCli.briefing||"")+'</textarea></div><button class="btn pri" id="anRun">▶ Analisar com a Íris</button></div>'+
      '<div class="card pad" id="anOut"></div></div>';
    I("#anRun").addEventListener('click',runAnalyze);
    runAnalyze();
  }

  // ---- Distribuição por funil ----
  function applyPreset(p){var m=p==="aut"?[65,25,10]:p==="ven"?[25,30,45]:[45,30,25];I("#rTopo").value=m[0];I("#rMeio").value=m[1];I("#rFundo").value=m[2];runDist()}
  function runDist(){
    var total=Math.max(1,parseInt(I("#dTotal").value||"20",10));
    var t=+I("#rTopo").value,m=+I("#rMeio").value,f=+I("#rFundo").value;
    I("#vTopo").textContent=t+"%";I("#vMeio").textContent=m+"%";I("#vFundo").textContent=f+"%";
    var r=planDistribution(total,{topo:t,meio:m,fundo:f});
    var cols={topo:"#5B45E6",meio:"#2E6FB7",fundo:"#0E8C9B"};
    var stack=["topo","meio","fundo"].map(function(k){return r.funnel[k]>0?'<div class="seg" style="flex:'+r.funnel[k]+' 1 0;background:'+cols[k]+'">'+r.funnel[k]+'</div>':''}).join('');
    var mx=Math.max.apply(null,FUNCS.map(function(x){return r.functions[x]}))||1;
    var funcRows=FUNCS.map(function(fn){return '<div class="fnbar"><span class="fnl">'+FUNC_LBL[fn]+' <span style="color:var(--faint);font-size:10.5px">· '+FUNC_FUNNEL[fn]+'</span></span><span class="fnt"><i style="width:'+(r.functions[fn]/mx*100)+'%"></i></span><span class="fnv tnum">'+r.functions[fn]+'</span></div>'}).join('');
    var warn=r.warnings.length?'<div class="callout" style="margin-top:14px;background:var(--hyp-bg)"><span></span><div class="em" style="color:var(--warn)">'+r.warnings.map(esc).join('<br>')+'</div></div>':'';
    I("#dOut").innerHTML='<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--faint);margin-bottom:10px">Plano do mês · '+total+' conteúdos</div><div class="stack">'+stack+'</div>'+
      '<div class="funnel-num"><div class="fn"><div class="n" style="color:'+cols.topo+'">'+r.funnel.topo+'</div><div class="l">Topo ('+r.funnelPercent.topo+'%)</div></div><div class="fn"><div class="n" style="color:'+cols.meio+'">'+r.funnel.meio+'</div><div class="l">Meio ('+r.funnelPercent.meio+'%)</div></div><div class="fn"><div class="n" style="color:'+cols.fundo+'">'+r.funnel.fundo+'</div><div class="l">Fundo ('+r.funnelPercent.fundo+'%)</div></div></div>'+
      '<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--faint);margin:18px 0 10px">Por função de conteúdo</div>'+funcRows+warn;
  }
  function renderDistribution(){
    var el=I('.view[data-view="distribution"]');
    el.innerHTML='<div class="section-head" style="margin-top:6px"><div><h3>Distribuição Editorial</h3><p>Quantos conteúdos no mês e o mix por funil. O plano é calculado de verdade (método do maior resto), competência de <b>Cronos + Bússola</b>.</p></div></div>'+
      '<div class="grid cols-2"><div class="card pad"><div class="fld"><label for="dTotal">Conteúdos no mês</label><input id="dTotal" type="number" min="1" max="60" value="20"></div>'+
      '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:16px"><button class="preset" data-preset="aut">Autoridade (mais topo)</button><button class="preset" data-preset="eq">Equilíbrio</button><button class="preset" data-preset="ven">Vendas (mais fundo)</button></div>'+
      '<div class="range-row"><span class="rl">Topo de funil</span><input type="range" id="rTopo" min="0" max="100" value="50"><span class="rv" id="vTopo">50%</span></div>'+
      '<div class="range-row"><span class="rl">Meio de funil</span><input type="range" id="rMeio" min="0" max="100" value="30"><span class="rv" id="vMeio">30%</span></div>'+
      '<div class="range-row"><span class="rl">Fundo de funil</span><input type="range" id="rFundo" min="0" max="100" value="20"><span class="rv" id="vFundo">20%</span></div>'+
      '<div style="font-size:11.5px;color:var(--faint);margin-top:6px">Os percentuais são normalizados, não precisam somar 100.</div></div>'+
      '<div class="card pad" id="dOut"></div></div>';
    ["rTopo","rMeio","rFundo","dTotal"].forEach(function(id){I("#"+id).addEventListener("input",runDist)});
    Array.prototype.forEach.call(document.querySelectorAll("[data-preset]"),function(b){b.addEventListener("click",function(){applyPreset(b.getAttribute("data-preset"))})});
    runDist();
  }

  // ---- Plano do Mês (pipeline gerado ponta a ponta) ----
  function chip(t,cls){return '<span class="'+(cls||"badge")+'">'+esc(t)+'</span>'}
  function renderPlan(){
    var el=I('.view[data-view="plan"]');
    if(!GENERATED){el.innerHTML=emptyView("Plano do Mês","Plano gerado não embutido nesta build. Rode: npm run pipeline (ou npx tsx src/demo/run-pipeline.ts).");return;}
    if(!GENERATED.strategy){el.innerHTML=emptyView("Plano do Mês","O plano do mês aparece aqui depois que este cliente tiver Content DNA e Estratégia. Comece pela aba Content DNA e siga os próximos passos do Dashboard.");return;}
    var g=GENERATED,s=g.strategy;
    function uniq(a){return a.filter(function(x,i){return x&&a.indexOf(x)===i})}
    var fx=s.funcoes||uniq([].concat.apply([],(s.paths||[]).map(function(p){return p.funcoes||[]}))),ex=s.emocoes||uniq([].concat.apply([],(s.paths||[]).map(function(p){return p.emocoes||[]}))),px=s.pilares||[];
    var h='<div class="section-head" style="margin-top:6px"><div><h3>Plano do Mês, '+esc(g.clientName)+'</h3><p>Gerado <b>ponta a ponta</b> pelo pipeline (Íris, Estratégia, Editorial, Ideias, Produção, Calendário, Notion), provider <b>'+esc(g.provider)+'</b>. Prosa final publicável depende do Anthropic.</p></div></div>';
    // Estratégia
    h+='<div class="grid cols-2"><div class="card pad"><div class="bt" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--faint);margin-bottom:6px">Posicionamento</div><div style="font-size:13.5px">'+esc(s.posicionamento)+'</div></div>'+
      '<div class="card pad" style="background:var(--brand-weak);border-color:transparent"><div class="bt" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--brand-ink);margin-bottom:6px">Big Message</div><div style="font-size:14px;font-family:var(--font-display);font-weight:700;color:var(--brand-ink)">'+esc(s.bigMessage)+'</div></div></div>';
    h+='<div class="card pad" style="margin-top:16px"><div class="metagrid"><div style="grid-column:1/-1"><div class="mk">Funções estratégicas ('+fx.length+')</div><div class="mv chips" style="margin-top:5px">'+fx.map(function(f){return chip(f,"pill st-INSIGHT")}).join('')+'</div></div>'+
      '<div><div class="mk">Pilares</div><div class="mv chips" style="margin-top:5px">'+px.map(function(p){return chip(String(p).split(":")[0],"badge")}).join('')+'</div></div>'+
      '<div><div class="mk">Emoções-alvo</div><div class="mv chips" style="margin-top:5px">'+ex.map(function(e){return chip("♥ "+e,"pill emo-pill")}).join('')+'</div></div>'+
      '<div style="grid-column:1/-1"><div class="mk">Percepção a construir</div><div class="mv">'+esc(s.percepcao)+'</div></div></div></div>';
    if(s.mix){h+='<div class="card pad" style="margin-top:16px"><div class="bt" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--faint);margin-bottom:10px">Mix estratégico recomendado (Átlas)</div><div class="stack">'+s.mix.map(function(m,i){return '<div class="seg" style="flex:'+m.pct+' 1 0;background:'+avc(i)+'">'+m.pct+'%</div>'}).join('')+'</div><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:11px">'+s.mix.map(function(m,i){return '<span class="badge"><span style="width:8px;height:8px;border-radius:50%;background:'+avc(i)+';display:inline-block"></span>&nbsp;'+m.pct+'% '+esc(m.nome)+'</span>'}).join('')+'</div><div style="font-size:11.5px;color:var(--faint);margin-top:9px">Combine e ajuste os caminhos na aba <b>Estratégia</b>.</div></div>';}
    // Ideias
    h+='<div class="section-head"><div><h3>'+g.ideas.length+' ideias geradas</h3><p>Diversas em função, funil, formato e emoção, não variações da mesma ideia.</p></div></div>';
    h+='<div class="grid cols-2">'+g.ideas.map(function(i){return '<div class="card pad" style="padding:13px 15px"><div style="font-size:13px;font-weight:600">'+esc(i.titulo)+'</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">'+chip(i.funil,"badge")+chip(i.funcao,"pill st-INSIGHT")+chip("♥ "+i.emocao,"pill emo-pill")+chip(i.surface+" + "+i.format,"badge")+'</div></div>'}).join('')+'</div>';
    // Calendário
    h+='<div class="section-head"><div><h3>Calendário do mês, '+g.calendar.items.length+' conteúdos</h3><p>Mix: topo '+g.calendar.mix.topo+' · meio '+g.calendar.mix.meio+' · fundo '+g.calendar.mix.fundo+'. Clique para abrir roteiro/copy + payload do Notion.</p></div></div>';
    h+='<div class="clist">'+g.calendar.items.map(function(it,idx){return '<div class="card content-card" data-gen="'+idx+'"><div class="cc-h">'+esc(pecaTitulo(it))+'</div>'+rascunhoBadge(it.content)+'<div class="cc-m">'+esc(quando(it))+' · '+esc(it.idea.surface)+' + '+esc(it.idea.format)+'</div><div class="cc-tags"><span class="badge '+(STCOL[it.status]||"badge")+'">'+it.status+'</span><span class="pill st-INSIGHT">'+esc(it.idea.funcao)+'</span><span class="pill emo-pill">♥ '+esc((it.content||it.carousel||it.stories||it.idea).emocao||it.idea.emocao||"")+'</span></div></div>'}).join('')+'</div>';
    el.innerHTML=h;
    Array.prototype.forEach.call(el.querySelectorAll('[data-gen]'),function(c){c.addEventListener('click',function(){openGenerated(+c.getAttribute('data-gen'))})});
  }
  // ---- Esqueleto estratégico (gatilhos/elementos selecionáveis + 3 perguntas) ----
  function chipSet(lib,recs,isTrigger){
    var byKey={};(recs||[]).forEach(function(r){byKey[r.key]=r});
    return '<div class="selgrid">'+(lib||[]).map(function(it){
      var rec=byKey[it.key],sel=!!rec;
      var guard=(isTrigger&&it.requerEvidencia)?'<span class="guard" title="Nunca inventar, só com base real">︎ evidência</span>':'';
      var why=(rec&&rec.porque)?'<div style="font-size:11px;color:var(--muted);margin-top:3px">'+esc(rec.porque)+(rec.guardrail?' <b style="color:var(--emo)">'+esc(rec.guardrail)+'</b>':'')+'</div>':'';
      return '<div class="selchip'+(sel?' sel':'')+'" data-sel data-key="'+esc(it.key)+'" data-nome="'+esc(it.nome)+'" title="'+esc(it.descricao||'')+'"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><b style="font-size:12px">'+esc(it.nome)+'</b>'+(sel?'<span class="badge act" style="font-size:9px">IA</span>':'')+guard+'</div>'+why+'</div>';
    }).join('')+'</div>';
  }
  function skelChainNodes(x,del,kind){
    var conteudo=kind==="carousel"?"Carrossel":kind==="stories"?"Stories":(del.roteiro?"Roteiro":del.slides?"Carrossel":"Stories");
    var g=(del.gatilhosRec||[]).map(function(t){return t.nome}).slice(0,3).join(", ")||"";
    var e=(del.elementosRec||[]).map(function(d){return d.nome}).slice(0,3).join(", ")||"";
    var nodes=[["Persona",x.persona],["Objetivo",x.objetivo],["Propósito",x.proposito],["Dor/Desejo",x.dorDesejo],["Big Message",x.bigMessage,1],["Emoção",x.emocao,1],["Percepção",x.percepcao,1],["Função",x.funcao],["Funil/Jornada",x.funil+" · "+x.jornada],["Gatilhos",g],["Elementos",e],["Headline",x.hook],["Conteúdo",conteudo],["CTA",del.cta||x.cta]];
    return nodes.map(function(n,i){return '<div class="sc'+(n[2]?' hot':'')+'"><b title="'+esc(String(n[1]))+'">'+esc(String(n[1]))+'</b>'+esc(n[0])+'</div>'+(i<nodes.length-1?'<span class="sca">›</span>':'')}).join('');
  }
  function skeletonHtml(x,del,kind){
    if(state.clientView){
      // Read-only para o cliente: só o "por quê" essencial, sem edição/prompts internos.
      return '<div class="block"><div class="bt">Por que este conteúdo</div><div class="metagrid">'+meta("Objetivo",x.objetivo)+meta("Formato",del.formato||x.surface)+'<div style="grid-column:1/-1">'+meta("Mensagem principal",x.bigMessage)+'</div>'+meta("Emoção",x.emocao)+meta("Etapa",x.funil+" · "+x.jornada)+'</div></div>';
    }
    var h='';
    h+='<div class="block"><div class="bt">Esqueleto estratégico, as 3 perguntas que guiam a criação <span class="tag-mock">editável</span></div><div class="qgrid">'
      +'<div class="q"><div class="ql">Qual é a principal mensagem? (Big Message)</div><div class="editable" contenteditable="true">'+esc(x.bigMessage)+'</div></div>'
      +'<div class="q"><div class="ql">O que queremos que a pessoa sinta? (Emoção)</div><div class="editable" contenteditable="true">'+esc(x.emocao+', '+(del.emocaoPor||x.percepcao))+'</div></div>'
      +'<div class="q"><div class="ql">Qual percepção queremos construir?</div><div class="editable" contenteditable="true">'+esc(x.percepcao)+'</div></div>'
      +'</div><div style="font-size:11px;color:var(--faint);margin-top:8px">A IA já preencheu com a recomendação estratégica, edite à vontade (cópia de trabalho).</div></div>';
    h+='<div class="block"><div class="bt">Cadeia completa (Persona, …, CTA)</div><div class="skelchain">'+skelChainNodes(x,del,kind)+'</div></div>';
    h+='<div class="block"><div class="bt">Gatilhos mentais <span class="tag-mock">selecione um ou mais · IA = recomendado</span></div>'+chipSet(GENERATED.libraries&&GENERATED.libraries.gatilhos,del.gatilhosRec,true)+'</div>';
    h+='<div class="block"><div class="bt">Elementos literários/narrativos <span class="tag-mock">selecione, adicione ou remova</span></div>'+chipSet(GENERATED.libraries&&GENERATED.libraries.elementos,del.elementosRec,false)+'</div>';
    return h;
  }
  function carouselHtml(cr,x,idx){
    if(!cr)return isDbClient(state.client)?'<div class="block" style="text-align:center;padding:32px"><div style="font-size:13px;color:var(--muted);margin-bottom:14px">Carrossel ainda não gerado.</div><button class="btn pri" data-genpeca="carrossel" data-idx="'+idx+'">Gerar Carrossel</button><span id="pecaMsg" style="margin-left:10px;font-size:12px;color:var(--muted)"></span></div>':'<div class="block">Carrossel não gerado.</div>';
    var db=isDbClient(state.client);
    var skel=x?skeletonHtml(x,cr,"carousel"):"";
    var slides=(cr.slides||[]).map(function(s,i){return '<div class="stp"><div class="sl">'+esc(s.n+' · '+s.papel)+'</div><div class="sv"><b'+(db?' contenteditable="true" data-slide-t="'+i+'"':'')+'>'+esc(s.titulo)+'</b><div style="color:var(--muted);margin-top:3px"'+(db?' contenteditable="true" data-slide-x="'+i+'"':'')+'>'+esc(s.texto)+'</div><div style="font-size:11.5px;color:var(--faint);margin-top:5px">'+esc(s.visual)+'</div><div style="font-size:11.5px;color:var(--faint);margin-top:2px">busca: '+esc(s.imagem)+'</div></div></div>'}).join('');
    var refs=(cr.referencias||[]).map(function(r){return r.url?'<a class="badge" href="'+esc(r.url)+'" target="_blank" rel="noopener" style="text-decoration:none">'+esc(r.fonte)+': '+esc(r.termo)+' ↗</a>':'<span class="badge">'+esc(r.fonte)+': '+esc(r.termo)+'</span>'}).join('');
    var h='';
    h+='<div class="emo-hero"><div class="eh-l">Carrossel · estrutura "'+esc(cr.estrutura)+'"</div><div class="eh-v"'+(db?' contenteditable="true" id="crCapa"':'')+'>'+esc(cr.capaHeadline)+'</div><div class="eh-w"><b>Emoção:</b> '+esc(cr.emocao)+', '+esc(cr.emocaoPor)+'</div></div>';
    h+=skel;
    h+='<div class="block"><div class="bt">Capa + slides ('+(cr.slides||[]).length+'), título · corpo · direção visual'+(db?' <span class="tag-mock">clique no texto pra editar</span>':'')+'</div><div class="steps">'+slides+'</div></div>';
    h+='<div class="block"><div class="bt">Copy / Legenda</div><div class="copybox" id="crCopy"'+(db?' contenteditable="true"':'')+'>'+esc(cr.copy)+'</div></div>';
    h+='<div class="block"><div class="bt">CTA</div><div style="font-size:14px;font-weight:600" id="crCta"'+(db?' contenteditable="true"':'')+'>'+esc(cr.cta)+'</div></div>';
    h+='<div class="block"><div class="bt">Direção visual</div><div style="font-size:13px;color:var(--muted)">'+esc(cr.direcaoVisual)+'</div><div class="bt" style="margin:14px 0 10px">Referências visuais <span class="tag-mock">busca real · Pinterest/Pixabay</span></div><div class="chips">'+refs+'</div></div>';
    if(db)h+='<div style="text-align:right"><button class="btn pri" id="saveCarrBtn" data-idx="'+idx+'">Salvar edições</button></div>';
    return h;
  }
  function storyHtml(sq,x,idx){
    if(!sq)return isDbClient(state.client)?'<div class="block" style="text-align:center;padding:32px"><div style="font-size:13px;color:var(--muted);margin-bottom:14px">Sequência de Stories ainda não gerada.</div><button class="btn pri" data-genpeca="stories" data-idx="'+idx+'">Gerar Sequência de Stories</button><span id="pecaMsg" style="margin-left:10px;font-size:12px;color:var(--muted)"></span></div>':'<div class="block">Sequência não gerada.</div>';
    var db=isDbClient(state.client);
    var skel=x?skeletonHtml(x,sq,"stories"):"";
    var steps=(sq.stories||[]).map(function(s,i){return '<div class="stp"><div class="sl">'+esc(s.n+' · '+s.papel)+'</div><div class="sv"><span'+(db?' contenteditable="true" data-story-fala="'+i+'"':'')+'>'+esc(s.fala)+'</span><div style="font-size:11.5px;color:var(--faint);margin-top:5px">'+esc(s.visual)+'</div><div style="font-size:11.5px;color:var(--brand-ink);margin-top:3px">👆 '+esc(s.interacao)+'</div></div></div>'}).join('');
    var prog=(sq.progressao||[]).map(function(p){return '<span class="cnode"><b>'+esc(p)+'</b></span>'}).join('<span class="car">›</span>');
    var h='';
    h+='<div class="emo-hero"><div class="eh-l">Sequência de Stories · tipo "'+esc(sq.tipo)+'"</div><div class="eh-v" style="font-size:17px">'+esc(sq.narrativa)+'</div><div class="eh-w"><b>Emoção:</b> '+esc(sq.emocao)+', '+esc(sq.emocaoPor)+'</div></div>';
    h+='<div class="block"><div class="bt">Progressão (relacionamento antes da venda)</div><div class="chain">'+prog+'</div></div>';
    h+=skel;
    h+='<div class="block"><div class="bt">Contexto estratégico</div><div class="metagrid">'+meta("Objetivo",sq.objetivo)+meta("Público",sq.publico)+'<div style="grid-column:1/-1">'+meta("Percepção desejada",sq.percepcaoDesejada)+'</div><div style="grid-column:1/-1">'+meta("Contexto",sq.contexto)+'</div></div></div>';
    h+='<div class="block"><div class="bt">Sequência ('+(sq.stories||[]).length+' Stories), fala · visual · interação'+(db?' <span class="tag-mock">clique na fala pra editar</span>':'')+'</div><div class="steps">'+steps+'</div></div>';
    h+='<div class="block"><div class="bt">CTA</div><div style="font-size:14px;font-weight:600" id="stCta"'+(db?' contenteditable="true"':'')+'>'+esc(sq.cta)+'</div></div>';
    if(db)h+='<div style="text-align:right"><button class="btn pri" id="saveStoBtn" data-idx="'+idx+'">Salvar edições</button></div>';
    return h;
  }
  var ANTI_AI_VOICE_JS='VOZ HUMANA, nunca "cara de IA". Evite ativamente:\n- Clichês: "no mundo de hoje", "é fundamental", "destravar", "elevar", "mergulhar", "jornada" fora de contexto, "não é só X, é Y", "imagine só".\n- Frases perfeitamente simétricas em sequência (parece lista gerada por máquina).\n- Entusiasmo genérico sem substância ("incrível!", "imperdível!", "revolucionário"), mostre o específico, não anuncie o genérico.\n- Todo parágrafo com a mesma cadência/abertura (varie o ritmo das frases: curtas e longas).\n- Travessões e negritos em excesso como muleta de ênfase.\nEm vez disso: use o VOCABULÁRIO REAL do cliente (VoC), seja específico ao ponto de um concorrente não conseguir copiar trocando só o nome, e prefira uma frase imperfeita e concreta a uma frase "redonda" demais. Se soa como texto que qualquer marca do nicho poderia ter publicado, reescreva.';
  function contentGuardrails(){
    var pp=prefsPrompt();return (pp?pp+'\n\n':'')+'REGRAS INEGOCIÁVEIS:\n- NUNCA invente dados, fontes, tendências, métricas, provas, depoimentos, resultados, números, autoridade, urgência ou escassez.\n- Use SOMENTE o que está no Content DNA e na configuração abaixo. Se algo não está lá, não afirme.\n- Escreva prosa publicável de verdade, não rótulos, não placeholders, não "[inserir aqui]".\n- Teste do concorrente: se um concorrente pudesse publicar o mesmo texto só trocando o nome, aprofunde no que é específico deste cliente.\n\n'+ANTI_AI_VOICE_JS;
  }
