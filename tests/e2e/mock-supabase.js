// Supabase simulado para o teste do painel no MODO SERVIDOR (o publicado na Vercel).
// Injetado depois de mock-claude.js: usa só o "sample" dele e apaga window.claude,
// porque na Vercel não existe runtime de Artifact. Imita a sessão já logada, as
// tabelas com o RLS da trava (cos_strategy/editorial/ideas só pela Edge Function)
// e a função "agentes" (gravar com a trava de processo.ts). window.__FAKE guarda
// as tabelas, o registro das chamadas e o que o RLS negou.
(function () {
  var artifact = window.claude; // mock-claude.js carregado antes: só usamos o "sample" dele
  window.__artifact = artifact;
  try { delete window.claude; } catch (e) {}
  window.claude = undefined; // na Vercel não existe window.claude

  var SEED = window.__SEED || [];
  var U = { id: "u-nicacio", email: "nicacio@teste.com", user_metadata: { nome: "Nicácio" } };
  var WS = "ws-1";
  // Contas do Auth (auth.users): o Tarik como a conta dele foi criada, com e-mail que não existe.
  var CONTAS = {
    "u-nicacio": { email: U.email, nome: "Nicácio", ultimo: "2026-09-28T12:00:00Z" },
    "11111111-1111-1111-1111-111111111111": { email: "tarik@contentos.app", nome: "Tarik", ultimo: null },
  };
  var T = {
    docs: [], workspaces: [{ id: WS, nome: "Content OS", created_at: "2026-09-25T15:00:00Z" }],
    membros: [{ workspace_id: WS, user_id: U.id, papel: window.__PAPEL || "dono" }, { workspace_id: WS, user_id: "11111111-1111-1111-1111-111111111111", papel: "dono" }],
    convites: [], proposals: [], agent_runs: [], agent_tasks: [], agent_settings: [], briefing_links: [], briefings: [],
    aprovacoes: [], knowledge_chunks: [], links_publicos: (window.__LINKS || []).slice(),
  };
  var F = (window.__FAKE = { T: T, CONTAS: CONTAS, log: [], negados: [], emails: [] });
  var clone = function (v) { return v == null ? v : JSON.parse(JSON.stringify(v)); };
  var parentOf = function (p) { return p.replace(/\/[^/]+$/, ""); };
  var travado = function (p) { return /^cos_(strategy|editorial|ideas)\//.test(p); };
  function putDoc(path, data) {
    var r = T.docs.find(function (d) { return d.workspace_id === WS && d.path === path; });
    if (r) r.data = clone(data); else T.docs.push({ workspace_id: WS, path: path, parent: parentOf(path), data: clone(data) });
  }
  SEED.forEach(function (d) { putDoc(d.path, d.data); });
  var getDoc = function (path) { var r = T.docs.find(function (d) { return d.path === path; }); return r ? r.data : null; };

  function rls(table, op, rows) {
    if (table === "docs" && op !== "select" && op !== "delete") {
      var bad = rows.find(function (r) { return travado(r.path); });
      if (bad) { F.negados.push(op + " " + bad.path); return { message: 'new row violates row-level security policy for table "docs"', code: "42501" }; }
    }
    if (["aprovacoes", "agent_runs", "proposals", "agent_tasks", "knowledge_chunks"].indexOf(table) >= 0 && op !== "select") {
      F.negados.push(op + " " + table); return { message: "permission denied for table " + table, code: "42501" };
    }
    return null;
  }

  function Q(table) {
    var st = { op: "select", filters: [], order: null, limit: null, single: 0, payload: null, returning: false };
    var q = {
      select: function () { if (st.op !== "select") st.returning = true; return q; },
      eq: function (c, v) { st.filters.push(function (r) { return r[c] === v; }); return q; },
      neq: function (c, v) { st.filters.push(function (r) { return r[c] !== v; }); return q; },
      in: function (c, vs) { st.filters.push(function (r) { return vs.indexOf(r[c]) >= 0; }); return q; },
      is: function (c, v) { st.filters.push(function (r) { return v === null ? r[c] == null : r[c] === v; }); return q; },
      gte: function (c, v) { st.filters.push(function (r) { return r[c] >= v; }); return q; },
      lte: function (c, v) { st.filters.push(function (r) { return r[c] <= v; }); return q; },
      like: function (c, v) { var re = new RegExp("^" + v.replace(/%/g, ".*") + "$"); st.filters.push(function (r) { return re.test(r[c]); }); return q; },
      order: function (c, o) { st.order = [c, !o || o.ascending !== false]; return q; },
      limit: function (n) { st.limit = n; return q; },
      maybeSingle: function () { st.single = 1; return q; },
      single: function () { st.single = 2; return q; },
      insert: function (rows) { st.op = "insert"; st.payload = [].concat(rows); return q; },
      upsert: function (rows) { st.op = "upsert"; st.payload = [].concat(rows); return q; },
      update: function (patch) { st.op = "update"; st.payload = patch; return q; },
      delete: function () { st.op = "delete"; return q; },
      then: function (res, rej) { return Promise.resolve().then(run).then(res, rej); },
    };
    function match() { return (T[table] = T[table] || []).filter(function (r) { return st.filters.every(function (f) { return f(r); }); }); }
    function run() {
      F.log.push(table + ":" + st.op);
      var rows = T[table] = T[table] || [], out;
      if (st.op === "insert" || st.op === "upsert") {
        var pl = st.payload.map(function (r) {
          r = clone(r);
          if (table === "docs") r.parent = parentOf(r.path);
          if ((table === "briefing_links" || table === "links_publicos") && !r.token) r.token = (Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2)).padEnd(32, "0").slice(0, 32);
          if (table === "links_publicos" && r.ativo == null) r.ativo = true;
          if (!r.id && table !== "docs") r.id = "id-" + Math.random().toString(36).slice(2);
          if (!r.created_at) r.created_at = new Date().toISOString();
          return r;
        });
        var e = rls(table, st.op, pl); if (e) return { data: null, error: e };
        pl.forEach(function (r) {
          var ex = table === "docs" ? rows.find(function (x) { return x.workspace_id === r.workspace_id && x.path === r.path; }) : null;
          if (ex && st.op === "upsert") Object.assign(ex, r); else rows.push(r);
        });
        out = pl;
      } else if (st.op === "update" || (st.op === "delete" && table === "membros")) {
        var alvo = match();
        // RLS de membros: só o dono muda ou tira os OUTROS (a linha do próprio não aparece).
        if (table === "membros") alvo = alvo.filter(function (r) { return r.user_id !== U.id; });
        if (st.op === "delete") { T[table] = rows.filter(function (r) { return alvo.indexOf(r) < 0; }); return { data: clone(alvo), error: null }; }
        var prev = alvo.map(function (r) { return Object.assign({}, r, clone(st.payload)); });
        var e2 = rls(table, "update", prev); if (e2) return { data: null, error: e2 };
        alvo.forEach(function (r) { Object.assign(r, clone(st.payload)); });
        out = alvo;
      } else if (st.op === "delete") {
        var del = match(); T[table] = rows.filter(function (r) { return del.indexOf(r) < 0; }); out = del;
      } else {
        out = match();
        if (st.order) { var c = st.order[0], asc = st.order[1]; out = out.slice().sort(function (a, b) { return (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1); }); }
        if (st.limit != null) out = out.slice(0, st.limit);
      }
      out = clone(out);
      if (st.single) {
        if (st.single === 2 && out.length !== 1) return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned" } };
        return { data: out[0] || null, error: null };
      }
      return { data: out, error: null };
    }
    return q;
  }

  // A trava de processo.ts (travaDaGravacao), igual ao servidor.
  function dnaAprov(cli) { return ((getDoc("cos_dna/" + cli) || {}).entries || []).filter(function (x) { return x && (x.status === "approved" || x.status == null); }).length; }
  function trava(cli, objs) {
    var jaE = !!getDoc("cos_strategy/" + cli), jaEd = !!getDoc("cos_editorial/" + cli);
    if (objs.estrategia && !jaE && dnaAprov(cli) < 5) return "A estratégia só entra com pelo menos 5 registros do Content DNA aprovados.";
    var temE = objs.estrategia || jaE;
    if (objs.editorial && !jaEd && !temE) return "A linha editorial só entra depois da estratégia aprovada.";
    var temEd = objs.editorial || jaEd;
    var temIdeias = T.docs.some(function (d) { return d.parent === "cos_ideas/" + cli + "/items"; });
    if (objs.ideias && !temEd && !temIdeias) return "As ideias só entram depois da linha editorial aprovada.";
    return null;
  }
  var obj = function (p) { return p.indexOf("cos_strategy/") === 0 ? "estrategia" : p.indexOf("cos_editorial/") === 0 ? "editorial" : p.indexOf("cos_ideas/") === 0 ? "ideias" : null; };
  function falhaFn(status, code, message) {
    F.log.push("fn:" + code);
    return { data: null, error: { message: "Edge Function returned a non-2xx status code", context: { status: status, json: async function () { return { error: { code: code, message: message } }; } } } };
  }
  async function agentes(body) {
    F.log.push("fn." + body.op);
    switch (body.op) {
      case "estado": return { data: { chave: true, modelo: "claude-opus-5", orcamento: 50, gasto: 0 }, error: null };
      case "ia": {
        var s = await artifact.use("sample"); var r = await s(body.input);
        return { data: { text: r.text != null ? r.text : String(r), truncated: false }, error: null };
      }
      case "gravar": {
        var objs = {}; (body.docs || []).forEach(function (d) { var o = obj(d.path); if (o) objs[o] = 1; });
        if (!body.restaurar) { var t = trava(body.cliente, objs); if (t) return falhaFn(409, "trava", t); }
        body.docs.forEach(function (d) { putDoc(d.path, d.data); });
        Object.keys(objs).forEach(function (o) { T.aprovacoes.push({ workspace_id: WS, client_id: body.cliente, objeto: o, decisao: body.restaurar ? "restaurado" : "aprovado", ref: body.proposta || "painel", em: new Date().toISOString() }); });
        return { data: { ok: true, gravados: body.docs.length }, error: null };
      }
      case "etapas": return { data: { etapas: {} }, error: null };
      case "vitrine_ver": case "vitrine_decidir": {
        var L = T.links_publicos.find(function (l) { return l.token === body.token && l.tipo === "vitrine" && l.ativo !== false; });
        if (!L) return falhaFn(404, "link", "Este link não está mais ativo. Peça um novo para quem enviou.");
        var cli = L.client_id;
        if (body.op === "vitrine_ver") {
          var c = getDoc("cos_clients/" + cli) || {};
          return { data: { cliente: { id: cli, name: c.name, niche: c.niche, rotina: c.rotina || {}, vitrine: c.vitrine || {} }, estrategia: getDoc("cos_strategy/" + cli), editorial: (getDoc("cos_editorial/" + cli) || {}).pilares || [],
            itens: T.docs.filter(function (d) { return d.parent === "cos_calendar/" + cli + "/items" && d.data.status !== "PUBLISHED"; }).map(function (d) { return clone(d.data); }) }, error: null };
        }
        var p = "cos_calendar/" + cli + "/items/" + body.id, it = getDoc(p);
        if (!it) return falhaFn(400, "vitrine", "Pauta não encontrada.");
        putDoc(p, Object.assign({}, it, { clientStatus: body.decisao, clientNote: body.decisao === "ajuste" ? body.nota : it.clientNote || null }));
        T.aprovacoes.push({ client_id: cli, objeto: "peca", decisao: body.decisao, ref: "vitrine:" + body.id, motivo: body.nota || null });
        return { data: { ok: true, clientStatus: body.decisao }, error: null };
      }
      case "equipe_convidar": {
        var novo = "uid-" + Math.random().toString(16).slice(2, 10);
        CONTAS[novo] = { email: body.email, nome: body.email.split("@")[0], ultimo: null };
        T.membros.push({ workspace_id: WS, user_id: novo, papel: body.papel });
        F.emails.push("convite " + body.email);
        return { data: { ok: true, novo: true, papel: body.papel }, error: null };
      }
      case "equipe_email": CONTAS[body.user_id].email = body.email.toLowerCase(); return { data: { ok: true, email: body.email.toLowerCase() }, error: null };
      case "equipe_acesso": F.emails.push("acesso " + CONTAS[body.user_id].email); return { data: { ok: true, email: CONTAS[body.user_id].email }, error: null };
      case "rodar": return { data: { ok: true }, error: null };
      case "decidir": return { data: { ok: true, status: body.aprovar ? "aplicada" : "rejeitada" }, error: null };
      case "conversar": return { data: { resposta: "Certo.", acoes: [], custo_usd: 0 }, error: null };
      default: return falhaFn(400, "op", "Operação desconhecida.");
    }
  }

  window.COS_CONFIG = { url: "https://fake.supabase.co", anonKey: "anon" };
  window.supabase = {
    createClient: function () {
      return {
        auth: {
          getSession: async function () { return { data: { session: { user: U, access_token: "t" } } }; },
          onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; },
          signOut: async function () { return { error: null }; },
          signInWithPassword: async function () { return { data: { user: U }, error: null }; },
          updateUser: async function () { return { data: { user: U }, error: null }; },
          resetPasswordForEmail: async function () { return { error: null }; },
        },
        from: Q,
        rpc: async function (fn, args) {
          F.log.push("rpc." + fn);
          if (fn === "apagar_cliente") {
            var cli = args && args.cli, antes = T.docs.length;
            T.docs = T.docs.filter(function (d) { return !(d.path.indexOf("cos_") === 0 && d.path.split("/")[1] === cli); });
            ["proposals", "agent_tasks", "aprovacoes", "briefings"].forEach(function (t) { T[t] = T[t].filter(function (r) { return r.client_id !== cli; }); });
            return { data: antes - T.docs.length, error: null };
          }
          if (fn === "criar_workspace") return { data: WS, error: null };
          if (fn === "equipe") return { data: T.membros.filter(function (m) { return m.workspace_id === WS; }).map(function (m) { var c = CONTAS[m.user_id] || {}; return { user_id: m.user_id, email: c.email, nome: c.nome, papel: m.papel, ultimo_acesso: c.ultimo }; }), error: null };
          if (fn === "gasto_do_mes_painel") return { data: 0, error: null };
          if (fn === "kb_buscar") return { data: [], error: null };
          return { data: null, error: null };
        },
        functions: { invoke: async function (name, o) { return agentes((o && o.body) || {}); } },
        channel: function () { var ch = { on: function () { return ch; }, subscribe: function () { return ch; } }; return ch; },
        removeChannel: function () {},
      };
    },
  };

  // Páginas públicas (briefing e vitrine por link) chamam a função com fetch direto, sem o cliente.
  var fetchOriginal = window.fetch ? window.fetch.bind(window) : null;
  var FN = window.COS_CONFIG.url + "/functions/v1/agentes";
  window.fetch = function (u, init) {
    if (String(u).indexOf(FN) !== 0) return fetchOriginal(u, init);
    var body = {}; try { body = JSON.parse((init && init.body) || "{}"); } catch (e) {}
    return agentes(body).then(function (r) {
      var cab = { "Content-Type": "application/json" };
      if (r.error) return r.error.context.json().then(function (j) { return new Response(JSON.stringify(j), { status: r.error.context.status, headers: cab }); });
      return new Response(JSON.stringify(r.data), { status: 200, headers: cab });
    });
  };
})();
