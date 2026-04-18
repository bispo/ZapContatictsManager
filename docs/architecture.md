# Arquitetura

## Visão geral
Aplicação web em Node.js/TypeScript com servidor Fastify, integração Baileys via WebSocket para streaming do QR Code, e frontend estático servido pelo próprio servidor.

## Fluxo principal
```
Navegador
  │
  ├── POST /session/start   → inicia sessão Baileys
  ├── WS  /session/qr       → recebe QR em tempo real
  │       (usuário escaneia com celular)
  ├── GET /session/status   → confirma autenticação
  ├── GET /groups           → lista grupos do WhatsApp
  └── POST /export          → recebe JIDs selecionados
                             retorna JSON para download
  ├── POST /import/contacts → recebe CSV em texto
  │                          valida, normaliza e deduplica
  └── POST /transmission/prepare
                             verifica números no WhatsApp
                             retorna artefato para uso manual
  ├── POST /transmission/export-valid
  │                          exporta apenas contatos validados
  ├── POST /messages/preview
  │                          valida template + CSV de variáveis
  │                          retorna amostras renderizadas
  └── POST /messages/send   → renderiza e envia campanha individual
```

## Camadas

### Servidor HTTP (`src/server/`)
- Fastify como framework principal
- Serve arquivos estáticos de `public/`
- Registra rotas e plugin WebSocket

### WebSocket (`src/ws/`)
- Rota `/session/qr`
- Escuta o evento `connection.update` do Baileys
- Emite o QR Code (base64) ao cliente a cada atualização
- Fecha a conexão WS após autenticação bem-sucedida

### Rotas REST (`src/routes/`)
- `session.routes.ts` → `POST /session/start`, `GET /session/status`
- `groups.routes.ts` → `GET /groups`
- `export.routes.ts` → `POST /export`
- `import.routes.ts` → `POST /import/contacts`
- `transmission.routes.ts` → `POST /transmission/prepare`
- `messages.routes.ts` → `POST /messages/preview`, `POST /messages/send`

### Sessão (`src/session/`)
- Inicializa e gerencia instância única do Baileys
- Persiste credenciais localmente (`auth_info_baileys/`)
- Expoe estado da conexão para as rotas

### Serviços (`src/services/`)
- `groups.service.ts` → busca chats, filtra grupos, retorna metadados
- `contacts.service.ts` → obtém participantes, normaliza e deduplica contatos
- `import-contacts.service.ts` → parseia CSV, valida cabeçalho e classifica linhas
- `transmission.service.ts` → verifica números no WhatsApp e gera saída manual
- `message-campaign.service.ts` → valida contatos/variáveis, renderiza template e executa envios
- `csv.service.ts` → parsing e utilidades CSV compartilhadas

### Frontend (`public/`)
- `index.html` → estrutura da página única (SPA simples)
- `app.js` → lógica: conexão WS, exibição do QR, listagem de grupos, export
- `style.css` → estilos

## Estrutura de pastas
```
src/
  server/
    index.ts        → cria e configura instância Fastify
  routes/
    session.routes.ts
    groups.routes.ts
    export.routes.ts
    import.routes.ts
    transmission.routes.ts
    messages.routes.ts
  ws/
    qr.handler.ts   → streaming do QR Code via WebSocket
  session/
    baileys.ts      → cria/reaproveita instância Baileys
    state.ts        → estado global da conexão
  services/
    groups.service.ts
    contacts.service.ts
    import-contacts.service.ts
    transmission.service.ts
    message-campaign.service.ts
    csv.service.ts
  types/
    group.types.ts
    contact.types.ts
    import.types.ts
  utils/
    logger.ts
  index.ts          → ponto de entrada, inicia servidor

public/
  index.html
  app.js
  style.css
```

## Decisões de design
- Instância Baileys é singleton: uma sessão por processo do servidor
- QR Code transmitido via WebSocket para evitar polling
- Frontend sem framework para manter zero dependências de build no cliente
- Export retorna JSON via resposta HTTP com header `Content-Disposition: attachment`
- Importação de transmissão usa JSON com conteúdo CSV para evitar dependência extra de multipart na V1
- Criação automática de lista de transmissão ainda não é prometida; a saída atual prepara contatos para uso manual
- Campanhas de mensagem usam template textual com variáveis randômicas resolvidas por destinatário
