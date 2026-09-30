# Integrar o Pixabay (B-roll) — passo a passo

O Pexels já funciona. O Pixabay é a segunda fonte de vídeos e imagens (licença livre, sem marca d'água).

## 1. Criar a conta e pegar a chave (gratuita)
1. Acesse https://pixabay.com e crie uma conta (ou entre).
2. Abra https://pixabay.com/api/docs/ (logado).
3. A chave de API aparece no topo da página. Copie.

## 2. Salvar a chave no ambiente (não cole no chat)
1. Claude Code na web → barra de título da sessão → nome do ambiente → **Editar ambiente em nuvem**.
2. Em **Variáveis de ambiente**, adicione:
   ```
   PIXABAY_API_KEY=cole_a_chave_aqui
   ```
   Sem aspas, sem espaços antes/depois, uma variável por linha.
3. Salve.

## 3. Liberar a rede (Acesso à rede: Personalizado)
Mantenha o que já está (Notion, Anthropic, Pexels) e confirme, um por linha, sem espaços no fim:
```
pixabay.com
cdn.pixabay.com
```

## 4. Abrir uma sessão nova
Variáveis e rede só valem em sessões novas. Escreva:
> "confere se as chaves do Pexels e do Pixabay estão definidas e faz uma busca de teste de 'café close' nas duas fontes"

## Uso depois
```
python3 scripts/buscar_broll.py "café close" --fonte ambas --n 3
python3 scripts/buscar_broll.py "escritório moderno" --tipo imagem
```
Destino: `assets/broll/` (créditos em `creditos.json`).

## Dicas
- Erro ao salvar: a chave deve estar sozinha na linha da variável, nunca grudada em um domínio.
- Segurança: a chave do Pexels foi exibida no chat. Gere uma nova em pexels.com/api e troque `PEXELS_API_KEY`.
- Pinterest não entra como fonte de mídia; use prints em `referencias/` como moodboard.
