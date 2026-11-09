# Landing Daycare — integração MateGrowth

Rotas: `/daycare/` (português, campanha inicial) e `/daycare/en/` (inglês). Raiz pública: a raiz deste repositório. Hospedagem atual: GitHub Pages, branch main, sem backend Node no host.

O pacote em Downloads/MateGrowth-Landing-Daycare e a pasta daycare já existente eram idênticos (17 arquivos). A versão aprovada foi preservada; alterações funcionais no formulário, privacidade e medição. Fotos, mockups e vídeos mantidos, sem reencodificação. A marcação noindex,nofollow original da revisão permanece; a política de SEO não foi alterada nesta implementação.

## Envio automático

`daycare/intake.js` envia JSON ao endpoint configurado em `daycare/config.js`. A preferência WhatsApp/telefone/e-mail apenas define o retorno, não abre aplicativos. Há confirmação local somente após `ok:true,status:accepted` do servidor. Isso confirma aceitação pelo Resend, não entrega na caixa de entrada.

Backend isolado: `backend/daycare-intake/index.ts` e `handler.mjs`, publicado como `submit-mategrowth-daycare` no projeto Supabase SmartMate - PROD (`hdvjtezjhalzharqdyfv`). Usa o mesmo `RESEND_API_KEY` e o remetente existente `SmartMate <support@smartimateapp.com>`. Destinatário fixo: `mategrowthus@gmail.com`. Não altera funções antigas, não grava no CRM nem em tabelas do SmartMate.

O endpoint é público para permitir envio sem login. Restringe origens a mategrowth.com/www, valida enums, campos condicionais, tamanho, contatos e parâmetros de campanha, usa honeypot e limite básico por IP na instância. Esse limite em memória não substitui um controle distribuído/captcha se o volume ou abuso exigir.

O botão fica bloqueado durante o POST. Repetições mantêm o mesmo UUID e corpo; o Resend recebe Idempotency-Key, com janela documentada de 24 horas. O cliente não repete automaticamente tentativas ambíguas após 23 horas. Erros preservam respostas e permitem nova tentativa. Dados pessoais não são gravados em armazenamento local; somente campanha, preferências e identificadores de eventos.

## Configuração que falta

A credencial RESEND_API_KEY já funciona no projeto Supabase e não precisa ser copiada para este repositório. Se for necessário repô-la, usar Supabase → SmartMate - PROD → Edge Functions → Secrets → RESEND_API_KEY. Nunca inserir a chave em config.js, HTML, Git ou .env publicado.

Falta o Measurement ID GA4 REAL da MateGrowth. Preencher `window.MG_DAYCARE_CONFIG.ga4MeasurementId` em `daycare/config.js` com o G-... correto. Está vazio e nenhum Google tag é carregado. O site institucional não possuía GA4/GTM/consentimento para reaproveitar; não foi usado o ID de outra cliente.

Com ID real, analytics.js oferece aceitar/recusar/alterar, respeita GPC e só carrega após aceitação. Eventos: `cta_click`, `daycare_form_start` (nome próprio para não duplicar o form_start automático do GA4) e `generate_lead` uma vez por pedido, somente após confirmação do servidor. Não envia nome, telefone, e-mail, respostas ou request ID aos eventos. UTMs permitidas são preservadas na troca PT/EN e enviadas na ficha. Consentimento recusado não impede envio comercial.

Conferir a configuração real da propriedade/Tag Assistant antes da campanha: a medição automática de formulários pode existir na propriedade, e form_submit não equivale a lead recebido. Os testes com tag simulada não comprovam recebimento no GA4.

## Prévia e verificações

Node 22 usado nos testes. Sem novas dependências npm no projeto.

```
node tools/daycare-preview.mjs
node --test tests/daycare-handler.test.mjs
python3 tools/validar.py
node --check daycare/intake.js
node --check daycare/analytics.js
```

Prévia: http://127.0.0.1:8124/daycare/ e /daycare/en/. O servidor local faz proxy ao endpoint real sem credenciais. ATENÇÃO: enviar nessa prévia envia e-mail real; use apenas TESTE autorizado. O servidor fica restrito a 127.0.0.1. A URL pública configurada funciona diretamente em https://mategrowth.com, sem esse proxy.

Teste real executado: `[TESTE] Nova lead | Preencher vagas | Revere, MA`. Aceito pelo serviço, confirmação exibida no celular. Repetições do mesmo UUID devolveram o mesmo providerMessageId. Verificar Inbox/Spam no Gmail; não há acesso à caixa para confirmar entrega.

## Antes de ativar a campanha

1. Confirmar no Gmail o TESTE acima.
2. Informar/configurar o ID GA4 MateGrowth e conferir consentimento/eventos na propriedade real.
3. Revisar a prévia e publicar a branch na main pelo fluxo GitHub Pages. As duas rotas ainda respondiam 404 no domínio no momento da implementação local; nenhum push de frontend foi feito.
4. Após publicação, verificar as duas URLs, CORS, formulário e campanha PT no domínio. Não iniciar anúncios apontando para a prévia local.

A fonte completa da nova função está em backend/daycare-intake; mudanças futuras devem republicar somente submit-mategrowth-daycare, sem sobrescrever submit-provider-lead ou os processadores do SmartimateApp. Ela não precisa de service_role nem chave Supabase no navegador.

Referências: https://resend.com/docs/dashboard/emails/idempotency-keys e https://supabase.com/docs/guides/functions/secrets.
