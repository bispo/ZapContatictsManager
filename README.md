# WhatsApp Group Exporter

Aplicação web para autenticar no WhatsApp Web via QR Code, selecionar grupos e fazer o backup dos contatos/participantes em JSON.

## Objetivo
Permitir que o usuário, pelo navegador, faça:
- autenticação segura via QR Code do WhatsApp
- visualização de todos os seus grupos
- seleção dos grupos desejados
- download do arquivo JSON com os contatos deduplicados

## Fluxo do usuário
1. Usuário acessa a aplicação no navegador
2. Clica em **"Conectar WhatsApp"**
3. QR Code é exibido em tempo real (via WebSocket)
4. Usuário escaneia com o celular → autenticação confirmada
5. Lista de grupos é exibida com checkboxes
6. Usuário seleciona os grupos desejados
7. Clica em **"Exportar Contatos"**
8. Arquivo JSON é gerado e baixado automaticamente

## Escopo da V1
- autenticação via QR Code na interface web
- exibição do QR em tempo real via WebSocket
- listagem dos grupos com seleção por checkbox
- exportação dos contatos selecionados para JSON
- deduplicação de contatos entre grupos
- logs básicos no servidor

## Fora do escopo
- envio de mensagens
- automação comercial
- banco de dados
- sincronização contínua
- suporte a múltiplas contas simultâneas

## Stack
- Node.js + TypeScript
- Fastify (servidor HTTP)
- Baileys (integração WhatsApp Web)
- WebSocket (`ws`) — streaming do QR Code
- Zod (validação de dados)
- HTML + CSS + JavaScript (frontend)

## Estrutura de pastas
```
src/
  server/       → inicialização do servidor HTTP
  routes/       → rotas REST da API
  ws/           → handler WebSocket para QR Code
  session/      → autenticação e persistência Baileys
  services/     → grupos, contatos, deduplicação
  types/        → tipos Zod/TypeScript
  utils/
  index.ts

public/         → frontend servido estaticamente
  index.html
  app.js
  style.css
```

## Endpoints da API
| Método | Rota | Responsabilidade |
|---|---|---|
| `POST` | `/session/start` | inicia sessão Baileys, começa QR stream |
| `WS` | `/session/qr` | emite QR em tempo real até autenticar |
| `GET` | `/session/status` | retorna se está conectado |
| `GET` | `/groups` | lista todos os grupos |
| `POST` | `/export` | recebe JIDs selecionados, devolve JSON |

## Documentação
- [Decisões Técnicas](docs/decisions.md)
- [Arquitetura](docs/architecture.md)
- [Backlog](docs/backlog.md)
- [Produto](docs/product.md)
