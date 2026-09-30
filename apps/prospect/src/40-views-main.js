/* ===== Estrutura e telas principais ===== */
function render() {
  const app = $('#app');
  if (!app) return;
  const y = window.scrollY;
  const nav = [['prospects', 'Prospects'], ['find', 'Encontrar'], ['args', 'Argumentos'], ['ops', 'Minha operação']];
  const inLead = S.view === 'lead';
  let body = '';
  if (S.view === 'prospects') body = viewProspects();
  else if (S.view === 'lead') body = viewLead();
  else if (S.view === 'find') body = viewFind();
  else if (S.view === 'args') body = viewArgsBank();
  else if (S.view === 'ops') body = viewOps();
  app.innerHTML = `
    <header class="top"><div class="wrap">
      <div class="brand"><b>Mesa</b> de Prospecção</div>
      <nav class="nav" aria-label="Seções">${list(nav, ([k, t]) => `<button type="button" data-act="nav" data-view="${k}" ${(S.view === k || (inLead && k === 'prospects')) ? 'aria-current="page"' : ''}>${t}</button>`)}</nav>
      <span class="sp"></span>
      <span id="storage-pill" class="pill ${S.storage === 'db' ? 'ok' : 'warn'}">${S.storage === 'db' ? 'Salvo no banco do Artifact' : 'Salvo só neste navegador'}</span>
    </div></header>
    <main class="wrap">${body}</main>`;
  window.scrollTo(0, y);
}

/* ---------- Prospects ---------- */
function prioRank(p) { return { ALTA: 0, MEDIA: 1, INDEFINIDA: 2, BAIXA: 3 }[p]; }

function viewProspects() {
  const niches = E.allNiches(S.op);
  const rows = S.leads.map((l) => ({ l, a: analysis(l) }));
  const counts = { todos: rows.length };
  for (const s of E.LEAD_STATUS) counts[s] = rows.filter((r) => r.l.status === s).length;
  const shown = rows.filter((r) => S.filter === 'todos' || r.l.status === S.filter)
    .sort((x, y) => prioRank(x.a.score.prioridade) - prioRank(y.a.score.prioridade) || y.a.score.pontuacao - x.a.score.pontuacao);
  return `
    <div class="page-title"><div>
      <h1>Prospects</h1>
      <p class="lede">Perfis de Instagram que podem contratar gestão e criação de conteúdo. Registre o que você observa; o sistema separa o que é fato do que é hipótese e prioriza quem pode virar contrato mensal.</p>
    </div></div>
    <datalist id="nichos-list">${list(niches, (n) => `<option value="${esc(n.nome)}"></option>`)}</datalist>
    <div class="split" style="margin-bottom:18px">
      <section class="card stack" aria-labelledby="h-add">
        <h3 id="h-add">Adicionar prospect</h3>
        <div class="g2">
          <label class="f">@ do Instagram<input type="text" id="np-handle" placeholder="@clinica.exemplo" autocomplete="off"></label>
          <label class="f">Nome do negócio ou pessoa<input type="text" id="np-nome" placeholder="Clínica Exemplo" autocomplete="off"></label>
          <label class="f">Nicho<input type="text" id="np-nicho" list="nichos-list" placeholder="Escolha ou digite um novo"></label>
          <label class="f">Cidade<input type="text" id="np-cidade" placeholder="Campinas"></label>
        </div>
        <div class="row"><button type="button" class="btn" data-act="addLead">Adicionar e abrir o Raio-X</button></div>
      </section>
      <section class="card stack" aria-labelledby="h-imp">
        <h3 id="h-imp">Importar uma lista de @</h3>
        <label class="f">Cole @handles ou links do Instagram (um por linha, espaço ou vírgula)<textarea id="imp" rows="3" placeholder="@perfil1&#10;instagram.com/perfil2"></textarea></label>
        <label class="f">Nicho da lista (opcional)<input type="text" id="imp-nicho" list="nichos-list"></label>
        <div class="row"><button type="button" class="btn ghost" data-act="importHandles">Importar</button><span class="small muted">Cada um entra como “Novo”, sem análise: você preenche o Raio-X depois.</span></div>
      </section>
    </div>
    ${rows.length ? `
      <div class="row" style="margin-bottom:10px">
        <div class="chips" role="group" aria-label="Filtrar por etapa">
          ${['todos', ...E.LEAD_STATUS].map((s) => `<button type="button" class="chip ${S.filter === s ? 'on' : ''}" data-act="filter" data-val="${s}">${s === 'todos' ? 'Todos' : STATUS_LABEL[s]} · ${counts[s]}</button>`).join('')}
        </div>
      </div>
      <div class="card" style="padding:0">
        ${shown.length ? list(shown, ({ l, a }) => leadRow(l, a)) : '<p class="empty" style="border:0">Nenhum prospect nesta etapa.</p>'}
      </div>` : `
      <div class="empty"><h3>Nenhum prospect ainda</h3>
        <p>Comece na aba <b>Encontrar</b> para gerar buscas por nicho e cidade, abra os perfis no Instagram e adicione aqui os que valem a pena.<br>Sem raspar nada: você observa, registra e a análise nasce dos seus dados.</p>
        <p style="margin-top:12px"><button type="button" class="btn ghost" data-act="loadExample">Ver um exemplo fictício</button></p></div>`}`;
}

