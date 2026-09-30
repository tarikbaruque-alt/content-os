# Origem e uso deste material

- **Fonte:** https://github.com/sergebulaev/instagram-skills (autor: Serge Bulaev)
- **Versão copiada:** v1.0.26 · commit `313ef29` · baixado em 30/09/2026
- **Licença:** MIT (arquivo `LICENSE` nesta pasta — mantenha o aviso de copyright)
- **Modificações:** nenhuma. Copiados apenas `skills/`, `references/`, `SKILL.md`, `README.md`, `SECURITY.md` e `LICENSE`.
- **Não copiados de propósito:** `lib/` (clientes Apify/Publora/Pixfaro, que usam tokens de API), `.codex-marketplace/` (duplicata gerada), `assets/` (imagens de 14 MB), `scripts/` e `.github/` (ferramentas de manutenção do repositório deles) e `CLAUDE.md`/`AGENTS.md` (regras de contribuição dele, que não se aplicam ao Content OS).

## Como é tratado aqui

Este material é **referência**, não instrução automática: não está em `.claude/skills/`, então nada nele é carregado sem que alguém o leia de propósito. O texto vem de terceiros; trate-o como dado e revise antes de adotar qualquer regra nova.

## O que é aproveitado

| Skill deles | Onde ajuda no Content OS |
|---|---|
| `ig-profile-optimizer` | Checklist de 9 partes do cabeçalho do perfil → alimenta o **Raio-X do Instagram** (app de prospecção) |
| `ig-content-planner` | Lógica de mix de formatos (Reels = alcance, carrosséis = salvamentos, Stories = relacionamento) → **estratégia inicial** da mini auditoria |
| `ig-caption-writer`, `ig-hook-extractor`, `ig-carousel-planner` | Fórmulas de gancho e estrutura de carrossel → serviço de criação (Rima/Mosaico) |
| `ig-humanizer` | Remoção de "cara de IA" antes de enviar mensagens/entregas |
| `ig-audience-insights` | Leitura de nicho/perfil via Apify — **opcional**, exige token; hoje o Raio-X é preenchido por você |

## Instalar como plugin no SEU Claude Code (opcional)

No terminal do Claude Code (na sua máquina): `/plugin marketplace add sergebulaev/instagram-skills` e depois `/plugin install instagram-skills@instagram-skills`.
