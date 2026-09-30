/* ===== Área de trabalho do prospect ===== */
const badge = (c) => `<span class="badge ${c}">${CERTEZA_LABEL[c] || c}</span>`;
const val = (o, p) => p.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o);
const dot = (n) => `<span class="dot ${n}"></span>`;
const copyBtn = (text, label) => `<button type="button" class="btn ghost small" data-act="copyText" data-text="${esc(text)}">${label || 'Copiar'}</button>`;
const claimLi = (c) => `<li><span>${esc(c.texto)} ${badge(c.certeza)}${c.evidencia ? `<div class="quote">${esc(c.evidencia)}</div>` : ''}</span></li>`;

function fText(lead, path, label, o) {
  o = o || {};
  const v = val(lead, path);
  const shown = path === 'profile.nicho' ? nichoNome(lead) : v;
  const attrs = `data-bind="${path}" ${o.t ? `data-t="${o.t}"` : ''} ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.list ? `list="${o.list}"` : ''}`;
  const field = o.area ? `<textarea ${attrs} rows="${o.rows || 3}">${esc(shown == null ? '' : shown)}</textarea>` : `<input type="${o.num ? 'number' : 'text'}" ${o.num ? 'min="0" step="1"' : ''} ${attrs} value="${esc(shown == null ? '' : shown)}">`;
  return `<label class="f">${label}${field}</label>`;
}
function fSel(lead, path, label, opts, t) {
  const v = val(lead, path);
  const cur = t === 'bool3' ? (v === true ? 'sim' : v === false ? 'nao' : '') : (v == null ? '' : v);
  return `<label class="f">${label}<select data-bind="${path}" ${t ? `data-t="${t}"` : ''}><option value="">Não sei</option>${opts.map(([k, l]) => `<option value="${k}" ${cur === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
}
function seg(kind, key, cur) {
  return `<div class="seg" role="group" aria-label="Avaliação">${['forte', 'regular', 'fraca', 'ausente'].map((v) => `<button type="button" data-act="nota" data-kind="${kind}" data-key="${key}" data-val="${v}" class="${cur === v ? 'on' : ''}" aria-pressed="${cur === v}">${NOTA_LABEL[v]}</button>`).join('')}</div>`;
}
function dimRow(lead, kind, key, label, hint) {
  const flat = kind === 'flat';
  const box = (flat ? lead.profile[key] : (lead.profile[kind] || {})[key]) || {};
  const bindPath = flat ? `profile.${key}.obs` : `profile.${kind}.${key}.obs`;
  const cur = box.nota && box.nota !== 'nao_avaliado' ? box.nota : '';
  return `<div class="dim" data-kind="${kind}" data-key="${key}">
    <div class="lab">${esc(label)}</div>${seg(kind, key, cur)}
    <input type="text" data-bind="${bindPath}" value="${esc(box.obs || '')}" placeholder="O que você viu (fato)" aria-label="Observação: ${esc(label)}">
    <div class="hint" data-hint>${esc(hint || '')}</div></div>`;
}

function viewLead() {
  const lead = curLead();
  if (!lead) return '<div class="empty"><h3>Prospect não encontrado</h3></div>';
  const a = analysis(lead);
  return `
    <div id="lead-head">${leadHead(lead, a)}</div>
    <div class="tabs" role="tablist" aria-label="Etapas do prospect">${list(TABS, ([k, t]) => `<button type="button" role="tab" aria-selected="${S.tab === k}" data-act="tab" data-tab="${k}">${t}</button>`)}</div>
    ${tabBody(lead, a)}`;
}

function leadHead(lead, a) {
  return `<div class="lead-head">
    <button type="button" class="btn ghost small" data-act="goProspects">← Prospects</button>
    <h1>${esc(lead.profile.nome)}</h1>
    <span class="muted">@${esc(lead.profile.handle)} · ${esc(nichoNome(lead) || 'sem nicho')}</span>
    <span class="sp"></span>
    <button type="button" class="btn ghost small" data-act="copyDossier">Copiar resumo</button>
    <span class="prio ${a.score.prioridade}" title="${esc(a.score.avisos.join(' '))}">${PRIO_LABEL[a.score.prioridade]} · ${a.score.pontuacao}/100</span>
    <label class="f" style="min-width:150px"><span class="mono" style="font-size:10px">ETAPA</span>
      <select data-status="${esc(lead.profile.id)}" aria-label="Etapa">${E.LEAD_STATUS.map((s) => `<option value="${s}" ${lead.status === s ? 'selected' : ''}>${STATUS_LABEL[s]}</option>`).join('')}</select></label>
  </div>`;
}

function tabBody(lead, a) {
  switch (S.tab) {
    case 'raiox': return tabRaioX(lead, a);
    case 'why': return tabWhy(lead, a);
    case 'audit': return tabAudit(lead, a);
    case 'approach': return tabApproach(lead, a);
    case 'qual': return tabQual(lead, a);
    case 'args': return tabArgs(lead, a);
    case 'obj': return tabObj(lead, a);
    case 'pitch': return tabPitch(lead, a);
    case 'follow': return tabFollow(lead, a);
    default: return '';
  }
}

/* atualização viva: só a coluna de leitura, o cabeçalho e as dicas — sem tirar o foco do formulário */
let pointerDown = false, refreshPending = false;
document.addEventListener('pointerdown', () => { pointerDown = true; }, true);
const pointerRelease = () => { pointerDown = false; if (refreshPending) { refreshPending = false; setTimeout(refreshResults, 0); } };
document.addEventListener('pointerup', pointerRelease, true);
document.addEventListener('pointercancel', pointerRelease, true);

function refreshResults() {
  // Se um clique está em andamento (o campo acabou de perder o foco), redesenhar agora engoliria o clique:
  // adia até o mouse soltar, depois do evento de clique.
  if (pointerDown) { refreshPending = true; return; }
  const lead = curLead();
  if (!lead) return;
  const a = analysis(lead);
  const h = $('#lead-head');
  if (h) h.innerHTML = leadHead(lead, a);
  const slot = $('#results');
  if (slot) slot.innerHTML = S.tab === 'raiox' ? raioxResults(lead, a) : S.tab === 'qual' ? qualResults(lead, a) : '';
  const dims = a.raiox.dims;
  $$('.dim[data-kind="dims"]').forEach((row) => {
    const d = dims.find((x) => x.key === row.dataset.key);
    const box = (lead.profile.dims || {})[row.dataset.key] || {};
    const manual = box.nota && box.nota !== 'nao_avaliado';
    const el = $('[data-hint]', row);
    if (el) el.textContent = !manual && d && d.origem === 'contagem' ? `Derivado dos números informados: ${d.nota} (${d.base})` : '';
  });
}

/* ---------- Raio-X ---------- */
function tabRaioX(lead, a) {
  const p = lead.profile;
  const dimRows = (grupo) => list(E.DIMENSOES.filter((d) => d.grupo === grupo), (d) => {
    const eff = a.raiox.dims.find((x) => x.key === d.key);
    const manual = (p.dims[d.key] || {}).nota && p.dims[d.key].nota !== 'nao_avaliado';
    return dimRow(lead, 'dims', d.key, d.label, !manual && eff && eff.origem === 'contagem' ? `Derivado dos números informados: ${eff.nota} (${eff.base})` : '');
  });
  const grupos = [['perfil', 'Perfil e apresentação'], ['cadencia', 'Cadência'], ['formato', 'Formatos'], ['conversao', 'Conversão'], ['conteudo', 'Conteúdo'], ['funil', 'Funil de conteúdo']];
  if (S.quick) return tabQuick(lead, a);
  return `
    <datalist id="nichos-list3">${list(E.allNiches(S.op), (n) => `<option value="${esc(n.nome)}"></option>`)}</datalist>
    <div class="split">
      <div class="stack">
        ${quickToggle()}
        <details class="card" open><summary>1 · Perfil</summary><div class="stack">
          <div class="g2">
            ${fText(lead, 'profile.nome', 'Nome do negócio ou pessoa')}
            ${fText(lead, 'profile.contato', 'Nome de quem vou abordar', { ph: 'Ex.: Helena' })}
            ${fText(lead, 'profile.nicho', 'Nicho', { t: 'nicho', list: 'nichos-list3', ph: 'Escolha ou digite' })}
            ${fText(lead, 'profile.cidade', 'Cidade')}
            ${fText(lead, 'profile.seguidores', 'Seguidores (opcional)', { num: 1, t: 'num' })}
            ${fText(lead, 'profile.link', 'Link da bio (opcional)')}
          </div>
          ${fText(lead, 'profile.temaDominado', 'O que este perfil demonstra dominar (fato que você viu)', { ph: 'Ex.: dermatologia estética' })}
          ${fText(lead, 'profile.bio', 'Bio (cole o texto)', { area: 1, rows: 2 })}
        </div></details>

        <details class="card"><summary>2 · Números observados</summary><div class="stack">
          <p class="small muted">Contagens simples que você vê no perfil. Viram avaliação automática (critério: 0 = ausente; poucos = fraca), e você pode sobrescrever abaixo.</p>
          <div class="g3">
            ${fText(lead, 'profile.posts30d', 'Posts nos últimos 30 dias', { num: 1, t: 'num' })}
            ${fText(lead, 'profile.reels30d', 'Reels nos últimos 30 dias', { num: 1, t: 'num' })}
            ${fText(lead, 'profile.carrosseis30d', 'Carrosséis nos últimos 30 dias', { num: 1, t: 'num' })}
            ${fSel(lead, 'profile.stories', 'Stories', [['diario', 'Todo dia'], ['semanal', 'Toda semana'], ['raro', 'Raramente'], ['nunca', 'Nunca']])}
            ${fSel(lead, 'profile.ctaNaBio', 'Tem CTA na bio?', [['sim', 'Sim'], ['nao', 'Não']], 'bool3')}
          </div>
          <span class="sect-label">Tipos dos últimos posts (conte ao menos 6 no total)</span>
          <div class="g3">
            ${fText(lead, 'profile.mix.educativo', 'Educativos', { num: 1, t: 'num' })}
            ${fText(lead, 'profile.mix.comercial', 'Comerciais', { num: 1, t: 'num' })}
            ${fText(lead, 'profile.mix.institucional', 'Institucionais', { num: 1, t: 'num' })}
            ${fText(lead, 'profile.mix.pessoal', 'Pessoais / bastidores', { num: 1, t: 'num' })}
            ${fText(lead, 'profile.mix.provaSocial', 'Prova social', { num: 1, t: 'num' })}
          </div>
          <span class="sect-label">Funil dos últimos posts</span>
          <div class="g3">
            ${fText(lead, 'profile.funil.descoberta', 'Descoberta', { num: 1, t: 'num' })}
            ${fText(lead, 'profile.funil.consideracao', 'Consideração', { num: 1, t: 'num' })}
            ${fText(lead, 'profile.funil.conversao', 'Conversão', { num: 1, t: 'num' })}
          </div>
        </div></details>

        <details class="card"><summary>3 · Avaliação por dimensão (19)</summary><div>
          <p class="small muted" style="margin-bottom:8px">Avalie o que você consegue observar; deixe em branco o que não deu para ver. Clique de novo no botão marcado para limpar. Escreva o fato observado — ele vira a evidência.</p>
          ${list(grupos, ([g, t]) => `<span class="sect-label" style="margin-top:12px">${t}</span>${dimRows(g)}`)}
        </div></details>

        <details class="card"><summary>4 · Cabeçalho do perfil</summary><div>
          <p class="small muted" style="margin-bottom:8px">Teste: alguém que olhasse só esta área entenderia para quem é o perfil e o que fazer?</p>
          ${list(E.HEADER_PARTS, (h) => dimRow(lead, 'header', h.key, h.label, h.dica))}
        </div></details>

        <details class="card"><summary>5 · O negócio</summary><div class="stack">
          <p class="small muted">Sua leitura de quão bom é o negócio e de quanto ele pode investir — com o fato que sustenta.</p>
          ${dimRow(lead, 'flat', 'negocio', 'Tem um bom negócio', '')}
          ${dimRow(lead, 'flat', 'capacidade', 'Capacidade de investimento', '')}
        </div></details>

        <details class="card"><summary>6 · Observações reais e texto para IA</summary><div class="stack">
          <span class="sect-label">Observações com fonte (viram motivo legítimo de contato)</span>
          <div id="notas-list">${notasList(lead)}</div>
          <div class="g2">
            <label class="f">Observação (fato)<input type="text" id="nt-texto" placeholder="Ex.: o site não mostra o cardápio"></label>
            <label class="f">Onde viu<input type="text" id="nt-fonte" placeholder="Ex.: Instagram (bio)"></label>
          </div>
          <div class="row"><button type="button" class="btn ghost" data-act="addNota">Adicionar observação</button></div>
          ${fText(lead, 'profile.amostraTexto', 'Legendas e textos colados (só para a análise de IA)', { area: 1, rows: 4, ph: 'Cole 3 a 5 legendas recentes' })}
        </div></details>
      </div>
      <aside class="sticky" aria-label="Leitura do perfil"><div id="results" class="stack">${raioxResults(lead, a)}</div></aside>
    </div>`;
}

function notasList(lead) {
  const n = lead.profile.notas;
  return n.length ? `<ul class="clean">${list(n, (x, i) => `<li><span>${esc(x.texto)} <span class="muted small">— ${esc(x.fonte)}</span> <button type="button" class="link small" data-act="delNota" data-i="${i}">remover</button></span></li>`)}</ul>` : '<p class="small muted">Nenhuma observação ainda.</p>';
}

function raioxResults(lead, a) {
  const r = a.raiox;
  const painLabel = (k) => (E.PAINS.find((p) => p.key === k) || {}).label || k;
  const hyp = r.dores.filter((d) => d.status === 'HIPOTESE');
  const conf = r.dores.filter((d) => d.status === 'CONFIRMADO');
  const talk = r.dores.filter((d) => d.status === 'SO_CONVERSA');
  return `
    <div class="card stack">
      <div class="row"><h3>Leitura do perfil</h3><span class="sp"></span>
        <span class="pill ${r.confianca === 'alta' ? 'ok' : r.confianca === 'media' ? '' : 'warn'}">confiança ${r.confianca}</span><span class="pill">${r.avaliadas}/19 avaliadas</span></div>
      <p class="small muted">Tudo é hipótese até o prospect confirmar. As evidências são os fatos que você informou.</p>
      ${list(r.lacunas, (l) => `<div class="callout">${esc(l)}</div>`)}
    </div>
    <div class="card stack">
      <h3>Gargalos possíveis</h3>
      ${r.gargalos.length ? list(r.gargalos, (g) => `<div class="item ${g.certeza === 'CONFIRMADO' ? 'conf' : 'hyp'}">
        <div class="row"><b>${esc(g.def.titulo)}</b>${badge(g.certeza)}</div>
        <ul class="plain small" style="margin-top:6px">${list(g.evidencias, (e) => `<li>${esc(e)}</li>`)}</ul>
        <p class="small" style="margin-top:6px"><span class="muted">Pode gerar:</span> ${esc(g.def.impacto)}.</p>
        <p class="small"><span class="muted">Serviços que respondem:</span> ${esc(g.def.servicos.map((k) => E.SERVICE_BY_KEY[k].nome).join(' · '))}</p></div>`)
        : '<p class="small muted">Nenhum gargalo identificado nos dados informados. Falta de dado não é problema do perfil: avalie mais dimensões.</p>'}
    </div>
    <div class="card stack">
      <h3>Dores a investigar</h3>
      <p class="small muted">Nenhuma dor é assumida. Estas são hipóteses para confirmar com perguntas.</p>
      ${conf.length ? `<div><span class="sect-label">Confirmadas</span>${list(conf, (d) => `<div class="item conf"><div class="row"><b>${esc(d.label)}</b>${badge('CONFIRMADO')}<span class="sp"></span><button type="button" class="link small" data-act="toggleDor" data-key="${d.key}">desmarcar</button></div></div>`)}</div>` : ''}
      ${hyp.length ? `<div><span class="sect-label">Hipóteses com sinal no perfil</span>${list(hyp, (d) => `<div class="item hyp"><div class="row"><b>${esc(d.label)}</b>${badge('HIPOTESE')}<span class="sp"></span><button type="button" class="btn ghost small" data-act="toggleDor" data-key="${d.key}">O prospect confirmou</button></div>
        <div class="small muted">Sinal: ${esc(d.sinais.join('; '))}</div><div class="small" style="margin-top:4px">Pergunte: “${esc(d.pergunta)}” ${copyBtn(d.pergunta, 'copiar')}</div></div>`)}</div>` : ''}
      <details><summary class="small" style="cursor:pointer">Só a conversa revela (${talk.length}) — perguntas para descobrir</summary>
        <div style="margin-top:8px">${list(talk, (d) => `<div class="item"><div class="row"><b>${esc(d.label)}</b><span class="sp"></span><button type="button" class="btn ghost small" data-act="toggleDor" data-key="${d.key}">O prospect confirmou</button></div><div class="small">Pergunte: “${esc(d.pergunta)}”</div></div>`)}</div></details>
    </div>
    <div class="card stack"><h3>O que já faz bem</h3>
      ${r.pontosFortes.length ? `<ul class="clean">${list(r.pontosFortes, claimLi)}</ul>` : '<p class="small muted">Nenhum ponto forte registrado. Não invente elogio: avalie e anote o que realmente é bom.</p>'}
    </div>
    ${aiBox(lead)}`;
}

function aiBox(lead) {
  if (!S.canSample) return '';
  const r = S.ai[lead.profile.id];
  const section = (t, arr, kind) => arr.length ? `<div><span class="sect-label">${t}</span>${list(arr, (c, i) => `<div class="item ${kind === 'gargalos' ? 'hyp' : 'obs'}"><div>${esc(c.texto)} ${badge(c.certeza)}</div><div class="quote">${esc(c.evidencia)}</div><div style="margin-top:6px"><button type="button" class="btn ghost small" data-act="aiSave" data-kind="${kind}" data-i="${i}">Salvar como observação</button></div></div>`)}</div>` : '';
  return `<div class="card stack"><h3>Análise de IA do texto colado</h3>
    <p class="small muted">A IA só pode citar trechos do que você colou (bio, legendas, notas). Item sem trecho comprovável é descartado.</p>
    <div class="row"><button type="button" class="btn ghost" data-act="aiRaioX" ${S.sampling ? 'disabled' : ''}>${S.sampling === 'raiox' ? 'Analisando…' : 'Analisar com IA'}</button></div>
    ${r ? `${section('Observações', r.observacoes, 'observacoes')}${section('Pontos fortes', r.pontosFortes, 'pontosFortes')}${section('Possíveis gargalos (hipóteses)', r.gargalos, 'gargalos')}
      ${!r.observacoes.length && !r.pontosFortes.length && !r.gargalos.length ? '<p class="small muted">A IA não encontrou nada sustentado pelo texto.</p>' : ''}
      ${r.descartados ? `<p class="small muted">${r.descartados} item(ns) descartado(s) por não terem evidência no texto.</p>` : ''}` : ''}</div>`;
}

/* ---------- Por que nós? ---------- */
function tabWhy(lead, a) {
  const w = a.why, o = a.offer, s = a.score;
  if (w.semBase) return `<div class="callout bad">${list(w.avisos, (x) => esc(x))}</div>
    <div class="card" style="margin-top:12px"><h3>Pergunta para começar</h3><p>${esc(w.perguntaPrimeiro)} ${copyBtn(w.perguntaPrimeiro)}</p></div>`;
  return `
    <div class="page-title"><div><h2>Por que este prospect precisaria de nós?</h2>
      <p class="lede">Baseado só no que foi registrado. Confiança ${w.confianca}.</p></div></div>
    ${list(w.avisos, (x) => `<div class="callout" style="margin-bottom:10px">${esc(x)}</div>`)}
    <div class="g2" style="align-items:start">
      <div class="card stack"><h3>Oportunidade</h3><p>${esc(w.oportunidade.texto)} ${badge('HIPOTESE')}</p><div class="quote">${esc(w.oportunidade.evidencia)}</div></div>
      <div class="card stack"><h3>Possível problema</h3><p>${esc(w.possivelProblema.texto)} ${badge(w.possivelProblema.certeza)}</p></div>
      <div class="card stack"><h3>O que pode melhorar</h3><ul class="clean">${list(w.oQueMelhorar, (x) => `<li>${esc(x)}</li>`)}</ul></div>
      <div class="card stack"><h3>Serviço que faz mais sentido</h3>
        ${w.servicoPrincipal ? `<p><b>${esc(w.servicoPrincipal.nome)}</b></p><p class="small muted">${esc(w.servicoPrincipal.motivo)}</p><p>${esc(w.servicoPrincipal.frase)}</p>${w.servicosComplementares.length ? `<p class="small muted">Complementares: ${esc(w.servicosComplementares.join(' · '))}</p>` : ''}` : '<p class="small muted">Nenhum serviço ativo responde aos gargalos. Ative serviços em “Minha operação”.</p>'}</div>
      <div class="card stack"><h3>Resultado estratégico buscado</h3><p>${w.resultadoEstrategico ? esc(w.resultadoEstrategico) : '—'}</p></div>
      <div class="card stack"><h3>Argumento comercial</h3>${w.argumentoComercial ? `<p><span class="mono">${esc(w.argumentoComercial.rotulo)}</span></p><p>${esc(w.argumentoComercial.frase)}</p>` : '<p class="muted small">—</p>'}</div>
      <div class="card stack"><h3>Pergunta para fazer primeiro</h3><p>“${esc(w.perguntaPrimeiro)}”</p><div>${copyBtn(w.perguntaPrimeiro)}</div></div>
      <div class="card stack"><h3>Contrato recorrente</h3><p>${esc(w.contratoRecorrente)}</p></div>
    </div>

    <h2 style="margin:26px 0 10px">Potencial de contrato mensal</h2>
    <div class="g2" style="align-items:start">
      <section class="card stack">
        <div class="row"><h3>Recorrência</h3><span class="sp"></span><span class="pill ${o.potencialRecorrente === 'alto' ? 'ok' : ''}">potencial ${o.potencialRecorrente}</span></div>
        <p class="small">${esc(o.motivoPotencial)}</p>
        <div class="ladder">${list(o.escada, (e, i) => `<div class="step ${i === 2 ? 'prio' : ''}"><i></i><div><b>${esc(e.etapa)}</b><div class="small muted">${esc(e.descricao)}</div><div class="small">${esc(e.servicos.join(' · '))}</div></div></div>`)}</div>
        ${o.contratoRecorrente.ticket ? `<p class="small muted">Faixa cadastrada por você para ${esc(o.contratoRecorrente.nome)}: ${esc(o.contratoRecorrente.ticket)}.</p>` : '<p class="small muted">Sem faixa cadastrada para o contrato mensal (cadastre em Minha operação).</p>'}
      </section>
      <section class="card stack"><h3>Quando oferecer cada serviço</h3>
        <div class="table-wrap"><table><thead><tr><th>Serviço</th><th>Indicação</th></tr></thead><tbody>
        ${list(o.quandoOferecer, (q) => `<tr><td><b>${esc(q.nome)}</b>${q.ofertado ? '' : ' <span class="badge SISTEMA">desativado</span>'}${q.ticket ? `<div class="small muted">${esc(q.ticket)}</div>` : ''}</td><td>${q.indicado === 'sim' ? '<span class="badge CONFIRMADO">indicado</span>' : q.indicado === 'talvez' ? '<span class="badge HIPOTESE">talvez</span>' : '<span class="badge SISTEMA">sem sinal</span>'}<div class="small muted">${esc(q.motivo)}</div></td></tr>`)}
        </tbody></table></div>
        <p class="small muted">Indicações são hipóteses a partir dos gargalos; a conversa decide.</p>
      </section>
      <section class="card stack" style="grid-column: 1 / -1"><h3>Prioridade do prospect</h3>
        <div class="row"><span class="prio ${s.prioridade}">${PRIO_LABEL[s.prioridade]}</span><b>${s.pontuacao}/100</b></div>
        <div class="table-wrap"><table><thead><tr><th>Critério</th><th>Nível</th><th>Base</th></tr></thead><tbody>
        ${list(s.criterios, (c) => `<tr><td>${esc(c.criterio)}</td><td>${c.nivel === 'desconhecido' ? '<span class="muted">desconhecido</span>' : dot(c.nivel) + c.nivel}</td><td class="small muted">${esc(c.evidencia)}</td></tr>`)}
        </tbody></table></div>
        ${list(s.avisos, (x) => `<div class="callout">${esc(x)}</div>`)}
      </section>
    </div>`;
}

/* ---------- Mini auditoria ---------- */
function tabAudit(lead, a) {
  const m = a.audit;
  const blk = (ico, titulo, corpo, warn) => `<div class="blk ${warn ? 'warn' : ''}"><div class="ico">${ico}</div><div><h4>${titulo}</h4>${corpo}</div></div>`;
  if (m.semBase) return `<div class="callout bad">${esc(m.texto)}</div>`;
  return `
    <div class="page-title"><div><h2>Mini auditoria de conteúdo</h2>
      <p class="lede">Curta e visual, para gerar percepção de valor antes da conversa comercial. São observações a validar com o prospect, não certezas.</p></div>
      <div class="row">${copyBtn(m.texto, 'Copiar texto da auditoria')}</div></div>
    ${list(m.avisos, (x) => `<div class="callout" style="margin-bottom:10px">${esc(x)}</div>`)}
    ${m.semaforo.length ? `<div class="semaforo" style="margin-bottom:14px">${list(m.semaforo, (s) => `<span>${dot(s.nota)}${esc(s.rotulo)}: ${NOTA_LABEL[s.nota]}</span>`)}</div>` : ''}
    <div class="audit">
      ${blk('1', 'O que o perfil já faz bem', m.jaFazBem.length ? `<ul class="clean">${list(m.jaFazBem, claimLi)}</ul>` : '<p class="muted small">Nenhum ponto forte registrado.</p>')}
      ${blk('2', 'Oportunidade encontrada', `<p>${esc(m.oportunidade.texto)} ${badge('HIPOTESE')}</p>`)}
      ${blk('3', 'Problema que isso pode estar causando', `<p>${esc(m.problema.texto)} ${badge('HIPOTESE')}</p>`, true)}
      ${blk('4', 'Possível melhoria', `<p>${esc(m.melhoria)}</p>`)}
      ${blk('5', 'Estratégia inicial', `<p>${esc(m.estrategiaInicial)}</p>`)}
      ${blk('6', 'Próximo passo', `<p>${esc(m.proximoPasso)}</p>`)}
    </div>`;
}

/* ---------- Abordagem ---------- */
function tabApproach(lead, a) {
  const id = lead.profile.id;
  const gid = S.approachGargalo[id];
  const ap = approachFor(lead, a);
  const head = `<div class="page-title"><div><h2>Primeira abordagem</h2>
    <p class="lede">Não vende: gera conversa. Observação real do perfil + oportunidade + pergunta. Sem elogio genérico, sem promessa, sem falar de gestão de redes sociais.</p></div></div>`;
  if (E.isRefusal(ap)) return `${head}<div class="callout bad"><b>Não gerei a mensagem.</b> ${esc(ap.motivo)}<br>${esc(ap.proximoPasso)}</div>`;
  return `${head}
    <div class="g2" style="align-items:start;margin-bottom:12px">
      <div class="card stack"><span class="sect-label">Motivo real do contato</span><p>${esc(ap.motivoReal)}</p>
        ${a.raiox.gargalos.length ? `<label class="f">Ângulo da abordagem<select data-act-change="approachGargalo"><option value="">Automático (gargalo mais forte com fato citável)</option>${list(a.raiox.gargalos, (g) => `<option value="${g.def.id}" ${gid === g.def.id ? 'selected' : ''}>${esc(g.def.titulo)}</option>`)}</select></label>` : ''}
      </div>
      <div class="card stack"><span class="sect-label">Avisos</span><ul class="plain small">${list(ap.avisos, (x) => `<li>${esc(x)}</li>`)}</ul></div>
    </div>
    <div class="row" style="margin-bottom:8px"><button type="button" class="btn ghost small" data-act="otherVariant">Outra versão do texto</button><span class="small muted">Versão ${(ap.variante || 0) + 1} de ${E.VARIANT_COUNT}: mesmo fato e mesma pergunta, outra forma de dizer.</span></div>
    <div class="stack">
      ${list(ap.variantes, (v, i) => {
        const pol = S.polish[id + ':' + i];
        return `<div class="card stack"><div class="row"><b>${esc(v.rotulo)}</b><span class="sp"></span>${copyBtn(v.texto)}${S.canSample ? `<button type="button" class="btn ghost small" data-act="polish" data-i="${i}" ${pol && pol.busy ? 'disabled' : ''}>${pol && pol.busy ? 'Polindo…' : 'Polir com IA'}</button>` : ''}</div>
          ${v.assunto ? `<div class="small muted">Assunto: ${esc(v.assunto)}</div>` : ''}
          <div class="msg">${esc(v.texto)}</div>
          <div class="small muted">${v.texto.length} caracteres</div>
          ${pol && pol.ok ? `<div><span class="sect-label">Versão polida (validada: manteve os fatos e a pergunta, sem venda)</span><div class="msg polished">${esc(pol.text)}</div><div style="margin-top:6px">${copyBtn(pol.text, 'Copiar versão polida')}</div></div>` : ''}
          ${pol && pol.ok === false ? `<div class="callout">A versão da IA foi descartada: ${esc(pol.motivos.join('; '))}. Use o texto acima.</div>` : ''}
        </div>`;
      })}
    </div>
    <div class="g2" style="align-items:start;margin-top:14px">
      <div class="card stack"><h3>Outras perguntas de abertura</h3><ul class="clean">${list(ap.perguntasAlternativas, (q) => `<li>${esc(q)} <button type="button" class="link small" data-act="copyText" data-text="${esc(q)}">copiar</button></li>`)}</ul></div>
      <div class="card stack"><h3>Se ele responder</h3>${ap.proximaSeResponder ? `<p>Próxima pergunta: “${esc(ap.proximaSeResponder)}”</p>` : '<p class="muted small">Qualificação completa.</p>'}
        <div class="row">${lead.status === 'novo' || lead.status === 'raiox' ? '<button type="button" class="btn" data-act="markAbordado">Marcar como abordado</button>' : `<span class="pill">Etapa atual: ${STATUS_LABEL[lead.status]}</span>`}</div></div>
    </div>`;
}

/* ---------- Qualificação ---------- */
function tabQual(lead, a) {
  const obj = E.OBJETIVO_KEYS;
  const sel = new Set(lead.objetivos);
  return `<div class="split">
    <div class="stack">
      <section class="card stack"><h3>Objetivo com o Instagram</h3>
        <p class="small muted">Marque o que o prospect disse querer. Também é detectado na conversa.</p>
        <div class="chips" role="group">${list(obj, (k) => `<button type="button" class="chip ${sel.has(k) ? 'on' : ''}" data-act="toggleObj" data-key="${k}" aria-pressed="${sel.has(k)}">${E.OBJETIVO_LABEL[k]}</button>`)}</div>
      </section>
      <section class="card stack"><h3>Conversa</h3>
        <div id="conv">${convList(lead)}</div>
        <label class="f">Nova mensagem<textarea id="cv-text" rows="2" placeholder="Cole aqui o que ele respondeu (ou o que você enviou)"></textarea></label>
        <div class="row"><select id="cv-autor" style="max-width:190px"><option value="lead">Ele(a) escreveu</option><option value="nos">Eu escrevi</option></select><button type="button" class="btn ghost" data-act="addMsg">Adicionar à conversa</button></div>
        <p class="small muted">Só o que o prospect escreveu conta como informação. O que você escreve não confirma nada.</p>
      </section>
      <details class="card"><summary>Respostas que você já ouviu (16 campos)</summary><div class="g2">
        ${list(E.QUAL_KEYS, (k) => `<label class="f">${esc(E.QUAL_LABEL[k])}<input type="text" data-bind="qual.${k}" value="${esc(lead.qual[k] || '')}"></label>`)}
      </div></details>
    </div>
    <aside class="sticky"><div id="results" class="stack">${qualResults(lead, a)}</div></aside>
  </div>`;
}
function convList(lead) {
  return lead.conversa.length ? `<div class="stack">${list(lead.conversa, (m, i) => `<div class="item ${m.autor === 'lead' ? 'obs' : ''}"><div class="row"><span class="mono">${m.autor === 'lead' ? 'ELE(A)' : 'EU'}</span><span class="sp"></span><button type="button" class="link small" data-act="delMsg" data-i="${i}">remover</button></div><div style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(m.texto)}</div></div>`)}</div>` : '<p class="small muted">Nenhuma mensagem ainda.</p>';
}
function qualResults(lead, a) {
  const q = a.qual;
  return `
    <div class="card stack"><div class="row"><h3>Qualificação</h3><span class="sp"></span><span class="pill ${q.qualificada ? 'ok' : 'warn'}">${q.qualificacaoPct}% · ${q.qualificada ? 'campos críticos completos' : 'faltam campos críticos'}</span></div>
      <div class="bar"><i style="width:${q.qualificacaoPct}%"></i></div>
      <ul class="clean">${list(q.campos, (c) => `<li><span>${c.status === 'identificado' ? '✔' : '○'} <b>${esc(c.rotulo)}</b>${c.valor ? `<span class="muted"> — ${esc(c.valor)}</span> ${badge('CONFIRMADO')}<span class="muted small"> (${c.origem === 'informado' ? 'informado por você' : 'dito por ele(a)'})</span>` : ''}</span></li>`)}</ul>
    </div>
    ${q.objetivos.length ? `<div class="card stack"><h3>Objetivos identificados</h3><div class="chips">${list(q.objetivos, (o) => `<span class="chip on">${esc(o.rotulo)}</span>`)}</div></div>` : ''}
    <div class="card stack"><h3>Próximas perguntas</h3>
      ${q.proximasPerguntas.length ? list(q.proximasPerguntas, (p) => `<div class="item"><div>“${esc(p.pergunta)}” ${copyBtn(p.pergunta, 'copiar')}</div><div class="small muted" style="margin-top:4px">Para quê: ${esc(p.finalidade)}</div></div>`) : '<p class="small muted">Nada a perguntar agora.</p>'}
    </div>
    ${q.estruturaAtual.length ? `<div class="card stack"><h3>Estrutura atual</h3><ul class="clean">${list(q.estruturaAtual, (x) => `<li>${esc(x)}</li>`)}</ul></div>` : ''}`;
}

