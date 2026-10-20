# MateGrowth — novo website institucional

**Versão de revisão · 20 de outubro de 2026**

Website estático, sem instalação de Node, sem framework e sem etapa de build. Não foi publicado.

## O que mudou

- Posicionamento: marketing para Home/Family Daycares, Child Care Centers e Preschools.
- Home, serviços, sistema, projetos, sobre, contato e privacidade em **PT / EN / ES**.
- Websites continuam em destaque; **SEO e SEO Local** agora têm uma página própria.
- Sistemas apresentados por função: contatos, registros, cobranças e financeiro. Os quatro grupos SmartMate aparecem com explicação simples.
- Portfólio com capturas fornecidas no ZIP e páginas de projeto traduzidas. Sem métricas ou resultados comerciais inventados.
- Contato por SMS, e-mail e WhatsApp; resumo comercial opcional, preparado no navegador.
- 48 páginas institucionais + 3 páginas 404 localizadas + 3 páginas de ofertas preservadas = **54 arquivos HTML**.

## Como abrir e revisar

1. Extraia o ZIP.
2. Abra a pasta **MateGrowth** no VS Code.
3. Use o Live Server, ou execute no terminal, dentro dessa pasta:

   ```bash
   python3 -m http.server 8000
   ```

4. Abra `http://localhost:8000` no navegador.

Idiomas: `/` (português), `/en/` (inglês), `/es/` (espanhol).

**Não abra apenas o HTML por duplo clique:** os caminhos de assets e páginas partem da raiz do website. Um servidor local faz a prévia correta.

## Antes de publicar — IMPORTANTE

As páginas novas continuam com **`noindex, follow`**, pois esta é a versão para sua aprovação. Isso evita liberar conteúdo novo para buscadores antes da revisão. Não publique e esqueça essa configuração ativada.

Depois de aprovar, você pode liberar a indexação das 48 páginas institucionais:

```bash
python3 tools/publicacao.py --liberar-indexacao
```

Para voltar ao estado de revisão:

```bash
python3 tools/publicacao.py --proteger-indexacao
```

O script altera arquivos locais. **Ele não publica nada, não faz commit nem push.** As páginas 404 continuam `noindex`. Os estados de indexação das landing pages preservadas não são alterados por esse comando.

O `sitemap.xml` já contém as URLs destinadas à publicação. Revise a indexação junto com o sitemap antes de enviar ao Search Console. O `CNAME` existente foi mantido como `mategrowth.com`.

## O que foi preservado, sem mudar preços

As pastas abaixo foram copiadas da base enviada, com suas páginas, conteúdo, estilos e scripts intactos:

- `/gbp-daycare/`
- `/website-daycare/`, incluindo `privacidade.html`

Essas ofertas não ficam no menu principal da nova versão. Seus endereços continuam disponíveis para campanhas existentes. Seus preços, manutenção, idiomas, bônus e menções de beta precisam ser conferidos no planejamento comercial antes de voltar a divulgá-las.

**As condições dessas landing pages não são automaticamente as condições de um projeto para centros maiores.**

Os 33 endereços institucionais anteriores foram mantidos. Foram adicionadas versões em três idiomas de `/services/`, `/seo/`, `/about/`, `/contact/` e `/privacy/`.

## Contato: funcionamento real

O formulário de `/contact/` **não envia e-mails por conta própria e não grava leads em um banco**. Ele prepara uma mensagem localmente, permite revisar e abre SMS, e-mail ou WhatsApp para a pessoa confirmar o envio.

- Não existe falsa confirmação de mensagem enviada.
- Os campos não são gravados em localStorage.
- Dados pessoais do resumo não são colocados nos links do DOM nem nos eventos personalizados.
- Sem JavaScript, os campos ficam desativados e as alternativas diretas de contato continuam disponíveis.
- Nenhuma integração com Supabase, CRM ou e-mail de servidor foi inventada.

Dados mantidos da base fornecida:

- SMS / WhatsApp: `+1 (774) 615-6579`
- E-mail: `MateGrowthus@gmail.com`
- Instagram: `https://www.instagram.com/mategrowthus/`

## Analytics e privacidade

- ID GA4 preservado: `G-Q1NMCRWD77`.
- Nas páginas institucionais novas, a tag só carrega depois de aceitar análise **e apenas no domínio mategrowth.com**. Prévia local não envia dados ao GA4.
- Não há Meta Pixel novo.
- Clique de contato e resumo preparado não são registrados como lead confirmado ou venda.
- A pessoa pode rever a autorização no rodapé.
- As landing pages preservadas têm implementações próprias. O aviso de privacidade explica essa distinção.

**Na revisão da conta GA4, confira também a Medição Otimizada** e suas opções de formulários/cliques externos, para manter a coleta alinhada à política do negócio. A configuração da conta e a entrega em produção não foram testadas nesta revisão local.

## Arquivos principais

- `assets/v2/site.css`: identidade visual e layout responsivo.
- `assets/v2/site.js`: menu, formulário, privacidade e eventos.
- `assets/v2/`: logo otimizada, imagens dos projetos, exemplos criativos e cartões de compartilhamento.
- `assets/media/mategrowth-signature.mp4`: assinatura de 5 segundos já aprovada, usada na página de vídeos.
- `tools/validar.py`: checagem local de links, assets, JSON e títulos.
- `QA.md`: resultado e limites dos testes.

Para validar depois de editar:

```bash
python3 tools/validar.py
```

## Publicação

Faça backup da pasta atual. Copie os arquivos novos para a raiz do seu projeto, **preservando a pasta `.git` local**, que não faz parte deste ZIP. Revise em uma branch ou prévia antes do deploy. Este pacote não altera automaticamente o repositório nem o site online.

O que ainda depende de você: aprovação dos textos, condições das ofertas existentes, eventual troca das capturas por versões mais recentes, validação do contato no aparelho final e autorização para liberar a indexação/publicar.
