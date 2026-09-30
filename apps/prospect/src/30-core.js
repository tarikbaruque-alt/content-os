/* ===== Núcleo: estado, armazenamento, utilitários e IA ===== */
const E = window.MesaEngine;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const list = (arr, fn) => (arr || []).map(fn).join('');
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const STATUS_LABEL = { novo: 'Novo', raiox: 'Raio-X feito', abordado: 'Abordado', conversa: 'Em conversa', qualificado: 'Qualificado', pitch: 'Pitch enviado', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido' };
const PRIO_LABEL = { ALTA: 'Prioridade alta', MEDIA: 'Prioridade média', BAIXA: 'Prioridade baixa', INDEFINIDA: 'Prioridade indefinida' };
const CERTEZA_LABEL = { OBSERVADO: 'Observado', HIPOTESE: 'Hipótese', CONFIRMADO: 'Confirmado', SISTEMA: 'Sistema' };
const NOTA_LABEL = { forte: 'Forte', regular: 'Regular', fraca: 'Fraca', ausente: 'Ausente' };
const TABS = [
  ['raiox', 'Raio-X'], ['why', 'Por que nós?'], ['audit', 'Mini auditoria'], ['approach', 'Abordagem'],
  ['qual', 'Qualificação'], ['args', 'Argumentos'], ['obj', 'Objeções'], ['pitch', 'Pitch'], ['follow', 'Follow-up'],
];

function LS0(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
const S = {
  view: 'prospects', leadId: null, tab: 'raiox',
  leads: [], op: E.normalizeOperacao(null),
  filter: 'todos', storage: 'local', canSample: false, canDownload: false,
  ai: {}, polish: {}, approachGargalo: {}, approachVar: {}, quick: !!LS0('mesa.v1.quick'), pitchOn: {}, obj: { text: '', key: '' }, find: { nicho: '', cidade: '', plan: null },
  confirmDel: null, sampling: null,
};

/* ---------- armazenamento ---------- */
const LS = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento: segue em memória */ } },
};
let db = null, sampleFn = null, dl = null;
const timers = new Map();
const writing = new Map();
let opTimer = null;
const clean = (o) => JSON.parse(JSON.stringify(o));
const persistLocal = () => { LS.set('mesa.v1.leads', S.leads); LS.set('mesa.v1.op', S.op); };

function setStorage(kind) {
  S.storage = kind;
  const el = $('#storage-pill');
  if (el) { el.textContent = kind === 'db' ? 'Salvo no banco do Artifact' : 'Salvo só neste navegador'; el.className = 'pill ' + (kind === 'db' ? 'ok' : 'warn'); }
}
function dbFail(e) {
  toast('Não consegui salvar no banco (' + ((e && e.code) || 'erro') + '). Seus dados continuam neste navegador.');
  setStorage('local');
}
async function writeLead(id) {
  const lead = S.leads.find((l) => l.profile.id === id);
  if (!lead || !db) return;
  const prev = writing.get(id) || Promise.resolve();
  const p = prev.then(() => db.doc('pro_leads/' + id).set(clean(lead))).catch(dbFail);
  writing.set(id, p);
  await p;
}
function saveLead(lead) {
  lead.atualizadoEm = new Date().toISOString();
  persistLocal();
  if (!db) return;
  const id = lead.profile.id;
  clearTimeout(timers.get(id));
  timers.set(id, setTimeout(() => writeLead(id), 700));
}
function saveOp() {
  persistLocal();
  if (!db) return;
  clearTimeout(opTimer);
  opTimer = setTimeout(() => { db.doc('pro_config/main').set(clean(S.op)).catch(dbFail); }, 700);
}
function removeLead(id) {
  S.leads = S.leads.filter((l) => l.profile.id !== id);
  persistLocal();
  if (db) db.doc('pro_leads/' + id).delete().catch(dbFail);
}

function mergeLeads(remote) {
  const byId = new Map(S.leads.map((l) => [l.profile.id, l]));
  const push = [];
  for (const r of remote) {
    const l = byId.get(r.profile.id);
    if (!l) byId.set(r.profile.id, r);
    else if ((r.atualizadoEm || '') >= (l.atualizadoEm || '')) byId.set(r.profile.id, r);
    else push.push(l.profile.id);
  }
  for (const l of S.leads) if (!remote.some((r) => r.profile.id === l.profile.id)) push.push(l.profile.id);
  S.leads = Array.from(byId.values());
  return push;
}