/* ---------- Argumentos ---------- */
function tabArgs(lead, a) {
  return `<div class="page-title"><div><h2>Argumentos para este prospect</h2>
    <p class="lede">Escolhidos pelo problema real e pelos objetivos dele. Nenhum promete resultado.</p></div></div>
    ${a.args.length ? `<div class="g2" style="align-items:start">${list(a.args, (g) => `<article class="card stack"><div class="row"><h3>${esc(g.rotulo)}</h3></div><p class="small muted">Por que: ${esc(g.motivo)}</p><p>${esc(g.tese)}</p><p class="small"><b>Como usar:</b> ${esc(g.comoUsar)}</p><ul class="clean">${list(g.frases, (f) => `<li>${esc(f)} <button type="button" class="link small" data-act="copyText" data-text="${esc(f)}">copiar</button></li>`)}</ul></article>`)}</div>`
      : '<div class="callout">Ainda não há problema identificado para escolher argumentos. Complete o Raio-X ou a qualificação.</div>'}
    <p class="small muted" style="margin-top:14px">Veja os dez argumentos na aba <button type="button" class="link" data-act="nav" data-view="args">Argumentos</button>.</p>`;
}

/* ---------- Objeções ---------- */
function tabObj(lead, a) {
  const last = lead.conversa.filter((m) => m.autor === 'lead').slice(-1)[0];
  const text = S.obj.text || '';
  const det = E.detectObjections(text);
  const key = S.obj.key || (det[0] && det[0].key) || '';
  const pb = key ? E.objectionPlaybook(key, S.op) : null;
  return `<div class="page-title"><div><h2>Objeções</h2>
    <p class="lede">Para cada objeção: o que existe por trás, a pergunta certa, a resposta, o argumento, como reduzir o risco e o próximo passo. Nunca discuta: entenda a causa primeiro.</p></div></div>
  <div class="split">
    <div class="stack">
      <section class="card stack"><label class="f">O que o prospect disse${last ? ' (última mensagem dele já abaixo, se quiser)' : ''}<textarea id="ob-text" rows="3" placeholder="Ex.: Eu mesmo faço meu conteúdo">${esc(text)}</textarea></label>
        <div class="row"><button type="button" class="btn" data-act="detectObj">Identificar objeção</button>${last ? '<button type="button" class="btn ghost" data-act="useLastMsg">Usar a última mensagem dele</button>' : ''}</div>
        ${text && !det.length ? '<div class="callout">Não reconheci uma das 13 objeções nessa fala. Escolha na lista ao lado, ou trate como dúvida e pergunte.</div>' : ''}
        ${det.length > 1 ? `<p class="small muted">Outras possíveis: ${esc(det.slice(1).map((d) => d.rotulo).join(', '))}.</p>` : ''}
      </section>
      <section class="card stack"><label class="f">Ou escolha a objeção<select data-act-change="objKey"><option value="">—</option>${list(E.OBJECTION_LIST, (o) => `<option value="${o.key}" ${key === o.key ? 'selected' : ''}>${esc(o.rotulo)}</option>`)}</select></label></section>
    </div>
    <div>${pb ? playbookHtml(pb) : '<div class="empty"><h3>Escolha ou identifique uma objeção</h3><p>Aparecem aqui a leitura, a pergunta e a resposta.</p></div>'}</div>
  </div>`;
}
function playbookHtml(pb) {
  return `<article class="card stack"><h3>${esc(pb.rotulo)}</h3>
    <div><span class="sect-label">O que pode existir por trás</span><ul class="plain">${list(pb.oQueExistePorTras, (x) => `<li>${esc(x)}</li>`)}</ul></div>
    <div><span class="sect-label">1 · Pergunte primeiro</span><div class="msg">${esc(pb.perguntaSugerida)}</div><div style="margin-top:6px">${copyBtn(pb.perguntaSugerida)}</div></div>
    <div><span class="sect-label">2 · Resposta</span><div class="msg">${esc(pb.resposta)}</div><div style="margin-top:6px">${copyBtn(pb.resposta)}</div></div>
    <div><span class="sect-label">3 · Argumento (${esc(pb.argumento.rotulo)})</span><p>${esc(pb.argumento.frase)}</p></div>
    <div><span class="sect-label">4 · Redução de risco</span><ul class="plain">${list(pb.reducaoDeRisco, (x) => `<li>${esc(x)}</li>`)}</ul></div>
    <div><span class="sect-label">5 · Próximo passo</span><p>${esc(pb.proximoPasso)}</p></div>
    ${pb.preco ? `<div class="callout"><b>Preço: entenda antes de negociar.</b><ul class="plain" style="margin-top:6px">${list(pb.preco.entenderPrimeiro, (x) => `<li>${esc(x)}</li>`)}</ul>
      <p style="margin-top:6px"><b>Reforce:</b> ${esc(pb.preco.reforcar.join(' · '))}.</p>
      <p style="margin-top:6px"><b>Desconto:</b> ${pb.preco.desconto.permitido ? `sua regra permite até ${pb.preco.desconto.ate}%${pb.preco.desconto.condicoes ? ' (condições: ' + esc(pb.preco.desconto.condicoes.join('; ')) + ')' : ''} — só depois de entender e esgotar escopo, fase e parcelamento.` : 'não sugerir: não há regra cadastrada em “Minha operação”.'}</p></div>` : ''}
    <div><span class="sect-label">Não fazer</span><ul class="plain small">${list(pb.naoFazer, (x) => `<li>${esc(x)}</li>`)}</ul></div>
  </article>`;
}

