  // ---- Novo cliente: cadastro em branco (sem exemplos, sem dados fictícios) ----
  // ---------- Formulário de briefing para o cliente (arquivo que você envia) + importação das respostas ----------
  var BRIEF_MARK="📋 BRIEFING DE CONTEÚDO";
  var BRIEF_FREQ=["3 por semana","4 por semana","5 por semana","7 por semana (todo dia)"];
  var BRIEF_FIELDS=[
    {k:"name",l:"Nome da empresa ou marca",t:"text",req:1,g:"Sobre o negócio"},
    {k:"responsavel",l:"Seu nome (quem está preenchendo)",t:"text"},
    {k:"whats",l:"Seu WhatsApp (com DDD)",t:"text",ph:"Ex.: 11 99999-9999"},
    {k:"niche",l:"Área de atuação / nicho",t:"text",req:1,ph:"Ex.: odontologia estética, loja de roupas femininas"},
    {k:"instagram",l:"Instagram (@)",t:"text",ph:"@seuperfil"},
    {k:"site",l:"Site ou link",t:"text"},
    {k:"regiao",l:"Cidade / região de atendimento",t:"text",ph:"Ex.: São Paulo — Zona Sul, ou 100% online"},
    {k:"oferta",l:"O que você vende? (produtos e serviços principais)",t:"area",req:1},
    {k:"ticket",l:"Faixa de preço / ticket médio",t:"text",ph:"Ex.: R$ 300 a R$ 2.000"},
    {k:"publico",l:"Quem é o seu cliente ideal?",t:"area",req:1,ph:"Idade, momento de vida, o que procura",g:"Sobre o seu cliente"},
    {k:"dores",l:"Quais são as maiores dores ou problemas dele?",t:"area"},
    {k:"desejos",l:"O que ele mais deseja conquistar?",t:"area"},
    {k:"objecoes",l:"O que faz ele hesitar antes de comprar?",t:"area",ph:"Ex.: acha caro, tem medo do resultado, não tem tempo"},
    {k:"proposito",l:"Qual é o propósito da sua marca? (por que ela existe, além de vender)",t:"area",g:"Sobre a sua marca"},
    {k:"identidade",l:"Identidade: como quer ser percebido(a)? Valores, personalidade, estilo visual",t:"area",ph:"Ex.: próxima e elegante; valores: honestidade e cuidado; cores claras, visual minimalista"},
    {k:"diferencial",l:"Por que escolher você e não outro?",t:"area"},
    {k:"provas",l:"Provas: anos de experiência, nº de clientes, resultados, prêmios",t:"area"},
    {k:"tom",l:"Como você gosta de falar? Palavras que usa e que evita",t:"area",ph:"Ex.: acolhedor e direto; evito “barato” e “promoção”"},
    {k:"restricoes",l:"O que NÃO pode aparecer no conteúdo?",t:"area"},
    {k:"objetivo",l:"Objetivos com o Instagram (marque até 3)",t:"multi",max:3,req:1,opts:["Ter mais autoridade / ser referência no assunto","Vender mais / gerar pedidos","Encher a agenda","Fortalecer marca pessoal (perfil de influenciador)","Criar proximidade e conexão (rapport)","Fortalecer a identidade da marca","Criar comunidade","Lançar algo novo"],g:"Objetivos e estratégia"},
    {k:"funil",l:"Neste momento, qual o foco principal?",t:"choice",req:1,opts:["Atrair gente nova que ainda não me conhece (topo)","Aquecer e educar quem já me segue (meio)","Transformar seguidores em clientes (fundo)","Equilíbrio entre os três"]},
    {k:"frequencia",l:"Quantos conteúdos por semana você quer?",t:"choice",req:1,opts:BRIEF_FREQ,g:"Sobre a rotina de conteúdo"},
    {k:"tempo",l:"Quanto tempo por semana você consegue reservar para gravar?",t:"choice",req:1,opts:TEMPO_OPC.map(function(o){return o[1]})},
    {k:"aparece",l:"Você aparece nos vídeos?",t:"choice",opts:["Sim, gosto de aparecer","Às vezes / ainda tenho vergonha","Prefiro não aparecer"]},
    {k:"gravdia",l:"Melhor dia da semana para gravar",t:"choice",opts:DIAS_SEM_LONGO.slice(1).concat([DIAS_SEM_LONGO[0]])},
    {k:"dias",l:"Dias que prefere postar (pode marcar vários)",t:"multi",opts:["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"]},
    {k:"referencias",l:"Perfis que você admira (referência) — e por quê",t:"area",g:"Referências"},
    {k:"concorrentes",l:"Concorrentes diretos",t:"area"},
    {k:"datas",l:"Datas importantes, lançamentos ou campanhas",t:"area"},
    {k:"obs",l:"Algo mais que devemos saber?",t:"area"}
  ];
  function formCfg(){try{return JSON.parse(localStorage.getItem("cos_form_cfg")||"{}")||{}}catch(e){return {}}}
  function saveFormCfg(o){try{localStorage.setItem("cos_form_cfg",JSON.stringify(o))}catch(e){}}
  function buildBriefingFormHtml(cfg){
    var para=cfg.cliente?String(cfg.cliente).trim():"",de=cfg.nome?String(cfg.nome):"",wa=String(cfg.whats||"").replace(/\D/g,"");if(wa&&wa.length<=11)wa="55"+wa;
    var mail=String(cfg.email||"").trim();
    var data=JSON.stringify({mark:BRIEF_MARK,de:de,wa:wa,mail:mail,fields:BRIEF_FIELDS}).replace(/</g,"\\u003c");
    var css='*{box-sizing:border-box}body{margin:0;font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f5f4fb;color:#1b1a22}main{max-width:640px;margin:0 auto;padding:22px 16px 60px}h1{font-size:22px;margin:0 0 6px}.sub{color:#5f5d6e;font-size:14px;margin:0 0 18px}.card{background:#fff;border:1px solid #e6e4ef;border-radius:14px;padding:16px;margin-bottom:14px}h2{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#5B45E6;margin:22px 0 10px}label.q{display:block;font-weight:600;font-size:14.5px;margin-bottom:6px}.req{color:#c0392b}input[type=text],textarea{width:100%;border:1px solid #d9d6e6;border-radius:10px;padding:11px 12px;font:inherit;background:#fbfbfe}textarea{min-height:84px;resize:vertical}.opts{display:flex;flex-wrap:wrap;gap:8px}.opts label{display:flex;align-items:center;gap:7px;border:1px solid #d9d6e6;border-radius:999px;padding:8px 13px;font-size:14px;cursor:pointer;background:#fbfbfe}.opts input{accent-color:#5B45E6}.btn{display:block;width:100%;border:0;border-radius:12px;padding:15px;font:600 16px system-ui,sans-serif;cursor:pointer;margin-top:10px}.pri{background:#5B45E6;color:#fff}.wa{background:#1fa855;color:#fff}.sec{background:#eeebff;color:#4634b6}.msg{font-size:13.5px;color:#5f5d6e;text-align:center;margin-top:10px;min-height:20px}.err{color:#c0392b}#out{display:none}';
    var js='(function(){var D='+data+';var F=D.fields,box=document.getElementById("form"),KEY="cos_briefing_rascunho";'+
      'function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c]})}'+
      'var h="";F.forEach(function(f,i){if(f.g)h+="<h2>"+esc(f.g)+"</h2>";h+="<div class=card><label class=q for=f"+i+">"+esc(f.l)+(f.req?" <span class=req>*</span>":"")+"</label>";'+
      'if(f.t==="text")h+="<input type=text id=f"+i+" data-k="+f.k+" placeholder=\\""+esc(f.ph||"")+"\\">";'+
      'else if(f.t==="area")h+="<textarea id=f"+i+" data-k="+f.k+" placeholder=\\""+esc(f.ph||"")+"\\"></textarea>";'+
      'else h+="<div class=opts>"+f.opts.map(function(o){return "<label><input type="+(f.t==="multi"?"checkbox":"radio")+" name="+f.k+" value=\\""+esc(o)+"\\"> "+esc(o)+"</label>"}).join("")+"</div>";h+="</div>"});box.innerHTML=h;'+
      'function val(f){if(f.t==="text"||f.t==="area"){var el=box.querySelector("[data-k="+f.k+"]");return el?el.value.trim():""}return [].map.call(box.querySelectorAll("input[name="+f.k+"]:checked"),function(x){return x.value}).join(", ")}'+
      'function setv(f,v){if(!v)return;if(f.t==="text"||f.t==="area"){var el=box.querySelector("[data-k="+f.k+"]");if(el)el.value=v;return}var vs=v.split(", ");[].forEach.call(box.querySelectorAll("input[name="+f.k+"]"),function(x){x.checked=vs.indexOf(x.value)>=0})}'+
      'try{var r=JSON.parse(localStorage.getItem(KEY)||"{}");F.forEach(function(f){setv(f,r[f.k])})}catch(e){}'+
      'box.addEventListener("change",function(e){var t=e.target;if(t.type!=="checkbox")return;var f=F.filter(function(x){return x.k===t.name})[0];if(f&&f.max&&box.querySelectorAll("input[name="+f.k+"]:checked").length>f.max){t.checked=false;alert("Marque no máximo "+f.max+" opções.")}});'+
      'box.addEventListener("input",function(){var o={};F.forEach(function(f){o[f.k]=val(f)});try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}});'+
      'function texto(){var t=D.mark+"\\n";F.forEach(function(f){var v=val(f);if(v)t+="\\n▸ "+f.l+"\\n"+v+"\\n"});return t}'+
      'function ok(){var m=document.getElementById("msg");var faltam=F.filter(function(f){return f.req&&!val(f)}).map(function(f){return f.l});if(faltam.length){m.className="msg err";m.textContent="Falta responder: "+faltam.join(" · ");return false}m.className="msg";m.textContent="";return true}'+
      'document.getElementById("go").addEventListener("click",function(){if(!ok())return;document.getElementById("out").style.display="block";document.getElementById("txt").value=texto();document.getElementById("out").scrollIntoView({behavior:"smooth"})});'+
      'var em=document.getElementById("em");if(em){if(!D.mail)em.style.display="none";em.addEventListener("click",function(){var nm=(box.querySelector("[data-k=name]")||{}).value||"";var u="mailto:"+D.mail+"?subject="+encodeURIComponent("📋 Briefing de conteúdo — "+nm.trim())+"&body="+encodeURIComponent(texto());window.location.href=u})}'+
      'var wa=document.getElementById("wa");if(!D.wa)wa.textContent="Enviar pelo WhatsApp";wa.addEventListener("click",function(){var u="https://wa.me/"+(D.wa||"")+"?text="+encodeURIComponent(texto());window.open(u,"_blank")});'+
      'document.getElementById("cp").addEventListener("click",function(){var t=document.getElementById("txt");t.select();var done=function(){document.getElementById("cpm").textContent="✓ Copiado — agora cole na conversa e envie."};if(navigator.clipboard)navigator.clipboard.writeText(t.value).then(done,function(){document.execCommand("copy");done()});else{document.execCommand("copy");done()}});'+
      '})();';
    var S='scr'+'ipt';
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Briefing de conteúdo'+(para?' — '+esc(para):de?' — '+esc(de):'')+'</title><style>'+css+'</style></head><body><main>'+
      '<h1>'+(para?'Olá, '+esc(para)+'! ':'')+'Briefing de conteúdo</h1><p class="sub">'+(de?'<b>'+esc(de)+'</b> vai usar'+'':'Vamos usar')+' estas respostas para montar a sua estratégia, a linha editorial e o calendário de conteúdo. Leva uns 10 minutos. Suas respostas ficam salvas neste aparelho enquanto você preenche. Campos com <span class="req">*</span> são obrigatórios.</p>'+
      '<p class="sub" style="background:#eeebff;color:#4634b6;border-radius:12px;padding:12px 14px"><b>Quanto mais detalhes você colocar, mais personalizadas ficam a sua estratégia e as ideias de conteúdo.</b> Responda com calma — exemplos reais, palavras que seus clientes usam e histórias ajudam muito.</p>'+
      '<div id="form"></div><button class="btn pri" id="go">Concluir briefing</button><div class="msg" id="msg"></div>'+
      '<div id="out"><h2>Pronto! Agora é só enviar</h2><div class="card"><button class="btn pri" id="em">📧 Enviar por e-mail'+(de?' para '+esc(de):'')+' (recomendado)</button><button class="btn wa" id="wa">Enviar pelo WhatsApp'+(de?' para '+esc(de):'')+'</button><button class="btn sec" id="cp">Copiar respostas</button><div class="msg" id="cpm">Se o e-mail abrir incompleto, toque em Copiar respostas e cole no corpo do e-mail.</div><textarea id="txt" readonly style="min-height:160px;margin-top:10px"></textarea></div></div>'+
      '</main><'+S+'>'+js+'</'+S+'></body></html>';
  }
  function parseBriefing(txt){
    txt=String(txt||"").replace(/\r/g,"");if(txt.indexOf("▸")<0)return null;
    var byLbl={};BRIEF_FIELDS.forEach(function(f){byLbl[normalizeTextPanel(f.l).replace(/[^a-z0-9]+/g,"")]=f;});
    var out={};txt.split(/\n?▸ ?/).slice(1).forEach(function(ch){var nl=ch.indexOf("\n");var lbl=(nl<0?ch:ch.slice(0,nl)).trim(),v=(nl<0?"":ch.slice(nl+1)).trim();
      var f=byLbl[normalizeTextPanel(lbl).replace(/[^a-z0-9]+/g,"")];if(f&&v)out[f.k]=v;});
    return out.name?out:null;
  }
  function briefingNarrativa(b){
    var s=[];function add(k,frase){if(b[k])s.push(frase.replace("%",b[k].replace(/\n+/g,"; ")));}
    add("oferta","Vendemos %.");add("ticket","Nosso ticket médio / faixa de preço é %.");add("publico","Meu público são %.");add("dores","A maior dor deles é %.");
    add("desejos","Eles desejam %.");add("objecoes","Uma objeção comum é %.");add("diferencial","Nosso diferencial é %.");add("provas","Provas e experiência: %.");
    add("proposito","Nosso propósito é %.");add("identidade","Queremos ser percebidos como %.");
    add("tom","Falamos de forma %.");add("objetivo","Objetivos com o Instagram: %.");add("funil","Foco atual do conteúdo: %.");add("regiao","Atendemos em %.");add("restricoes","Não pode aparecer no conteúdo: %.");
    add("aparece","Sobre aparecer nos vídeos: %.");add("datas","Datas importantes: %.");add("obs","Observações: %.");
    return s.join("\n");
  }
  // Ficha, metas e rotina a partir de um briefing de formulário (sem mexer no
  // Content DNA). Usado ao importar e também quando o briefing é colado no DNA.
  function fichaDoBriefing(id,b){
    var rec=Object.assign({},DB_CLIENTS[id]);
    rec.niche=b.niche||rec.niche||"";
    var fic=Object.assign({},rec.ficha||{});["instagram","site","regiao","ticket","oferta","publico","tom","restricoes"].forEach(function(k){if(b[k])fic[k]=b[k];});
    rec.metas={objetivos:(b.objetivo||"").split(/,\s*(?=[A-ZÁÉÍÓÚ])/).filter(Boolean),proposito:b.proposito||"",identidade:b.identidade||""};
    var extra=[b.objetivo?"Objetivos: "+b.objetivo:"",b.datas?"Datas: "+b.datas:"",b.obs||"",b.responsavel?"Briefing preenchido por "+b.responsavel:""].filter(Boolean).join("\n");
    if(extra)fic.obs=(fic.obs?fic.obs+"\n":"")+extra;
    rec.ficha=fic;
    if(b.whats&&!(rec.admin&&rec.admin.whats))rec.admin=Object.assign({},rec.admin||{},{whats:b.whats});
    if(b.responsavel&&!(rec.admin&&rec.admin.contato))rec.admin=Object.assign({},rec.admin||{},{contato:b.responsavel.split(" ")[0]});
    var r=Object.assign({},rotinaOf(id));
    var ti=TEMPO_OPC.map(function(o){return o[1]}).indexOf(b.tempo);if(ti>=0){r.tempoGrav=TEMPO_OPC[ti][0];r.maxGrav=CAPACIDADE[r.tempoGrav].grav;}
    var fi=BRIEF_FREQ.indexOf(b.frequencia),n=fi>=0?[3,4,5,7][fi]:0;
    if(n){var map={"Dom":0,"Seg":1,"Ter":2,"Qua":3,"Qui":4,"Sex":5,"Sáb":6},esc2=(b.dias||"").split(/,\s*/).map(function(d){return map[d]}).filter(function(x){return x!=null});
      // Mais dias marcados que postagens: espalha pela semana (Seg–Sex, 3 → Seg, Qua, Sex).
      var dias=esc2.length>n?(n===1?[esc2[0]]:Array.apply(null,Array(n)).map(function(_,i){return esc2[Math.round(i*(esc2.length-1)/(n-1))]})):esc2.slice();DIAS_PADRAO[n].forEach(function(d){if(dias.length<n&&dias.indexOf(d)<0)dias.push(d);});r.diasPost=dias.sort();}
    var gi=DIAS_SEM_LONGO.indexOf(b.gravdia);if(gi>=0)r.gravDia=gi;
    if(b.funil){var fz=/\(topo\)/.test(b.funil)?"topo":/\(meio\)/.test(b.funil)?"meio":/\(fundo\)/.test(b.funil)?"fundo":"equilibrio";r.foco=fz;}
    rec.rotina=r;
    return rec;
  }
  async function importarBriefing(b,destino){
    var nome=b.name.trim(),alvo=destino&&DB_CLIENTS[destino]?destino:null,norm=function(x){return normalizeTextPanel(x).replace(/[^a-z0-9]+/g,"")};
    if(!alvo)Object.keys(DB_CLIENTS).forEach(function(id){if(norm(DB_CLIENTS[id].name||"")===norm(nome))alvo=id;});
    if(alvo&&!destino&&!confirm("Já existe um cliente chamado \""+nome+"\". Atualizar a ficha dele com este briefing?"))alvo=null;
    var id=alvo||await createClient(nome,b.niche||"");
    var rec=fichaDoBriefing(id,b),fi=BRIEF_FREQ.indexOf(b.frequencia),n=fi>=0?[3,4,5,7][fi]:0;
    var narr=briefingNarrativa(b);rec.briefing=(rec.briefing?rec.briefing+"\n\n":"")+narr;
    await saveClientRecord(id,rec);
    var cli=byId(id);if(cli){cli.niche=rec.niche;cli.full=rec.name+(rec.niche?" — "+rec.niche:"");refreshClientOptions();}
    var refs=[];function addRefs(txt,tipo){String(txt||"").split(/\n|;|,(?=\s*@)/).map(function(x){return x.trim()}).filter(Boolean).forEach(function(l){var m=l.match(/^(@?[\w.]+)\s*[-—–:]?\s*(.*)$/);refs.push({nome:m?m[1]:l.slice(0,40),tipo:tipo,descricao:m?m[2]:l});});}
    addRefs(b.referencias,"Referência de estilo");addRefs(b.concorrentes,"Concorrente direto");
    if(refs.length)await dbDoc("cos_refs/"+id).set({items:refs.slice(0,5)});
    var dnaDoc=await dbDoc("cos_dna/"+id).get(),atuais=dnaDoc.exists?((dnaDoc.data()||{}).entries||[]):[];
    var novas=irisToDnaEntries(irisExtract(narr,"Briefing do cliente (formulário) — "+new Date().toLocaleDateString("pt-BR")));
    await dbDoc("cos_dna/"+id).set({entries:atuais.concat(novas)});
    delete DB_STATE_CACHE[id];
    return {id:id,atualizado:!!alvo,sugestoes:novas.length,refs:Math.min(5,refs.length),freq:n,tempo:b.tempo||""};
  }
  // ---------- Caixa de entrada de briefings: lê do Gmail do estrategista (conector) → cria o cliente → monta tudo ----------
  var INBOX_Q='subject:"Briefing de conteúdo" newer_than:180d';
  async function gmail(tool,input){
    var mcp=null;try{mcp=window.claude&&claude.use?await claude.use("mcp"):null;}catch(e){}
    if(!mcp)throw {code:"no_mcp"};
    var r=await mcp.callTool("Gmail",tool,input,{cache:false});return r&&r.payload!=null?r.payload:r;
  }
  function gmailErr(e){var c=e&&e.code;
    if(c==="no_mcp"||c==="not_granted"||c==="capability_disabled"||c==="capability_removed")return "A caixa de entrada só funciona no painel aberto pelo link, no claude.ai.";
    if(c==="needs_reauth")return "Reconecte o Gmail em claude.ai → Configurações → Conectores e tente de novo.";
    if(c==="server_not_connected"||c==="server_not_found")return "Adicione o conector Gmail em claude.ai → Configurações → Conectores.";
    if(c==="selection_required")return "Você tem mais de um Gmail conectado — escolha qual usar no aviso do Claude.";
    if(c==="not_in_manifest")return "O painel não tem permissão para ler o Gmail. Recarregue a página e permita quando o Claude perguntar.";
    if(c==="blocked_by_policy"||c==="approval_required")return "A política da sua conta bloqueou a leitura do Gmail.";
    if(c==="server_unavailable"||c==="rate_limited")return "O Gmail não respondeu agora — tente de novo em instantes.";
    return "Não consegui ler o Gmail agora"+(c?" ("+c+")":"")+" — tente de novo.";}
  function msgsOf(t){return (t&&(t.messages||t.message))||[];}
  function corpoOf(m){var c=m.plaintextBody||m.plaintext_body||m.plainTextBody||m.textBody||m.body;if(c)return String(c);
    for(var k in m){if(typeof m[k]==="string"&&m[k].indexOf("▸")>=0)return m[k];}return String(m.snippet||"");}
  async function inboxStatus(){var st={};try{var sn=await CAP.db.collection("cos_inbox").get();sn.docs.forEach(function(d){var v=d.data();if(v)st[d.id]=v;});}catch(e){}return st;}
  // ---- Retornos de pauta (aprovação / ajuste) vindos do arquivo do cliente → aplicados no painel ----
  var RET_Q='subject:"Retorno de pauta" newer_than:120d';
  function parseRetornos(txt){var out=[],re=/ref:\s*CAL\|([^|\s]+)\|([^|\s]+)\|(aprovado|ajuste)/g,m,ini=0;txt=String(txt||"").replace(/\r/g,"");
    while((m=re.exec(txt))){var bloco=txt.slice(ini,m.index),linhas=bloco.split("\n").map(function(l){return l.trim()}).filter(Boolean);
      var i0=-1;for(var k=linhas.length-1;k>=0;k--){if(/^(✅|✏️)/.test(linhas[k])){i0=k;break;}}
      var nota=m[3]==="ajuste"&&i0>=0?linhas.slice(i0+1).join("\n").trim():"";
      out.push({cid:m[1],iid:m[2],status:m[3],note:nota});ini=re.lastIndex;}
    return out;}
  async function aplicarRetornos(lista,quando){var ok=0,res={aprovado:0,ajuste:0};
    for(var i=0;i<lista.length;i++){var r=lista[i];if(!DB_CLIENTS[r.cid])continue;
      try{var ref=dbItemsCol("cos_calendar",r.cid).doc(r.iid),d=await ref.get();if(!d.exists)continue;
        var patch={clientStatus:r.status,clientAt:quando||new Date().toISOString()};if(r.status==="ajuste")patch.clientNote=r.note||"(sem detalhes)";
        await ref.update(patch);ok++;res[r.status]++;
        var cache=DB_STATE_CACHE[r.cid];if(cache&&cache.calendar){(cache.calendar.items||[]).forEach(function(it){if(it.id===r.iid)Object.assign(it,patch);});}
      }catch(e){}}
    return {total:ok,aprovado:res.aprovado,ajuste:res.ajuste};}
  async function sincronizarRetornosGmail(){
    var res=await gmail("search_threads",{query:RET_Q,pageSize:25,view:"THREAD_VIEW_METADATA_ONLY"}),th=(res&&res.threads)||[],st=await inboxStatus(),soma={total:0,aprovado:0,ajuste:0};
    for(var i=0;i<th.length;i++){
      var t=await gmail("get_thread",{threadId:th[i].id,messageFormat:"PLAIN_TEXT"}),ms=msgsOf(t).slice().sort(function(a,b){return String(a.date||"")<String(b.date||"")?-1:1});
      for(var j=0;j<ms.length;j++){var m=ms[j],chave="msg_"+(m.id||(th[i].id+"_"+j));if(st[chave])continue;
        var r=await aplicarRetornos(parseRetornos(corpoOf(m)),m.date?new Date(m.date).toISOString():null);
        soma.total+=r.total;soma.aprovado+=r.aprovado;soma.ajuste+=r.ajuste;
        await CAP.db.doc("cos_inbox/"+chave).set({status:"aplicado",tipo:"retorno",n:r.total,at:new Date().toISOString()});}
    }
    return soma;}
  async function renderInbox(){
    var box=I("#inboxList");if(!box)return;setBusy(box,"Procurando briefings e retornos de pauta no Gmail…");
    var retHtml="";
    try{var sr=await sincronizarRetornosGmail();retHtml='<div style="font-size:12.5px;margin-bottom:10px;padding:8px 10px;border-radius:9px;background:var(--surface-2)">📌 Retornos de pauta: '+(sr.total?'<b>'+sr.total+' novo(s) aplicado(s)</b> — ✓ '+sr.aprovado+' aprovação(ões), ✏️ '+sr.ajuste+' ajuste(s). Veja em Calendário ou Clientes ativos.':'nenhum novo.')+'</div>';}
    catch(e){retHtml='<div style="font-size:12px;color:var(--warn);margin-bottom:8px">Retornos de pauta: '+esc(gmailErr(e))+'</div>';}
    try{
      var res=await gmail("search_threads",{query:INBOX_Q,pageSize:25,view:"THREAD_VIEW_MINIMAL"});
      var th=(res&&res.threads)||[],st=await inboxStatus();clearBusy(box);
      if(!th.length){box.innerHTML=retHtml+'<div style="font-size:12.5px;color:var(--muted)">Nenhum briefing recebido ainda. Quando o cliente tocar em <b>Enviar por e-mail</b> no formulário, ele aparece aqui.</div>';return;}
      box.innerHTML=retHtml+th.map(function(t){var m=msgsOf(t)[0]||{},sub=String(m.subject||"Briefing").replace(/^.*Briefing de conteúdo\s*[—-]?\s*/i,"")||"(sem nome)",s0=st[t.id],dt=m.date?new Date(m.date).toLocaleDateString("pt-BR"):"";
        return '<div class="ag-row" style="cursor:default;align-items:center"><div style="flex:1;min-width:0"><b>'+esc(sub)+'</b><div class="ag-sub">'+esc(m.sender||"")+(dt?' · '+esc(dt):'')+'</div></div>'+
          (s0&&s0.status==="importado"?'<span class="badge act">✓ importado</span>'+(s0.clientId&&DB_CLIENTS[s0.clientId]?'<button class="btn" data-inbox-open="'+esc(s0.clientId)+'">Abrir</button>':''):
           s0&&s0.status==="ignorado"?'<span class="badge">ignorado</span><button class="btn ghost" data-inbox-go="'+esc(t.id)+'">Importar mesmo assim</button>':
           '<button class="btn pri genbtn" data-inbox-go="'+esc(t.id)+'">✦ Criar cliente e montar tudo</button><button class="btn ghost" data-inbox-skip="'+esc(t.id)+'">Ignorar</button>')+'</div>';}).join('');
      Array.prototype.forEach.call(box.querySelectorAll('[data-inbox-go]'),function(b){b.addEventListener('click',function(){importarDoGmail(b.getAttribute('data-inbox-go'),b);})});
      Array.prototype.forEach.call(box.querySelectorAll('[data-inbox-skip]'),function(b){b.addEventListener('click',function(){CAP.db.doc("cos_inbox/"+b.getAttribute('data-inbox-skip')).set({status:"ignorado",at:new Date().toISOString()}).then(renderInbox);})});
      Array.prototype.forEach.call(box.querySelectorAll('[data-inbox-open]'),function(b){b.addEventListener('click',function(){setClient(b.getAttribute('data-inbox-open'));go("calendar");})});
    }catch(e){clearBusy(box);box.innerHTML='<div style="font-size:12.5px;color:var(--warn)">'+esc(gmailErr(e))+'</div>';}
  }
  async function importarDoGmail(threadId,btn){
    if(btn)btn.disabled=true;var msg=I("#inboxMsg");setBusy(msg,"Lendo o briefing…");
    try{
      var t=await gmail("get_thread",{threadId:threadId,messageFormat:"PLAIN_TEXT"}),parsed=null;
      msgsOf(t).forEach(function(m){if(!parsed)parsed=parseBriefing(corpoOf(m));});
      if(!parsed){clearBusy(msg);msg.textContent="Esse e-mail não tem as respostas completas do formulário — peça ao cliente para reenviar (ou use Copiar respostas).";msg.style.color="var(--warn)";if(btn)btn.disabled=false;return;}
      var dias=+((I("#inboxDias")||{}).value||30);
      var r=await importarBriefing(parsed);
      await CAP.db.doc("cos_inbox/"+threadId).set({status:"importado",clientId:r.id,at:new Date().toISOString()});
      clearBusy(msg);msg.textContent="";
      montarTudo(r.id,dias);
    }catch(e){clearBusy(msg);msg.textContent=e&&e.code?gmailErr(e):"Não consegui importar agora — tente de novo.";msg.style.color="var(--warn)";if(btn)btn.disabled=false;}
  }
  function briefToolsHtml(){
    if(state.clientView)return '';
    return '<div class="card pad" style="margin-bottom:16px"><div class="bt" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--faint);margin-bottom:8px">Briefing do cliente por formulário</div>'+
      '<div style="font-size:12.5px;color:var(--muted);margin-bottom:12px">1) Baixe o formulário e envie ao cliente (WhatsApp/e-mail) · 2) ele preenche no celular e toca em <b>Enviar pelo WhatsApp</b> · 3) você cola a mensagem em <b>Importar briefing</b> — o cliente é criado com ficha, frequência, tempo de gravação e o Content DNA sugerido pela Íris.</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" id="bfForm">📨 Formulário de briefing para enviar</button><button class="btn" id="bfImport">📥 Importar briefing (colar)</button></div></div>'+
      '<div class="card pad" style="margin-bottom:16px"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px"><div class="bt" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--faint)">📬 Caixa de entrada de briefings (Gmail)</div>'+
      '<span style="margin-left:auto;font-size:12px;color:var(--muted)">Calendário de</span><select id="inboxDias" style="font:inherit;font-size:12px;border:1px solid var(--line);border-radius:8px;padding:4px 6px;background:var(--surface)">'+[30,45,60,90].map(function(d){return '<option value="'+d+'">'+d+' dias</option>'}).join('')+'</select><button class="btn" id="inboxRefresh">↻ Verificar briefings e retornos</button></div>'+
      '<div id="inboxList" style="font-size:12.5px;color:var(--muted)">Clique em <b>Verificar novos briefings</b> — o painel procura no seu Gmail os briefings enviados pelo formulário e as aprovações/ajustes que os clientes mandam pelo calendário. Na primeira vez o Claude pede permissão para o painel ler o Gmail.</div><div id="inboxMsg" style="font-size:12px;margin-top:8px"></div></div>';
  }
  var MSG_PADRAO="Oi, [nome]! Tudo bem? Preparei um briefing rápido para montar a sua estratégia e o seu calendário de conteúdo. Abra o arquivo, responda com calma e, no final, toque em \"Enviar por e-mail\". Quanto mais detalhes você colocar, mais personalizadas ficam a sua estratégia e as ideias de conteúdo. Qualquer dúvida, me chama!";
  function msgConvite(tpl,nome){var t=String(tpl||MSG_PADRAO);return nome?t.replace(/\[nome\]/gi,nome):t.replace(/,\s*\[nome\]/gi,"").replace(/\s*\[nome\]/gi,"");}
  function openBriefFormModal(nomePre){
    var c=formCfg();
    I("#overlay").innerHTML='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" style="width:min(460px,100%)"><div class="dh"><div class="d-title">Formulário de briefing</div><button class="icon-btn" id="dclose">✕</button></div><div class="db"><div class="block">'+
      '<div style="font-size:12.5px;color:var(--muted);margin-bottom:14px">Gera um arquivo que abre no celular do cliente. Ele responde (frequência desejada, tempo para gravar, público, dores, diferencial…) e as respostas chegam no seu WhatsApp, prontas para importar.</div>'+
      '<div class="fld"><label for="bfNome">Seu nome ou agência (aparece no formulário)</label><input id="bfNome" value="'+esc(c.nome||"")+'" placeholder="Ex.: Tarik Estratégia de Conteúdo"></div>'+
      '<div class="fld"><label for="bfWhats">Seu WhatsApp com DDD (para receber as respostas)</label><input id="bfWhats" value="'+esc(c.whats||"")+'" placeholder="Ex.: 11 99999-9999"></div>'+
      '<div class="fld"><label for="bfEmail">Seu e-mail (Gmail conectado ao Claude — os briefings chegam na Caixa de entrada do painel)</label><input id="bfEmail" value="'+esc(c.email||"")+'" placeholder="seuemail@gmail.com"></div>'+
      '<div class="fld"><label for="bfCliente">Nome do cliente (aparece no formulário e na mensagem)</label><input id="bfCliente" placeholder="Ex.: Ana"></div>'+
      '<div class="fld"><label for="bfTpl">Mensagem para enviar junto — edite à vontade ([nome] vira o nome do cliente)</label><textarea class="ta" id="bfTpl" style="min-height:120px">'+esc(c.msg||MSG_PADRAO)+'</textarea></div>'+
      '<div class="fld"><label>Como vai ficar</label><div class="copybox" id="bfPrevMsg"></div></div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn pri genbtn" id="bfBaixar">⬇ Baixar formulário</button><button class="btn" id="bfCopyMsg">📋 Copiar mensagem</button><button class="btn ghost" id="bfResetMsg">Voltar ao texto padrão</button><span id="bfMsg" style="font-size:12px;color:var(--muted)"></span></div>'+
      '<div style="font-size:11.5px;color:var(--faint);margin-top:12px">Envie o arquivo <b>briefing-de-conteudo.html</b> ao cliente. No celular ele toca no arquivo e abre no navegador. Não precisa de login nem de conta.</div></div></div></aside>';
    I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);document.addEventListener('keydown',escClose);
    if(typeof nomePre==="string"&&nomePre)I("#bfCliente").value=nomePre;
    function prevMsg(){I("#bfPrevMsg").textContent=msgConvite(I("#bfTpl").value,I("#bfCliente").value.trim());}
    prevMsg();I("#bfTpl").addEventListener('input',prevMsg);I("#bfCliente").addEventListener('input',prevMsg);
    function lerCfg(){var cfg={nome:I("#bfNome").value.trim(),whats:I("#bfWhats").value.trim(),email:I("#bfEmail").value.trim(),msg:I("#bfTpl").value};saveFormCfg(cfg);return cfg;}
    I("#bfResetMsg").addEventListener('click',function(){I("#bfTpl").value=MSG_PADRAO;prevMsg();lerCfg();});
    I("#bfCopyMsg").addEventListener('click',function(){lerCfg();var t=msgConvite(I("#bfTpl").value,I("#bfCliente").value.trim()),m=I("#bfMsg");
      function ok(){if(m){m.textContent="✓ Mensagem copiada — cole no WhatsApp junto com o arquivo";m.style.color="var(--good)";}}
      if(navigator.clipboard)navigator.clipboard.writeText(t).then(ok,function(){var ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand("copy")}catch(e){}document.body.removeChild(ta);ok();});
      else{var ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand("copy")}catch(e){}document.body.removeChild(ta);ok();}});
    I("#bfBaixar").addEventListener('click',function(){var cfg=lerCfg(),cli=I("#bfCliente").value.trim();cfg=Object.assign({},cfg,{cliente:cli});
      downloadText("briefing-de-conteudo"+(cli?"-"+slugify(cli):"")+".html",buildBriefingFormHtml(cfg),"text/html",function(ok){var m=I("#bfMsg");if(m){m.textContent=ok?"✓ Baixado — envie ao cliente":"Não consegui baixar agora";m.style.color=ok?"var(--good)":"var(--warn)";}});});
  }
  // ---------- Montar tudo automaticamente: DNA (Íris) → Estratégia → Linha Editorial → Ideias → Calendário ----------
  var AUTO_STEPS=[["dna","Content DNA (Íris lê o briefing)"],["strategy","Estratégia (Átlas)"],["editorial","Linha Editorial (Bússola)"],["ideas","Ideias (Musa)"],["calendar","Calendário editorial (Cronos)"]];
  function autoFeito(k,g){g=g||{};return k==="dna"?(g.dna||[]).length>=5:k==="strategy"?!!g.strategy:k==="editorial"?(g.editorial||[]).length>0:k==="ideas"?(g.ideas||[]).length>0:((g.calendar&&g.calendar.items)||[]).length>0;}
  function autoModalHtml(done,atual,erro,days){
    return '<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" style="width:min(480px,100%)"><div class="dh"><div class="d-title">Montando tudo — '+esc(clientName(state.client))+'</div><button class="icon-btn" id="dclose">✕</button></div><div class="db"><div class="block">'+
      '<div style="font-size:12.5px;color:var(--muted);margin-bottom:12px">Cada agente usa o resultado do anterior. Leva alguns minutos — pode deixar esta janela aberta. Calendário de <b>'+days+' dias</b>, na frequência e com o limite de gravações da rotina do cliente.</div>'+
      AUTO_STEPS.map(function(st){var ok=done.indexOf(st[0])>=0,cur=atual===st[0];return '<div class="stepi'+(ok?' ok':'')+'" style="cursor:default"><span class="dot">'+(ok?'✓':cur&&!erro?'<span class="spinner" style="margin:0;width:11px;height:11px"></span>':'')+'</span>'+esc(st[1])+(cur&&erro?' <span style="color:var(--warn)">— '+esc(erro)+'</span>':'')+'</div>'}).join('')+
      (erro?'<div style="margin-top:14px"><button class="btn pri" id="autoRetry">Continuar de onde parou</button></div>':'')+
      (done.length===AUTO_STEPS.length?'<div style="margin-top:14px;font-size:13px">✓ Pronto! Revise o <b>Content DNA</b> (as sugestões ficam pendentes para você aprovar) e confira a <b>Linha Editorial</b> e o <b>Calendário</b>.</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn pri" id="autoGoCal">Ver o calendário</button><button class="btn" id="autoGoEd">Ver a linha editorial</button></div>':'')+
      '</div></div></aside>';
  }
  async function montarTudo(id,days){
    if(!CAP.sample){noAi();return;}
    if(state.client!==id)setClient(id);
    state.autoRunning=id;
    try{GENERATED=await loadDbClientState(id);}catch(e){state.autoRunning=null;throw e;}
    var done=[],atual="",erro="",lastErr=null;
    function draw(){if(state.client!==id)return;I("#overlay").innerHTML=autoModalHtml(done,atual,erro,days);I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);
      var r=I("#autoRetry");if(r){r.addEventListener('click',function(){montarTudo(id,days)});cooldownBtn(r,lastErr,60);}
      var gc=I("#autoGoCal");if(gc)gc.addEventListener('click',function(){closeDrawer();go("calendar")});var ge=I("#autoGoEd");if(ge)ge.addEventListener('click',function(){closeDrawer();go("editorial")});}
    AUTO_STEPS.forEach(function(st){if(autoFeito(st[0],GENERATED))done.push(st[0]);});
    for(var i=0;i<AUTO_STEPS.length;i++){var k=AUTO_STEPS[i][0];if(done.indexOf(k)>=0)continue;
      if(state.client!==id){state.autoRunning=null;return;}
      atual=k;erro="";draw();
      try{
        if(k==="dna"){var rec=DB_CLIENTS[id]||{},brief=[rec.briefing||"",fichaCompact()].filter(Boolean).join("\n");
          var out=await CAP.sample.json(buildIrisPrompt(byId(id).name,brief),{modelTier:"default",cache:false});
          var entries=(GENERATED.dna||[]).slice();((out&&out.suggestions)||[]).forEach(function(x){if(!x||!x.field||!x.value)return;entries.push({section:x.section||"business",field:String(x.field),value:String(x.value),state:x.state||"HYPOTHESIS",status:"pending",src:"Briefing do cliente — Íris"});});
          await saveDna(id,entries);if(!entries.length)throw new Error("sem dados");}
        else if(k==="strategy"){await runGerarEstrategia();if(!GENERATED.strategy)throw new Error("falhou");}
        else if(k==="editorial"){await runGerarEditorial();if(!(GENERATED.editorial||[]).length)throw new Error("falhou");}
        else if(k==="ideas"){await gerarIdeiasCore(id,false,15);if(!(GENERATED.ideas||[]).length)throw new Error("falhou");}
        else{state.period=days;await runGerarPlanejamento(days);if(!((GENERATED.calendar&&GENERATED.calendar.items)||[]).length)throw new Error("falhou");}
        done.push(k);
      }catch(e){erro=e&&e.code?sampleErrCopy(e):"não deu certo agora — tente de novo";lastErr=e;state.autoRunning=null;draw();return;}
    }
    try{if(!(vitrineOf(id).mensagem)&&DB_CLIENTS[id]){var mv=await gerarMensagemVitrine();await saveClientRecord(id,Object.assign({},DB_CLIENTS[id],{vitrine:Object.assign({},vitrineOf(id),{mensagem:mv})}));}}catch(e){}
    state.autoRunning=null;atual="";draw();renderKpis();
  }
  function openBriefImportModal(destino){destino=typeof destino==="string"?destino:null;
    I("#overlay").innerHTML='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" style="width:min(560px,100%)"><div class="dh"><div class="d-title">Importar briefing recebido</div><button class="icon-btn" id="dclose">✕</button></div><div class="db"><div class="block">'+
      '<div style="font-size:12.5px;color:var(--muted);margin-bottom:10px">Cole aqui a mensagem que o cliente enviou: o <b>briefing</b> (começa com “'+esc(BRIEF_MARK)+'”) ou um <b>retorno de pauta</b> (aprovação/ajuste vindo do calendário).</div>'+
      '<textarea class="ta" id="bfTxt" style="min-height:220px" placeholder="'+esc(BRIEF_MARK)+'&#10;&#10;▸ Nome da empresa ou marca&#10;…"></textarea>'+
      '<div id="bfPrev" style="font-size:12.5px;color:var(--muted);margin:10px 0"></div>'+
      '<button class="btn pri genbtn" id="bfGo" disabled>Criar cliente com este briefing</button><span id="bfIMsg" style="margin-left:10px;font-size:12px;color:var(--muted)"></span></div></div></aside>';
    I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);document.addEventListener('keydown',escClose);
    var parsed=null;
    var rets=[];
    I("#bfTxt").addEventListener('input',function(){parsed=parseBriefing(this.value);var p=I("#bfPrev");rets=parsed?[]:parseRetornos(this.value);
      if(rets.length){p.innerHTML='✓ <b>'+rets.length+' retorno(s) de pauta</b> do cliente (aprovação/ajuste).';I("#bfGo").disabled=false;I("#bfGo").textContent="Aplicar retornos no calendário";return;}
      I("#bfGo").textContent="Criar cliente com este briefing";
      if(!parsed){p.innerHTML=this.value.trim()?'<span style="color:var(--warn)">Não reconheci o briefing — cole a mensagem inteira, do jeito que chegou.</span>':'';I("#bfGo").disabled=true;return;}
      var n=Object.keys(parsed).length;p.innerHTML='✓ <b>'+esc(parsed.name)+'</b>'+(parsed.niche?' — '+esc(parsed.niche):'')+' · '+n+' respostas'+(parsed.frequencia?' · '+esc(parsed.frequencia):'')+(parsed.tempo?' · gravação: '+esc(parsed.tempo):'');I("#bfGo").disabled=false;});
    I("#bfGo").addEventListener('click',async function(){
      if(!parsed&&rets.length){var rr=await aplicarRetornos(rets);closeDrawer();toast(rr.total?"✓ "+rr.total+" retorno(s) aplicados: "+rr.aprovado+" aprovação(ões), "+rr.ajuste+" ajuste(s).":"Não encontrei essas pautas no painel.");renderView(state.view);return;}
      if(!parsed)return;if(!CAP.db){noAi();return;}
      I("#bfGo").disabled=true;setBusy(I("#bfIMsg"),"Importando…");
      try{var r=await importarBriefing(parsed,destino);setClient(r.id);if(!destino)go("dna");
        I("#overlay").innerHTML='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" style="width:min(480px,100%)"><div class="dh"><div class="d-title">'+(r.atualizado?'Cliente atualizado':'Cliente criado')+' ✓</div><button class="icon-btn" id="dclose">✕</button></div><div class="db"><div class="block">'+
          '<div style="font-size:13px;margin-bottom:12px"><b>'+esc(parsed.name)+'</b> — ficha preenchida, '+r.sugestoes+' sugestões no Content DNA'+(r.refs?', '+r.refs+' referência(s)':'')+(r.freq?', <b>'+r.freq+' conteúdos/semana</b>':'')+(r.tempo?', gravação: <b>'+esc(r.tempo)+'</b>':'')+'.</div>'+
          '<div style="font-size:12.5px;color:var(--muted);margin-bottom:12px">Quer que o painel monte o resto agora? A Íris lê o briefing, e os agentes geram Estratégia → Linha Editorial → Ideias → Calendário, na frequência que o cliente pediu.</div>'+
          '<div class="plrow"><span class="pllbl">Calendário de</span>'+[30,45,60,90].map(function(d){return '<button class="preset autoDays" data-days="'+d+'" style="'+(d===30?'background:var(--brand-weak);color:var(--brand-ink);border-color:transparent':'')+'">'+d+' dias</button>'}).join('')+'</div>'+
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn pri genbtn" id="autoGo">✦ Montar tudo automaticamente</button><button class="btn" id="autoNo">Agora não — vou revisar antes</button></div></div></div></aside>';
        var dias=30;I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);I("#autoNo").addEventListener('click',closeDrawer);
        Array.prototype.forEach.call(document.querySelectorAll('.autoDays'),function(b){b.addEventListener('click',function(){dias=+b.getAttribute('data-days');Array.prototype.forEach.call(document.querySelectorAll('.autoDays'),function(x){x.style.cssText=x===b?'background:var(--brand-weak);color:var(--brand-ink);border-color:transparent':''});})});
        I("#autoGo").addEventListener('click',function(){montarTudo(r.id,dias);});}
      catch(e){I("#bfIMsg").textContent="Não consegui importar — tente de novo.";I("#bfIMsg").style.color="var(--warn)";I("#bfGo").disabled=false;}});
  }
