# Endpoint isolado da landing MateGrowth

Fonte: index.ts (Deno.serve) + handler.mjs (validação/envio, testável em Node). Função Supabase: submit-mategrowth-daycare, projeto hdvjtezjhalzharqdyfv. Endpoint público sem JWT porque a ficha deve funcionar sem login; nenhuma chave privilegiada é entregue ao navegador. CORS não é autenticação; o destino é fixo e há validação, honeypot, limite por instância e idempotência no provedor.

Segredo requerido: RESEND_API_KEY, já existente e comprovado por um envio TESTE aceito. Local de configuração: Supabase → SmartMate - PROD → Edge Functions → Secrets. Não copiar valores para esta pasta ou para HTML/JS público. Remetente reutilizado: SmartMate <support@smartimateapp.com>. Destinatário fixo mategrowthus@gmail.com. Alterar remetente requer aprovação/configuração no serviço, não dados vindos do formulário.

Status accepted significa que o provedor retornou sucesso com um ID de mensagem. Não significa entrega ou leitura no Gmail. Sem escrita em banco/CRM. Nenhuma modificação nas funções existentes.

Deploy realizado via ferramenta Supabase com entrypoint index.ts e ambos os arquivos incluídos. Para alterações futuras, republicar exclusivamente essa função. A hospedagem GitHub Pages serve somente o frontend e não executa estes arquivos.

Testes: node --test tests/daycare-handler.test.mjs a partir da raiz do repositório. Os casos automatizados injetam um provedor falso e não enviam e-mails. Idempotency-Key estável protege retries por 24h no Resend; não é uma promessa de deduplicação permanente.