/* ---------- Pitch ---------- */
function tabPitch(lead, a) {
  const on = S.pitchOn[lead.profile.id];
  const p = a.pitch;
  return `<div class="page-title"><div><h2>Pitch</h2>
    <p class="lede">Cenário, problema, impacto, oportunidade, solução, diferencial e próximo passo — montados com o que você registrou. O diferencial só vem do que você cadastrou e verificou.</p></div>
    <button type="button" class="btn big" data-act="makePitch">CRIAR PITCH</button></div>
  ${on ? `
    ${list(p.avisos, (x) => `<div class="callout" style="margin-bottom:8px">${esc(x)}</div>`)}
    <section class="card">
      ${list(p.secoes, (s) => `<div class="pitch-sec"><div class="t">${s.titulo}</div><div><p style="white-space:pre-wrap">${esc(s.texto)} ${badge(s.certeza)}</p>${s.nota ? `<p class="small muted">${esc(s.nota)}</p>` : ''}</div></div>`)}
      <div class="row" style="margin-top:12px">${copyBtn(p.texto, 'Copiar pitch')}</div>
    </section>
    <section class="card stack" style="margin-top:14px"><h3>O que entrou no pitch</h3>
      <div class="table-wrap"><table><tbody>${list(p.entradasUsadas, (e) => `<tr><td><b>${esc(e.entrada)}</b></td><td>${e.valor ? esc(e.valor) : '<span class="muted">não informado</span>'}</td></tr>`)}</tbody></table></div></section>`
    : '<div class="empty"><h3>Pronto para montar</h3><p>Clique em CRIAR PITCH. Quanto mais completo o Raio-X e a qualificação, mais específico o pitch.</p></div>'}`;
}


