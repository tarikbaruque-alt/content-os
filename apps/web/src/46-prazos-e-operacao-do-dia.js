  // ---- Prazos, situação da peça e a operação do dia ----
  // Cada peça tem prazos contados de trás para frente a partir da publicação, com a
  // mesma regra do servidor (supabase/functions/_shared/prazos.ts): roteiro pronto,
  // revisão da equipe, aprovação do cliente, gravação/produção e publicação. A
  // situação diz o que falta agora e se já passou do prazo. O calendário geral, a
  // gaveta da peça e a tela Hoje leem daqui.
  var APROVADA_EQ={"APPROVED":1,"SCHEDULED":1,"PUBLISHED":1};
  var SIT={texto:["sem texto","Escrever o roteiro"],revisao:["revisar","Revisar e aprovar"],aprovacao:["cliente aprova","Esperar o cliente"],ajuste:["ajuste pedido","Ajustar o que o cliente pediu"],
    producao:["gravar","Gravar ou produzir"],pronta:["pronta","Publicar no horário"],publicar:["não publicada","Marcar como publicada"],publicada:["publicada","Publicada"]};
  function somaDias(iso,n){var d=parseD(iso);d.setDate(d.getDate()+n);return fmtD(d);}
  function semanaIso(iso){var d=parseD(iso);d.setDate(d.getDate()-((d.getDay()+6)%7));return fmtD(d);}
  function prazosDe(it,cid){
    if(!it||!isIsoDate(it.data))return null;
    var r=rotinaOf(cid),op=typeof opDo==="function"?opDo(cid):{},g=+r.gravDia;
    if(!(g>=0&&g<=6))g=1;
    var d=parseD(it.data);d.setDate(d.getDate()-1);
    for(var k=0;k<7&&d.getDay()!==g;k++)d.setDate(d.getDate()-1);
    var producao=fmtD(d),aprovacao=(op.clienteAprova||"calendario_e_pecas")==="calendario_e_pecas"?somaDias(producao,-1):null;
    var texto=aprovacao?somaDias(aprovacao,-Math.max(1,Math.round(+op.prazoCliente||2))):somaDias(producao,-1);
    return {texto:texto,aprovacao:aprovacao,producao:producao,publicacao:it.data};
  }
  function situacaoPeca(it,cid,hoje){
    hoje=hoje||fmtD(new Date());var p=prazosDe(it,cid);if(!p)return null;
    function s(etapa,prazo,txt){return {etapa:etapa,prazo:prazo,atraso:!!prazo&&prazo<hoje,curto:SIT[etapa][0],acao:SIT[etapa][1],txt:txt,p:p};}
    if(it.status==="PUBLISHED")return s("publicada",null,it.postUrl?"Publicada":"Publicada, falta o link do post");
    if(p.publicacao<hoje)return s("publicar",p.publicacao,"Passou do dia "+dataBR(p.publicacao)+": marque como publicada ou mude a data");
    if(!pecaPronta(it))return s("texto",p.texto,"Roteiro até "+dataBR(p.texto));
    if(it.clientStatus==="ajuste")return s("ajuste",p.aprovacao||p.producao,"Cliente pediu ajuste"+(it.clientNote?": "+it.clientNote:""));
    if(!APROVADA_EQ[it.status]&&it.clientStatus!=="aprovado")return s("revisao",p.texto,"Vocês revisam e aprovam até "+dataBR(p.texto));
    if(p.aprovacao&&it.clientStatus!=="aprovado")return s("aprovacao",p.aprovacao,"Cliente aprova até "+dataBR(p.aprovacao));
    if(p.producao>=hoje)return s("producao",p.producao,p.producao===hoje?"Gravar hoje":"Gravar em "+dataBR(p.producao));
    return s("pronta",p.publicacao,"Publicar "+dataBR(p.publicacao)+" às "+itemHora(it,rotinaOf(cid)));
  }
  function prazosTxt(it,cid){var p=prazosDe(it,cid);if(!p)return "";
    return "Roteiro até "+dataBR(p.texto)+(p.aprovacao?" · cliente aprova até "+dataBR(p.aprovacao):"")+" · gravação "+dataBR(p.producao)+" · publicação "+dataBR(p.publicacao);}

  // ---- Feriados nacionais e datas comerciais (o calendário mostra; mover para elas avisa) ----
  function pascoa(y){var a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
    return new Date(y,Math.floor((h+l-7*m+114)/31)-1,((h+l-7*m+114)%31)+1);}
  var DATAS_ANO={};
  function datasDoAno(y){
    if(DATAS_ANO[y])return DATAS_ANO[y];
    var out={},p=pascoa(y);
    function add(d,nome,tipo){var k=typeof d==="string"?y+"-"+d:fmtD(d);(out[k]=out[k]||[]).push({nome:nome,tipo:tipo});}
    function rel(n){var d=new Date(p.getTime());d.setDate(d.getDate()+n);return d;}
    function enesimo(mes,dia,n){var d=new Date(y,mes,1),c=0;while(d.getMonth()===mes){if(d.getDay()===dia&&++c===n)return d;d.setDate(d.getDate()+1);}return d;}
    [["01-01","Confraternização Universal"],["04-21","Tiradentes"],["05-01","Dia do Trabalho"],["09-07","Independência"],["10-12","Nossa Senhora Aparecida"],["11-02","Finados"],["11-15","Proclamação da República"],["11-20","Consciência Negra"],["12-25","Natal"]].forEach(function(f){add(f[0],f[1],"feriado");});
    add(rel(-2),"Sexta-feira Santa","feriado");add(rel(-48),"Carnaval","facultativo");add(rel(-47),"Carnaval","facultativo");add(rel(60),"Corpus Christi","facultativo");
    [["03-08","Dia Internacional da Mulher"],["03-15","Dia do Consumidor"],["06-12","Dia dos Namorados"],["09-15","Dia do Cliente"],["10-12","Dia das Crianças"]].forEach(function(f){add(f[0],f[1],"comercial");});
    add(enesimo(4,0,2),"Dia das Mães","comercial");add(enesimo(7,0,2),"Dia dos Pais","comercial");
    var bf=enesimo(10,4,4);bf.setDate(bf.getDate()+1);add(bf,"Black Friday","comercial");
    return DATAS_ANO[y]=out;
  }
  function datasDoDia(iso){return isIsoDate(iso)?(datasDoAno(+iso.slice(0,4))[iso]||[]):[];}
  function dataTipoTxt(x){return x.tipo==="feriado"?"feriado":x.tipo==="facultativo"?"ponto facultativo":"data comercial";}

  // ---- Mover uma peça de dia (arrastar no calendário ou mudar na gaveta): as regras ----
  function regrasMover(cid,it,nova){
    var hoje=fmtD(new Date()),r=rotinaOf(cid),dias=(r.diasPost&&r.diasPost.length?r.diasPost:DIAS_PADRAO[3]).map(Number),av=[];
    if(!isIsoDate(nova))return {bloqueio:"Data inválida."};
    if(nova<hoje&&it.status!=="PUBLISHED")return {bloqueio:"Não dá para marcar uma publicação no passado. Se já foi ao ar, marque como publicada."};
    var dw=parseD(nova).getDay();if(dias.indexOf(dw)<0)av.push(DIAS_SEM_LONGO[dw]+" não é dia de postar na rotina deste cliente");
    datasDoDia(nova).forEach(function(x){av.push(x.nome+" ("+dataTipoTxt(x)+")");});
    var cap=capOf(cid);
    if(cap&&precisaGravar((it.idea||{}).surface)){
      var g=(state.client===cid?GENERATED:DB_STATE_CACHE[cid])||{},sem=semanaIso(nova);
      var n=((g.calendar&&g.calendar.items)||[]).filter(function(x){return x.id!==it.id&&isIsoDate(x.data)&&semanaIso(x.data)===sem&&precisaGravar((x.idea||{}).surface)}).length;
      if(n>=cap.grav)av.push("a semana de "+dataBR(sem)+" já tem "+n+(n>1?" gravações":" gravação")+" (limite de "+cap.grav+" pela rotina)");
    }
    return {avisos:av,reabrir:it.clientStatus==="aprovado"&&nova!==it.data};
  }
  // Monta a mudança de data com as regras. Devolve null se bloqueou ou a pessoa desistiu.
  function mudancaDeData(cid,it,nova,hora){
    var rg=regrasMover(cid,it,nova);
    if(rg.bloqueio){toast(rg.bloqueio);return null;}
    var patch={data:nova};if(hora)patch.hora=hora;
    if(rg.reabrir){if(!confirm("O cliente já aprovou esta pauta para "+dataBR(it.data)+". Mudar a data e pedir a aprovação dele de novo?"))return null;patch.clientStatus=null;patch.clientNote=null;}
    if(nova!==it.data){var mv=(it.movimentos||[]).slice(-9);mv.push({de:it.data,para:nova,em:new Date().toISOString(),por:(SB&&SB.nome)||""});patch.movimentos=mv;}
    return {patch:patch,avisos:rg.avisos};
  }

  // ---- Campanhas do cliente (lançamento, data comercial): nos dias dela vale o foco de funil dela ----
  var FOCO_CAMP=[["fundo","Vender (fundo de funil)"],["meio","Aquecer e educar (meio)"],["topo","Atrair gente nova (topo)"],["equilibrio","Equilíbrio"]];
  function campanhasDe(cid){var c=DB_CLIENTS[cid]||{};return Array.isArray(c.campanhas)?c.campanhas:[];}
  function campanhaNoDia(cid,iso){return campanhasDe(cid).filter(function(cp){return cp.inicio<=iso&&iso<=cp.fim})[0]||null;}
  function mixDoFoco(f){for(var i=0;i<FUNIL_OPC.length;i++)if(FUNIL_OPC[i][0]===f)return FUNIL_OPC[i][2];return null;}
  function abrirCampanhas(cid){
    function desenhar(msg){
      var lista=campanhasDe(cid).slice().sort(function(a,b){return a.inicio<b.inicio?-1:1});
      I("#cpCorpo").innerHTML=(lista.length?'<div class="tabela"><table><thead><tr><th>Campanha</th><th>Período</th><th>Foco</th><th></th></tr></thead><tbody>'+lista.map(function(cp){var f=FOCO_CAMP.filter(function(x){return x[0]===cp.foco})[0];
          return '<tr class="sem-clique"><td><b class="cel-t">'+esc(cp.nome)+'</b></td><td class="nowrap">'+esc(dataBR(cp.inicio))+' a '+esc(dataBR(cp.fim))+'</td><td>'+esc(f?f[1]:cp.foco)+'</td><td class="acao"><button class="icon-btn sm" data-cp-del="'+esc(cp.id)+'" aria-label="Apagar a campanha '+esc(cp.nome)+'" title="Apagar">'+iconeUI("linha-trash")+'</button></td></tr>'}).join('')+'</tbody></table></div>'
        :'<p class="pp-m">Nenhuma campanha. Um lançamento ou uma data comercial pede mais conteúdo de venda naqueles dias: marque aqui e o calendário muda o mix só nesse período.</p>')+
        '<div class="bt" style="margin-top:16px">Nova campanha</div><div class="grid cols-2 q-form"><div class="fld"><label for="cpNome">Nome</label><input id="cpNome" placeholder="Ex.: Lançamento da mentoria"></div><div class="fld"><label for="cpFoco">Foco</label><select id="cpFoco">'+FOCO_CAMP.map(function(f){return '<option value="'+f[0]+'">'+esc(f[1])+'</option>'}).join('')+'</select></div>'+
        '<div class="fld"><label for="cpIni">Começa</label><input type="date" id="cpIni"></div><div class="fld"><label for="cpFim">Termina</label><input type="date" id="cpFim"></div></div>'+
        '<div class="q-rodape"><button class="btn pri" id="cpSalvar">Adicionar campanha</button><span class="pp-m" id="cpMsg" role="status">'+esc(msg||"")+'</span></div>'+
        '<p class="pp-m">Vale para o próximo calendário montado (pelo Cronos ou pelo botão Montar calendário). O que já está no calendário não muda sozinho.</p>';
      I("#cpSalvar").addEventListener('click',async function(){var nome=I("#cpNome").value.trim(),ini=I("#cpIni").value,fim=I("#cpFim").value,m=I("#cpMsg");
        if(!nome||!isIsoDate(ini)||!isIsoDate(fim)){m.textContent="Preencha o nome e as duas datas.";return;}
        if(fim<ini){m.textContent="A campanha termina antes de começar.";return;}
        var nova=campanhasDe(cid).concat([{id:"cp-"+Date.now().toString(36),nome:nome,inicio:ini,fim:fim,foco:I("#cpFoco").value}]);
        try{await saveClientRecord(cid,Object.assign({},DB_CLIENTS[cid],{campanhas:nova}));desenhar("Campanha adicionada.");AG_ITENS=null;}catch(e){m.textContent="Não consegui salvar: "+(e.message||e);}});
      I("#cpCorpo").querySelectorAll('[data-cp-del]').forEach(function(b){b.addEventListener('click',async function(){
        var nova=campanhasDe(cid).filter(function(cp){return cp.id!==b.getAttribute('data-cp-del')});
        try{await saveClientRecord(cid,Object.assign({},DB_CLIENTS[cid],{campanhas:nova}));desenhar("Campanha apagada.");AG_ITENS=null;}catch(e){toast("Não consegui apagar: "+(e.message||e));}})});
    }
    I("#overlay").innerHTML='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" aria-label="Campanhas" style="width:min(560px,100%)"><div class="dh"><div style="flex:1;min-width:0"><div class="d-title">Campanhas</div><div class="d-sub">'+esc(clientName(cid))+'</div></div><button class="icon-btn" id="dclose" aria-label="Fechar">'+iconeUI("x-fechar")+'</button></div><div class="db"><div class="block" id="cpCorpo"></div></div></aside>';
    I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);document.addEventListener('keydown',escClose);
    desenhar();
  }

  // ---- Tela Hoje: o que a equipe faz hoje, de todos os clientes, pelo que vence primeiro ----
  function tarefasDoDia(){
    var hoje=fmtD(new Date()),amanha=somaDias(hoje,1),depois=somaDias(hoje,2),out=[];
    (AG_ITENS||[]).forEach(function(o){var s=situacaoPeca(o.it,o.cid,hoje);if(!s||s.etapa==="publicada"||!s.prazo)return;
      if(s.atraso||s.prazo<=depois)out.push({o:o,s:s,quando:s.atraso?"atrasada":s.prazo===hoje?"hoje":s.prazo===amanha?"amanhã":"depois de amanhã"});});
    return out.sort(function(a,b){return (a.s.prazo<b.s.prazo?-1:a.s.prazo>b.s.prazo?1:0)});
  }
  function renderHojeOperacao(){
    var el=I("#ovHoje");if(!el)return;
    if(!Object.keys(DB_CLIENTS).length||state.clientView){el.innerHTML="";return;}
    if(!AG_ITENS){el.innerHTML='';agCarregar();return;}
    var t=tarefasDoDia(),atr=t.filter(function(x){return x.quando==="atrasada"}).length,hj=t.filter(function(x){return x.quando==="hoje"}).length;
    var linhas=t.slice(0,12).map(function(x){var it=x.o.it;
      return '<tr class="sem-clique'+(x.quando==="atrasada"?' linha-atraso':'')+'"><td class="nowrap"><span class="chip'+(x.quando==="atrasada"?' warn':x.quando==="hoje"?' prog':'')+'">'+esc(x.quando)+'</span></td>'+
        '<td><b class="cel-t">'+esc(clientName(x.o.cid))+'</b><small>'+esc(pecaTitulo(it))+' · '+esc(surfLbl((it.idea||{}).surface))+'</small></td>'+
        '<td><b class="cel-t">'+esc(x.s.acao)+'</b><small>'+esc(x.s.txt)+'</small></td>'+
        '<td class="acao"><button class="btn" data-hj-abrir="'+esc(x.o.cid)+'|'+esc(it.id)+'">Abrir</button></td></tr>';}).join('');
    el.innerHTML=quadro("O que fazer hoje",t.length?(atr?atr+' atrasada'+(atr>1?'s':'')+', ':'')+hj+' para hoje, contando os prazos de roteiro, aprovação, gravação e publicação de todos os clientes.':'Nada vencendo hoje nem nos próximos dois dias.','',
      t.length?'<div class="tabela"><table><thead><tr><th>Quando</th><th>Peça</th><th>O que fazer</th><th></th></tr></thead><tbody>'+linhas+'</tbody></table></div>'+(t.length>12?'<p class="pp-m">E mais '+(t.length-12)+'. Veja tudo no Calendário, na lista.</p>':''):'');
    el.querySelectorAll('[data-hj-abrir]').forEach(function(b){b.addEventListener('click',function(){var v=b.getAttribute('data-hj-abrir').split("|");agAbrir(v[0],v[1]);})});
  }
