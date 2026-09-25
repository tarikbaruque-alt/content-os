  // ---------- Configuração (chaves & integrações) ----------
  var CFG_KEY="contentos.keys.v1";
  var CFG_FIELDS=[
    {k:"ANTHROPIC_API_KEY",l:"Anthropic API Key",ph:"sk-ant-...",secret:true,grp:"Anthropic (Rima · Mosaico · Enredo)"},
    {k:"ANTHROPIC_MODEL",l:"Modelo (opcional)",ph:"claude-opus-5 (padrão) · claude-sonnet-5 (mais barato)",secret:false,grp:"Anthropic (Rima · Mosaico · Enredo)"},
    {k:"NOTION_API_KEY",l:"Notion Integration Token",ph:"ntn_...",secret:true,grp:"Notion (sincronização)"},
    {k:"NOTION_DATABASE_ID",l:"Notion Database ID",ph:"32 caracteres da URL do database",secret:false,grp:"Notion (sincronização)"},
    {k:"PIXABAY_API_KEY",l:"Pixabay API Key (opcional)",ph:"para imagens reais no carrossel/Stories",secret:true,grp:"Imagens (opcional)"}
  ];
  function cfgLoad(){try{return JSON.parse(localStorage.getItem(CFG_KEY)||"{}")||{}}catch(e){return {}}}
  function cfgSave(o){try{localStorage.setItem(CFG_KEY,JSON.stringify(o));return true}catch(e){return false}}
  function cfgVals(){var o={};CFG_FIELDS.forEach(function(f){var el=I("#cfg_"+f.k);if(el)o[f.k]=el.value.trim()});return o}
  function buildEnvText(v){
    var lines=["# Content OS — gerado pela aba Configuração do painel","# Salve este arquivo como .env na RAIZ do projeto. NUNCA comite (já está no .gitignore).",""];
    lines.push("CONTENT_OS_LLM_PROVIDER="+(v.ANTHROPIC_API_KEY?"anthropic":"mock"));
    ["ANTHROPIC_API_KEY","ANTHROPIC_MODEL","NOTION_API_KEY","NOTION_DATABASE_ID","PIXABAY_API_KEY"].forEach(function(k){lines.push(k+"="+(v[k]||""))});
    return lines.join("\n")+"\n";
  }
  function cfgStatus(v){
    var anthropic=!!v.ANTHROPIC_API_KEY, notion=!!(v.NOTION_API_KEY&&v.NOTION_DATABASE_ID), pix=!!v.PIXABAY_API_KEY;
    function pill(ok,txt){return '<span class="statuspill '+(ok?"lvl-func":"lvl-nao")+'">'+(ok?"● ":"○ ")+txt+'</span>'}
    return pill(anthropic,"Anthropic")+" "+pill(notion,"Notion")+" "+pill(pix,"Pixabay");
  }
  function renderConfig(){
    var saved=cfgLoad();
    var groups={};CFG_FIELDS.forEach(function(f){(groups[f.grp]=groups[f.grp]||[]).push(f)});
    var forms=Object.keys(groups).map(function(g){
      var rows=groups[g].map(function(f){
        return '<div class="fld"><label>'+esc(f.l)+'</label><input id="cfg_'+f.k+'" type="'+(f.secret?"password":"text")+'" placeholder="'+esc(f.ph)+'" value="'+esc(saved[f.k]||"")+'" autocomplete="off" spellcheck="false"></div>';
      }).join('');
      return '<div class="card pad" style="margin-bottom:14px"><div class="eyebrow" style="margin-bottom:12px">'+esc(g)+'</div>'+rows+'</div>';
    }).join('');
    var h='';
    h+='<div class="section-head" style="margin-top:6px"><div><h3>Configuração — chaves & integrações</h3><p>Preencha <b>uma vez</b>. As chaves ficam salvas <b>no seu navegador</b> e você gera o arquivo <code>.env</code> para conectar tudo de forma permanente.</p></div><div id="cfgStatus">'+cfgStatus(saved)+'</div></div>';
    h+='<div class="callout" style="margin-bottom:16px"><span style="font-size:15px">🔒</span><div class="em"><b>Como funciona a permanência.</b> Os comandos (<code>pipeline</code>, <code>notion:sync</code>, <code>doctor</code>) leem as chaves de um arquivo <code>.env</code> na raiz do projeto — carregado automaticamente. Preencha aqui, clique em <b>Baixar .env</b>, salve na raiz e pronto: fica sempre conectado, sem redigitar. <br>No Claude Code na web, prefira cadastrar as mesmas chaves em <b>Credenciais de API do ambiente</b> (persistem entre sessões) e liberar os hosts <code>api.anthropic.com</code> e <code>api.notion.com</code> na rede.</div></div>';
    h+=backupHtml()+forms;
    h+='<div class="card pad"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px"><button class="btn pri" id="cfgSave">Salvar no navegador</button><button class="btn" id="cfgDownload">⬇︎ Baixar .env</button><button class="btn" id="cfgCopy">Copiar .env</button><button class="btn ghost" id="cfgClear">Limpar</button><span id="cfgMsg" style="align-self:center;font-size:12px;color:var(--good)"></span></div><div class="fld"><label>Prévia do .env</label><textarea id="cfgEnv" class="ta mono" style="min-height:150px" readonly></textarea></div></div>';
    I('.view[data-view="config"]').innerHTML=h;
    function refresh(){var v=cfgVals();I("#cfgEnv").value=buildEnvText(v);I("#cfgStatus").innerHTML=cfgStatus(v);}
    CFG_FIELDS.forEach(function(f){var el=I("#cfg_"+f.k);if(el)el.addEventListener('input',refresh)});
    refresh();
    wireBackup();
    function msg(t){I("#cfgMsg").textContent=t;setTimeout(function(){if(I("#cfgMsg"))I("#cfgMsg").textContent=""},2600)}
    I("#cfgSave").addEventListener('click',function(){msg(cfgSave(cfgVals())?"✓ Salvo neste navegador":"Não foi possível salvar (navegação privada?)")});
    I("#cfgDownload").addEventListener('click',function(){
      cfgSave(cfgVals());
      var env=buildEnvText(cfgVals());
      function localDL(){try{var b=new Blob([env],{type:"text/plain"});var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=".env";document.body.appendChild(a);a.click();document.body.removeChild(a);msg("✓ .env baixado — salve na raiz do projeto");}catch(e){msg("Use Copiar .env e cole num arquivo .env");}}
      function viaCap(dl){
        if(!dl){localDL();return;}
        dl.save({filename:"env.txt",data:env}).then(
          function(){msg("✓ Baixado como env.txt — renomeie para .env na raiz do projeto");},
          function(){msg("Download recusado — use Copiar .env");}
        );
      }
      if(window.claude&&claude.use){claude.use("downloads").then(viaCap,localDL);}else{localDL();}
    });
    I("#cfgCopy").addEventListener('click',function(){var ta=I("#cfgEnv");ta.select();var ok=false;try{ok=document.execCommand('copy')}catch(e){}if(!ok&&navigator.clipboard){navigator.clipboard.writeText(ta.value).then(function(){msg("✓ Copiado")},function(){msg("Selecione e copie manualmente")});}else{msg(ok?"✓ Copiado":"Selecione e copie manualmente")}});
    I("#cfgClear").addEventListener('click',function(){CFG_FIELDS.forEach(function(f){var el=I("#cfg_"+f.k);if(el)el.value=""});cfgSave({});refresh();msg("Limpo")});
  }

  // ---------- content drawer ----------
  var NO_CLIENT={id:"",name:"Nenhum cliente",full:"Nenhum cliente ainda",niche:"",av:0};
  function byId(id){for(var i=0;i<CLIENTS.length;i++)if(CLIENTS[i].id===id)return CLIENTS[i];return CLIENTS[0]||NO_CLIENT}
  function getContent(id){for(var i=0;i<CONTENT.length;i++)if(CONTENT[i].id===id)return CONTENT[i];return null}
  function chainHtml(x){
    var nodes=[["Estratégia",clientName(x.client)],["Objetivo",x.objetivo],["Mensagem","Big Message"],["Emoção",x.emocao,true],["Ideia",x.format],["Formato",x.surface+" + "+x.format],["Roteiro/Copy",x.roteiro?"Roteiro":"Carrossel"],["CTA","→"]];
    return '<div class="chain">'+nodes.map(function(n,i){return '<div class="cnode'+(n[2]?' hot':'')+'"><b>'+esc(n[0])+'</b>'+esc(n[1])+'</div>'+(i<nodes.length-1?'<span class="car">›</span>':'')}).join('')+'</div>';
  }
  function meta(k,v){return '<div><div class="mk">'+esc(k)+'</div><div class="mv">'+esc(v)+'</div></div>'}
  function stepsHtml(arr,editable){return '<div class="steps">'+arr.map(function(s,i){return '<div class="stp"><div class="sl">'+esc(s[0])+'</div><div class="sv"'+(editable?' contenteditable="true" data-step="'+i+'"':'')+'>'+esc(s[1])+'</div></div>'}).join('')+'</div>'}
  function chipsHtml(arr,cls){return '<div class="chips">'+arr.map(function(x){return '<span class="'+(cls||'badge')+'">'+esc(x)+'</span>'}).join('')+'</div>'}
  function openContent(id){
    var x=getContent(id);if(!x)return;
    var body='';
    body+='<div class="block"><div class="bt">Cadeia estratégica</div>'+chainHtml(x)+'</div>';
    body+='<div class="emo-hero"><div class="eh-l">♥ Emoção estratégica</div><div class="eh-v">'+esc(x.emocao)+'</div><div class="eh-w"><b>Por quê:</b> '+esc(x.emocaoPor)+'</div></div>';
    body+='<div class="block"><div class="bt">Contexto estratégico</div><div class="metagrid">'+
      meta("Objetivo",x.objetivo)+meta("Público / Persona",x.persona)+meta("Jornada",x.jornada)+meta("Funil",x.funil)+
      meta("Função estratégica",x.funcao)+meta("Pilar",x.pilar)+meta("Tema / Subtema",x.tema+" / "+x.subtema)+meta("Formato",x.surface+" + "+x.format)+
      '<div style="grid-column:1/-1">'+meta("Percepção que queremos construir",x.percepcao)+'</div>'+
      '<div style="grid-column:1/-1">'+meta("Ideia",x.ideia)+'</div>'+
      '<div style="grid-column:1/-1">'+meta("Ângulo",x.angulo)+'</div>'+
      '</div></div>';
    if(x.roteiro)body+='<div class="block"><div class="bt">Roteiro</div>'+stepsHtml(x.roteiro)+'</div>';
    if(x.carrossel)body+='<div class="block"><div class="bt">Estrutura do carrossel</div>'+stepsHtml(x.carrossel)+'</div>';
    if(x.copy&&x.copy!=="—")body+='<div class="block"><div class="bt">Copy / Legenda</div><div class="copybox">'+esc(x.copy)+'</div></div>';
    body+='<div class="block"><div class="bt">CTA</div><div style="font-size:14px;font-weight:600">'+esc(x.cta)+'</div></div>';
    body+='<div class="block"><div class="bt">Gatilhos & princípios persuasivos</div>'+chipsHtml(x.gatilhos,'badge')+'<div class="bt" style="margin:14px 0 10px">Elementos literários / narrativos</div>'+chipsHtml(x.recursos,'pill st-INSIGHT')+'</div>';
    body+='<div class="block"><div class="bt">Direção visual</div><div style="font-size:13px;color:var(--muted)">'+esc(x.visual)+'</div></div>';

    var html='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" aria-label="Detalhe do conteúdo"><div class="dh"><div style="min-width:0;flex:1"><div class="d-title">'+esc(x.headline)+'</div><div class="d-sub">'+esc(clientName(x.client))+' · '+esc(x.date)+' · '+esc(x.surface)+' + '+esc(x.format)+'</div></div><button class="icon-btn" id="dclose" aria-label="Fechar">✕</button></div><div class="db">'+body+'</div><div class="df"><button class="btn pri">Aprovar</button><button class="btn">Pedir ajuste</button><span class="badge '+(STCOL[x.status]||'badge')+'" style="margin-left:auto;align-self:center">'+x.status+'</span></div></aside>';
    I("#overlay").innerHTML=html;
    I("#scrim").addEventListener('click',closeDrawer);
    I("#dclose").addEventListener('click',closeDrawer);
    document.addEventListener('keydown',escClose);
    Array.prototype.forEach.call(document.querySelectorAll('.df .btn'),function(b){b.addEventListener('click',function(){b.parentNode.querySelector('span').textContent="Ação registrada (prévia)"})});
  }
  function escClose(ev){if(ev.key==="Escape")closeDrawer()}
  function closeDrawer(){I("#overlay").innerHTML='';document.removeEventListener('keydown',escClose)}

