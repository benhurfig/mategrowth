# Endpoint isolado da landing MateGrowth

Fonte: index.ts (Deno.serve) + handler.mjs (validação/envio, testável em Node). Função Supabase: submit-mategrowth-daycare, projeto hdvjtezjhalzharqdyfv. Endpoint público sem JWT porque a ficha deve funcionar sem login; nenhuma chave privilegiada é entregue ao navegador. CORS não é autenticação; o destino é fixo e há validação, honeypot, limite por instância e idempotência no provedor.

Segredo requerido: RESEND_API_KEY, já existente e comprovado por um envio TESTE aceito. Local de configuração: Supabase → SmartMate - PROD → Edge Functions → Secrets. Não copiar valores para esta pasta ou para HTML/JS público. Remetente reutilizado: SmartMate <support@smartimateapp.com>. Destinatário fixo mategrowthus@gmail.com. Alterar remetente requer aprovação/configuração no serviço, não dados vindos do formulário.

Status accepted significa que o provedor retornou sucesso com um ID de mensagem. Não significa entrega ou leitura no Gmail. Sem escrita em banco/CRM. Nenhuma modificação nas funções existentes.

Deploy realizado via ferramenta Supabase com entrypoint index.ts e ambos os arquivos incluídos. Para alterações futuras, republicar exclusivamente essa função. A hospedagem GitHub Pages serve somente o frontend e não executa estes arquivos.

Testes: node --test tests/daycare-handler.test.mjs a partir da raiz do repositório. Os casos automatizados injetam um provedor falso e não enviam e-mails. Idempotency-Key estável protege retries por 24h no Resend; não é uma promessa de deduplicação permanente.

## Prioridades múltiplas e horário de retorno

O frontend atual envia answers.goals como array não vazio dos códigos spots, google, site, ads, follow e other. O servidor normaliza a ordem, exige as perguntas de todas as escolhas e compartilha website entre google/site. Campos condicionais ocultos são retirados do DOM e do payload.

answers.contactTime é opcional: morning, afternoon, late_afternoon, any ou other. A opção other exige contactTimeOther de até 100 caracteres. O e-mail informa o horário local da lead; sem escolha, apresenta Não informado / Not provided. Nenhum desses dados é enviado ao Analytics.

O formato anterior answers.goal continua aceito. O texto e o assunto dos e-mails antigos permanecem idênticos para preservar os retries idempotentes de visitantes com a página anterior aberta. Não enviar goal e goals juntos. Publicar o endpoint compatível antes do frontend.

Português com anúncios: answers.adTopics é um array não vazio de openings_now, future_enrollment, local_awareness e other; só é aceito em pt-BR com goals incluindo ads. A escolha other exige adsOther (até 250 caracteres). Não combinar adTopics e o campo antigo ads. O campo group de spots é reutilizado para contexto dos anúncios; não é duplicado. O formato antigo ads permanece aceito para clientes abertos anteriormente e para inglês.
