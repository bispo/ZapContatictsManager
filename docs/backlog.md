# Backlog

## Fase 1 - Fundação
- [ ] criar projeto Node + TypeScript
- [ ] configurar lint (ESLint)
- [ ] configurar prettier
- [ ] configurar tsconfig
- [ ] criar estrutura de pastas (`src/`, `public/`)
- [ ] configurar Fastify com plugin de arquivos estáticos
- [ ] configurar Fastify com plugin WebSocket

## Fase 2 - Conexão WhatsApp
- [ ] integrar Baileys
- [ ] criar instância singleton do Baileys
- [ ] persistir credenciais localmente (`auth_info_baileys/`)
- [ ] expor estado da conexão (desconectado / aguardando QR / autenticado)
- [ ] implementar rota `POST /session/start`
- [ ] implementar handler WebSocket `WS /session/qr` (emite QR em tempo real)
- [ ] implementar rota `GET /session/status`
- [ ] suportar reconexão de sessão já salva

## Fase 3 - Grupos e Exportação
- [ ] implementar `groups.service.ts` (listar chats e filtrar grupos)
- [ ] implementar rota `GET /groups`
- [ ] implementar `contacts.service.ts` (participantes, normalização, deduplicação)
- [ ] implementar rota `POST /export` (recebe JIDs, retorna JSON para download)

## Fase 4 - Frontend
- [ ] criar `public/index.html` com estrutura de página única
- [ ] tela 1: botão "Conectar WhatsApp" + exibição do QR Code via WebSocket
- [ ] tela 2: lista de grupos com checkboxes após autenticação
- [ ] botão "Selecionar todos" / "Limpar seleção"
- [ ] tela 3: botão "Exportar Contatos" + feedback de progresso
- [ ] download automático do JSON após exportação
- [ ] estilização básica (`style.css`)

## Fase 5 - Robustez
- [ ] logs de erro por grupo sem abortar exportação
- [ ] retry básico em falhas transitórias do Baileys
- [ ] tratamento de sessão expirada com redirect para QR
- [ ] exibir erros amigáveis no frontend

## Fase 6 - Evolução
- [ ] filtros por nome de grupo no frontend
- [ ] exportação incremental (apenas grupos novos)
- [ ] suporte a múltiplos formatos de exportação (CSV, JSON)
- [ ] autenticação por pairing code como alternativa ao QR