function leadRow(l, a) {
  const top = a.raiox.gargalos[0];
  const del = S.confirmDel === l.profile.id;
  return `<div class="lead-row">
    <div style="min-width:0">
      <button type="button" class="name" data-act="openLead" data-id="${esc(l.profile.id)}">${esc(l.profile.nome)}</button>
      <div class="small muted">@${esc(l.profile.handle)} · ${esc(nichoNome(l) || 'sem nicho')}${l.profile.cidade ? ' · ' + esc(l.profile.cidade) : ''}</div>
      ${top ? `<div class="small" style="margin-top:2px">${esc(top.def.titulo)} <span class="badge HIPOTESE">hipótese</span></div>` : `<div class="small muted" style="margin-top:2px">Sem gargalos identificados nos dados informados</div>`}
    </div>
    <div style="text-align:right"><span class="prio ${a.score.prioridade}">${PRIO_LABEL[a.score.prioridade]}</span><div class="score">${a.score.pontuacao}/100</div></div>
    <label class="f" style="min-width:130px"><span class="mono" style="font-size:10px">ETAPA</span>
      <select data-status="${esc(l.profile.id)}" aria-label="Etapa de ${esc(l.profile.nome)}">${E.LEAD_STATUS.map((s) => `<option value="${s}" ${l.status === s ? 'selected' : ''}>${STATUS_LABEL[s]}</option>`).join('')}</select></label>
    <div>${del
      ? `<button type="button" class="btn danger small" data-act="delLead" data-id="${esc(l.profile.id)}">Confirmar exclusão</button> <button type="button" class="link small" data-act="cancelDel">cancelar</button>`
      : `<button type="button" class="btn ghost small" data-act="askDel" data-id="${esc(l.profile.id)}" aria-label="Excluir ${esc(l.profile.nome)}">Excluir</button>`}</div>
  </div>`;
}

