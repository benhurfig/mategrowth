# Verificação da entrega

20/10/2026. Escopo: nova versão institucional, sem publicação.

## Testes executados

- 48 páginas institucionais com paridade PT / EN / ES, mais páginas 404 nos três idiomas.
- Links e assets locais, âncoras, um H1 por página nova, títulos, IDs e JSON estruturado.
- Layout das 48 páginas novas em **320, 390 e 1440 pixels**: sem rolagem horizontal involuntária nos testes finais.
- Renderização em Chromium, incluindo conteúdo e imagens do pacote, em modo local/offline.
- Nenhum erro de JavaScript nos testes registrados das páginas novas.
- Menu mobile: abertura, fechamento, Escape e retorno do foco.
- FAQ: abrir e fechar.
- Seletor de idioma: aponta para a página equivalente.
- Preferências de análise: abrir, aceitar e recusar; ausência de tags GA em prévia offline.
- Formulário nos três idiomas: campos obrigatórios, texto de revisão, edição, tratamento de caracteres especiais e rejeição de nome formado só por espaços.
- Resumo do contato não fica no href do DOM, nem nos eventos personalizados de Analytics.
- Sem JavaScript: campos desativados; alternativas diretas de contato disponíveis.
- Zero mensagens externas enviadas durante o teste.
- Alternância local de indexação testada e devolvida ao estado de revisão (`noindex`); ofertas e páginas 404 preservadas.
- Comparação byte a byte das páginas, scripts, estilos e imagens das duas pastas de ofertas preservadas com o ZIP original.

## Limites claros

A prévia foi renderizada com os arquivos locais fornecidos ao Chromium; não foi uma navegação no domínio publicado. Os botões que abrem aplicativos e serviços externos precisam de conferência no aparelho final. Não foram executados envio de e-mail, SMS, WhatsApp, teste de recebimento em CRM ou medição na conta GA4.

Capturas dos projetos vieram do material fornecido; não são uma nova captura de todos os websites publicados. Care’s Corner tem uma representação das frentes do projeto, identificada como tal, sem fingir que existe uma captura que não foi fornecida.

As ofertas `/gbp-daycare/` e `/website-daycare/` continuam com o conteúdo e código anteriores. Seu teste estático não equivale a uma auditoria completa das implementações legadas.

As páginas novas mantêm `noindex, follow` até aprovação. A liberação é local, pelo script de publicação, e não realiza deploy.