/* ---------- Modo rápido do Raio-X ---------- */
const QUICK_DIMS = ['posicionamento', 'clareza_oferta', 'frequencia', 'autoridade', 'educativo', 'comercial', 'prova_social', 'cta'];
function quickToggle() {
  return `<div class="card row"><label class="row" style="gap:8px;cursor:pointer"><input type="checkbox" data-act="toggleQuick" ${S.quick ? 'checked' : ''}><b>Modo rápido</b></label><span class="small muted">${S.quick ? 'Só o essencial (cerca de 2 minutos por perfil). Desmarque para o Raio-X completo de 19 dimensões.' : 'Marque para preencher só o essencial e triar mais perfis por hora.'}</span></div>`;
}
function tabQuick(lead, a) {
  const dimRows = list(QUICK_DIMS, (k) => {
    const d = E.DIMENSOES.find((x) => x.key === k);
    return d ? dimRow(lead, 'dims', d.key, d.label, '') : '';
  });
  return `
    <datalist id="nichos-list3">${list(E.allNiches(S.op), (n) => `<option value="${esc(n.nome)}"></option>`)}</datalist>
    <div class="split">
      <div class="stack">
        ${quickToggle()}
        <section class="card stack"><h3>Perfil</h3>
          <div class="g2">
            ${fText(lead, 'profile.nome', 'Nome do negócio ou pessoa')}
            ${fText(lead, 'profile.nicho', 'Nicho', { t: 'nicho', list: 'nichos-list3', ph: 'Escolha ou digite' })}
          </div>
          ${fText(lead, 'profile.temaDominado', 'O que este perfil demonstra dominar (fato que você viu)', { ph: 'Ex.: dermatologia estética' })}
        </section>
        <section class="card stack"><h3>Números dos últimos 30 dias</h3>
          <div class="g3">
            ${fText(lead, 'profile.posts30d', 'Posts', { num: 1, t: 'num' })}
            ${fText(lead, 'profile.reels30d', 'Reels', { num: 1, t: 'num' })}
            ${fSel(lead, 'profile.ctaNaBio', 'CTA na bio?', [['sim', 'Sim'], ['nao', 'Não']], 'bool3')}
          </div>
        </section>
        <section class="card"><h3>Avaliação essencial</h3><p class="small muted" style="margin-bottom:8px">Avalie só o que deu para observar. Escreva o fato visto: ele vira a evidência.</p>${dimRows}</section>
        <section class="card stack"><h3>O negócio</h3>
          ${dimRow(lead, 'flat', 'negocio', 'Tem um bom negócio', '')}
          ${dimRow(lead, 'flat', 'capacidade', 'Capacidade de investimento', '')}
        </section>
        <section class="card stack"><h3>Observação real</h3>
          <div id="notas-list">${notasList(lead)}</div>
          <div class="g2">
            <label class="f">Observação (fato)<input type="text" id="nt-texto" placeholder="Ex.: o site não mostra o cardápio"></label>
            <label class="f">Onde viu<input type="text" id="nt-fonte" placeholder="Ex.: Instagram (bio)"></label>
          </div>
          <div class="row"><button type="button" class="btn ghost" data-act="addNota">Adicionar observação</button></div>
        </section>
      </div>
      <aside class="sticky" aria-label="Leitura do perfil"><div id="results" class="stack">${raioxResults(lead, a)}</div></aside>
    </div>`;
}

