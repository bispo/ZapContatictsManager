# Decisões Técnicas

## D001 - Stack backend
Escolhido Node.js + TypeScript + Fastify + Baileys

### Motivo
Ecossistema mais maduro para integração com WhatsApp Web. Fastify oferece performance e suporte nativo a plugins WebSocket.

### Consequências
- maior velocidade de desenvolvimento
- dependência da estabilidade do protocolo do WhatsApp Web

---

## D002 - Aplicação web em vez de CLI
Escolhido servidor HTTP + frontend estático em vez de ferramenta de linha de comando

### Motivo
O usuário precisa de uma interface visual para escanear o QR Code, selecionar grupos e baixar o JSON sem precisar instalar dependencias ou usar terminal.

### Consequências
- necessidade de servidor HTTP sempre ativo durante o uso
- frontend precisa ser mantido junto com o backend
- distribuição mais simples: basta rodar o servidor e acessar pelo navegador

---

## D003 - WebSocket para streaming do QR Code
Escolhido WebSocket (`ws`) para entregar o QR em tempo real ao navegador

### Motivo
O QR Code do Baileys é regenerado a cada poucos segundos. Polling HTTP introduziria latência e carga desnecessária. WebSocket garante entrega imediata de cada novo QR.

### Consequências
- frontend precisa abrir conexão WS antes de solicitar o QR
- conexão WS deve ser fechada após autenticação bem-sucedida

---

## D004 - Frontend sem framework
Escolhido HTML + CSS + JavaScript puro servido estaticamente pelo Fastify

### Motivo
A interface é simples (uma página, três estados: QR / lista de grupos / exportando). Um framework como React adicionaria complexidade de build desnecessária para V1.

### Consequências
- zero etapa de build no frontend
- fácil de manter e entender
- caso a interface cresça, migrar para React é simples

---

## D005 - Instância Baileys como singleton
Uma única instância Baileys por processo do servidor

### Motivo
A aplicação serve um usuário por vez. Singleton evita múltiplas conexões ao WhatsApp e simplifica o gerenciamento de estado.

### Consequências
- não suporta múltiplos usuários simultâneos (fora do escopo da V1)
- sessão persistida em disco (`auth_info_baileys/`) e reaproveitada entre reinicializações

---

## D006 - Importação para transmissão com fallback manual
Escolhido entregar a funcionalidade de transmissão em duas partes: importação + validação + verificação no WhatsApp, com saída pronta para uso manual, sem criação automática de lista de transmissão.

### Motivo
O projeto atual não possui uma prova local de que a combinação Baileys + sessão autenticada cria listas de transmissão de forma estável. A verificação de número é útil e de baixo risco; a automação da lista ainda exige spike separada.

### Consequências
- a interface passa a aceitar CSV `Number,Name`
- o backend normaliza, deduplica e classifica linhas antes de qualquer envio
- a etapa final gera JSON/CSV para montagem manual da transmissão enquanto a automação real não for validada

---

## D007 - Campanha por template com variáveis randômicas
Escolhido tratar o envio como campanha baseada em template com variáveis no formato `$nome_da_variavel`, resolvidas a partir de um CSV `Variable,Values`.

### Motivo
O usuário precisa variar o texto entre destinatários sem criar manualmente múltiplas mensagens. Um CSV separado mantém o template simples e o conjunto de variações editável.

### Consequências
- cada envio renderiza a mensagem final imediatamente antes do disparo
- o sistema precisa validar template e CSV de variáveis em conjunto
- o relatório final precisa registrar os valores resolvidos e a mensagem enviada por destinatário