/* ---------- Encontrar (radar de busca) ---------- */
function viewFind() {
  const niches = E.allNiches(S.op);
  const p = S.find.plan;
  return `
    <div class="page-title"><div>
      <h1>Encontrar prospects</h1>
      <p class="lede">Gera buscas por nicho e cidade e os critérios de um bom prospect para contratos mensais. O sistema não acessa nem raspa o Instagram: você abre os perfis, confere e registra o que viu.</p>
    </div></div>
    <datalist id="nichos-list2">${list(niches, (n) => `<option value="${esc(n.nome)}"></option>`)}</datalist>
    <section class="card stack" style="margin-bottom:16px">
      <div class="g2">
        <label class="f">Nicho<input type="text" id="fd-nicho" list="nichos-list2" value="${esc(S.find.nicho)}" placeholder="Ex.: Clínicas"></label>
        <label class="f">Cidade (opcional)<input type="text" id="fd-cidade" value="${esc(S.find.cidade)}" placeholder="Ex.: Campinas"></label>
      </div>
      <div class="row"><button type="button" class="btn" data-act="makePlan">Gerar plano de busca</button></div>
    </section>
    ${p ? `
    <div class="g2" style="align-items:start">
      <section class="card stack"><h3>Onde buscar</h3>
        <div><span class="sect-label">Busca do Instagram</span><ul class="clean">${list(p.instagram, (q) => `<li>${esc(q)} <button type="button" class="link small" data-act="copyText" data-text="${esc(q)}">copiar</button></li>`)}</ul></div>
        <div><span class="sect-label">Hashtags</span><div class="chips">${list(p.hashtags, (q) => `<button type="button" class="chip" data-act="copyText" data-text="${esc(q)}">${esc(q)}</button>`)}</div></div>
        <div><span class="sect-label">Google Maps</span><ul class="clean">${list(p.googleMaps, (q) => `<li>${esc(q)} <button type="button" class="link small" data-act="copyText" data-text="${esc(q)}">copiar</button></li>`)}</ul></div>
        <p class="small muted">${esc(p.aviso)}</p>
      </section>
      <section class="card stack"><h3>O que torna um perfil bom prospect</h3>
        <ul class="clean">${list(p.sinaisDeBomProspect, (s) => `<li><span><b>${esc(s.criterio)}.</b> <span class="muted">${esc(s.ondeOlhar)}.</span></span></li>`)}</ul>
        <div><span class="sect-label">Como filtrar</span><ul class="plain">${list(p.filtrar, (f) => `<li>${esc(f)}</li>`)}</ul></div>
        <div class="row"><button type="button" class="btn ghost" data-act="goProspects">Ir para Prospects e adicionar</button></div>
      </section>
    </div>` : ''}`;
}

/* ---------- Banco de argumentos ---------- */
function viewArgsBank() {
  return `
    <div class="page-title"><div>
      <h1>Banco de argumentos</h1>
      <p class="lede">Dez argumentos para serviços de conteúdo. Nenhum promete resultado nem usa número: cada um explica a lógica e quando usar. Dentro de cada prospect, o sistema escolhe os que combinam com o problema real dele.</p>
    </div></div>
    <div class="g2" style="align-items:start">
      ${list(E.ARGUMENTS, (a) => `<article class="card stack">
        <h3>${esc(a.rotulo)}</h3>
        <p>${esc(a.tese)}</p>
        <div><span class="sect-label">Como usar</span><p class="small">${esc(a.comoUsar)}</p></div>
        <div><span class="sect-label">Frases</span><ul class="clean">${list(a.frases, (f) => `<li>${esc(f)} <button type="button" class="link small" data-act="copyText" data-text="${esc(f)}">copiar</button></li>`)}</ul></div>
      </article>`)}
    </div>`;
}

