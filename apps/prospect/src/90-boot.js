/* ===== Eventos, ações e inicialização ===== */
function onBind(el) {
  const lead = curLead();
  if (!lead) return;
  const t = el.dataset.t;
  let v;
  if (el.type === 'checkbox') v = el.checked;
  else if (t === 'num') { const s = el.value.trim().replace(',', '.'); v = s === '' ? '' : parseFloat(s); }
  else if (t === 'bool3') v = el.value === 'sim' ? true : el.value === 'nao' ? false : '';
  else if (t === 'nicho') v = resolveNicho(el.value);
  else v = el.value.trim();
  setPath(lead, el.dataset.bind, v);
  saveLead(lead);
  refreshResults();
}

function onOp(el) {
  const p = el.dataset.op;
  let v;
  if (el.dataset.lines) v = el.value.split('\n').map((s) => s.trim()).filter(Boolean);
  else if (el.dataset.bool) v = el.checked;
  else if (el.type === 'number') { const s = el.value.trim(); v = s === '' ? undefined : parseFloat(s); }
  else v = el.value.trim();
  const ks = p.split('.');
  let cur = S.op;
  for (let i = 0; i < ks.length - 1; i++) { if (cur[ks[i]] == null) cur[ks[i]] = {}; cur = cur[ks[i]]; }
  const last = ks[ks.length - 1];
  if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) delete cur[last]; else cur[last] = v;
  saveOp();
}

function onSvc(el) {
  const key = el.dataset.svc, f = el.dataset.f;
  const c = S.op.catalogo[key] = S.op.catalogo[key] || { ativo: true };
  if (f === 'ativo') c.ativo = el.checked;
  else { const s = el.value.trim(); if (s === '') delete c[f]; else c[f] = Math.max(0, parseFloat(s)); }
  if (c.ticketMin != null && c.ticketMax != null && c.ticketMin > c.ticketMax) toast('O mínimo está maior que o máximo neste serviço.');
  saveOp();
}

