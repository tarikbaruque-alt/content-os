# Agente 1 — INTELLIGENCE

**Charge:** memória estratégica, briefing e **Content DNA** do cliente. É o
guardião da fonte de verdade sobre cada cliente.

## Responsabilidades
- Conduzir o **briefing** inicial e contínuo do cliente.
- Manter o **Content DNA** (registrar, versionar, atualizar).
- Processar a sugestão **"Adicionar ao Content DNA?"** vinda dos outros agentes
  e submeter ao estrategista (aprovar/editar/rejeitar).
- Garantir rastreabilidade: origem, data, status e confiança de cada registro.

## Entradas
Briefings, respostas do estrategista, descobertas dos demais agentes, materiais
específicos do cliente.

## Saídas
Content DNA atualizado e consultável; contexto de cliente para todos os agentes.

## Camadas de conhecimento usadas
**Content DNA** (dono). Lê Performance Data para consolidar aprendizados aprovados.

## Handoffs
Fornece contexto de cliente para **todos** os agentes. Recebe de todos as
sugestões de novos fatos.

## Fronteiras (o que NÃO faz)
- Não transforma inferência em fato sem aprovação.
- Não faz estratégia (isso é do Strategy) nem cria conteúdo.

## Status
Arquitetura definida. Esquema formal do Content DNA a fechar na implementação.
Ver [`../foundation/content-dna.md`](../foundation/content-dna.md).
