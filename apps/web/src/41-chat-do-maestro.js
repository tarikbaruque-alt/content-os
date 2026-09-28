  // ---- Chat do Maestro (tela Hoje) ----
  // A pessoa escreve o pedido; o Maestro lê o estado real dos clientes no
  // servidor e aciona os agentes certos. A conversa fica guardada só neste
  // navegador (conveniência); o que os agentes fazem fica no servidor.
  var MC_CHAVE="cos_maestro_chat",MC_SUGESTOES=["Planeja o próximo mês do cliente aberto","Como está cada cliente?","Escreve as peças da próxima semana"];
  function mcLer(){try{var v=JSON.parse(localStorage.getItem(MC_CHAVE+":"+(SB&&SB.ws||""))||"[]");return Array.isArray(v)?v:[];}catch(e){return [];}}
  function mcGravar(h){try{localStorage.setItem(MC_CHAVE+":"+(SB&&SB.ws||""),JSON.stringify(h.slice(-30)));}catch(e){}}
  function mcBalao(m){
    var acoes=(m.acoes||[]).map(function(a){return '<span class="chip">'+esc((AG_INFO[a.agente]||[a.agente])[0])+' para '+esc(clientName(a.cliente))+'</span>'}).join('');
    return '<div class="mc-msg '+(m.de==="voce"?"voce":"maestro")+(m.erro?" erro":"")+'"><div class="mc-quem">'+(m.de==="voce"?"Você":"Maestro")+'</div><div class="mc-texto">'+esc(m.texto)+'</div>'+
      (acoes?'<div class="mc-acoes"><small>Agentes acionados</small>'+acoes+'</div>':'')+'</div>';
  }
  function renderMaestroChat(){
    var el=I("#maestroChat");if(!el)return;
    if(!SB){el.innerHTML=quadro("Maestro","Escreva o que você precisa e ele chama os agentes certos. O chat funciona no painel publicado, com o login da equipe.",'','');return;}
    var h=mcLer();
    el.innerHTML=quadro("Maestro","Escreva o que você precisa. Ele olha o cliente e chama os agentes certos; o que eles entregarem aparece em Propostas e Aprovações.",
      h.length?'<button class="btn ghost" id="mcLimpar">Limpar conversa</button>':'',
      '<div class="mc-lista" id="mcLista">'+(h.length?h.map(mcBalao).join(''):'<div class="mc-sugestoes">'+MC_SUGESTOES.map(function(s){return '<button class="btn" data-mc-sug="'+esc(s)+'">'+esc(s)+'</button>'}).join('')+'</div>')+'</div>'+
      '<form class="mc-form" id="mcForm"><label for="mcTexto" class="sr">Mensagem para o Maestro</label><textarea id="mcTexto" class="ta" rows="2" placeholder="Ex.: planeja outubro da '+esc(state.client&&isDbClient(state.client)?clientName(state.client):"Academia")+'"></textarea><button class="btn pri" id="mcEnviar" type="submit">Enviar</button></form>');
    var lista=I("#mcLista");lista.scrollTop=lista.scrollHeight;
    var ta=I("#mcTexto");
    ta.addEventListener('keydown',function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();I("#mcForm").requestSubmit();}});
    I("#mcForm").addEventListener('submit',function(e){e.preventDefault();mcEnviar(ta.value);});
    el.querySelectorAll('[data-mc-sug]').forEach(function(b){b.addEventListener('click',function(){mcEnviar(b.getAttribute('data-mc-sug'));});});
    var lp=I("#mcLimpar");if(lp)lp.addEventListener('click',function(){mcGravar([]);renderMaestroChat();});
  }
  var mcOcupado=false;
  async function mcEnviar(texto){
    texto=String(texto||"").trim();if(!texto||mcOcupado)return;
    mcOcupado=true;
    var h=mcLer(),historico=h.filter(function(m){return !m.erro}).map(function(m){return {de:m.de,texto:m.texto}});
    h.push({de:"voce",texto:texto});mcGravar(h);renderMaestroChat();
    var lista=I("#mcLista"),bt=I("#mcEnviar");
    lista.insertAdjacentHTML('beforeend','<div class="mc-msg maestro pensando"><div class="mc-quem">Maestro</div><div class="mc-texto">Olhando os clientes</div></div>');
    lista.scrollTop=lista.scrollHeight;bt.disabled=true;
    try{
      var r=await chamarServidor("conversar",{mensagem:texto,historico:historico,cliente:state.client&&isDbClient(state.client)?state.client:null});
      h.push({de:"maestro",texto:r.resposta||"Pronto.",acoes:r.acoes||[]});
    }catch(e){
      h.push({de:"maestro",erro:true,texto:e.code==="sem_chave"?"A chave da Anthropic ainda não foi configurada no servidor.":e.code==="rate_limited"?e.message:"Não consegui responder agora: "+e.message});
    }
    mcOcupado=false;mcGravar(h);renderMaestroChat();
    var fim=h[h.length-1];
    if(fim.acoes&&fim.acoes.length&&typeof renderAgentesServidor==="function"&&state.view==="agents")renderAgentesServidor();
  }