/* ---------- Minha operação ---------- */
function viewOps() {
  const op = S.op;
  const groups = [['entrada', 'Portas de entrada'], ['nucleo', 'Contratos mensais (núcleo)'], ['expansao', 'Expansão']];
  return `
    <div class="page-title"><div>
      <h1>Minha operação</h1>
      <p class="lede">É daqui, e só daqui, que saem preços, diferenciais e concessões. Se você não cadastrar, o sistema não inventa: sem faixa de preço ele não estima; sem diferencial verificado ele não cita; sem regra de desconto ele não sugere.</p>
    </div></div>
    <div class="stack">
      <section class="card stack"><h3>Identidade</h3>
        <div class="g2">
          <label class="f">Nome da sua operação<input type="text" data-op="nome" value="${esc(op.nome || '')}"></label>
          <label class="f">Assinatura das mensagens<input type="text" data-op="assinatura" value="${esc(op.assinatura || '')}" placeholder="— Seu nome"></label>
        </div>
      </section>

      <section class="card stack"><h3>Serviços e faixa de investimento</h3>
        <p class="small muted">Desative o que você não vende. A faixa é a que você mesmo pratica; aparece só nas análises internas e nunca é inventada.</p>
        ${list(groups, ([papel, titulo]) => `<div><span class="sect-label">${titulo}</span><div class="table-wrap"><table>
          <thead><tr><th>Serviço</th><th>Oferto</th><th>Mín. (R$)</th><th>Máx. (R$)</th></tr></thead>
          <tbody>${list(E.SERVICES.filter((s) => s.papel === papel), (s) => { const c = op.catalogo[s.key] || {}; return `<tr>
            <td><b>${esc(s.nome)}</b> ${s.recorrente ? '<span class="badge SISTEMA">mensal</span>' : ''}<div class="small muted">${esc(s.frase)}</div></td>
            <td><input type="checkbox" data-svc="${s.key}" data-f="ativo" ${c.ativo === false ? '' : 'checked'} aria-label="Oferto ${esc(s.nome)}"></td>
            <td><input type="number" min="0" step="50" data-svc="${s.key}" data-f="ticketMin" value="${c.ticketMin != null ? c.ticketMin : ''}" aria-label="Mínimo de ${esc(s.nome)}"></td>
            <td><input type="number" min="0" step="50" data-svc="${s.key}" data-f="ticketMax" value="${c.ticketMax != null ? c.ticketMax : ''}" aria-label="Máximo de ${esc(s.nome)}"></td></tr>`; })}
          </tbody></table></div></div>`)}
      </section>

      <section class="card stack"><h3>Seus diferenciais</h3>
        <p class="small muted">Só os marcados como <b>verificados</b> entram no pitch. Não é preciso ter cases: processo e método também são diferenciais legítimos.</p>
        ${list(op.diferenciais, (d, i) => proofRow('diferenciais', d, i))}
        ${proofForm('diferenciais', false)}
      </section>

      <section class="card stack"><h3>Provas e cases</h3>
        <p class="small muted">Case, depoimento ou resultado só é usável com <b>verificado</b> e com o resultado documentado. Sem isso, o sistema não cita.</p>
        ${list(op.provas, (d, i) => proofRow('provas', d, i))}
        ${proofForm('provas', true)}
      </section>

      <section class="card stack"><h3>Seu processo</h3>
        <label class="f">Etapas, uma por linha (aparece na redução de risco e no pitch)<textarea data-op="processo" data-lines="1" rows="5">${esc((op.processo || []).join('\n'))}</textarea></label>
      </section>

      <section class="card stack"><h3>Nichos que você atende</h3>
        <p class="small muted">Os 18 nichos padrão já estão disponíveis. Cadastre outros; marque de que o nicho depende (é o que pesa na prioridade).</p>
        ${op.nichosCustom.length ? `<ul class="clean">${list(op.nichosCustom, (n, i) => `<li><b>${esc(n.nome)}</b> <span class="muted small">— depende de: ${esc(n.dependeDe.join(', ') || 'nada marcado')}</span> <button type="button" class="link small" data-act="delNicho" data-i="${i}">remover</button></li>`)}</ul>` : '<p class="small muted">Nenhum nicho próprio ainda.</p>'}
        <div class="row">
          <label class="f grow">Novo nicho<input type="text" id="nn-nome" placeholder="Ex.: Pet shops"></label>
          <label class="f"><span>Depende de</span><span class="row"><label><input type="checkbox" id="nn-a"> autoridade</label><label><input type="checkbox" id="nn-i"> imagem</label><label><input type="checkbox" id="nn-q"> aquisição digital</label></span></label>
          <button type="button" class="btn ghost" data-act="addNicho">Cadastrar</button>
        </div>
      </section>

      <section class="card stack"><h3>Regras comerciais</h3>
        <p class="small muted">Sem regra cadastrada, nenhum desconto, parcelamento ou fase inicial é sugerido além do padrão.</p>
        <div class="g3">
          <label class="f">Desconto máximo (%)<input type="number" min="0" max="100" data-op="regras.descontoMaximoPct" value="${op.regras.descontoMaximoPct != null ? op.regras.descontoMaximoPct : ''}"></label>
          <label class="f">Parcelas máximas<input type="number" min="1" max="24" data-op="regras.parcelamentoMaxParcelas" value="${op.regras.parcelamentoMaxParcelas != null ? op.regras.parcelamentoMaxParcelas : ''}"></label>
          <label class="f">Margem mínima (%)<input type="number" min="0" max="100" data-op="regras.margemMinimaPct" value="${op.regras.margemMinimaPct != null ? op.regras.margemMinimaPct : ''}"></label>
        </div>
        <label class="f">Condições para conceder desconto, uma por linha<textarea data-op="regras.descontoCondicoes" data-lines="1" rows="2">${esc((op.regras.descontoCondicoes || []).join('\n'))}</textarea></label>
        <label class="row"><input type="checkbox" data-op="regras.faseInicialPermitida" data-bool="1" ${op.regras.faseInicialPermitida === false ? '' : 'checked'}> Posso propor uma fase inicial menor</label>
      </section>

      <section class="card stack"><h3>Backup</h3>
        <p class="small muted">Seus dados ficam ${S.storage === 'db' ? 'no banco deste Artifact' : 'só neste navegador'}. Guarde uma cópia quando quiser.</p>
        <div class="row">
          ${S.canDownload ? '<button type="button" class="btn ghost" data-act="exportBackup">Exportar backup (.json)</button>' : '<span class="small muted">Exportar não está disponível neste ambiente.</span>'}
          <label class="btn ghost" style="cursor:pointer">Importar backup<input type="file" id="imp-file" accept=".json,application/json" hidden></label>
        </div>
      </section>
    </div>`;
}

