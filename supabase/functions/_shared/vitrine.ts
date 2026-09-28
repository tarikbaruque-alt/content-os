import type { Backend } from "./tipos.ts";
import { prazosDaPeca, somarDias } from "./prazos.ts";

/**
 * Vitrine e agenda por link (token de links_publicos): o que o cliente vê, a
 * decisão dele sobre cada pauta e a assinatura de calendário (.ics). O visitante
 * é anônimo: tudo que sai daqui é só o necessário e tudo que entra é limpo.
 */
const hoje = (agora: Date) => new Date(agora.getTime() - 3 * 3600e3).toISOString().slice(0, 10);
const txt = (v: unknown, max = 4000) => (typeof v === "string" ? v.slice(0, max) : v == null ? undefined : String(v).slice(0, max));
export const idPecaValido = (id: unknown): id is string => typeof id === "string" && /^[\w-]{1,80}$/.test(id);
const HORA_PADRAO: Record<string, string> = { Reel: "18:30", Carrossel: "12:00", Imagem: "12:00", "Vídeo": "19:00", Stories: "09:00" };

/** Só o que a vitrine desenha: nada de custo, execução, notas internas ou dados da equipe. */
function pecaPublica(it: Record<string, any>) {
  const x = it.idea ?? {}, c = it.content, cr = it.carousel, s = it.stories;
  return {
    id: it.id, data: it.data, hora: txt(it.hora, 5), status: it.status, clientStatus: txt(it.clientStatus, 20), clientNote: txt(it.clientNote, 1000),
    idea: { titulo: txt(x.titulo), tema: txt(x.tema), conceito: txt(x.conceito), hook: txt(x.hook), cta: txt(x.cta), surface: txt(x.surface, 20), format: txt(x.format), funil: txt(x.funil, 10), funcao: txt(x.funcao), proposito: txt(x.proposito), objetivo: txt(x.objetivo), angulo: txt(x.angulo) },
    content: c ? { headline: txt(c.headline), roteiro: Array.isArray(c.roteiro) ? c.roteiro.slice(0, 20).map((q: any) => ({ label: txt(q?.label, 60), text: txt(q?.text) })) : undefined, copy: txt(c.copy), copyVariants: c.copyVariants ? { media: txt(c.copyVariants.media) } : undefined, cta: txt(c.cta) } : null,
    carousel: cr ? { capaHeadline: txt(cr.capaHeadline), slides: Array.isArray(cr.slides) ? cr.slides.slice(0, 20).map((q: any) => ({ titulo: txt(q?.titulo), texto: txt(q?.texto) })) : [], copy: txt(cr.copy) } : null,
    stories: s && Array.isArray(s.stories) ? { stories: s.stories.slice(0, 20).map((q: any) => ({ fala: txt(q?.fala), papel: txt(q?.papel, 60), visual: txt(q?.visual), interacao: txt(q?.interacao) })) } : null,
  };
}

export async function dadosDaVitrine(b: Backend, ws: string, cli: string, agora: Date) {
  const c = (await b.getDoc(ws, `cos_clients/${cli}`)) ?? {};
  const de = somarDias(hoje(agora), -7), ate = somarDias(hoje(agora), 60);
  const itens = (await b.listDocs(ws, `cos_calendar/${cli}/items`)).map((d) => d.data)
    // Publicada não se aprova mais: a vitrine mostra o que ainda vai ao ar.
    .filter((it) => typeof it.data === "string" && it.data >= de && it.data <= ate && it.status !== "PUBLISHED")
    .sort((a, b2) => (a.data < b2.data ? -1 : a.data > b2.data ? 1 : 0)).slice(0, 80).map(pecaPublica);
  const st = (await b.getDoc(ws, `cos_strategy/${cli}`)) ?? null, ed = (await b.getDoc(ws, `cos_editorial/${cli}`)) ?? null;
  return {
    cliente: { id: cli, name: txt(c.name, 120) ?? "", niche: txt(c.niche, 120) ?? "", rotina: c.rotina ?? {}, vitrine: c.vitrine ? { titulo: txt(c.vitrine.titulo, 120), mensagem: txt(c.vitrine.mensagem, 1200), emoji: txt(c.vitrine.emoji, 8) } : {} },
    estrategia: st ? { posicionamento: txt(st.posicionamento), bigMessage: txt(st.bigMessage), persona: txt(st.persona), percepcao: txt(st.percepcao), mix: Array.isArray(st.mix) ? st.mix.map((m: any) => ({ nome: txt(m?.nome, 80), pct: Number(m?.pct) || 0 })) : [], pilares: Array.isArray(st.pilares) ? st.pilares.map((p: any) => txt(p, 200)) : [] } : null,
    editorial: ed && Array.isArray(ed.pilares) ? ed.pilares.slice(0, 12).map((p: any) => ({ pilar: txt(p?.pilar, 120), territorio: txt(p?.territorio, 200), temas: Array.isArray(p?.temas) ? p.temas.slice(0, 12).map((t: any) => ({ tema: txt(t?.tema, 160), subtemas: Array.isArray(t?.subtemas) ? t.subtemas.slice(0, 10).map((s: any) => txt(s, 120)) : [], topicos: [] })) : [] })) : [],
    itens,
  };
}