async function connect() {
  const c = window.claude;
  if (!c || !c.use) return;
  const get = async (n) => { try { return await c.use(n); } catch (e) { return null; } };
  const [d, s, x] = await Promise.all([get('db'), get('sample'), get('downloads')]);
  sampleFn = s || null; dl = x || null;
  S.canSample = !!sampleFn; S.canDownload = !!dl;
  if (d) {
    try {
      const [snap, cfg] = await Promise.all([d.collection('pro_leads').get(), d.doc('pro_config/main').get()]);
      db = d;
      const remote = snap.docs.map((x) => E.normalizeLead(x.data())).filter(Boolean);
      const push = mergeLeads(remote);
      if (cfg.exists) S.op = E.normalizeOperacao(cfg.data()); else saveOp();
      persistLocal();
      setStorage('db');
      for (const id of push) writeLead(id);
    } catch (e) { db = null; setStorage('local'); }
  }
  render();
}

/* ---------- utilitários de UI ---------- */
let toastT = null;
function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => { t.hidden = true; }, 4600);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Copiado.'); return; } catch (e) { /* tenta alternativa */ }
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  toast(ok ? 'Copiado.' : 'Não consegui copiar sozinho: selecione o texto e copie.');
}
function setPath(o, path, val) {
  const ks = path.split('.');
  let cur = o;
  for (let i = 0; i < ks.length - 1; i++) { if (cur[ks[i]] == null || typeof cur[ks[i]] !== 'object') cur[ks[i]] = {}; cur = cur[ks[i]]; }
  const last = ks[ks.length - 1];
  if (val === '' || val == null || (typeof val === 'number' && Number.isNaN(val))) delete cur[last]; else cur[last] = val;
  if ((ks[1] === 'dims' || ks[1] === 'header') && ks.length >= 4) {
    const box = o[ks[0]][ks[1]][ks[2]];
    if (box && !box.nota) box.nota = 'nao_avaliado';
  } else if ((ks[1] === 'negocio' || ks[1] === 'capacidade') && ks.length === 3) {
    const box = o[ks[0]][ks[1]];
    if (box && !box.nota) box.nota = 'nao_avaliado';
  }
}
const today = () => E.dayStr(new Date());
const approachFor = (lead, a) => {
  const id = lead.profile.id, gid = S.approachGargalo[id], v = S.approachVar[id];
  return gid || v != null ? E.buildApproach(lead, a.raiox, a.qual, S.op, { gargaloId: gid || undefined, variante: v }) : a.approach;
};
const curLead = () => S.leads.find((l) => l.profile.id === S.leadId) || null;
const analysis = (lead) => E.analyzeLead(lead, S.op);
const nichoNome = (lead) => E.nicheName(lead, S.op);
const resolveNicho = (text) => {
  const t = (text || '').trim();
  const n = E.allNiches(S.op).find((x) => E.norm(x.nome) === E.norm(t) || x.key === t);
  return n ? n.key : t;
};
const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString('pt-BR'); } catch (e) { return ''; } };

/* ---------- IA (sample) com validação ---------- */
const AI_ERR = {
  not_granted: 'A IA não foi liberada para esta página (você pode permitir quando ela pedir).',
  sampling_disabled: 'A IA não está disponível para esta conta.',
  rate_limited: 'Limite de uso da IA atingido. Tente novamente mais tarde.',
  invalid_json: 'A IA não devolveu um formato válido. Tente de novo.',
  refused: 'A IA recusou esta entrada. Revise o texto e tente de novo.',
  prompt_too_large: 'O texto colado é grande demais. Cole um trecho menor.',
  session_expired: 'Sua sessão expirou. Entre novamente.',
};
function aiErr(e) { return AI_ERR[e && e.code] || 'A IA falhou agora. Tente novamente em instantes.'; }

async function aiRaioX(lead) {
  if (!sampleFn) return;
  const src = E.aiSourceText(lead);
  if (src.trim().length < 20) { toast('Cole a bio, legendas ou notas (mín. algumas linhas) para a IA analisar.'); return; }
  S.sampling = 'raiox'; refreshResults();
  try {
    const data = await sampleFn.json(E.buildAiRaioXPrompt(lead, S.op), { modelTier: 'default' });
    S.ai[lead.profile.id] = E.parseAiRaioX(data, src);
  } catch (e) {
    if (!e || e.code !== 'cancelled') toast(aiErr(e));
  } finally { S.sampling = null; refreshResults(); }
}
async function aiPolish(lead, idx) {
  if (!sampleFn) return;
  const a = analysis(lead);
  if (E.isRefusal(approachFor(lead, a))) return;
  const orig = approachFor(lead, a).variantes[idx];
  if (!orig) return;
  const anchors = [lead.profile.temaDominado || ''].filter(Boolean);
  const key = lead.profile.id + ':' + idx;
  S.polish[key] = { busy: true }; render();
  try {
    const { text } = await sampleFn(E.buildPolishPrompt(orig.texto, anchors), { modelTier: 'quick', cache: false });
    const v = E.validatePolish(orig.texto, text, S.op, anchors, true);
    S.polish[key] = v.ok ? { ok: true, text: text.trim() } : { ok: false, motivos: v.motivos };
  } catch (e) { S.polish[key] = { ok: false, motivos: [aiErr(e)] }; }
  render();
}
