# Integração — Notion (camada opcional)

> Diretriz de arquitetura. **Documentado, não implementado.**

---

## 1. Papel de cada sistema

| Sistema | Papel |
|---|---|
| **Content OS** | **fonte principal** de inteligência e dados (Content DNA, estratégia, conteúdos, calendário, performance) |
| **Notion** | camada **opcional** de compartilhamento e sincronização com o cliente |

> O Notion **não é o banco de dados** do produto. Se o Notion sair de cena, o
> Content OS continua íntegro. A dependência é de saída, nunca de verdade.

## 2. Direção da sincronização

**Content OS → Notion**, após **aprovação humana** de um calendário. Push de
campos selecionados para a base/página daquele cliente:

`data` · `plataforma` · `objetivo` · `jornada` · `funil` ·
`função estratégica` · `pilar` · `tema` · `formato` · `headline` · `roteiro` ·
`copy` · `CTA` · `status`

Campos internos (hipóteses, raciocínio dos agentes, proveniência, aprendizados
não validados) **não** são sincronizados por padrão.

## 3. Regra de autorização (inegociável)

**Nenhuma ação externa ou sincronização acontece sem autorização explícita do
estrategista.** Sem exceção — nem "para testar", nem em background, nem como
efeito colateral de outra ação. Ver [`../governance.md`](../governance.md).

## 4. Preparação arquitetural

- Integração via **API do Notion**, atrás de uma interface (`SyncTarget`), do
  mesmo jeito que o LLM está atrás de `LlmProvider` — sem lock-in.
- Mapeamento **campo do Content OS → propriedade do Notion** configurável por cliente.
- Toda sincronização gera **registro de auditoria** (o que foi enviado, quando,
  autorizado por quem).