/* ---------- Follow-up ---------- */
function tabFollow(lead, a) {
  const due = E.dueState(lead, today());
  const fu = E.followUps(lead, a.raiox, a.qual, S.op);
  const hist = (lead.historico || []).slice().reverse();
  const n = E.attempts(lead);
  const cad = E.cadenciaOf(S.op);
  return `
    <div class="page-title"><div><h2>Follow-up</h2>
      <p class="lede">Retomadas educadas que agregam algo, sem cobrar, sem urgência inventada. A cadência é ${cad.join(', ')} dias entre tentativas (ajuste em Minha operação).</p></div></div>
    <div class="g2" style="align-items:start;margin-bottom:12px">
      <div class="card stack">
        <span class="sect-label">Próximo contato</span>
        ${due ? `<div class="callout ${due.estado === 'atrasado' ? 'bad' : ''}"><b>${due.estado === 'atrasado' ? 'Atrasado há ' + due.dias + ' dia(s)' : 'É hoje'}.</b></div>` : ''}
        <label class="f">Data<input type="date" data-bind="proximoContato" value="${esc(lead.proximoContato || '')}"></label>
        <div class="row"><button type="button" class="btn" data-act="registerContact" ${lead.status === 'fechado' || lead.status === 'perdido' ? 'disabled' : ''}>Registrei um contato</button>
          <span class="small muted">${n} tentativa(s) sem resposta registrada(s).</span></div>
        <p class="small muted">Ao registrar, o sistema agenda a próxima data pela cadência. Acabando a cadência, sugere encerrar com educação.</p>
      </div>
      <div class="card stack"><span class="sect-label">Motivo da perda (se perder)</span>
        ${fText(lead, 'motivoPerda', 'O que aconteceu', { ph: 'Ex.: sem orçamento agora' })}
        <p class="small muted">Só para você aprender o que melhora. Nada disso vai para mensagem nenhuma.</p></div>
    </div>
    ${fu.length ? `<div class="stack">${list(fu, (f) => `<div class="card stack"><div class="row"><b>${esc(f.rotulo)}</b><span class="small muted">${esc(f.situacao)}</span><span class="sp"></span>${copyBtn(f.texto)}</div><div class="msg">${esc(f.texto)}</div>${f.avisos.length ? `<div class="callout bad">${esc(f.avisos.join('; '))}</div>` : ''}</div>`)}</div>`
      : '<div class="empty"><p>Sem mensagem de follow-up para esta etapa. Marque o prospect como <b>Abordado</b> para ver as retomadas.</p></div>'}
    <div class="card stack" style="margin-top:14px"><h3>Histórico</h3>
      ${hist.length ? `<ul class="clean">${list(hist, (h) => `<li><span class="mono small">${esc(fmtDate(h.quando))}</span> ${esc(h.evento === 'contato' ? 'Contato registrado (sem resposta)' : h.evento)}</li>`)}</ul>` : '<p class="small muted">Sem eventos ainda.</p>'}
    </div>`;
}
