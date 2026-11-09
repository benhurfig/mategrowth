# Landing Daycare — integração MateGrowth

Rotas: `/daycare/` (português, campanha inicial) e `/daycare/en/` (inglês). Raiz pública: a raiz deste repositório. Hospedagem atual: GitHub Pages, branch main, sem backend Node no host.

O pacote em Downloads/MateGrowth-Landing-Daycare e a pasta daycare já existente eram idênticos (17 arquivos). A versão aprovada foi preservada; alterações funcionais no formulário, privacidade e medição. Fotos, mockups e vídeos mantidos, sem reencodificação. A marcação noindex,nofollow original da revisão permanece; a política de SEO não foi alterada nesta implementação.

## Envio automático

`daycare/intake.js` envia JSON ao endpoint configurado em `daycare/config.js`. A preferência WhatsApp/telefone/e-mail apenas define o retorno, não abre aplicativos. Há confirmação local somente após `ok:true,status:accepted` do servidor. Isso confirma aceitação pelo Resend, não entrega na caixa de entrada.

Backend isolado: `backend/daycare-intake/index.ts` e `handler.mjs`, publicado como `submit-mategrowth-daycare` no projeto Supabase SmartMate - PROD (`hdvjtezjhalzharqdyfv`). Usa o mesmo `RESEND_API_KEY` e o remetente existente `SmartMate <support@smartimateapp.com>`. Destinatário fixo: `mategrowthus@gmail.com`. Não altera funções antigas, não grava no CRM nem em tabelas do SmartMate.

O endpoint é público para permitir envio sem login. Restringe origens a mategrowth.com/www, valida enums, campos condicionais, tamanho, contatos e parâmetros de campanha, usa honeypot e limite básico por IP na instância. Esse limite em memória não substitui um controle distribuído/captcha se o volume ou abuso exigir.

O botão fica bloqueado durante o POST. Repetições mantêm o mesmo UUID e corpo; o Resend recebe Idempotency-Key, com janela documentada de 24 horas. O cliente não repete automaticamente tentativas ambíguas após 23 horas. Erros preservam respostas e permitem nova tentativa. Dados pessoais não são gravados em armazenamento local; somente campanha, preferências e identificadores de eventos.

## Configuração ativa

A credencial RESEND_API_KEY já funciona no projeto Supabase e não precisa ser copiada para este repositório. Se for necessário repô-la, usar Supabase → SmartMate - PROD → Edge Functions → Secrets → RESEND_API_KEY. Nunca inserir a chave em config.js, HTML, Git ou .env publicado.

O Measurement ID GA4 `G-Q1NMCRWD77`, fornecido pela cliente, está em `window.MG_DAYCARE_CONFIG.ga4MeasurementId` no arquivo `daycare/config.js`. A tag carrega automaticamente para novas visitas, sem banner de aceite; recusa anterior e GPC continuam respeitados. O site institucional não possuía GA4/GTM/consentimento para reaproveitar; não foi usado o ID de outra cliente.

Analytics.js carrega o GA4 automaticamente e oferece somente um controle discreto de ativar/desativar no rodapé, sem banner. Respeita GPC e recusas já salvas. Eventos: `cta_click`, `form_start` automático da propriedade GA4 (confirmado com a tag real, sem segundo disparo manual) e `generate_lead` uma vez por pedido, somente após confirmação do servidor. Não envia nome, telefone, e-mail, respostas ou request ID aos eventos. UTMs permitidas são preservadas na troca PT/EN e enviadas na ficha. Consentimento recusado não impede envio comercial.

Conferir a configuração real da propriedade/Tag Assistant antes da campanha: a medição automática de formulários já está ativa e é reutilizada para form_start. Não adicionar um segundo início manual; form_submit não equivale a lead recebido. Os testes com tag simulada não comprovam recebimento no GA4.

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
2. Conferir recebimento dos eventos na propriedade GA4 G-Q1NMCRWD77. Teste no navegador não comprova relatórios da propriedade.
3. Publicação na main autorizada pela cliente em 08/11/2026 após os testes. Usar o fluxo GitHub Pages existente; o resultado do deploy será registrado na entrega pós-publicação. As duas rotas respondiam 404 antes da integração.
4. Conferir as duas URLs públicas, CORS, formulário e campanha PT no domínio após o deploy. Não iniciar anúncios apontando para a prévia local.

A fonte completa da nova função está em backend/daycare-intake; mudanças futuras devem republicar somente submit-mategrowth-daycare, sem sobrescrever submit-provider-lead ou os processadores do SmartimateApp. Ela não precisa de service_role nem chave Supabase no navegador.