/** Aprovar ou pedir ajuste numa pauta. Grava na peça e no histórico (por = null: foi o cliente). */
export async function decidirPauta(b: Backend, ws: string, cli: string, id: unknown, decisao: unknown, nota: unknown, agora: Date): Promise<{ ok: true; clientStatus: string } | { erro: string }> {
  if (!idPecaValido(id)) return { erro: "Pauta não encontrada." };
  if (decisao !== "aprovado" && decisao !== "ajuste") return { erro: "Decisão inválida." };
  const path = `cos_calendar/${cli}/items/${id}`;
  const it = await b.getDoc(ws, path);
  if (!it) return { erro: "Pauta não encontrada." };
  const n = typeof nota === "string" ? nota.replace(/\u0000/g, "").trim().slice(0, 1000) : "";
  if (decisao === "ajuste" && !n) return { erro: "Conte o que você gostaria de ajustar." };
  await b.setDoc(ws, path, { ...it, clientStatus: decisao, clientNote: decisao === "ajuste" ? n : it.clientNote ?? null, clientAt: agora.toISOString() });
  await b.registrarAprovacao({ workspace_id: ws, client_id: cli, objeto: "peca", decisao, ref: `vitrine:${id}`, motivo: n || null, por: null });
  return { ok: true, clientStatus: decisao };
}

// ---------------------------------------------------------------- .ics
const icsEsc = (s: unknown) => String(s ?? "").replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/[,;]/g, (c) => "\\" + c);
const dobra = (l: string) => { const c = Array.from(l), o: string[] = []; for (let i = 0; i < c.length; i += 60) o.push(c.slice(i, i + 60).join("")); return o.join("\r\n "); };
const dt = (iso: string, hhmm: string, mais = 0) => {
  const [h, m] = hhmm.split(":").map(Number); const d = new Date(`${iso}T00:00:00Z`); d.setUTCMinutes((h || 0) * 60 + (m || 0) + mais);
  return d.toISOString().replace(/[-:]/g, "").slice(0, 15);
};
const horaDe = (it: Record<string, any>, rot: Record<string, any>) => {
  const s = it.idea?.surface ?? "Reel";
  const v = it.hora || (s === "Stories" ? String(rot.Stories ?? "").split(/[,;\s]+/)[0] : rot[s]) || rot.Reel || HORA_PADRAO[s] || "18:30";
  return /^\d{1,2}:\d{2}$/.test(v) ? v : "18:30";
};

/**
 * Calendário para assinar: publicações e dias de produção. Horário local (sem
 * fuso), como o .ics que o painel já baixava; o app mostra no fuso do aparelho.
 */
export async function icsDaAgenda(b: Backend, ws: string, clientes: string[], agora: Date): Promise<string> {
  const de = somarDias(hoje(agora), -14), ate = somarDias(hoje(agora), 120), stamp = agora.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Content OS//Agenda//PT-BR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${icsEsc(clientes.length === 1 ? "Conteúdo" : "Content OS, todos os clientes")}`, "X-PUBLISHED-TTL:PT1H"];
  for (const cli of clientes) {
    const c = (await b.getDoc(ws, `cos_clients/${cli}`)) ?? {}, rot = c.rotina ?? {}, nome = c.name ?? cli;
    const op = c.operacao ?? {}, gravHora = /^\d{1,2}:\d{2}$/.test(rot.gravHora ?? "") ? rot.gravHora : "09:00";
    const producao: Record<string, string[]> = {};
    for (const { data: it } of await b.listDocs(ws, `cos_calendar/${cli}/items`)) {
      if (typeof it.data !== "string" || it.data < de || it.data > ate) continue;
      const titulo = it.content?.headline || it.carousel?.capaHeadline || it.idea?.titulo || "Conteúdo", s = it.idea?.surface ?? "Reel", h = horaDe(it, rot);
      L.push("BEGIN:VEVENT", `UID:pub-${cli}-${it.id}@content-os`, `DTSTAMP:${stamp}`, `DTSTART:${dt(it.data, h)}`, `DTEND:${dt(it.data, h, 30)}`,
        `SUMMARY:${icsEsc(`${clientes.length > 1 ? nome + ": " : ""}Postar ${s}: ${titulo}`)}`,
        `DESCRIPTION:${icsEsc([it.idea?.format, it.idea?.funil, it.status === "PUBLISHED" ? "publicada" : it.clientStatus === "aprovado" ? "aprovada pelo cliente" : ""].filter(Boolean).join(" · "))}`,
        "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(titulo)}`, "TRIGGER:-PT30M", "END:VALARM", "END:VEVENT");
      if (it.status !== "PUBLISHED") (producao[prazosDaPeca(it.data, rot, op).producao] ??= []).push(`${s}: ${titulo}`);
    }
    for (const [dia, pecas] of Object.entries(producao)) {
      L.push("BEGIN:VEVENT", `UID:prod-${cli}-${dia}@content-os`, `DTSTAMP:${stamp}`, `DTSTART:${dt(dia, gravHora)}`, `DTEND:${dt(dia, gravHora, (Number(rot.gravDur) || 3) * 60)}`,
        `SUMMARY:${icsEsc(`${clientes.length > 1 ? nome + ": " : ""}Gravação e produção, ${pecas.length} peça${pecas.length > 1 ? "s" : ""}`)}`,
        `DESCRIPTION:${icsEsc(pecas.join("\n"))}`, "END:VEVENT");
    }
  }
  L.push("END:VCALENDAR");
  return L.map(dobra).join("\r\n") + "\r\n";
}
