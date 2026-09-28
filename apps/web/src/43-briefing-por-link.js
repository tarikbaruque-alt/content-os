  // ---- Briefing por link ----
  // A equipe cria um link; o cliente abre no celular, responde sem login e as
  // respostas chegam aqui (tabela briefings, gravada pela Edge Function). Um
  // clique cria o cliente com ficha, rotina, referências e o DNA sugerido.
  var BF_RECEBIDOS=[],BF_LINKS=[];
  var MSG_LINK="Oi, [nome]! Tudo bem? Preparei um briefing rápido para montar a sua estratégia e o seu calendário de conteúdo. É só abrir o link, responder com calma e tocar em Concluir no final:\n\n[link]\n\nQuanto mais detalhes você colocar, mais personalizadas ficam a estratégia e as ideias. Qualquer dúvida, me chama!";
  function bfUrl(token){return location.origin+location.pathname+"?briefing="+token;}
  function bfMsg(tpl,nome,link){return msgConvite(tpl,nome).replace(/\[link\]/gi,link);}
  // Página pública: a mesma do painel, aberta com ?briefing=<token>. Troca tudo pelo formulário.
  function briefingPublicoNaUrl(){
    var token=null;try{token=new URLSearchParams(location.search).get("briefing");}catch(e){}
    if(!token)return false;
    var cfg=window.COS_CONFIG;
    function escrever(html){document.open();document.write(html);document.close();}
    if(!cfg||!/^[0-9a-f]{32}$/.test(token)){escrever(bfPaginaAviso("Link de briefing inválido","Confira o link que você recebeu ou peça um novo para quem enviou."));return true;}
    var url=cfg.url.replace(/\/$/,"")+"/functions/v1/agentes";
    fetch(url,{method:"POST",headers:{"Content-Type":"application/json",apikey:cfg.anonKey,Authorization:"Bearer "+cfg.anonKey},body:JSON.stringify({op:"briefing_ver",token:token})})
      .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error((j&&j.error&&j.error.message)||"Link indisponível.");return j;})})
      .then(function(j){escrever(buildBriefingFormHtml({cliente:j.cliente||"",nome:j.agencia||"",envio:{url:url,anon:cfg.anonKey,token:token}}));})
      .catch(function(e){escrever(bfPaginaAviso("Não foi possível abrir o briefing",e.message));});
    return true;
  }
  function bfPaginaAviso(t,m){return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Briefing de conteúdo</title></head><body style="margin:0;font:16px/1.5 system-ui,sans-serif;background:#F9F9FD;color:#2A2A2A"><main style="max-width:520px;margin:0 auto;padding:80px 20px;text-align:center"><h1 style="font-size:22px">'+esc(t)+'</h1><p style="color:#57595B">'+esc(m)+'</p></main></body></html>';}

  async function bfCarregar(){
    if(!SB)return;
    var r=await SB.c.from("briefings").select("id,respostas,status,client_id,recebido_em").eq("status","novo").order("recebido_em",{ascending:false}).limit(50);
    BF_RECEBIDOS=r.data||[];
    var l=await SB.c.from("briefing_links").select("token,cliente_nome,ativo,created_at").eq("ativo",true).order("created_at",{ascending:false}).limit(10);
    BF_LINKS=l.data||[];
  }
  function bfDataCurta(iso){var d=new Date(iso);return ("0"+d.getDate()).slice(-2)+"/"+("0"+(d.getMonth()+1)).slice(-2)+" às "+("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2);}
  async function renderBriefingLink(){
    var el=I("#bfLink");if(!el)return;
    if(!SB||state.clientView){el.innerHTML="";return;}
    try{await bfCarregar();}catch(e){}
    var corpo=BF_RECEBIDOS.length?'<div class="tabela"><table><thead><tr><th>Empresa</th><th>Quem respondeu</th><th>Recebido</th><th></th></tr></thead><tbody>'+BF_RECEBIDOS.map(function(b){var r=b.respostas||{};
        return '<tr class="sem-clique"><td><b class="cel-t">'+esc(r.name||"Sem nome")+'</b><small>'+esc(r.niche||"")+'</small></td><td>'+esc(r.responsavel||"")+(r.whats?'<small>'+esc(r.whats)+'</small>':'')+'</td><td class="nowrap">'+esc(bfDataCurta(b.recebido_em))+'</td>'+
          '<td class="acao nowrap"><button class="btn ghost" data-bf-ver="'+b.id+'">Ver respostas</button><button class="btn ghost" data-bf-arq="'+b.id+'">Arquivar</button><button class="btn pri" data-bf-criar="'+b.id+'">Criar cliente</button></td></tr>';}).join('')+'</tbody></table></div>'
      :'<p class="pp-m" style="margin:0">Nenhum briefing esperando. Quando um cliente responder, ele aparece aqui para você criar o cliente com um clique.</p>';
    var links=BF_LINKS.length?'<details class="dobra-l"><summary>Links ativos ('+BF_LINKS.length+')</summary>'+BF_LINKS.map(function(l){return '<div class="linha"><div class="l-main"><b>'+esc(l.cliente_nome||"Sem nome")+'</b><small>criado em '+esc(bfDataCurta(l.created_at))+'</small></div><button class="btn ghost" data-bf-copiar="'+l.token+'">Copiar link</button><button class="btn ghost" data-bf-off="'+l.token+'">Desativar</button></div>'}).join('')+'</details>':'';
    el.innerHTML=quadro("Briefing do cliente"+(BF_RECEBIDOS.length?' <span class="chip prog">'+BF_RECEBIDOS.length+' novo'+(BF_RECEBIDOS.length>1?'s':'')+'</span>':''),"Mande o link: o cliente responde no celular, sem login, e as respostas chegam aqui.",'<button class="btn pri" id="bfNovoLink">Criar link de briefing</button>',corpo+links);
    I("#bfNovoLink").addEventListener('click',function(){abrirNovoLink()});
    el.querySelectorAll('[data-bf-ver]').forEach(function(b){b.addEventListener('click',function(){bfVer(b.getAttribute('data-bf-ver'))})});
    el.querySelectorAll('[data-bf-criar]').forEach(function(b){b.addEventListener('click',function(){bfCriar(b.getAttribute('data-bf-criar'),b)})});
    el.querySelectorAll('[data-bf-arq]').forEach(function(b){b.addEventListener('click',async function(){b.disabled=true;await SB.c.from("briefings").update({status:"arquivado"}).eq("id",b.getAttribute('data-bf-arq'));toast("Briefing arquivado.");renderBriefingLink();renderBriefingAviso();})});
    el.querySelectorAll('[data-bf-copiar]').forEach(function(b){b.addEventListener('click',function(){copiarTexto(bfUrl(b.getAttribute('data-bf-copiar')),"Link copiado.")})});
    el.querySelectorAll('[data-bf-off]').forEach(function(b){b.addEventListener('click',async function(){b.disabled=true;await SB.c.from("briefing_links").update({ativo:false}).eq("token",b.getAttribute('data-bf-off'));toast("Link desativado. Quem tiver o link não consegue mais responder.");renderBriefingLink();})});
  }
  function copiarTexto(t,aviso){
    function ok(){toast(aviso||"Copiado.");}
    function velho(){var ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand("copy")}catch(e){}document.body.removeChild(ta);ok();}
    if(navigator.clipboard)navigator.clipboard.writeText(t).then(ok,velho);else velho();
  }
  function abrirNovoLink(){
    var c=formCfg();
    I("#overlay").innerHTML='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" aria-label="Link de briefing" style="width:min(480px,100%)"><div class="dh"><div style="flex:1;min-width:0"><div class="d-title">Link de briefing</div><div class="d-sub">O cliente responde no celular, sem login.</div></div><button class="icon-btn" id="dclose" aria-label="Fechar">'+iconeUI("x-fechar")+'</button></div><div class="db"><div class="block">'+
      '<div class="fld"><label for="blCliente">Nome do cliente (aparece no formulário)</label><input id="blCliente" placeholder="Ex.: Ana"></div>'+
      '<div class="fld"><label for="blAgencia">Seu nome ou agência</label><input id="blAgencia" value="'+esc(c.nome||"")+'" placeholder="Ex.: Tarik Estratégia de Conteúdo"></div>'+
      '<div class="fld"><label for="blTpl">Mensagem para mandar junto ([nome] e [link] são trocados sozinhos)</label><textarea class="ta" id="blTpl" style="min-height:150px">'+esc(c.msgLink||MSG_LINK)+'</textarea></div>'+
      '<div class="q-rodape"><button class="btn pri" id="blCriar">Criar link</button><span id="blMsg" class="pp-m"></span></div>'+
      '<div id="blPronto" hidden><div class="fld" style="margin-top:16px"><label for="blUrl">Link</label><input id="blUrl" readonly></div><div class="fld"><label>Mensagem</label><div class="copybox" id="blPrev"></div></div>'+
      '<div class="q-rodape"><button class="btn pri" id="blCopiarMsg">Copiar mensagem com o link</button><button class="btn" id="blCopiarUrl">Copiar só o link</button><a class="btn" id="blWa" target="_blank" rel="noopener">Abrir no WhatsApp</a></div></div>'+
      '</div></div></aside>';
    I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);document.addEventListener('keydown',escClose);
    I("#blCriar").addEventListener('click',async function(){
      var bt=this,m=I("#blMsg"),nome=I("#blCliente").value.trim(),ag=I("#blAgencia").value.trim(),tpl=I("#blTpl").value;
      saveFormCfg(Object.assign({},formCfg(),{nome:ag,msgLink:tpl}));
      bt.disabled=true;m.textContent="Criando";
      var r=await SB.c.from("briefing_links").insert({workspace_id:SB.ws,cliente_nome:nome,agencia:ag,criado_por:SB.user.id}).select("token").single();
      if(r.error){bt.disabled=false;m.textContent="Não consegui criar o link: "+r.error.message;m.style.color="var(--warn)";return;}
      var link=bfUrl(r.data.token),msg=bfMsg(tpl,nome,link);
      m.textContent="";bt.hidden=true;I("#blPronto").hidden=false;I("#blUrl").value=link;I("#blPrev").textContent=msg;
      I("#blWa").href="https://wa.me/?text="+encodeURIComponent(msg);
      I("#blCopiarMsg").addEventListener('click',function(){copiarTexto(msg,"Mensagem copiada. Cole na conversa com o cliente.")});
      I("#blCopiarUrl").addEventListener('click',function(){copiarTexto(link,"Link copiado.")});
      renderBriefingLink();
    });
  }
  function bfVer(id){
    var b=BF_RECEBIDOS.filter(function(x){return x.id===id})[0];if(!b)return;var r=b.respostas||{};
    var linhas=BRIEF_FIELDS.filter(function(f){return r[f.k]}).map(function(f){return (f.g?'<div class="bt" style="margin-top:16px">'+esc(f.g)+'</div>':'')+'<div class="fld"><label>'+esc(f.l)+'</label><div class="copybox">'+esc(r[f.k])+'</div></div>'}).join('');
    I("#overlay").innerHTML='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" aria-label="Briefing recebido"><div class="dh"><div style="flex:1;min-width:0"><div class="d-title">'+esc(r.name||"Briefing")+'</div><div class="d-sub">Recebido em '+esc(bfDataCurta(b.recebido_em))+'</div></div><button class="icon-btn" id="dclose" aria-label="Fechar">'+iconeUI("x-fechar")+'</button></div>'+
      '<div class="db"><div class="block">'+linhas+'</div></div><div class="df"><button class="btn" id="bvFechar">Fechar</button><button class="btn pri" id="bvCriar">Criar cliente</button></div></aside>';
    I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);I("#bvFechar").addEventListener('click',closeDrawer);document.addEventListener('keydown',escClose);
    I("#bvCriar").addEventListener('click',function(){closeDrawer();bfCriar(id);});
  }
  async function bfCriar(id,bt){
    var b=BF_RECEBIDOS.filter(function(x){return x.id===id})[0];if(!b)return;
    if(bt){bt.disabled=true;bt.textContent="Criando";}
    try{
      var r=await importarBriefing(b.respostas||{});
      await SB.c.from("briefings").update({status:"importado",client_id:r.id}).eq("id",id);
      toast((r.atualizado?"Ficha atualizada":"Cliente criado")+": "+clientName(r.id)+". A Íris já leu o briefing.");
      renderBriefingAviso();setClient(r.id);go("dna");
    }catch(e){if(bt){bt.disabled=false;bt.textContent="Criar cliente";}toast("Não consegui criar o cliente: "+e.message);}
  }
  // ---- Links públicos: aprovação do cliente (vitrine) e agenda assinada ----
  // Um link ativo por cliente e tipo: abrir de novo mostra o mesmo; "gerar outro" desativa o antigo.
  async function linkPublicoAtivo(tipo,cli,novo){
    var q=SB.c.from("links_publicos").select("token,created_at").eq("workspace_id",SB.ws).eq("tipo",tipo).eq("ativo",true);
    q=cli?q.eq("client_id",cli):q.is("client_id",null);
    var r=await q.order("created_at",{ascending:false}).limit(1),atual=r.data&&r.data[0]&&r.data[0].token;
    if(atual&&!novo)return atual;
    if(atual){var off=SB.c.from("links_publicos").update({ativo:false}).eq("workspace_id",SB.ws).eq("tipo",tipo);await (cli?off.eq("client_id",cli):off.is("client_id",null));}
    var n=await SB.c.from("links_publicos").insert({workspace_id:SB.ws,tipo:tipo,client_id:cli||null,criado_por:SB.user.id}).select("token").single();
    if(n.error)throw n.error;return n.data.token;
  }
  function urlVitrine(t){return location.origin+location.pathname+"?vitrine="+t;}
  function urlAgenda(t){return window.COS_CONFIG.url.replace(/\/$/,"")+"/functions/v1/agentes?agenda="+t;}
  async function abrirLinkPublico(tipo,cli,novo){
    var vit=tipo==="vitrine",nome=cli?clientName(cli):"todos os clientes";
    I("#overlay").innerHTML='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" aria-label="'+(vit?'Link de aprovação':'Assinar agenda')+'" style="width:min(520px,100%)"><div class="dh"><div style="flex:1;min-width:0"><div class="d-title">'+(vit?'Link de aprovação':'Assinar agenda')+'</div><div class="d-sub">'+esc(nome)+'</div></div><button class="icon-btn" id="dclose" aria-label="Fechar">'+iconeUI("x-fechar")+'</button></div><div class="db"><div class="block" id="lpCorpo"><p class="pp-m"><span class="spinner"></span> Preparando o link</p></div></div></aside>';
    I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);document.addEventListener('keydown',escClose);
    var corpo=I("#lpCorpo"),token;
    try{token=await linkPublicoAtivo(tipo,cli,novo);}catch(e){corpo.innerHTML='<p class="pp-m" style="color:var(--warn)">Não consegui criar o link: '+esc(e.message||e)+'</p>';return;}
    var url=vit?urlVitrine(token):urlAgenda(token),h;
    if(vit){
      var c=DB_CLIENTS[cli]||{},a=typeof adminOf==="function"?adminOf(c):{},quem=(a.contato||c.name||"").split(" ")[0];
      var msg="Oi"+(quem?", "+quem:"")+"! O seu calendário de conteúdo está aqui. Abra, veja cada pauta com o texto e o roteiro, e toque em Aprovar ou em Pedir ajuste:\n\n"+url;
      var wa=typeof waLink==="function"?waLink(a.whats,msg):"";
      h='<p class="pp-m" style="margin-top:0">O cliente abre no celular, sem login. Cada aprovação ou pedido de ajuste cai direto na peça, e o link mostra sempre o calendário de hoje.</p>'+
        '<div class="fld"><label for="lpUrl">Link</label><input id="lpUrl" readonly value="'+esc(url)+'"></div>'+
        '<div class="fld"><label>Mensagem</label><div class="copybox" id="lpMsg"></div></div>'+
        '<div class="q-rodape"><button class="btn pri" id="lpCopiarMsg">Copiar mensagem com o link</button><button class="btn" id="lpCopiar">Copiar só o link</button>'+(wa?'<a class="btn" href="'+esc(wa)+'" target="_blank" rel="noopener">Abrir no WhatsApp do cliente</a>':'')+'</div>';
    }else{
      var web=url.replace(/^https?:\/\//,"webcal://");
      h='<p class="pp-m" style="margin-top:0">Assine uma vez e a agenda atualiza sozinha: publicações no horário de cada peça e os dias de gravação com o que gravar. '+(cli?'':'Entram todos os clientes ativos.')+'</p>'+
        '<div class="fld"><label for="lpUrl">Link da agenda</label><input id="lpUrl" readonly value="'+esc(url)+'"></div>'+
        '<div class="q-rodape"><a class="btn pri" href="'+esc(web)+'">Abrir no calendário do celular</a><button class="btn" id="lpCopiar">Copiar o link</button></div>'+
        '<ul class="pp-m lp-como"><li><b>Google Agenda</b> no computador: Outras agendas, botão de mais, "Do URL", cole o link. O Google atualiza algumas vezes por dia.</li><li><b>iPhone</b>: Ajustes, Calendário, Contas, Adicionar conta, Outra, Adicionar calendário assinado, cole o link.</li></ul>';
    }
    h+='<div class="q-rodape" style="margin-top:14px"><button class="lnk" id="lpNovo">Desativar este link e gerar outro</button></div>';
    corpo.innerHTML=h;
    if(vit)I("#lpMsg").textContent=msg;
    var cm=I("#lpCopiarMsg");if(cm)cm.addEventListener('click',function(){copiarTexto(msg,"Mensagem copiada. Cole na conversa com o cliente.")});
    I("#lpCopiar").addEventListener('click',function(){copiarTexto(url,"Link copiado.")});
    I("#lpNovo").addEventListener('click',function(){if(confirm("Desativar este link? Quem tiver o link antigo não consegue mais abrir."))abrirLinkPublico(tipo,cli,true);});
  }
  // Aviso na tela Hoje quando chega briefing novo.
  async function renderBriefingAviso(){
    var el=I("#ovBriefings");if(!el)return;
    if(!SB||state.clientView){el.innerHTML="";return;}
    try{await bfCarregar();}catch(e){el.innerHTML="";return;}
    var n=BF_RECEBIDOS.length;
    el.innerHTML=n?'<div class="aviso-l"><div class="l-main"><b>'+(n>1?n+' briefings novos':'Briefing novo')+'</b><small>'+esc(BF_RECEBIDOS.slice(0,3).map(function(b){return (b.respostas||{}).name||"Sem nome"}).join(", "))+(n>1?' responderam':' respondeu')+'. Um clique cria o cliente.</small></div><button class="btn pri" data-bf-ir>Ver briefings</button></div>':'';
    var ir=el.querySelector('[data-bf-ir]');if(ir)ir.addEventListener('click',function(){go("clients");});
  }
