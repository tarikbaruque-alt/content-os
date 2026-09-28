  // ===================================================================
  // MODO SERVIDOR (Supabase), liga quando o painel é publicado com
  // window.COS_CONFIG (npm run build:web). Login da equipe, os mesmos docs do
  // painel guardados no banco, a IA dos botões pela função do servidor e as
  // telas Propostas e Agentes. Sem COS_CONFIG, nada disto roda: o painel segue
  // como Artifact (window.claude) ou cópia offline (navegador).
  // ===================================================================
  var SB=null; // {c: cliente supabase, ws: workspace, user}
  function servidorLigado(){return !!(window.COS_CONFIG&&window.supabase&&window.supabase.createClient);}

  function telaLogin(c){
    return new Promise(function(resolve){
      var el=document.createElement("div");el.id="loginTela";el.className="login";
      el.innerHTML='<form class="login-box" id="loginForm" novalidate><div class="login-marca"><span class="brand-mark">C</span><div><b>Content OS</b><span>Entre com a conta da equipe</span></div></div>'+
        '<div class="fld"><label for="lgEmail">E-mail</label><input id="lgEmail" type="email" autocomplete="email" required></div>'+
        '<div class="fld"><label for="lgSenha">Senha</label><input id="lgSenha" type="password" autocomplete="current-password" required minlength="6"></div>'+
        '<button class="btn pri login-ok" id="lgEntrar" type="submit">Entrar</button>'+
        '<div class="login-alt"><span class="pp-m">Acesso só por convite da equipe.</span><button class="lnk" type="button" id="lgEsqueci">Esqueci a senha</button></div>'+
        '<div class="login-msg" id="lgMsg" role="status"></div></form>';
      document.body.appendChild(el);
      var msg=function(t,bom){var m=I("#lgMsg");m.textContent=t;m.style.color=bom?"var(--good)":"var(--warn)";};
      var traduz=function(e){var t=String(e&&e.message||e||"");
        if(/invalid login/i.test(t))return "E-mail ou senha errados.";
        if(/not confirmed/i.test(t))return "Confirme o e-mail pelo link que enviamos e tente de novo.";
        if(/already registered|already been registered/i.test(t))return "Esse e-mail já tem conta. Use Entrar.";
        if(/password/i.test(t))return "A senha precisa ter pelo menos 6 caracteres.";
        if(/rate|too many/i.test(t))return "Muitas tentativas. Espere um minuto.";
        return "Não deu certo: "+t;};
      var dados=function(){return {email:I("#lgEmail").value.trim(),password:I("#lgSenha").value};};
      I("#loginForm").addEventListener("submit",async function(ev){ev.preventDefault();var d=dados();if(!d.email||!d.password){msg("Preencha e-mail e senha.");return;}
        var b=I("#lgEntrar");b.disabled=true;b.textContent="Entrando…";
        var r=await c.auth.signInWithPassword(d);b.disabled=false;b.textContent="Entrar";
        if(r.error){msg(traduz(r.error));return;}
        el.remove();resolve(r.data.user);});
      I("#lgEsqueci").addEventListener("click",async function(){var d=dados();if(!d.email){msg("Digite seu e-mail e clique em Esqueci a senha.");return;}
        var r=await c.auth.resetPasswordForEmail(d.email,{redirectTo:location.origin});
        msg(r.error?traduz(r.error):"Enviamos um link para "+d.email+" criar uma senha nova.",!r.error);});
      setTimeout(function(){var e=I("#lgEmail");if(e)e.focus();},50);
    });
  }

  // Link do e-mail: "esqueci a senha" (recovery) ou convite da equipe (invite).
  function telaNovaSenha(c,convite){
    return new Promise(function(resolve){
      var el=document.createElement("div");el.className="login";
      el.innerHTML='<form class="login-box" id="nsForm" novalidate><div class="login-marca"><span class="brand-mark">C</span><div><b>'+(convite?'Bem-vindo à equipe':'Senha nova')+'</b><span>'+(convite?'Crie a senha que vai usar para entrar no painel':'Escolha a senha que vai usar daqui pra frente')+'</span></div></div>'+
        (convite?'<div class="fld"><label for="nsNome">Seu nome</label><input id="nsNome" autocomplete="name" required></div>':'')+
        '<div class="fld"><label for="nsSenha">'+(convite?'Senha':'Senha nova')+'</label><input id="nsSenha" type="password" autocomplete="new-password" minlength="6" required></div>'+
        '<button class="btn pri login-ok" type="submit">Salvar e entrar</button><div class="login-msg" id="nsMsg" role="status"></div></form>';
      document.body.appendChild(el);
      I("#nsForm").addEventListener("submit",async function(ev){ev.preventDefault();var v=I("#nsSenha").value,nm=I("#nsNome")?I("#nsNome").value.trim():"";
        if(convite&&!nm){I("#nsMsg").textContent="Diga o seu nome, é como a equipe vai te ver.";return;}
        if(v.length<6){I("#nsMsg").textContent="A senha precisa ter pelo menos 6 caracteres.";return;}
        var r=await c.auth.updateUser(convite?{password:v,data:{nome:nm}}:{password:v});
        if(r.error){I("#nsMsg").textContent="Não deu certo: "+r.error.message;return;}
        history.replaceState(null,"",location.pathname);el.remove();resolve();});
    });
  }

  async function iniciarServidor(){
    var cfg=window.COS_CONFIG,c=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true}});
    var s=(await c.auth.getSession()).data.session,user=s&&s.user;
    // Voltou pelo link do e-mail (esqueci a senha ou convite): já tem sessão; pede a senha antes de seguir.
    if(user&&/type=(recovery|invite)/.test(location.hash)){await telaNovaSenha(c,/type=invite/.test(location.hash));user=((await c.auth.getSession()).data.session||{}).user||user;}
    if(!user)user=await telaLogin(c);
    await c.rpc("aceitar_convites");
    // Workspace fixo: o escolhido antes (neste navegador) ou o mais antigo. Antes era
    // o primeiro que o banco devolvesse, e quem estava em mais de um caía em qualquer um.
    var ms=((await c.from("membros").select("workspace_id,papel").eq("user_id",user.id)).data)||[],lista=[],ws=null,papel=null;
    if(ms.length){
      var wr=((await c.from("workspaces").select("id,nome,created_at")).data)||[];
      lista=ms.map(function(m){var w=wr.filter(function(x){return x.id===m.workspace_id})[0]||{};return {id:m.workspace_id,papel:m.papel,nome:w.nome||"Content OS",criado:w.created_at||""};})
        .sort(function(a,b){return String(a.criado).localeCompare(String(b.criado))});
      var salvo=null;try{salvo=localStorage.getItem("cos_ws");}catch(e){}
      var ok=lista.filter(function(x){return x.id===salvo})[0]||lista[0];ws=ok.id;papel=ok.papel;
    }
    if(!ws){var r=await c.rpc("criar_workspace",{nome:"Content OS"});if(r.error)throw r.error;ws=r.data;papel="dono";lista=[{id:ws,papel:"dono",nome:"Content OS"}];}
    var meta=user.user_metadata||{};
    SB={c:c,ws:ws,user:user,papel:papel,nome:meta.nome||String(user.email||"").split("@")[0],workspaces:lista};
    document.body.classList.toggle("so-leitura",papel==="leitura");
    c.auth.onAuthStateChange(function(ev){if(ev==="SIGNED_OUT")location.reload();});
    return SB;
  }

  // Plano do cliente (estratégia, linha editorial, ideias): o banco não aceita
  // gravação direta do navegador. Vai pela op "gravar", que confere a trava da
  // etapa e registra quem aprovou. SB_CTX diz o motivo (proposta, restauração).
  var SB_CTX={};
  function eTravado(path){return /^cos_(strategy|editorial|ideas)\//.test(path);}
  async function gravarTravado(docs){
    var cli=docs[0].path.split("/")[1];
    await chamarServidor("gravar",{cliente:cli,docs:docs.map(function(d){return {path:d.path,data:JSON.parse(JSON.stringify(d.data))}}),proposta:SB_CTX.proposta||null,restaurar:!!SB_CTX.restaurar,motivo:SB_CTX.motivo||null});
  }
  async function comContexto(ctx,fn){var antes=SB_CTX;SB_CTX=ctx;try{return await fn();}finally{SB_CTX=antes;}}
  // Mesma interface do db do Artifact (doc/collection, get/set/update/delete), sobre a tabela docs.
  function sbDb(){
    var c=SB.c,ws=SB.ws;
    function snap(path,row){return {id:path.split('/').pop(),exists:!!row,data:function(){return row?row.data:undefined}};}
    function falha(r){if(r.error)throw r.error;return r;}
    function doc(path){return {id:path.split('/').pop(),
      get:async function(){var r=falha(await c.from("docs").select("data").eq("workspace_id",ws).eq("path",path).maybeSingle());return snap(path,r.data);},
      set:async function(v){if(eTravado(path))return gravarTravado([{path:path,data:v}]);falha(await c.from("docs").upsert({workspace_id:ws,path:path,data:JSON.parse(JSON.stringify(v))},{onConflict:"workspace_id,path"}));},
      update:async function(v){var atual=(await doc(path).get()).data()||{};await doc(path).set(Object.assign({},atual,JSON.parse(JSON.stringify(v))));},
      delete:async function(){falha(await c.from("docs").delete().eq("workspace_id",ws).eq("path",path));},
      collection:function(n){return col(path+"/"+n)}};}
    function col(prefix){return {doc:function(id){return doc(prefix+"/"+id)},
      get:async function(){var r=falha(await c.from("docs").select("path,data").eq("workspace_id",ws).eq("parent",prefix));return {docs:(r.data||[]).map(function(x){return snap(x.path,x)})};}};}
    return {doc:doc,collection:col};
  }

  async function chamarServidor(op,corpo){
    var r=await SB.c.functions.invoke("agentes",{body:Object.assign({op:op,ws:SB.ws},corpo||{})});
    if(r.error){var det=null;try{det=await r.error.context.json();}catch(e){}
      var er=new Error((det&&det.error&&det.error.message)||r.error.message);er.code=(det&&det.error&&det.error.code)||"erro";throw er;}
    return r.data;
  }
  // Mesma interface do "sample" do Artifact: sample(input) -> {text}; sample.json(input) -> objeto.
  function sbSample(){
    var f=async function(input){var d=await chamarServidor("ia",{input:input});return {text:d.text,truncated:!!d.truncated};};
    f.json=async function(input){var t=(await f(input)).text||"",i=t.indexOf("{"),j=t.lastIndexOf("}");
      try{return JSON.parse(i>=0&&j>i?t.slice(i,j+1):t);}catch(e){var er=new Error("json");er.code="invalid_json";throw er;}};
    return f;
  }

  // ---------------------------------------------------------------- Propostas
  var AG_INFO={radar:["Radar","Pesquisa"],iris:["Íris","Content DNA"],atlas:["Átlas","Estratégia"],bussola:["Bússola","Linha editorial"],musa:["Musa","Ideias"],cronos:["Cronos","Calendário"],estudio:["Estúdio","Peças"],pulso:["Pulso","Performance"],painel:["Painel","Botões Gerar"],acervo:["Acervo","Knowledge Base"],maestro:["Maestro","Chat"]};
  var TIPO_LBL={pesquisa:"Pesquisa",estrategia:"Estratégia",editorial:"Linha editorial",ideias:"Ideias",aviso:"Aviso"};
  var PROPOSTAS=[];
  async function carregarPropostas(){
    if(!SB)return [];
    var r=await SB.c.from("proposals").select("*").order("created_at",{ascending:false}).limit(60);
    PROPOSTAS=r.data||[];atualizarContadorPropostas();return PROPOSTAS;
  }
  function atualizarContadorPropostas(){
    var n=PROPOSTAS.filter(function(p){return p.status==="pendente"}).length,b=I('.side .nav a[data-view="overview"] .nav-n');
    if(b){b.textContent=n;b.hidden=!n;}
  }
  function previaProposta(p){
    var d=p.payload||{};
    if(p.tipo==="pesquisa")return '<ul class="pp-lista">'+(d.items||[]).map(function(i){return '<li><b>'+esc(i.tipo)+'</b> '+esc(i.insight)+(i.url?' <a href="'+esc(i.url)+'" target="_blank" rel="noopener">'+esc(i.origem||"fonte")+(i.data?' · '+esc(i.data):'')+'</a>':'')+'</li>'}).join('')+'</ul>';
    if(p.tipo==="estrategia")return '<dl class="pp-dl"><dt>Posicionamento</dt><dd>'+esc(d.posicionamento||"")+'</dd><dt>Big Message</dt><dd>'+esc(d.bigMessage||"")+'</dd><dt>Mix do mês</dt><dd>'+esc((d.mix||[]).map(function(x){return x.nome+" "+x.pct+"%"}).join(" · "))+'</dd></dl>';
    if(p.tipo==="editorial")return '<ul class="pp-lista">'+(d.pilares||[]).map(function(x){return '<li><b>'+esc(x.pilar)+'</b> '+esc((x.temas||[]).map(function(t){return t.tema}).join(", "))+'</li>'}).join('')+'</ul>';
    if(p.tipo==="ideias")return '<ol class="pp-lista">'+(d.ideas||[]).map(function(x){return '<li>'+esc(x.titulo)+' <span class="pp-m">'+esc(x.formato||"")+' · '+esc(x.funil||"")+'</span></li>'}).join('')+'</ol>';
    return '';
  }
  function cardProposta(p){
    var ag=AG_INFO[p.agente]||[p.agente,""],pend=p.status==="pendente",aviso=p.tipo==="aviso";
    return '<article class="card pad prop'+(pend?'':' feita')+'" data-prop="'+esc(p.id)+'"><div class="prop-top"><span class="badge">'+esc(ag[0])+'</span><span class="badge">'+esc(clientName(p.client_id))+'</span><span class="badge '+(aviso?'':'prog')+'">'+esc(TIPO_LBL[p.tipo]||p.tipo)+'</span>'+
      '<span class="prop-quando">'+esc(new Date(p.created_at).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}))+'</span></div>'+
      '<h4 class="prop-t">'+esc(p.titulo)+'</h4>'+(p.resumo?'<p class="prop-r">'+esc(p.resumo)+'</p>':'')+
      (aviso?'':'<details class="prop-prev"'+(pend?' open':'')+'><summary>Ver o que o agente propõe</summary>'+previaProposta(p)+'</details>')+
      '<div class="prop-acoes">'+(pend?(aviso?
        '<button class="btn pri" data-prop-ir="'+esc((p.payload||{}).ir||"overview")+'">Ver</button><button class="btn" data-prop-ok>Ok, visto</button>':
        '<button class="btn pri" data-prop-aprovar>Aprovar e aplicar</button><button class="btn" data-prop-rejeitar>Rejeitar</button>'):
        '<span class="badge '+(p.status==="aplicada"?'act':'')+'">'+(p.status==="aplicada"?(aviso?'visto':'aplicada'):'rejeitada')+'</span>')+
      '<span class="prop-msg"></span></div></article>';
  }
  async function renderPropostas(){
    var el=I('.view[data-view="propostas"]');if(!el)return;
    var head='<div class="section-head" style="margin-top:6px"><div><h3>Propostas dos agentes</h3><p>O que os agentes fizeram sozinhos e espera a sua decisão. Aprovar grava no cliente e, no planejamento, chama o próximo agente.</p></div></div>';
    if(!SB){el.innerHTML=head+'<div class="card empty-hero"><div class="eh-t">As propostas aparecem no painel publicado, com login da equipe.</div></div>';return;}
    el.innerHTML=head+'<div class="card pad"><span class="spinner"></span>Carregando…</div>';
    await carregarPropostas();
    var pend=PROPOSTAS.filter(function(p){return p.status==="pendente"}),feitas=PROPOSTAS.filter(function(p){return p.status!=="pendente"}).slice(0,15);
    el.innerHTML=head+(pend.length?'<div class="props">'+pend.map(cardProposta).join('')+'</div>':'<div class="card empty-hero"><div class="eh-t"><b>Nada esperando você.</b><br>Quando um agente terminar um trabalho, ele aparece aqui.</div></div>')+
      (feitas.length?'<div class="eyebrow" style="margin:26px 0 10px">Decididas recentemente</div><div class="props">'+feitas.map(cardProposta).join('')+'</div>':'');
    ligarCartoesProposta(el,function(){renderPropostas();});
  }
  function ligarCartoesProposta(el,depois){
    Array.prototype.forEach.call(el.querySelectorAll('[data-prop]'),function(card){
      var p=PROPOSTAS.filter(function(x){return x.id===card.getAttribute('data-prop')})[0],msg=card.querySelector('.prop-msg');
      var fim=async function(aprovar){await chamarServidor("decidir",{id:p.id,aprovar:aprovar});await carregarPropostas();depois();};
      var bAprovar=card.querySelector('[data-prop-aprovar]'),bRejeitar=card.querySelector('[data-prop-rejeitar]'),bOk=card.querySelector('[data-prop-ok]'),bIr=card.querySelector('[data-prop-ir]');
      if(bAprovar)bAprovar.addEventListener('click',async function(){
        bAprovar.disabled=true;setBusy(msg,"Aplicando…");
        try{await aplicarProposta(p);await fim(true);toast("Aplicado em "+clientName(p.client_id)+".");}
        catch(e){clearBusy(msg);msg.textContent="Não consegui aplicar: "+(e.message||e);bAprovar.disabled=false;}});
      if(bRejeitar)bRejeitar.addEventListener('click',function(){fim(false).catch(function(e){msg.textContent=e.message;});});
      if(bOk)bOk.addEventListener('click',function(){fim(true).catch(function(e){msg.textContent=e.message;});});
      if(bIr)bIr.addEventListener('click',function(){if(p.client_id&&isDbClient(p.client_id))setClient(p.client_id);go(bIr.getAttribute('data-prop-ir'));});
    });
  }
  // Hoje: as propostas pendentes, com os mesmos cartões (aprovar ali mesmo).
  async function renderPropostasResumo(){
    var el=I("#ovPropostas");if(!el)return;
    if(!SB){el.innerHTML="";return;}
    await carregarPropostas();renderKpis();
    var pend=PROPOSTAS.filter(function(p){return p.status==="pendente"});
    el.innerHTML='<div class="bloco"><div class="bloco-head"><h3>Propostas dos agentes</h3><button class="lnk" data-ir-props>Ver histórico</button></div>'+
      (pend.length?'<div class="props">'+pend.slice(0,5).map(cardProposta).join('')+'</div>':'<div class="vazio">Nada esperando você. Quando um agente terminar um trabalho, ele aparece aqui.</div>')+'</div>';
    var b=el.querySelector('[data-ir-props]');if(b)b.addEventListener('click',function(){go("propostas")});
    ligarCartoesProposta(el,function(){renderPropostasResumo();});
  }
  // Aprovar = gravar com a MESMA rotina do botão "Gerar" daquela tela.
  async function aplicarProposta(p){
    var id=p.client_id,d=p.payload||{};
    if(!isDbClient(id))throw new Error("cliente não encontrado");
    var g=await loadDbClientState(id);
    if(state.client!==id){var v=state.view;setClient(id);state.view=v;}
    GENERATED=g;
    if(p.tipo==="estrategia")await comContexto({proposta:p.id},function(){return salvarEstrategia(id,d)});
    else if(p.tipo==="pesquisa")await salvarPesquisa(id,d);
    else if(p.tipo==="editorial")await comContexto({proposta:p.id},function(){return salvarEditorial(id,d)});
    else if(p.tipo==="ideias")await comContexto({proposta:p.id},function(){return salvarIdeias(id,d,d.append!==false)});
    renderKpis();
  }

  // ---------------------------------------------------------------- Agentes ao vivo
  var AG_ORDEM=["radar","iris","atlas","bussola","musa","cronos","estudio","pulso"];
  var AG_QUANDO={radar:"toda segunda, 7h",iris:"briefing novo",atlas:"depois do Pulso no dia de planejar, ou da Íris no cliente novo",bussola:"estratégia aprovada",musa:"linha editorial aprovada",cronos:"ideias aprovadas (sem IA)",estudio:"todo dia, 6h",pulso:"resultado novo e no dia de planejar"};
  var OP_PADRAO={diaPlanejamento:20,clienteAprova:"calendario_e_pecas",prazoCliente:2,semRespostaPublica:false,pautaQuente:"sugestao",agentes:{}};
  function opDo(id){var c=DB_CLIENTS[id]||{};return Object.assign({},OP_PADRAO,c.operacao||{},{agentes:Object.assign({},(c.operacao||{}).agentes||{})});}
  async function salvarOp(id,patch){var c=DB_CLIENTS[id];if(!c)return;var op=Object.assign(opDo(id),patch);await saveClientRecord(id,Object.assign({},c,{operacao:op}));}
  function quandoTs(ts){return ts?new Date(ts).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):"";}
  var ST_RUN={ok:["act","ok"],erro:["","erro"],sem_saida:["","sem resultado"],pulado:["","pulado"],rodando:["prog","rodando"]};
  // Duas telas, uma rotina: a tela Agentes (servidor, gasto, execuções de todos)
  // e a aba Operação do cliente (configurações e Automático/Manual por agente).
  async function renderAgentesServidor(doCliente){
    var el=doCliente?I('.view[data-view="operacao"]'):I("#agentGrid");if(!el||!SB)return false;
    var id=state.client,temCli=!!doCliente&&isDbClient(id),op=temCli?opDo(id):OP_PADRAO;
    var est={};try{est=await chamarServidor("estado");}catch(e){est={erro:e.message};}
    var runs=((await SB.c.from("agent_runs").select("id,agente,client_id,gatilho,status,custo_usd,erro,started_at,passos").order("started_at",{ascending:false}).limit(40)).data)||[];
    var ultima={};runs.forEach(function(r){if(r.client_id===id&&!ultima[r.agente])ultima[r.agente]=r;});
    var gasto=Number(est.gasto||0),teto=Number(est.orcamento||0);
    var mes=new Date().toISOString().slice(0,7),doMes=runs.filter(function(r){return String(r.started_at).slice(0,7)===mes});
    var linhaRun=function(r,comCli){var st=ST_RUN[r.status]||["",r.status];
      return '<tr class="sem-clique"><td class="nowrap">'+esc(quandoTs(r.started_at))+'</td><td>'+esc((AG_INFO[r.agente]||[r.agente])[0])+'</td>'+(comCli?'<td>'+esc(r.client_id?clientName(r.client_id):"")+'</td>':'')+'<td>'+esc(r.gatilho)+'</td>'+
        '<td><span class="chip '+st[0]+'">'+esc(st[1])+'</span>'+(r.erro?'<small>'+esc(r.erro)+'</small>':'')+'</td><td class="num tnum">'+(Number(r.custo_usd)?'US$ '+Number(r.custo_usd).toFixed(2):'')+'</td></tr>'};
    var h='';
    if(!doCliente){
      h+='<div class="stat-cards">'+
        kpiCard("Servidor dos agentes",est.chave?'Ligado':'Sem chave','modelo '+esc(est.modelo||""))+
        kpiCard("Gasto do mês",'US$ '+gasto.toFixed(2),'de US$ '+teto.toFixed(0)+' de teto<div class="prog-l largo" style="margin-top:10px"><i style="width:'+(teto?Math.min(100,gasto/teto*100):0)+'%"></i></div>')+
        kpiCard("Execuções no mês",String(doMes.length),doMes.filter(function(r){return r.status==="erro"}).length+' com erro')+'</div>';
    }
    if(temCli){
      h+=quadro("Como a operação funciona para este cliente","Vale para todos os agentes deste cliente.",'<span id="opMsg" class="pp-m"></span>',
        '<div class="grid cols-3 q-form">'+
        '<div class="fld"><label for="opDia">Dia de planejar o próximo mês</label><select id="opDia">'+Array.from({length:28},function(_,i){return '<option'+(op.diaPlanejamento===i+1?' selected':'')+'>'+(i+1)+'</option>'}).join('')+'</select></div>'+
        '<div class="fld"><label for="opAprova">O cliente aprova</label><select id="opAprova">'+[["calendario_e_pecas","O calendário e as peças"],["calendario","Só o calendário"],["nada","Nada, vocês aprovam"]].map(function(o){return '<option value="'+o[0]+'"'+(op.clienteAprova===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select></div>'+
        '<div class="fld"><label for="opPrazo">Prazo do cliente, em dias</label><input id="opPrazo" type="number" min="1" max="15" value="'+esc(op.prazoCliente)+'"></div>'+
        '<div class="fld"><label for="opSem">Se passar do prazo</label><select id="opSem"><option value="nao"'+(op.semRespostaPublica?'':' selected')+'>Espera a resposta</option><option value="sim"'+(op.semRespostaPublica?' selected':'')+'>Publica como está</option></select></div>'+
        '<div class="fld"><label for="opPauta">Pauta quente do Radar</label><select id="opPauta"><option value="sugestao"'+(op.pautaQuente==="sugestao"?' selected':'')+'>Só sugestão para o próximo mês</option><option value="troca"'+(op.pautaQuente==="troca"?' selected':'')+'>Pode virar gancho de peça da semana</option></select></div>'+
        '</div>');
    }
    h+=quadro(temCli?"Agentes deste cliente":"Os agentes",temCli?"Automático roda pela agenda e pela cadeia do planejamento. Manual só roda quando você pede.":"Para ligar ou desligar um agente num cliente, abra o cliente e vá em Operação.",'',
      '<div class="tabela"><table><thead><tr><th>Agente</th><th>Quando roda sozinho</th>'+(temCli?'<th>Modo</th>':'')+'<th>Última execução'+(temCli?'':' (cliente em foco)')+'</th>'+(temCli?'<th></th>':'')+'</tr></thead><tbody>'+
      AG_ORDEM.map(function(k){var inf=AG_INFO[k],modo=(op.agentes||{})[k]==="manual"?"manual":"auto",u=ultima[k],st=u?ST_RUN[u.status]||["",u.status]:null;
        return '<tr class="sem-clique"><td><b class="cel-t">'+esc(inf[0])+'</b><small>'+esc(inf[1])+'</small></td><td class="e-reg">'+esc(AG_QUANDO[k])+'</td>'+
          (temCli?'<td><div class="seg" role="group" aria-label="Modo do '+esc(inf[0])+'"><button class="'+(modo==="auto"?"on":"")+'" data-modo="auto" data-ag="'+k+'">Automático</button><button class="'+(modo==="manual"?"on":"")+'" data-modo="manual" data-ag="'+k+'">Manual</button></div></td>':'')+
          '<td>'+(u?'<span class="chip '+st[0]+'">'+esc(st[1])+'</span><small>'+esc(quandoTs(u.started_at))+(u.erro?' · '+esc(u.erro):'')+'</small>':'<small>ainda não rodou</small>')+'</td>'+
          (temCli?'<td class="acao"><button class="btn" data-rodar="'+k+'">Rodar agora</button><small class="ag-msg" data-agmsg="'+k+'"></small></td>':'')+'</tr>';}).join('')+'</tbody></table></div>');
    var lista=doCliente?runs.filter(function(r){return r.client_id===id}).slice(0,12):runs;
    h+=quadro(doCliente?"Execuções deste cliente":"Execuções recentes",'','',lista.length?'<div class="tabela"><table><thead><tr><th>Quando</th><th>Agente</th>'+(doCliente?'':'<th>Cliente</th>')+'<th>Gatilho</th><th>Resultado</th><th class="num">Custo</th></tr></thead><tbody>'+lista.map(function(r){return linhaRun(r,!doCliente)}).join('')+'</tbody></table></div>':'<div class="vazio">Nenhuma execução ainda.</div>');
    el.className="";el.innerHTML=h;
    var om=function(t,bom){var m=I("#opMsg");if(m){m.textContent=t;m.style.color=bom?"var(--good)":"var(--warn)";}};
    var salvaCampo=function(sel,fn){var x=I(sel);if(x)x.addEventListener('change',function(){salvarOp(id,fn(x.value)).then(function(){om("Salvo",true)},function(){om("Não consegui salvar")});});};
    salvaCampo("#opDia",function(v){return {diaPlanejamento:+v}});
    salvaCampo("#opAprova",function(v){return {clienteAprova:v}});
    salvaCampo("#opPrazo",function(v){return {prazoCliente:Math.max(1,+v||2)}});
    salvaCampo("#opSem",function(v){return {semRespostaPublica:v==="sim"}});
    salvaCampo("#opPauta",function(v){return {pautaQuente:v}});
    Array.prototype.forEach.call(el.querySelectorAll('[data-modo]'),function(b){b.addEventListener('click',function(){
      var ags=Object.assign({},opDo(id).agentes);ags[b.getAttribute('data-ag')]=b.getAttribute('data-modo');
      salvarOp(id,{agentes:ags}).then(function(){renderAgentesServidor(doCliente)});});});
    Array.prototype.forEach.call(el.querySelectorAll('[data-rodar]'),function(b){b.addEventListener('click',async function(){
      var k=b.getAttribute('data-rodar'),m=el.querySelector('[data-agmsg="'+k+'"]');b.disabled=true;setBusy(m,"Pedindo…");
      try{await chamarServidor("rodar",{cliente:id,agente:k});clearBusy(m);m.textContent="Rodando no servidor. O resultado chega em Propostas.";}
      catch(e){clearBusy(m);m.textContent=e.code==="sem_chave"?"Falta a chave da IA no servidor.":(e.message||"Não consegui pedir.");b.disabled=false;}});});
    return true;
  }

  function renderOperacao(){
    var el=I('.view[data-view="operacao"]');if(!el)return;
    if(!SB){el.innerHTML=vazioQuadro("A operação automática funciona no painel publicado.","Agenda, cadeia do planejamento e Automático ou Manual por agente precisam do servidor, que liga com o login da equipe.");return;}
    el.innerHTML='<div class="card pad"><span class="spinner"></span>Carregando…</div>';
    renderAgentesServidor(true);
  }

  // ---------------------------------------------------------------- Equipe
  // Quem está na equipe, o papel de cada um e o seu perfil. O dono convida (o servidor
  // cria a conta e manda o e-mail), troca papel, corrige e-mail, reenvia acesso e remove.
  var PAPEL_LBL={dono:"Dono",editor:"Editor",leitura:"Só leitura"};
  var PAPEL_DESC={dono:"faz tudo, inclusive a equipe",editor:"trabalha em tudo, não mexe na equipe",leitura:"vê tudo e não muda nada"};
  function selPapel(id,atual){return '<select id="'+id+'" aria-label="Papel">'+["editor","leitura","dono"].map(function(p){return '<option value="'+p+'"'+(p===atual?' selected':'')+'>'+PAPEL_LBL[p]+'</option>'}).join('')+'</select>';}
  function equipeHtml(){
    if(!SB)return '';
    var dono=SB.papel==="dono",varios=(SB.workspaces||[]).length>1;
    return quadro("Equipe","Dono "+PAPEL_DESC.dono+". Editor "+PAPEL_DESC.editor+". Só leitura "+PAPEL_DESC.leitura+".",'<button class="btn" id="eqSair">Sair</button>',
      (varios?'<div class="fld eq-ws"><label for="eqWs">Equipe aberta neste navegador</label><select id="eqWs">'+SB.workspaces.map(function(w){return '<option value="'+esc(w.id)+'"'+(w.id===SB.ws?' selected':'')+'>'+esc(w.nome)+', você é '+esc((PAPEL_LBL[w.papel]||w.papel).toLowerCase())+'</option>'}).join('')+'</select></div>':'')+
      '<div id="eqLista"><p class="pp-m"><span class="spinner"></span> Carregando a equipe</p></div>'+
      (dono?'<div class="eq-convite"><div class="bt">Convidar</div><div class="q-rodape" style="margin-top:0"><label class="sr" for="eqEmail">E-mail</label><input id="eqEmail" type="email" placeholder="email@exemplo.com" style="max-width:300px">'+selPapel("eqPapel","editor")+'<button class="btn pri" id="eqConvidar">Convidar</button></div><p class="pp-m">A pessoa recebe um e-mail para criar a senha e já entra na equipe.</p></div>':'')+
      '<div class="eq-perfil"><div class="bt">Seu perfil</div><div class="q-rodape" style="margin-top:0"><label class="sr" for="eqNome">Seu nome</label><input id="eqNome" value="'+esc(SB.nome||"")+'" placeholder="Seu nome" style="max-width:220px"><button class="btn" id="eqNomeSalvar">Salvar nome</button>'+
        '<label class="sr" for="eqSenha">Senha nova</label><input id="eqSenha" type="password" autocomplete="new-password" placeholder="Senha nova" style="max-width:200px"><button class="btn" id="eqSenhaSalvar">Trocar senha</button></div><p class="pp-m">Você entrou como '+esc(SB.user.email||"")+'.</p></div>'+
      '<p class="pp-m" id="eqMsg" role="status"></p>');
  }
  function eqMsg(t,bom){var m=I("#eqMsg");if(m){m.textContent=t;m.style.color=bom?"var(--good)":"var(--warn)";}}
  function quandoAcesso(ts){return ts?"entrou em "+new Date(ts).toLocaleDateString("pt-BR"):"nunca entrou";}
  async function carregarEquipe(){
    var el=I("#eqLista");if(!el||!SB)return;
    var dono=SB.papel==="dono",r=await SB.c.rpc("equipe",{ws:SB.ws});
    if(r.error){el.innerHTML='<p class="pp-m">Não consegui carregar a equipe: '+esc(r.error.message)+'</p>';return;}
    var pend=dono?(((await SB.c.from("convites").select("email,papel,created_at").eq("workspace_id",SB.ws)).data)||[]):[];
    var linhas=(r.data||[]).map(function(p){var eu=p.user_id===SB.user.id,mexe=dono&&!eu;
      return '<tr data-eq="'+esc(p.user_id)+'"><td><b class="cel-t">'+esc(p.nome||"")+(eu?' <span class="chip">você</span>':'')+'</b><small class="eq-email">'+esc(p.email||"")+'</small></td>'+
        '<td>'+(mexe?selPapel("eqP-"+p.user_id,p.papel):esc(PAPEL_LBL[p.papel]||p.papel))+'</td><td><small>'+esc(quandoAcesso(p.ultimo_acesso))+'</small></td>'+
        '<td class="acao nowrap">'+(mexe?'<button class="btn ghost" data-eq-email>Trocar e-mail</button><button class="btn ghost" data-eq-acesso>Enviar link de acesso</button><button class="icon-btn sm" data-eq-remover title="Tirar da equipe" aria-label="Tirar '+esc(p.nome||p.email)+' da equipe">'+iconeUI("linha-trash")+'</button>':'')+'</td></tr>';}).join('');
    el.innerHTML='<div class="tabela"><table><thead><tr><th>Pessoa</th><th>Papel</th><th>Acesso</th><th></th></tr></thead><tbody>'+linhas+'</tbody></table></div>'+
      (pend.length?'<p class="pp-m">Convites antigos esperando a pessoa criar conta: '+pend.map(function(c){return esc(c.email)+' <button class="lnk" data-eq-conv="'+esc(c.email)+'">cancelar</button>'}).join(', ')+'</p>':'');
    el.querySelectorAll('tr[data-eq]').forEach(function(tr){var uid=tr.getAttribute('data-eq'),nome=(tr.querySelector('.cel-t')||{}).textContent||"";
      var sp=I("#eqP-"+uid);if(sp)sp.addEventListener('change',async function(){sp.disabled=true;
        var u=await SB.c.from("membros").update({papel:sp.value}).eq("workspace_id",SB.ws).eq("user_id",uid).select("papel");sp.disabled=false;
        if(u.error||!(u.data||[]).length){eqMsg("Não consegui mudar o papel"+(u.error?": "+u.error.message:"."));carregarEquipe();return;}
        eqMsg(nome.trim()+" agora é "+PAPEL_LBL[sp.value].toLowerCase()+".",true);});
      var be=tr.querySelector('[data-eq-email]');if(be)be.addEventListener('click',function(){var cel=tr.querySelector('.eq-email'),atual=cel.textContent;
        cel.innerHTML='<input type="email" value="'+esc(atual)+'" aria-label="E-mail novo" style="max-width:240px"> <button class="btn sm pri">Salvar</button> <button class="btn sm">Cancelar</button>';
        var inp=cel.querySelector('input'),bs=cel.querySelectorAll('button');inp.focus();
        bs[1].addEventListener('click',function(ev){ev.stopPropagation();carregarEquipe();});
        bs[0].addEventListener('click',async function(ev){ev.stopPropagation();bs[0].disabled=true;
          try{var x=await chamarServidor("equipe_email",{user_id:uid,email:inp.value});eqMsg("E-mail trocado para "+x.email+". Mande o link de acesso para a pessoa entrar.",true);carregarEquipe();}
          catch(e){bs[0].disabled=false;eqMsg(e.message);}});});
      var ba=tr.querySelector('[data-eq-acesso]');if(ba)ba.addEventListener('click',async function(){ba.disabled=true;
        try{var x=await chamarServidor("equipe_acesso",{user_id:uid});eqMsg("Link de acesso enviado para "+x.email+".",true);}catch(e){eqMsg(e.message);}ba.disabled=false;});
      var br=tr.querySelector('[data-eq-remover]');if(br)br.addEventListener('click',async function(){
        if(!confirm("Tirar "+nome.trim()+" da equipe? A pessoa perde o acesso ao painel; a conta dela continua existindo."))return;
        var d=await SB.c.from("membros").delete().eq("workspace_id",SB.ws).eq("user_id",uid).select("user_id");
        if(d.error||!(d.data||[]).length){eqMsg("Não consegui tirar da equipe"+(d.error?": "+d.error.message:"."));return;}
        eqMsg(nome.trim()+" saiu da equipe.",true);carregarEquipe();});
    });
    el.querySelectorAll('[data-eq-conv]').forEach(function(b){b.addEventListener('click',async function(){await SB.c.from("convites").delete().eq("workspace_id",SB.ws).eq("email",b.getAttribute('data-eq-conv'));carregarEquipe();})});
  }
  function wireEquipe(){
    if(!SB)return;
    carregarEquipe();
    var b=I("#eqConvidar");if(b)b.addEventListener('click',async function(){var e=(I("#eqEmail").value||"").trim().toLowerCase();
      if(!/^\S+@\S+\.\S+$/.test(e)){eqMsg("Digite um e-mail válido.");return;}
      b.disabled=true;
      try{var x=await chamarServidor("equipe_convidar",{email:e,papel:I("#eqPapel").value});I("#eqEmail").value="";
        eqMsg(x.novo?"Convite enviado para "+e+". A pessoa recebe um e-mail para criar a senha.":e+" já tinha conta e entrou na equipe como "+PAPEL_LBL[x.papel].toLowerCase()+".",true);carregarEquipe();}
      catch(er){eqMsg(er.message);}b.disabled=false;});
    var ns=I("#eqNomeSalvar");if(ns)ns.addEventListener('click',async function(){var nm=(I("#eqNome").value||"").trim();if(!nm){eqMsg("Digite o seu nome.");return;}
      var r=await SB.c.auth.updateUser({data:{nome:nm}});if(r.error){eqMsg("Não consegui salvar: "+r.error.message);return;}SB.nome=nm;renderAiBadge();eqMsg("Nome salvo.",true);carregarEquipe();});
    var ss=I("#eqSenhaSalvar");if(ss)ss.addEventListener('click',async function(){var v=I("#eqSenha").value||"";if(v.length<6){eqMsg("A senha precisa ter pelo menos 6 caracteres.");return;}
      var r=await SB.c.auth.updateUser({password:v});if(r.error){eqMsg("Não consegui trocar a senha: "+r.error.message);return;}I("#eqSenha").value="";eqMsg("Senha trocada.",true);});
    var w=I("#eqWs");if(w)w.addEventListener('change',function(){try{localStorage.setItem("cos_ws",w.value);}catch(e){}location.reload();});
    var s=I("#eqSair");if(s)s.addEventListener('click',function(){SB.c.auth.signOut();});
  }