Referências: https://resend.com/docs/dashboard/emails/idempotency-keys e https://supabase.com/docs/guides/functions/secrets.

Recusa/revogação também usa ga-disable-G-Q1NMCRWD77 para impedir coleta automática após a retirada do consentimento. Se o SDK ainda carrega quando o servidor confirma a ficha, o lead aguarda esse carregamento e só é medido uma vez se a medição continuar habilitada.

Ajuste solicitado pela cliente: removidos o texto abaixo do vídeo de demonstração e o banner de Analytics nas duas rotas. O envio, a deduplicação e a condição de generate_lead após aceite do serviço de e-mail permanecem intactos.

## Atualização: prioridades e horário de retorno

O formulário fica abaixo da apresentação da seção #intake, com largura completa e campos curtos em duas colunas no desktop. As seis prioridades são checkboxes; exige ao menos uma. As perguntas consideram todas as escolhas, preservam respostas ainda relevantes e não enviam campos retirados. O website compartilhado aparece uma vez. A preferência opcional de horário usa o horário local da lead e não confirma atendimento.

Validações desta etapa: 14 testes de servidor aprovados, incluindo 63 combinações de prioridades, horário em branco/customizado, dados inválidos, compatibilidade antiga, erro e deduplicação. Chrome local em PT/EN a 390, 768 e 1440 px: formulário abaixo do título, sem overflow, campos corretos, troca de idioma e UTMs, erro preservando respostas, clique repetido e um generate_lead após aceite simulado. O e-mail anterior foi comparado com a versão anterior e continua idêntico para retries. As 58 páginas passaram na verificação estática.

O TESTE desta etapa usa as prioridades Preencher vagas + Criar ou melhorar o website, retorno WhatsApp e Dias de semana, entre 16h e 17h. Assunto esperado: [TESTE] Nova lead | Preencher vagas + Criar ou melhorar o website | Revere, MA. A entrega final distingue aceite do serviço e chegada no Gmail.

## Anúncios — ajuste em português em 09/11/2026

Em /daycare/, Divulgar com anúncios abre uma pergunta com quatro escolhas múltiplas: Vagas abertas agora; Matrículas para uma turma ou data futura; Minha daycare para mais famílias da região; Outro. Exige pelo menos uma opção. O texto livre aparece e é exigido somente em Outro; ao ocultar, não segue na ficha. A idade/turma de Preencher vagas é reutilizada, sem segunda pergunta. As escolhas e Outro seguem no e-mail. A versão inglesa mantém a pergunta aberta anterior. O endpoint aceita também os formatos anteriores de ads, preservando o corpo de retries idempotentes.

## Ajuda no formulário português — 09/11/2026

/daycare/ não mostra mais o seletor PT/EN no topo. /daycare/en/ permanece disponível para trabalho separado. Abaixo de Enviar meu pedido há uma ajuda discreta: Ficou com alguma dúvida ao preencher? / Fale comigo no WhatsApp. O destino é wa.me/17746156579 com a mensagem aprovada, target=_blank e rel=noopener noreferrer para preservar a página e as respostas. Funciona como link mesmo sem JavaScript.

O evento whatsapp_help_click usa apenas locale, form_id e cta_location=form_help, respeita escolha de Analytics e GPC, inclusive quando a tag ainda está carregando ou a escolha é revogada. Não inclui telefone, mensagem ou respostas nos parâmetros personalizados. Esse clique não chama lead nem gera generate_lead; generate_lead continua reservado à confirmação accepted do envio automático.

## Correção de envio e canal de anúncio — 09/11/2026

Causa reproduzida em produção: o Chrome preenchia automaticamente companyWebsite, campo oculto antispam, com o mesmo nome da daycare. A validação nativa passava, mas a função respondia 422 com fields=[companyWebsite]; o Resend não era chamado. O DOM da página que falhou confirmou :-webkit-autofill e igualdade com business.

A versão atual usa um nome neutro para o campo oculto, contêiner inert e indicadores para não preencher via gerenciadores. O servidor aceita o falso positivo específico (valor igual ao nome da daycare normalizado), mantendo rejeição de valores alheios e os limites existentes. Isso também corrige o envio de páginas antigas abertas, sem exigir perda das respostas.

No português, Divulgar com anúncios agora abre Onde você gostaria de anunciar sua daycare?, select opcional com Google, Facebook/Instagram, Nos dois ou recomendação. A ficha traz Canal de anúncio com a resposta por extenso, ou Não informado. Os formatos anteriores ads e adTopics/adsOther permanecem aceitos com o corpo de e-mail idêntico para retries. Inglês, UTMs, consentimento, ajuda WhatsApp e generate_lead após accepted preservados.
