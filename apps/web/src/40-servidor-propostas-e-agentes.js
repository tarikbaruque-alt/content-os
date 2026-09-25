  // ===================================================================
  // MODO SERVIDOR (Supabase) — liga quando o painel é publicado com
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
        '<div class="login-alt"><button class="lnk" type="button" id="lgCriar">Criar conta</button><button class="lnk" type="button" id="lgEsqueci">Esqueci a senha</button></div>'+
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
      I("#lgCriar").addEventListener("click",async function(){var d=dados();if(!d.email||d.password.length<6){msg("Digite o e-mail e uma senha com 6 caracteres ou mais, e clique em Criar conta.");return;}
        var r=await c.auth.signUp({email:d.email,password:d.password,options:{emailRedirectTo:location.origin}});
        if(r.error){msg(traduz(r.error));return;}
        if(r.data.session){el.remove();resolve(r.data.user);return;}
        msg("Conta criada. Confirme pelo link que enviamos para "+d.email+" e depois entre.",true);});
      I("#lgEsqueci").addEventListener("click",async function(){var d=dados();if(!d.email){msg("Digite seu e-mail e clique em Esqueci a senha.");return;}
        var r=await c.auth.resetPasswordForEmail(d.email,{redirectTo:location.origin});
        msg(r.error?traduz(r.error):"Enviamos um link para "+d.email+" criar uma senha nova.",!r.error);});
      setTimeout(function(){var e=I("#lgEmail");if(e)e.focus();},50);
    });
  }

  function telaNovaSenha(c){
    return new Promise(function(resolve){
      var el=document.createElement("div");el.className="login";
      el.innerHTML='<form class="login-box" id="nsForm" novalidate><div class="login-marca"><span class="brand-mark">C</span><div><b>Senha nova</b><span>Escolha a senha que vai usar daqui pra frente</span></div></div>'+
        '<div class="fld"><label for="nsSenha">Senha nova</label><input id="nsSenha" type="password" autocomplete="new-password" minlength="6" required></div>'+
        '<button class="btn pri login-ok" type="submit">Salvar e entrar</button><div class="login-msg" id="nsMsg" role="status"></div></form>';
      document.body.appendChild(el);
      I("#nsForm").addEventListener("submit",async function(ev){ev.preventDefault();var v=I("#nsSenha").value;
        if(v.length<6){I("#nsMsg").textContent="A senha precisa ter pelo menos 6 caracteres.";return;}
        var r=await c.auth.updateUser({password:v});
        if(r.error){I("#nsMsg").textContent="Não deu certo: "+r.error.message;return;}
        history.replaceState(null,"",location.pathname);el.remove();resolve();});
    });
  }

  async function iniciarServidor(){
    var cfg=window.COS_CONFIG,c=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true}});
    var s=(await c.auth.getSession()).data.session,user=s&&s.user;
    // Voltou pelo link de "esqueci a senha": já tem sessão; pede a senha nova antes de seguir.
    if(user&&/type=recovery/.test(location.hash))await telaNovaSenha(c);
    if(!user)user=await telaLogin(c);
    await c.rpc("aceitar_convites");
    var m=await c.from("membros").select("workspace_id,papel").eq("user_id",user.id).limit(1);
    var ws=m.data&&m.data[0]&&m.data[0].workspace_id,papel=m.data&&m.data[0]&&m.data[0].papel;
    if(!ws){var r=await c.rpc("criar_workspace",{nome:"Content OS"});if(r.error)throw r.error;ws=r.data;papel="dono";}
    SB={c:c,ws:ws,user:user,papel:papel};
    c.auth.onAuthStateChange(function(ev){if(ev==="SIGNED_OUT")location.reload();});
    return SB;
  }

  // Mesma interface do db do Artifact (doc/collection, get/set/update/delete), sobre a tabela docs.
  function sbDb(){
    var c=SB.c,ws=SB.ws;
    function snap(path,row){return {id:path.split('/').pop(),exists:!!row,data:function(){return row?row.data:undefined}};}
    function falha(r){if(r.error)throw r.error;return r;}
    function doc(path){return {id:path.split('/').pop(),
      get:async function(){var r=falha(await c.from("docs").select("data").eq("workspace_id",ws).eq("path",path).maybeSingle());return snap(path,r.data);},
      set:async function(v){falha(await c.from("docs").upsert({workspace_id:ws,path:path,data:JSON.parse(JSON.stringify(v))},{onConflict:"workspace_id,path"}));},
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
  var AG_INFO={radar:["Radar","Pesquisa"],iris:["Íris","Content DNA"],atlas:["Átlas","Estratégia"],bussola:["Bússola","Linha editorial"],musa:["Musa","Ideias"],cronos:["Cronos","Calendário"],estudio:["Estúdio","Peças"],pulso:["Pulso","Performance"],painel:["Painel","Botões Gerar"],acervo:["Acervo","Knowledge Base"]};
  var TIPO_LBL={pesquisa:"Pesquisa",estrategia:"Estratégia",editorial:"Linha editorial",ideias:"Ideias",aviso:"Aviso"};
  var PROPOSTAS=[];
  async function carregarPropostas(){
    if(!SB)return [];
    var r=await SB.c.from("proposals").select("*").order("created_at",{ascending:false}).limit(60);
    PROPOSTAS=r.data||[];atualizarContadorPropostas();return PROPOSTAS;
  }
  function atualizarContadorPropostas(){
    var n=PROPOSTAS.filter(function(p){return p.status==="pendente"}).length,a=I('#nav a[data-view="propostas"] span');
    if(a)a.innerHTML='Propostas'+(n?' <b class="nav-n">'+n+'</b>':'');
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
    Array.prototype.forEach.call(el.querySelectorAll('[data-prop]'),function(card){
      var p=PROPOSTAS.filter(function(x){return x.id===card.getAttribute('data-prop')})[0],msg=card.querySelector('.prop-msg');
      var fim=async function(aprovar){await chamarServidor("decidir",{id:p.id,aprovar:aprovar});renderPropostas();};
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
  // Aprovar = gravar com a MESMA rotina do botão "Gerar" daquela tela.
  async function aplicarProposta(p){
    var id=p.client_id,d=p.payload||{};
    if(!isDbClient(id))throw new Error("cliente não encontrado");
    var g=await loadDbClientState(id);
    if(state.client!==id){var v=state.view;setClient(id);state.view=v;}
    GENERATED=g;
    if(p.tipo==="estrategia")await salvarEstrategia(id,d);
    else if(p.tipo==="pesquisa")await salvarPesquisa(id,d);
    else if(p.tipo==="editorial")await salvarEditorial(id,d);
    else if(p.tipo==="ideias")await salvarIdeias(id,d,d.append!==false);
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
  async function renderAgentesServidor(){
    var el=I("#agentGrid");if(!el||!SB)return false;
    var id=state.client,temCli=isDbClient(id),op=temCli?opDo(id):OP_PADRAO;
    var est={};try{est=await chamarServidor("estado");}catch(e){est={erro:e.message};}
    var runs=((await SB.c.from("agent_runs").select("id,agente,client_id,gatilho,status,custo_usd,erro,started_at,passos").order("started_at",{ascending:false}).limit(40)).data)||[];
    var ultima={};runs.forEach(function(r){if(r.client_id===id&&!ultima[r.agente])ultima[r.agente]=r;});
    var gasto=Number(est.gasto||0),teto=Number(est.orcamento||0);
    var h='<div class="card pad ag-estado"><div><div class="eyebrow">Servidor dos agentes</div><div class="ag-num">'+(est.chave?'<span class="badge act">● ligado</span>':'<span class="badge">○ sem chave da IA</span>')+' <span class="pp-m">modelo '+esc(est.modelo||"")+'</span></div></div>'+
      '<div><div class="eyebrow">Gasto do mês</div><div class="ag-num tnum">US$ '+gasto.toFixed(2)+' <span class="pp-m">de '+teto.toFixed(0)+'</span></div><div class="ag-barra"><i style="width:'+(teto?Math.min(100,gasto/teto*100):0)+'%"></i></div></div></div>';
    if(temCli){
      h+='<div class="card pad"><div class="eyebrow" style="margin-bottom:12px">Operação de '+esc(clientName(id))+'</div><div class="grid cols-3 op-grid">'+
        '<div class="fld"><label for="opDia">Dia de planejar o próximo mês</label><select id="opDia">'+Array.from({length:28},function(_,i){return '<option'+(op.diaPlanejamento===i+1?' selected':'')+'>'+(i+1)+'</option>'}).join('')+'</select></div>'+
        '<div class="fld"><label for="opAprova">O cliente aprova</label><select id="opAprova">'+[["calendario_e_pecas","o calendário e as peças"],["calendario","só o calendário"],["nada","nada (vocês aprovam)"]].map(function(o){return '<option value="'+o[0]+'"'+(op.clienteAprova===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select></div>'+
        '<div class="fld"><label for="opPrazo">Prazo do cliente (dias)</label><input id="opPrazo" type="number" min="1" max="15" value="'+esc(op.prazoCliente)+'"></div>'+
        '<div class="fld"><label for="opSem">Se passar do prazo</label><select id="opSem"><option value="nao"'+(op.semRespostaPublica?'':' selected')+'>espera a resposta</option><option value="sim"'+(op.semRespostaPublica?' selected':'')+'>publica como está</option></select></div>'+
        '<div class="fld"><label for="opPauta">Pauta quente do Radar</label><select id="opPauta"><option value="sugestao"'+(op.pautaQuente==="sugestao"?' selected':'')+'>só sugestão para o próximo mês</option><option value="troca"'+(op.pautaQuente==="troca"?' selected':'')+'>pode virar gancho de peça da semana</option></select></div>'+
        '<div class="fld"><label>&nbsp;</label><span id="opMsg" class="pp-m"></span></div></div></div>';
    }
    h+='<div class="ag-lista">'+AG_ORDEM.map(function(k){var inf=AG_INFO[k],modo=(op.agentes||{})[k]==="manual"?"manual":"auto",u=ultima[k],st=u?ST_RUN[u.status]||["",u.status]:null;
      return '<div class="card pad ag-card"><div class="ag-top"><b>'+esc(inf[0])+'</b><span class="pp-m">'+esc(inf[1])+'</span>'+
        (temCli?'<div class="seg" role="group" aria-label="Modo do '+esc(inf[0])+'"><button class="'+(modo==="auto"?"on":"")+'" data-modo="auto" data-ag="'+k+'">Automático</button><button class="'+(modo==="manual"?"on":"")+'" data-modo="manual" data-ag="'+k+'">Manual</button></div>':'')+'</div>'+
        '<div class="pp-m">Roda sozinho: '+esc(AG_QUANDO[k])+'</div>'+
        '<div class="ag-ult">'+(u?'<span class="badge '+st[0]+'">'+esc(st[1])+'</span> '+esc(quandoTs(u.started_at))+(u.erro?' · '+esc(u.erro):''):'<span class="pp-m">ainda não rodou para este cliente</span>')+'</div>'+
        (temCli?'<button class="btn" data-rodar="'+k+'">Rodar agora</button>':'')+'<span class="ag-msg pp-m" data-agmsg="'+k+'"></span></div>';}).join('')+'</div>';
    h+='<div class="eyebrow" style="margin:26px 0 10px">Execuções recentes (todos os clientes)</div><div class="card tbl-wrap"><table class="runs"><thead><tr><th>Quando</th><th>Agente</th><th>Cliente</th><th>Gatilho</th><th>Resultado</th><th class="num">Custo</th></tr></thead><tbody>'+
      (runs.length?runs.map(function(r){var st=ST_RUN[r.status]||["",r.status];return '<tr><td>'+esc(quandoTs(r.started_at))+'</td><td>'+esc((AG_INFO[r.agente]||[r.agente])[0])+'</td><td>'+esc(r.client_id?clientName(r.client_id):"—")+'</td><td>'+esc(r.gatilho)+'</td><td><span class="badge '+st[0]+'">'+esc(st[1])+'</span>'+(r.erro?' <span class="pp-m">'+esc(r.erro)+'</span>':'')+'</td><td class="num tnum">'+(Number(r.custo_usd)?'US$ '+Number(r.custo_usd).toFixed(2):'')+'</td></tr>'}).join(''):'<tr><td colspan="6" class="pp-m">Nenhuma execução ainda.</td></tr>')+'</tbody></table></div>';
    el.className="";el.innerHTML=h;
    var om=function(t,bom){var m=I("#opMsg");if(m){m.textContent=t;m.style.color=bom?"var(--good)":"var(--warn)";}};
    var salvaCampo=function(sel,fn){var x=I(sel);if(x)x.addEventListener('change',function(){salvarOp(id,fn(x.value)).then(function(){om("✓ Salvo",true)},function(){om("Não consegui salvar")});});};
    salvaCampo("#opDia",function(v){return {diaPlanejamento:+v}});
    salvaCampo("#opAprova",function(v){return {clienteAprova:v}});
    salvaCampo("#opPrazo",function(v){return {prazoCliente:Math.max(1,+v||2)}});
    salvaCampo("#opSem",function(v){return {semRespostaPublica:v==="sim"}});
    salvaCampo("#opPauta",function(v){return {pautaQuente:v}});
    Array.prototype.forEach.call(el.querySelectorAll('[data-modo]'),function(b){b.addEventListener('click',function(){
      var ags=Object.assign({},opDo(id).agentes);ags[b.getAttribute('data-ag')]=b.getAttribute('data-modo');
      salvarOp(id,{agentes:ags}).then(renderAgentesServidor);});});
    Array.prototype.forEach.call(el.querySelectorAll('[data-rodar]'),function(b){b.addEventListener('click',async function(){
      var k=b.getAttribute('data-rodar'),m=el.querySelector('[data-agmsg="'+k+'"]');b.disabled=true;setBusy(m,"Pedindo…");
      try{await chamarServidor("rodar",{cliente:id,agente:k});clearBusy(m);m.textContent="Rodando no servidor. O resultado chega em Propostas.";}
      catch(e){clearBusy(m);m.textContent=e.code==="sem_chave"?"Falta a chave da IA no servidor.":(e.message||"Não consegui pedir.");b.disabled=false;}});});
    return true;
  }

  // ---------------------------------------------------------------- Equipe
  function equipeHtml(){
    if(!SB)return '';
    return '<div class="card pad" style="margin-bottom:14px"><div class="eyebrow" style="margin-bottom:8px">Equipe</div>'+
      '<div style="font-size:12.5px;color:var(--muted);margin-bottom:12px">Você entrou como <b>'+esc(SB.user.email||"")+'</b>'+(SB.papel==="dono"?' (dono)':'')+'. Convide quem trabalha com você: a pessoa cria a conta com o mesmo e-mail e entra direto na equipe.</div>'+
      (SB.papel==="dono"?'<div style="display:flex;gap:8px;flex-wrap:wrap"><input id="eqEmail" type="email" placeholder="email@exemplo.com" class="inp"><button class="btn pri" id="eqConvidar">Convidar</button></div>':'')+
      '<div id="eqMsg" class="pp-m" style="margin-top:8px"></div><div style="margin-top:12px"><button class="btn" id="eqSair">Sair</button></div></div>';
  }
  function wireEquipe(){
    var b=I("#eqConvidar");if(b)b.addEventListener('click',async function(){var e=(I("#eqEmail").value||"").trim().toLowerCase(),m=I("#eqMsg");
      if(!/^\S+@\S+\.\S+$/.test(e)){m.textContent="Digite um e-mail válido.";return;}
      var r=await SB.c.from("convites").upsert({workspace_id:SB.ws,email:e});m.textContent=r.error?"Não consegui convidar: "+r.error.message:"✓ Convite registrado. Mande o link do painel para "+e+" criar a conta.";});
    var s=I("#eqSair");if(s)s.addEventListener('click',function(){SB.c.auth.signOut();});
  }
