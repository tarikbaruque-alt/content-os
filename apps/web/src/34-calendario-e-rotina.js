  // ---------- Rotina: horários de publicação + dia de gravação (Cronos) ----------
  var DIAS_SEM=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  var DIAS_SEM_LONGO=["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  var ROTINA_PADRAO={Reel:"18:30",Carrossel:"12:00",Imagem:"12:00","Vídeo":"19:00",Stories:"09:00, 13:00, 20:30",gravDia:1,gravHora:"09:00",gravDur:3};
  var ROTINA_TIPOS=[["Reel","Reels","🎬"],["Carrossel","Carrossel","🖼️"],["Imagem","Post estático","📌"],["Vídeo","Vídeo longo","🎥"]];
  function surfLbl(s){for(var i=0;i<ROTINA_TIPOS.length;i++)if(ROTINA_TIPOS[i][0]===s)return ROTINA_TIPOS[i][1];return s||"Conteúdo";}
  function surfIc(s){if(s==="Stories")return "📱";for(var i=0;i<ROTINA_TIPOS.length;i++)if(ROTINA_TIPOS[i][0]===s)return ROTINA_TIPOS[i][2];return "•";}
  function rotinaOf(id){var c=DB_CLIENTS[id]||{};return Object.assign({},ROTINA_PADRAO,c.rotina||{});}
  function padT(t){var p=String(t).split(":");return ("0"+p[0]).slice(-2)+":"+("0"+(p[1]||"0")).slice(-2);}
  function storyTimes(r){return String(r.Stories||"").split(/[,;\s]+/).filter(function(t){return /^\d{1,2}:\d{2}$/.test(t)}).map(padT).sort();}
  function isIsoDate(s){return /^\d{4}-\d{2}-\d{2}$/.test(String(s||""));}
  function parseD(s){var p=s.split("-");return new Date(+p[0],+p[1]-1,+p[2]);}
  function fmtD(d){return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}
  function dataBR(s){if(!isIsoDate(s))return s||"";var d=parseD(s);return DIAS_SEM[d.getDay()]+" "+("0"+d.getDate()).slice(-2)+"/"+("0"+(d.getMonth()+1)).slice(-2);}
  function itemHora(it,r){r=r||rotinaOf(state.client);return padT(it.hora||(it.idea.surface==="Stories"?(storyTimes(r)[0]||"09:00"):(r[it.idea.surface]||r.Reel)));}
  function quando(it){return isIsoDate(it.data)?dataBR(it.data)+" · "+itemHora(it):(it.data||"");}
  // Gravação em lote: o último "dia de gravação" ANTES da data de publicação (se já passou, hoje).
  function recDate(it,r){if(!isIsoDate(it.data))return "";var d=parseD(it.data);d.setDate(d.getDate()-1);for(var k=0;k<7&&d.getDay()!==+r.gravDia;k++)d.setDate(d.getDate()-1);var g=fmtD(d),hoje=fmtD(new Date());return g<hoje&&hoje<it.data?hoje:g;}
  function pecaTitulo(it){return it.content?it.content.headline:it.carousel?it.carousel.capaHeadline:it.idea.titulo;}
  function pecaPronta(it){return !!(it.content||it.carousel||(it.stories&&it.stories.stories&&it.stories.stories.length));}
  function acaoProducao(s){return s==="Carrossel"||s==="Imagem"?"produzir a arte":"gravar";}
  function agendaData(items,r){
    var days={};
    function day(k){return days[k]||(days[k]={pub:[],grav:[]});}
    items.forEach(function(it,idx){if(!isIsoDate(it.data))return;day(it.data).pub.push({it:it,idx:idx,t:itemHora(it,r)});var g=recDate(it,r);if(g)day(g).grav.push({it:it,idx:idx});});
    Object.keys(days).forEach(function(k){days[k].pub.sort(function(a,b){return a.t<b.t?-1:a.t>b.t?1:0});});
    return {keys:Object.keys(days).sort(),days:days};
  }
  function rotinaResumo(r){
    var fo=FUNIL_OPC.filter(function(x){return x[0]===(r.foco||"")})[0];
    return (fo?"🎯 "+fo[1]+" · ":"")+(r.tempoGrav!=null&&r.tempoGrav!==""?"⏱ "+tempoLbl(r.tempoGrav)+" de gravação/semana · ":"")+ROTINA_TIPOS.map(function(t){return t[2]+" "+t[1]+" "+padT(r[t[0]])}).join(" · ")+" · 📱 Stories "+storyTimes(r).join(" / ")+" · 🎥 Gravação: "+DIAS_SEM_LONGO[+r.gravDia]+" "+padT(r.gravHora);
  }
  // ---- Capacidade do cliente: tempo de gravação por semana → frequência e mix (gravado × sem gravação) ----
  var TEMPO_OPC=[[0,"Não grava (só arte/carrossel)"],[30,"Até 30 min"],[60,"1 hora"],[120,"2 horas"],[180,"3 horas"],[240,"4 horas ou mais"]];
  var CAPACIDADE={0:{total:2,grav:0},30:{total:3,grav:1},60:{total:3,grav:2},120:{total:4,grav:3},180:{total:5,grav:4},240:{total:6,grav:5}};
  function precisaGravar(surface){return ["Reel","Vídeo","Stories","Live"].indexOf(surface)>=0;}
  function capOf(id){var r=rotinaOf(id);if(r.tempoGrav==null||r.tempoGrav==="")return null;var c=CAPACIDADE[+r.tempoGrav]||CAPACIDADE[60];return {tempo:+r.tempoGrav,total:c.total,grav:(r.maxGrav!=null?+r.maxGrav:c.grav)};}
  function tempoLbl(t){for(var i=0;i<TEMPO_OPC.length;i++)if(TEMPO_OPC[i][0]===+t)return TEMPO_OPC[i][1];return t+" min";}
  var FUNIL_OPC=[["topo","Atrair gente nova (topo)",{topo:60,meio:25,fundo:15}],["meio","Aquecer e educar (meio)",{topo:30,meio:50,fundo:20}],["fundo","Converter em clientes (fundo)",{topo:25,meio:30,fundo:45}],["equilibrio","Equilíbrio",{topo:45,meio:35,fundo:20}]];
  function mixDoCliente(id){var f=rotinaOf(id).foco||"equilibrio";for(var i=0;i<FUNIL_OPC.length;i++)if(FUNIL_OPC[i][0]===f)return FUNIL_OPC[i][2];return FUNIL_OPC[3][2];}
  function metasPrompt(){
    var id=state.client;if(!id)return '';var m=(DB_CLIENTS[id]||{}).metas||{},r=rotinaOf(id),L=[];
    if(m.objetivos&&m.objetivos.length)L.push('Objetivos declarados pelo cliente: '+m.objetivos.join('; '));
    if(r.foco){var fo=FUNIL_OPC.filter(function(x){return x[0]===r.foco})[0];if(fo)L.push('Foco do funil agora: '+fo[1]+' — mix alvo topo '+fo[2].topo+'% / meio '+fo[2].meio+'% / fundo '+fo[2].fundo+'%');}
    if(m.proposito)L.push('Propósito da marca: '+m.proposito);
    if(m.identidade)L.push('Identidade / como quer ser percebida: '+m.identidade);
    return L.length?('METAS DO CLIENTE (respeite ao decidir caminhos, pilares e ideias):\n- '+L.join('\n- ')):'';
  }
  function capacidadePrompt(){
    var id=state.client;if(!id)return '';var c=capOf(id),dias=diasPostOf();if(!c)return '';
    var ppw=dias.length,semGrav=Math.max(0,ppw-c.grav);
    return 'FREQUÊNCIA E CAPACIDADE REAL DO CLIENTE: '+ppw+' postagens por semana. Tempo do cliente para gravar: '+tempoLbl(c.tempo)+' por semana → no máximo '+c.grav+' peça(s) GRAVADA(S) por semana (Reels, Vídeo, Stories-roteiro)'+(semGrav?' e '+semGrav+' sem gravação (Carrossel/post estático, produzidos pela agência)':'')+'. Estruture para caber nessa rotina: menos frentes bem feitas é melhor que muitas pela metade.';
  }
  function rotinaCardHtml(){
    var r=rotinaOf(state.client),ro=state.clientView;
    var head='<div class="bt" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--faint);margin-bottom:10px">Rotina de publicação e gravação</div>';
    if(ro)return '<div class="card pad" style="margin-bottom:16px">'+head+'<div style="font-size:13px;line-height:1.7">'+esc(rotinaResumo(r))+'</div></div>';
    var tm=function(k,l){return '<div class="fld" style="margin:0"><label for="rt_'+k+'">'+l+'</label><input type="time" id="rt_'+k+'" data-rot="'+k+'" value="'+padT(r[k])+'"></div>';};
    var cp=capOf(state.client),rec=cp?CAPACIDADE[cp.tempo]||CAPACIDADE[60]:null;
    var focoAt=rotinaOf(state.client).foco||"equilibrio";
    var capHtml='<div class="capbox"><div class="fld" style="margin:0;flex:1 1 200px"><label for="rt_foco">🎯 Foco do funil</label><select id="rt_foco" data-rot="foco">'+FUNIL_OPC.map(function(o){return '<option value="'+o[0]+'"'+(o[0]===focoAt?' selected':'')+'>'+o[1]+' — '+o[2].topo+'/'+o[2].meio+'/'+o[2].fundo+'</option>'}).join('')+'</select></div></div><div class="capbox"><div class="fld" style="margin:0;flex:1 1 220px"><label for="rt_tempoGrav">⏱ Tempo do cliente para gravar por semana</label><select id="rt_tempoGrav" data-rot="tempoGrav"><option value="">— escolha —</option>'+TEMPO_OPC.map(function(o){return '<option value="'+o[0]+'"'+(cp&&cp.tempo===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select></div>'+
      '<div style="flex:2 1 300px;font-size:12.5px;color:var(--muted)" id="capRec">'+(rec?'Recomendado: <b style="color:var(--ink)">'+rec.total+' postagens/semana</b>, sendo <b style="color:var(--ink)">até '+rec.grav+' gravada(s)</b> (Reels/Stories) e o resto em carrossel/post estático, que você produz sem depender do cliente. <button class="btn" id="capApply" style="margin-left:6px">Aplicar ao calendário</button>':'Diga quanto tempo o cliente tem para gravar e o painel recomenda a frequência e o mix de formatos — e limita as gravações por semana no calendário.')+'</div></div>';
    return '<details class="card pad" style="margin-bottom:16px"'+(DB_CLIENTS[state.client]&&DB_CLIENTS[state.client].rotina&&cp?'':' open')+'><summary style="cursor:pointer;list-style:none">'+head.replace('margin-bottom:10px','display:inline')+' <span style="font-size:12px;color:var(--muted);margin-left:6px">'+esc(rotinaResumo(r))+'</span></summary>'+
      '<div style="font-size:11.5px;color:var(--faint);margin:10px 0 12px">Horário em que cada tipo vai ao ar e o dia da semana em que o cliente grava/produz tudo em lote. Ajuste pelo Instagram → Insights → Público → <b>Horários mais ativos</b>. Cada conteúdo também aceita horário próprio (abra o conteúdo).</div>'+
      capHtml+'<div class="grid cols-4" style="gap:12px">'+ROTINA_TIPOS.map(function(t){return tm(t[0],t[2]+" "+t[1])}).join('')+'</div>'+
      '<div class="grid cols-3" style="gap:12px;margin-top:12px"><div class="fld" style="margin:0"><label for="rt_Stories">📱 Stories — horários do dia</label><input id="rt_Stories" data-rot="Stories" value="'+esc(r.Stories)+'" placeholder="09:00, 13:00, 20:30"></div>'+
      '<div class="fld" style="margin:0"><label for="rt_gravDia">🎥 Dia de gravação/produção</label><select id="rt_gravDia" data-rot="gravDia">'+DIAS_SEM_LONGO.map(function(d,i){return '<option value="'+i+'"'+(+r.gravDia===i?' selected':'')+'>'+d+'</option>'}).join('')+'</select></div>'+
      tm("gravHora","⏰ Início da gravação")+'</div>'+
      '<div style="display:flex;gap:10px;align-items:center;margin-top:14px"><button class="btn pri" id="rotSave">Salvar rotina</button><span id="rotMsg" style="font-size:12px;color:var(--muted)"></span></div></details>';
  }
  function wireRotina(){
    var tg=I("#rt_tempoGrav");if(tg)tg.addEventListener('change',function(){var v=tg.value,box=I("#capRec");if(!box)return;if(v===""){box.textContent="";return;}var c=CAPACIDADE[+v];box.innerHTML='Recomendado: <b style="color:var(--ink)">'+c.total+' postagens/semana</b>, sendo <b style="color:var(--ink)">até '+c.grav+' gravada(s)</b>. Clique em <b>Salvar rotina</b> para aplicar.';});
    var ap=I("#capApply");if(ap)ap.addEventListener('click',function(){var c=capOf(state.client);if(!c)return;state.diasPost=DIAS_PADRAO[CAPACIDADE[c.tempo].total].slice();state.diasPostCli=state.client;toast("Frequência recomendada aplicada — agora é só gerar o planejamento.");renderCal();});
    var b=I("#rotSave");if(!b)return;
    b.addEventListener('click',function(){
      var id=state.client,rec=DB_CLIENTS[id];if(!rec)return;
      var r=rotinaOf(id);Array.prototype.forEach.call(document.querySelectorAll('[data-rot]'),function(el){var k=el.getAttribute('data-rot');r[k]=k==="gravDia"?+el.value:k==="tempoGrav"?(el.value===""?null:+el.value):el.value.trim();});
      if(r.tempoGrav!=null)r.maxGrav=(CAPACIDADE[r.tempoGrav]||CAPACIDADE[60]).grav;
      if(!storyTimes(r).length){I("#rotMsg").textContent="Stories: use horários como 09:00, 13:00";return;}
      saveClientRecord(id,Object.assign({},rec,{rotina:r})).then(function(){if(r.tempoGrav!=null){state.diasPost=DIAS_PADRAO[(CAPACIDADE[r.tempoGrav]||CAPACIDADE[60]).total].slice();state.diasPostCli=id;}toast("Rotina salva — frequência, horários e limite de gravações aplicados.");renderCal();},function(){I("#rotMsg").textContent="Não consegui salvar";});
    });
  }
  function agendaHtml(items){
    var r=rotinaOf(state.client),A=agendaData(items,r),st=storyTimes(r),h='',lastWeek='';
    if(!A.keys.length)return '';
    A.keys.forEach(function(k){
      var d=parseD(k),mon=new Date(d.getTime());mon.setDate(d.getDate()-((d.getDay()+6)%7));var wk=fmtD(mon);
      if(wk!==lastWeek){if(lastWeek)h+='</div>';h+='<div class="bt" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--faint);margin:18px 0 8px">Semana de '+("0"+mon.getDate()).slice(-2)+'/'+("0"+(mon.getMonth()+1)).slice(-2)+'</div><div class="grid" style="gap:10px">';lastWeek=wk;}
      var D=A.days[k],rows='';
      if(D.grav.length)rows+='<div class="ag-row ag-grav"><span class="ag-t">'+padT(r.gravHora)+'</span><div><b>🎥 Dia de gravação e produção</b> — '+D.grav.length+' peça'+(D.grav.length>1?'s':'')+' da semana<div class="ag-sub">'+D.grav.map(function(g){return '<a data-gen="'+g.idx+'">'+surfIc(g.it.idea.surface)+' '+esc(acaoProducao(g.it.idea.surface))+': '+esc(pecaTitulo(g.it))+' <span style="color:var(--faint)">(vai ao ar '+esc(dataBR(g.it.data))+')</span></a>'}).join('')+'</div></div></div>';
      D.pub.forEach(function(p){var x=p.it.idea,c=p.it.content,s=p.it.stories;
        rows+='<div class="ag-row" data-gen="'+p.idx+'"><span class="ag-t">'+p.t+'</span><div><b>'+surfIc(x.surface)+' '+esc(surfLbl(x.surface))+'</b> · '+esc(pecaTitulo(p.it))+(p.it.clientStatus==="aprovado"?' <span class="badge act">✓ cliente aprovou</span>':p.it.clientStatus==="ajuste"?' <span class="badge prog" title="'+esc(p.it.clientNote||"")+'">✏️ ajuste: '+esc(String(p.it.clientNote||"").slice(0,60))+'</span>':'')+'<div class="ag-sub">'+esc(x.format)+' · '+esc(x.funcao)+' · '+esc(x.funil)+(pecaPronta(p.it)?'':' · <span class="badge prog">ainda não produzido</span>')+'</div>'+
          (s&&s.stories&&s.stories.length?'<div class="ag-sub">📱 Stories de apoio ('+s.stories.length+' telas) — '+esc(st.filter(function(t){return t>=p.t})[0]||st[st.length-1]||"")+'</div>':'')+'</div></div>';});
      if(D.pub.length&&st.length)rows+='<div class="ag-row ag-st"><span class="ag-t">📱</span><div class="ag-sub" style="margin:0">Stories do dia: '+st.join(' · ')+'</div></div>';
      h+='<div class="card pad ag-day"><div class="ag-d">'+esc(DIAS_SEM_LONGO[d.getDay()])+' <span>'+("0"+d.getDate()).slice(-2)+'/'+("0"+(d.getMonth()+1)).slice(-2)+'</span></div>'+rows+'</div>';
    });
    return h+'</div>';
  }
  // ---- Exportar: agenda .ics (Google Agenda / iPhone) e agenda do cliente (HTML para enviar/imprimir) ----
  function icsEsc(s){return String(s||"").replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/[,;]/g,function(c){return "\\"+c});}
  function icsDt(date,t,addMin){var p=padT(t).split(":"),d=parseD(date);d.setHours(+p[0],+p[1]+(addMin||0),0,0);return fmtD(d).replace(/-/g,"")+"T"+("0"+d.getHours()).slice(-2)+("0"+d.getMinutes()).slice(-2)+"00";}
  function icsFold(l){var c=Array.from(l),o=[];for(var i=0;i<c.length;i+=60)o.push(c.slice(i,i+60).join(""));return o.join("\r\n ");}
  function buildIcs(items,r,cliente){
    var A=agendaData(items,r),stamp=new Date().toISOString().replace(/[-:]/g,"").slice(0,15)+"Z",L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Content OS//Agenda//PT-BR","CALSCALE:GREGORIAN","X-WR-CALNAME:"+icsEsc("Conteúdo — "+cliente)];
    function ev(uid,date,t,min,sum,desc){L.push("BEGIN:VEVENT","UID:"+uid+"@content-os","DTSTAMP:"+stamp,"DTSTART:"+icsDt(date,t,0),"DTEND:"+icsDt(date,t,min),"SUMMARY:"+icsEsc(sum),"DESCRIPTION:"+icsEsc(desc),"BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+icsEsc(sum),"TRIGGER:-PT30M","END:VALARM","END:VEVENT");}
    A.keys.forEach(function(k){var D=A.days[k];
      if(D.grav.length)ev("grav-"+k,k,r.gravHora,(+r.gravDur||3)*60,"🎥 Gravação/produção — "+D.grav.length+" peça(s)",D.grav.map(function(g){return "• "+surfLbl(g.it.idea.surface)+" ("+acaoProducao(g.it.idea.surface)+"): "+pecaTitulo(g.it)+" — vai ao ar "+dataBR(g.it.data)}).join("\n"));
      D.pub.forEach(function(p){var x=p.it.idea,c=p.it.content,desc=[x.format+" · "+x.funcao+" · "+x.funil];
        if(c&&c.roteiro&&c.roteiro.length)desc.push("Roteiro:\n"+c.roteiro.map(function(s){return "- "+s.label+": "+s.text}).join("\n"));
        if(c&&c.copy)desc.push("Legenda:\n"+c.copy);
        if(c&&c.cta)desc.push("CTA: "+c.cta);
        var cr=p.it.carousel;if(cr&&cr.slides&&cr.slides.length)desc.push("Slides:\n"+cr.slides.map(function(q,i){return (i+1)+". "+q.titulo+(q.texto?" — "+q.texto:"")}).join("\n")+(cr.copy?"\n\nLegenda:\n"+cr.copy:""));
        ev("pub-"+(p.it.id||p.idx)+"-"+k,k,p.t,30,surfIc(x.surface)+" Postar "+surfLbl(x.surface)+": "+pecaTitulo(p.it),desc.join("\n\n"));});
    });
    L.push("END:VCALENDAR");
    return L.map(icsFold).join("\r\n")+"\r\n";
  }
  // Parte estratégica do documento do cliente: estratégia + linha editorial + como vamos trabalhar.
  function planoClienteHtml(items,r){
    var g=GENERATED||{},st=g.strategy,ed=g.editorial||[],h='';
    if(st){
      h+='<section><h2>Estratégia</h2>'+(st.posicionamento?'<p><b>Posicionamento:</b> '+esc(st.posicionamento)+'</p>':'')+(st.bigMessage?'<p class="big">“'+esc(st.bigMessage)+'”</p>':'')+
        (st.persona?'<p><b>Para quem falamos:</b> '+esc(st.persona)+'</p>':'')+(st.percepcao?'<p><b>Como queremos ser percebidos:</b> '+esc(st.percepcao)+'</p>':'')+
        ((st.mix||[]).length?'<p><b>Caminhos deste período:</b> '+st.mix.map(function(m){return esc(m.nome)+' ('+esc(String(m.pct))+'%)'}).join(' · ')+'</p>':'')+'</section>';
    }
    if(ed.length){
      h+='<section><h2>Linha editorial</h2><p class="m">Os assuntos que vamos repetir com consistência — é isso que faz o público lembrar da marca.</p>'+ed.map(function(p){
        return '<div class="pil"><b>'+esc(p.pilar||"")+'</b>'+(p.territorio?' <span class="m">— '+esc(p.territorio)+'</span>':'')+'<ul>'+(p.temas||[]).map(function(t){return '<li><b>'+esc(t.tema||"")+'</b>'+((t.subtemas||[]).length?': '+esc(t.subtemas.join(', ')):'')+((t.topicos||[]).length?'<br><span class="m">Ex.: '+esc(t.topicos.join(' · '))+'</span>':'')+'</li>'}).join('')+'</ul></div>';
      }).join('')+'</section>';
    }
    var sf={},fu={topo:0,meio:0,fundo:0};items.forEach(function(it){var x=it.idea||{};sf[x.surface]=(sf[x.surface]||0)+1;if(fu[x.funil]!=null)fu[x.funil]++;});
    var n=items.length||1,dias=(r.diasPost||[]).slice().sort().map(function(d){return DIAS_SEM_LONGO[d]}).join(', ');
    h+='<section><h2>Como vamos trabalhar</h2><ul>'+
      '<li><b>'+items.length+' conteúdos</b> neste período'+(dias?' — postagens em: '+esc(dias):'')+'</li>'+
      '<li><b>Formatos:</b> '+Object.keys(sf).map(function(k){return esc(surfLbl(k))+' '+sf[k]}).join(' · ')+'</li>'+
      '<li><b>Objetivo de cada conteúdo:</b> atrair gente nova '+Math.round(fu.topo*100/n)+'% · aquecer quem já segue '+Math.round(fu.meio*100/n)+'% · converter em clientes '+Math.round(fu.fundo*100/n)+'%</li>'+
      '<li><b>Rotina:</b> '+esc(rotinaResumo(r))+'</li></ul></section>';
    return h;
  }
  function buildAgendaHtml(items,r,cliente){
    var A=agendaData(items,r),st=storyTimes(r),body='';
    A.keys.forEach(function(k){var D=A.days[k],d=parseD(k);
      body+='<section><h2>'+esc(DIAS_SEM_LONGO[d.getDay()])+' <span>'+esc(k.split("-").reverse().join("/"))+'</span></h2>';
      if(D.grav.length)body+='<div class="row grav"><b class="t">'+padT(r.gravHora)+'</b><div><b>🎥 Gravação e produção</b><ul>'+D.grav.map(function(g){return '<li>'+esc(surfLbl(g.it.idea.surface))+' ('+esc(acaoProducao(g.it.idea.surface))+'): '+esc(pecaTitulo(g.it))+' — vai ao ar '+esc(dataBR(g.it.data))+'</li>'}).join('')+'</ul></div></div>';
      D.pub.forEach(function(p){var x=p.it.idea,c=p.it.content,s=p.it.stories;
        body+='<div class="row"><b class="t">'+p.t+'</b><div><b>'+surfIc(x.surface)+' '+esc(surfLbl(x.surface))+'</b> — '+esc(pecaTitulo(p.it))+'<div class="m">'+esc(x.format)+' · '+esc(x.funcao)+'</div>'+
          (c&&c.roteiro&&c.roteiro.length?'<details><summary>Roteiro</summary><ol>'+c.roteiro.map(function(q){return '<li><b>'+esc(q.label)+':</b> '+esc(q.text)+'</li>'}).join('')+'</ol></details>':'')+
          (c&&c.copy?'<details><summary>Legenda</summary><p class="copy">'+esc(c.copy)+'</p></details>':'')+
          (p.it.carousel&&p.it.carousel.slides&&p.it.carousel.slides.length?'<details><summary>Slides do carrossel ('+p.it.carousel.slides.length+')</summary><ol>'+p.it.carousel.slides.map(function(q){return '<li><b>'+esc(q.titulo)+'</b>'+(q.texto?' — '+esc(q.texto):'')+'</li>'}).join('')+'</ol>'+(p.it.carousel.copy?'<p class="copy"><b>Legenda:</b> '+esc(p.it.carousel.copy)+'</p>':'')+'</details>':'')+
          (s&&s.stories&&s.stories.length?'<details><summary>Stories de apoio ('+s.stories.length+' telas)</summary><ol>'+s.stories.map(function(q){return '<li>'+esc(q.fala)+(q.interacao?' <i>('+esc(q.interacao)+')</i>':'')+'</li>'}).join('')+'</ol></details>':'')+'</div></div>';});
      if(D.pub.length&&st.length)body+='<div class="row st"><b class="t">📱</b><div>Stories do dia: '+esc(st.join(' · '))+'</div></div>';
      body+='</section>';
    });
    var css='body{font:15px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1b1a22;background:#f6f5fb;margin:0;padding:24px 16px}main{max-width:720px;margin:0 auto}h1{font-size:22px;margin:0 0 4px}.sub{color:#666;font-size:13px;margin:0 0 18px}.rot{background:#fff;border:1px solid #e6e4ef;border-radius:12px;padding:12px 14px;font-size:13.5px;margin-bottom:18px}section{background:#fff;border:1px solid #e6e4ef;border-radius:12px;padding:12px 14px;margin-bottom:12px;break-inside:avoid}h2{font-size:15px;margin:0 0 8px}h2 span{color:#888;font-weight:500}.row{display:flex;gap:12px;padding:8px 0;border-top:1px solid #f0eef6}.row:first-of-type{border-top:0}.t{min-width:46px;font-variant-numeric:tabular-nums;color:#5B45E6}.grav .t{color:#0E8C9B}.m{color:#777;font-size:12.5px}.st{color:#666;font-size:13px}details{margin-top:6px;font-size:13.5px}summary{cursor:pointer;color:#5B45E6}.copy{white-space:pre-wrap}ul,ol{margin:6px 0;padding-left:20px}@media print{body{background:#fff;padding:0}details{display:block}details>summary{list-style:none}section{border-color:#ccc}}';
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Plano de conteúdo — '+esc(cliente)+'</title><style>'+css+'.big{font-size:17px;font-weight:700;color:#4634B6}.pil{margin:10px 0}.pil ul{margin:6px 0 0}h2.cal{font-size:18px;margin:26px 0 10px}</style></head><body><main><h1>Plano de conteúdo — '+esc(cliente)+'</h1><p class="sub">Estratégia, linha editorial e calendário: o que gravar, quando postar e em que horário. No calendário, toque em “Roteiro”, “Legenda” e “Stories” para ver o conteúdo pronto. Para salvar em PDF: Imprimir → Salvar como PDF.</p>'+planoClienteHtml(items,r)+'<h2 class="cal">Calendário</h2>'+body+'</main></body></html>';
  }
  function slugify(s){return (normalizeTextPanel(s)||"cliente").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40)||"cliente";}
  function normalizeTextPanel(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
  function downloadText(name,data,mime,done){
    function localDL(){try{var b=new Blob([data],{type:mime});var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);done(true);}catch(e){done(false);}}
    if(window.claude&&claude.use){claude.use("downloads").then(function(dl){if(!dl){localDL();return;}dl.save({filename:name,data:data}).then(function(){done(true)},function(){done(false)});},localDL);}else{localDL();}
  }
  function exportBarHtml(){
    return '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:4px 0 6px">'+
      '<button class="preset calMode" data-mode="agenda" style="'+(state.calMode!=="lista"?'background:var(--brand-weak);color:var(--brand-ink);border-color:transparent':'')+'">🗓 Rotina da semana</button>'+
      '<button class="preset calMode" data-mode="lista" style="'+(state.calMode==="lista"?'background:var(--brand-weak);color:var(--brand-ink);border-color:transparent':'')+'">☰ Lista</button>'+
      '<span style="flex:1"></span><button class="btn" id="expIcs" title="Importa no Google Agenda ou no calendário do celular, com lembrete 30 min antes">📅 Baixar para a agenda do celular (.ics)</button>'+
      '<button class="btn" id="expView" title="Veja exatamente como o cliente vê o calendário">👁 Ver como o cliente</button><button class="btn" id="expHtml" title="Arquivo para enviar ao cliente: abre no celular, com texto pronto, roteiro, Stories e aprovação por pauta">📤 Calendário do cliente (arquivo)</button><button class="btn" id="expGcal" title="Cria os horários de publicação na sua Google Agenda, com a pauta completa">📆 Google Agenda</button><span id="expMsg" style="font-size:12px;color:var(--muted)"></span></div>';
  }
  function wireCalExtras(items){
    Array.prototype.forEach.call(document.querySelectorAll('.calMode'),function(b){b.addEventListener('click',function(){state.calMode=b.getAttribute('data-mode');renderCal();})});
    var cli=clientName(state.client),r=rotinaOf(state.client),slug=slugify(cli);
    function msg(ok,t){var m=I("#expMsg");if(m){m.textContent=ok?t:"Não consegui baixar agora";m.style.color=ok?"var(--good)":"var(--warn)";}}
    var a=I("#expIcs");if(a)a.addEventListener('click',function(){downloadText("agenda-"+slug+".ics",buildIcs(items,r,cli),"text/calendar",function(ok){msg(ok,"✓ Abra o arquivo no celular ou importe no Google Agenda");});});
    var b=I("#expHtml");if(b)b.addEventListener('click',function(){downloadText("calendario-"+slug+".html",buildVitrineDoc(items,r,cli),"text/html",function(ok){msg(ok,"✓ Envie o arquivo ao cliente (WhatsApp/e-mail)");});});
    var vw=I("#expView");if(vw)vw.addEventListener('click',function(){state.view="calendar";toggleClientView(true);});
    var gc=I("#expGcal");if(gc)gc.addEventListener('click',function(){openGcalModal(items);});
    wireRotina();
  }