function proofRow(kind, d, i) {
  return `<div class="item ${d.verificado ? 'conf' : 'hyp'}">
    <div class="row"><b>${esc(d.titulo)}</b><span class="badge ${d.verificado ? 'CONFIRMADO' : 'HIPOTESE'}">${d.verificado ? 'verificado' : 'não verificado'}</span><span class="sp"></span>
      <button type="button" class="btn ghost small" data-act="toggleProof" data-kind="${kind}" data-i="${i}">${d.verificado ? 'Marcar como não verificado' : 'Marcar como verificado'}</button>
      <button type="button" class="link small" data-act="delProof" data-kind="${kind}" data-i="${i}">remover</button></div>
    <p class="small">${esc(d.descricao)}</p>
    <p class="small muted">Fonte: ${esc(d.fonte)}${d.resultadoDocumentado ? ' · Resultado documentado: ' + esc(d.resultadoDocumentado) : ''}</p></div>`;
}
function proofForm(kind, withResult) {
  return `<details class="card flat"><summary>Adicionar</summary>
    <div class="g2">
      <label class="f">Título<input type="text" id="${kind}-t"></label>
      ${kind === 'provas' ? `<label class="f">Tipo<select id="${kind}-tipo">${['case', 'portfolio', 'depoimento', 'resultado', 'cliente', 'experiencia', 'metodologia', 'processo', 'especializacao', 'estrutura'].map((t) => `<option>${t}</option>`).join('')}</select></label>` : ''}
      <label class="f">Onde está documentado (fonte)<input type="text" id="${kind}-f" placeholder="link, contrato, print…"></label>
    </div>
    <label class="f">Descrição<textarea id="${kind}-d" rows="2"></textarea></label>
    ${withResult ? `<label class="f">Resultado documentado (obrigatório p/ case, depoimento e resultado)<input type="text" id="${kind}-r"></label>` : ''}
    <div class="row"><label class="row"><input type="checkbox" id="${kind}-v"> Já verifiquei esta informação</label><button type="button" class="btn ghost" data-act="addProof" data-kind="${kind}">Adicionar</button></div>
  </details>`;
}
