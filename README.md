# Coli Loterias

Site da Coli Loterias (Ipiranga – SP): resultados ao vivo, estatísticas
completas do 1º ao último concurso e gerador de jogos das Loterias CAIXA,
com atualização automática pela API oficial.

## Estrutura do repositório

```
site/     → o site pronto para publicar (é o conteúdo do .zip)
tools/    → build.py (gera data/*.json, páginas de estatísticas e o zip)
            template-estatisticas.html
dist/     → coli-loterias.zip (entregável)
```

## Publicar

Leia `site/LEIA-ME.md` — explica passo a passo como subir no WordPress /
hospedagem, configurar o WhatsApp e como funciona a atualização automática.

## Regenerar o zip

```bash
python3 tools/build.py            # baixa o histórico (cache 12h), gera páginas e o zip
python3 tools/build.py --forcar   # força novo download do histórico
```

O histórico embutido vem da base pública `eitchtee/loterias.json` (GitHub).
Em produção, o proxy `site/api/loterias.php` mantém esses arquivos
atualizados sozinho a partir da API da CAIXA.