const slugify = (s) => E.norm(s).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const ACTIONS = {
  nav(el) { S.view = el.dataset.view; if (S.view !== 'lead') S.leadId = null; render(); },
  goProspects() { S.view = 'prospects'; S.leadId = null; render(); },
  filter(el) { S.filter = el.dataset.val; render(); },
  copyText(el) { copyText(el.dataset.text); },

  addLead() {
    const h = E.parseHandles($('#np-handle').value)[0];
    if (!h) { toast('Digite o @ do Instagram (letras, números, ponto e sublinhado).'); return; }
    const ex = S.leads.find((l) => l.profile.handle === h);
    if (ex) { toast('Esse perfil já está na lista. Abri para você.'); S.leadId = ex.profile.id; S.view = 'lead'; S.tab = 'raiox'; render(); return; }
    const l = E.newLead(h, $('#np-nome').value);
    l.profile.nicho = resolveNicho($('#np-nicho').value);
    const c = $('#np-cidade').value.trim();
    if (c) l.profile.cidade = c;
    S.leads.push(l); saveLead(l);
    S.leadId = l.profile.id; S.view = 'lead'; S.tab = 'raiox'; render();
  },
  importHandles() {
    const hs = E.parseHandles($('#imp').value);
    if (!hs.length) { toast('Nenhum @ válido encontrado no texto.'); return; }
    const nicho = resolveNicho($('#imp-nicho').value);
    let n = 0;
    for (const h of hs) {
      if (S.leads.some((l) => l.profile.handle === h)) continue;
      const l = E.newLead(h); if (nicho) l.profile.nicho = nicho;
      S.leads.push(l); saveLead(l); n++;
    }
    toast(n + ' prospect(s) importado(s)' + (n < hs.length ? ' (' + (hs.length - n) + ' já existiam)' : '') + '.');
    render();
  },
  loadExample() {
    const l = E.demoLead();
    if (S.leads.some((x) => x.profile.id === l.profile.id)) { toast('O exemplo já está na lista.'); return; }
    S.leads.push(l); saveLead(l); toast('Exemplo fictício carregado. Pode excluir quando quiser.'); render();
  },
  openLead(el) { S.leadId = el.dataset.id; S.view = 'lead'; S.tab = 'raiox'; render(); window.scrollTo(0, 0); },
  askDel(el) { S.confirmDel = el.dataset.id; render(); },
  cancelDel() { S.confirmDel = null; render(); },
  delLead(el) { removeLead(el.dataset.id); S.confirmDel = null; toast('Prospect excluído.'); render(); },
  tab(el) { S.tab = el.dataset.tab; render(); },

  nota(el) {
    const lead = curLead(); if (!lead) return;
    const kind = el.dataset.kind, key = el.dataset.key, v = el.dataset.val;
    const box = kind === 'flat' ? (lead.profile[key] || {}) : ((lead.profile[kind] || {})[key] || {});
    const next = box.nota === v ? 'nao_avaliado' : v;
    setPath(lead, kind === 'flat' ? 'profile.' + key + '.nota' : 'profile.' + kind + '.' + key + '.nota', next);
    const grp = el.closest('.seg');
    $$('button', grp).forEach((b) => { const on = b.dataset.val === next; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    saveLead(lead); refreshResults();
  },
  addNota() {
    const lead = curLead(); if (!lead) return;
    const t = $('#nt-texto').value.trim(), f = $('#nt-fonte').value.trim();
    if (!t || !f) { toast('Preencha a observação e onde você a viu: sem fonte, não vale como fato.'); return; }
    lead.profile.notas.push({ texto: t, fonte: f });
    $('#nt-texto').value = ''; $('#nt-fonte').value = '';
    $('#notas-list').innerHTML = notasList(lead);
    saveLead(lead); refreshResults();
  },
  delNota(el) {
    const lead = curLead(); if (!lead) return;
    lead.profile.notas.splice(+el.dataset.i, 1);
    $('#notas-list').innerHTML = notasList(lead);
    saveLead(lead); refreshResults();
  },
  toggleDor(el) {
    const lead = curLead(); if (!lead) return;
    const k = el.dataset.key, arr = lead.doresConfirmadas;
    const i = arr.indexOf(k);
    if (i >= 0) arr.splice(i, 1); else arr.push(k);
    saveLead(lead); refreshResults();
  },
  aiRaioX() { const lead = curLead(); if (lead) aiRaioX(lead); },
  aiSave(el) {
    const lead = curLead(); if (!lead) return;
    const r = S.ai[lead.profile.id]; if (!r) return;
    const c = r[el.dataset.kind][+el.dataset.i]; if (!c) return;
    lead.profile.notas.push({ texto: (el.dataset.kind === 'gargalos' ? 'Hipótese (IA): ' : '') + c.texto, fonte: 'IA · trecho do texto colado: "' + c.evidencia + '"' });
    $('#notas-list').innerHTML = notasList(lead);
    saveLead(lead); toast('Salvo nas observações.'); refreshResults();
  },

  toggleObj(el) {
    const lead = curLead(); if (!lead) return;
    const k = el.dataset.key, i = lead.objetivos.indexOf(k);
    if (i >= 0) lead.objetivos.splice(i, 1); else lead.objetivos.push(k);
    el.classList.toggle('on', i < 0); el.setAttribute('aria-pressed', String(i < 0));
    saveLead(lead); refreshResults();
  },
  addMsg() {
    const lead = curLead(); if (!lead) return;
    const t = $('#cv-text').value.trim();
    if (!t) { toast('Escreva ou cole a mensagem.'); return; }
    lead.conversa.push({ autor: $('#cv-autor').value, texto: t });
    $('#cv-text').value = '';
    $('#conv').innerHTML = convList(lead);
    if (lead.status === 'abordado') lead.status = 'conversa';
    saveLead(lead); refreshResults();
  },
  delMsg(el) {
    const lead = curLead(); if (!lead) return;
    lead.conversa.splice(+el.dataset.i, 1);
    $('#conv').innerHTML = convList(lead);
    saveLead(lead); refreshResults();
  },
  markAbordado() { const lead = curLead(); if (!lead) return; lead.status = 'abordado'; saveLead(lead); toast('Marcado como abordado.'); render(); },
  polish(el) { const lead = curLead(); if (lead) aiPolish(lead, +el.dataset.i); },

  detectObj() { S.obj.text = ($('#ob-text') || {}).value || ''; S.obj.key = ''; render(); },
  useLastMsg() {
    const lead = curLead(); if (!lead) return;
    const m = lead.conversa.filter((x) => x.autor === 'lead').slice(-1)[0];
    S.obj.text = m ? m.texto : ''; S.obj.key = ''; render();
  },
  makePitch() { const lead = curLead(); if (!lead) return; S.pitchOn[lead.profile.id] = true; render(); },

  makePlan() {
    const n = $('#fd-nicho').value.trim();
    if (!n) { toast('Escolha ou digite um nicho.'); return; }
    S.find.nicho = n; S.find.cidade = $('#fd-cidade').value.trim();
    S.find.plan = E.buildSearchPlan(S.op, resolveNicho(n), S.find.cidade);
    render();
  },

  addNicho() {
    const nome = $('#nn-nome').value.trim();
    if (!nome) { toast('Dê um nome ao nicho.'); return; }
    const key = slugify(nome);
    if (E.allNiches(S.op).some((n) => n.key === key || E.norm(n.nome) === E.norm(nome))) { toast('Esse nicho já existe.'); return; }
    const dep = [];
    if ($('#nn-a').checked) dep.push('autoridade'); if ($('#nn-i').checked) dep.push('imagem'); if ($('#nn-q').checked) dep.push('aquisicao');
    S.op.nichosCustom.push({ key, nome, dependeDe: dep }); saveOp(); render();
  },
  delNicho(el) { S.op.nichosCustom.splice(+el.dataset.i, 1); saveOp(); render(); },
  addProof(el) {
    const kind = el.dataset.kind;
    const t = $('#' + kind + '-t').value.trim(), f = $('#' + kind + '-f').value.trim(), d = $('#' + kind + '-d').value.trim();
    if (!t || !f || !d) { toast('Preencha título, fonte e descrição: sem fonte, não é prova.'); return; }
    const item = { tipo: kind === 'diferenciais' ? 'diferencial' : $('#' + kind + '-tipo').value, titulo: t, descricao: d, fonte: f, verificado: $('#' + kind + '-v').checked };
    const r = $('#' + kind + '-r'); if (r && r.value.trim()) item.resultadoDocumentado = r.value.trim();
    S.op[kind].push(item); saveOp(); render();
  },
  toggleProof(el) { const it = S.op[el.dataset.kind][+el.dataset.i]; if (it) { it.verificado = !it.verificado; saveOp(); render(); } },
  delProof(el) { S.op[el.dataset.kind].splice(+el.dataset.i, 1); saveOp(); render(); },

  async exportBackup() {
    if (!dl) return;
    try {
      await dl.save({ filename: 'mesa-prospeccao-backup.json', data: JSON.stringify({ versao: 1, exportadoEm: new Date().toISOString(), op: S.op, leads: S.leads }, null, 2) });
      toast('Backup salvo.');
    } catch (e) { if (!e || e.code !== 'declined') toast('Não consegui salvar o backup agora.'); }
  },
};

function importBackup(file) {
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const d = JSON.parse(String(rd.result));
      const ls = (Array.isArray(d.leads) ? d.leads : []).map(E.normalizeLead).filter(Boolean);
      if (!ls.length && !d.op) { toast('Esse arquivo não parece um backup da Mesa de Prospecção.'); return; }
      for (const l of ls) { const i = S.leads.findIndex((x) => x.profile.id === l.profile.id); if (i >= 0) S.leads[i] = l; else S.leads.push(l); saveLead(l); }
      if (d.op) { S.op = E.normalizeOperacao(d.op); saveOp(); }
      toast(ls.length + ' prospect(s) importado(s) do backup.'); render();
    } catch (e) { toast('Não consegui ler o arquivo de backup.'); }
  };
  rd.readAsText(file);
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) fn(el, e);
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.matches('#imp-file')) { if (t.files && t.files[0]) importBackup(t.files[0]); t.value = ''; return; }
  if (t.matches('[data-bind]')) return onBind(t);
  if (t.matches('[data-op]')) return onOp(t);
  if (t.matches('[data-svc]')) return onSvc(t);
  if (t.matches('[data-status]')) {
    const l = S.leads.find((x) => x.profile.id === t.dataset.status);
    if (l) { l.status = t.value; saveLead(l); if (S.view === 'prospects') render(); else refreshResults(); }
    return;
  }
  const ch = t.dataset && t.dataset.actChange;
  if (ch === 'approachGargalo') { const lead = curLead(); if (lead) { S.approachGargalo[lead.profile.id] = t.value; render(); } }
  if (ch === 'objKey') { S.obj.key = t.value; S.obj.text = ($('#ob-text') || {}).value || S.obj.text; render(); }
});

if (!E) {
  document.getElementById('app').innerHTML = '<p style="padding:40px 0">Não consegui carregar o motor da Mesa de Prospecção.</p>';
} else {
  const lp = LS.get('mesa.v1.leads');
  if (Array.isArray(lp)) S.leads = lp.map(E.normalizeLead).filter(Boolean);
  const op = LS.get('mesa.v1.op');
  if (op) S.op = E.normalizeOperacao(op);
  render();
  connect();
}
