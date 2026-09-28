// Simulador de window.claude para o teste de ponta a ponta do painel.
// Injetado antes do painel carregar (page.addInitScript). Imita o contrato
// real dos Artifacts: claude.use(nome) resolve o namespace ou null; o db é um
// store de documentos (doc/collection/get/set/update/delete); o sample
// responde com o JSON que cada agente pede. window.__MOCK controla o cenário.
(function () {
  var M = (window.__MOCK = window.__MOCK || { calls: [], rateLimitNext: 0, store: {}, mcpCalls: [] });
  var store = M.store;
  function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
  function snap(path) {
    var has = Object.prototype.hasOwnProperty.call(store, path);
    return { id: path.split("/").pop(), exists: has, data: function () { return has ? clone(store[path]) : undefined; } };
  }
  function doc(path) {
    return {
      id: path.split("/").pop(),
      get: async function () { return snap(path); },
      set: async function (v) { store[path] = clone(v); },
      update: async function (v) { if (!(path in store)) { var e = new Error("not_found"); e.code = "not_found"; throw e; } store[path] = Object.assign({}, store[path], clone(v)); },
      delete: async function () { delete store[path]; },
      collection: function (n) { return col(path + "/" + n); },
    };
  }
  function col(prefix) {
    var depth = prefix.split("/").length + 1;
    return {
      doc: function (id) { return doc(prefix + "/" + id); },
      get: async function () {
        return { docs: Object.keys(store).filter(function (k) { return k.indexOf(prefix + "/") === 0 && k.split("/").length === depth; }).map(snap) };
      },
    };
  }
  var db = { doc: doc, collection: col };

  var n = 0;
  function uid() { return ++n; }
  function reply(prompt) {
    var p = String(typeof prompt === "string" ? prompt : (prompt[prompt.length - 1] || {}).content || "");
    if (/Você é Íris/.test(p)) return { suggestions: [
      { section: "audience", field: "persona", value: "Mulheres de 30 a 45 anos que querem voltar a treinar", state: "FACT" },
      { section: "audience", field: "dores", value: "Não conseguem manter a rotina de treino", state: "FACT" },
      { section: "audience", field: "desejos", value: "Ter mais disposição no dia a dia", state: "FACT" },
      { section: "audience", field: "objecoes", value: "Acham que personal é caro demais", state: "FACT" },
      { section: "business", field: "oferta", value: "Consultoria de treino online", state: "FACT" },
      { section: "positioning", field: "diferenciais", value: "Treinos de 30 minutos para quem tem pouco tempo", state: "FACT" },
      { section: "communication", field: "tom", value: "Próximo e direto, sem jargão", state: "FACT" },
    ] };
    if (/Você é Átlas/.test(p)) return {
      posicionamento: "Treino possível para quem tem pouco tempo", bigMessage: "Trinta minutos bem feitos valem mais que duas horas que você não faz",
      persona: "Mulher de 30 a 45 anos, rotina cheia", percepcao: "Especialista acessível", pilares: ["Rotina", "Técnica", "Mentalidade", "Resultados"],
      paths: [
        { key: "autoridade", nome: "Autoridade", quando: "sempre", porque: "gera confiança", objetivo: "ser referência", funil: "topo", jornada: "descoberta", funcoes: ["educativo"], emocoes: ["confiança"], metricas: ["salvamentos"], relevancia: 90 },
        { key: "educacao", nome: "Educação", quando: "sempre", porque: "ensina", objetivo: "educar", funil: "meio", jornada: "consideração", funcoes: ["educativo"], emocoes: ["clareza"], metricas: ["salvamentos"], relevancia: 80 },
        { key: "conversao", nome: "Conversão / Vendas", quando: "fim do mês", porque: "vende", objetivo: "vender", funil: "fundo", jornada: "decisão", funcoes: ["conversao"], emocoes: ["segurança"], metricas: ["DMs"], relevancia: 70 },
      ],
      mix: [{ key: "autoridade", nome: "Autoridade", pct: 40 }, { key: "educacao", nome: "Educação", pct: 40 }, { key: "conversao", nome: "Conversão / Vendas", pct: 20 }],
    };
    if (/Você é Radar/.test(p)) return { items: [{ tipo: "tendência interna", insight: "Dúvidas sobre tempo de treino", origem: "Content DNA", relevancia: "alta" }] };
    if (/Linha Editorial|Bússola|pilares realmente/.test(p) && /"pilares"/.test(p)) return { pilares: [
      { pilar: "Rotina", territorio: "Tempo", temas: [{ tema: "Treino curto", subtemas: ["30 minutos"], topicos: ["como montar"] }] },
      { pilar: "Técnica", territorio: "Execução", temas: [{ tema: "Agachamento", subtemas: ["postura"], topicos: ["erros comuns"] }] },
    ] };
    if (/Você é Musa, o agente de Ideias/.test(p)) {
      var m = p.match(/Gere (\d+) ideias/), q = m ? Math.min(+m[1], 20) : 15, out = [];
      var fmts = ["Talking Head", "Carrossel educativo", "Lo-fi", "Bastidores"], funis = ["topo", "meio", "fundo"];
      for (var i = 0; i < q; i++) { var k = uid(); out.push({ titulo: "Ideia " + k + ": treino de 30 minutos", conceito: "c", angulo: "a", dorDesejo: "pouco tempo", funcao: ["descoberta", "educativo", "conversao"][i % 3], funil: funis[i % 3], jornada: "descoberta", emocao: "alívio", pilar: "Rotina", tema: "Treino curto", proposito: "p", formato: fmts[i % 4], formatoObjetivo: "alcance", formatoJustificativa: "j", hook: "Você não precisa de 2 horas", cta: "Salve", justificativa: "j", gatilhos: ["Curiosidade"], elementos: ["Contraste"] }); }
      return { ideas: out };
    }
    if (/agente de Formatos/.test(p)) return { leitura: "l", formatos: [{ nome: "Talking Head", papel: "Carro-chefe", porque: "p", comoFazer: "c" }], superficies: [{ superficie: "Reel", pct: 60 }, { superficie: "Carrossel", pct: 40 }], cadencia: "3x", series: ["Treino de bolso"], evitar: [{ pratica: "x", porque: "y", formato: "Lo-fi" }] };
    if (/Você é Rima/.test(p)) return { headline: "Trinta minutos que cabem no seu dia", roteiro: [{ label: "Hook", text: "h" }, { label: "Desenvolvimento", text: "d" }, { label: "Retenção", text: "r" }, { label: "Payoff", text: "p" }, { label: "CTA", text: "c" }], copyCurta: "cc", copyMedia: "cm", copyLonga: "cl", cta: "Salve", emocao: "alívio", emocaoPor: "p", direcaoVisual: "v" };
    if (/Você é Mosaico/.test(p)) return { capaHeadline: "Capa", hook: "h", estrutura: "lista", slides: [{ papel: "capa", titulo: "t", texto: "x" }, { papel: "fim", titulo: "t2", texto: "x2" }], copy: "c", cta: "Salve", emocao: "e", emocaoPor: "p", direcaoVisual: "v" };
    if (/Você é Enredo/.test(p)) return { tipo: "bastidores", stories: [{ papel: "abertura", fala: "f", interacao: "enquete" }], cta: "c", emocao: "e", emocaoPor: "p" };
    if (/mensagem de abertura/.test(p)) return { mensagem: "Oi! Segue o calendário." };
    return {};
  }
  async function run(input, opts) {
    M.calls.push(String(typeof input === "string" ? input : JSON.stringify(input)).slice(0, 120));
    if (M.rateLimitNext > 0) { M.rateLimitNext--; var e = new Error("rate"); e.code = "rate_limited"; throw e; }
    return reply(input);
  }
  var sample = function (input, opts) { return run(input, opts).then(function (o) { return { text: JSON.stringify(o), truncated: false }; }); };
  sample.json = run;
  sample.limits = async function () { return { images: false }; };

  var mcp = {
    callTool: async function (server, tool, input) { M.mcpCalls.push([server, tool, input]); return { payload: M.mcpReply ? M.mcpReply(server, tool, input) : { id: "ev1", messages: [] } }; },
    listTools: async function () { return { servers: [] }; },
  };
  var downloads = { save: async function (f) { M.downloads = (M.downloads || []).concat([f.filename]); } };
  var caps = { db: db, sample: sample, mcp: mcp, downloads: downloads };
  if (M.offline) return;
  window.claude = { use: function (name) { return new Promise(function (r) { setTimeout(function () { r(caps[name] || null); }, 5); }); } };
})();
