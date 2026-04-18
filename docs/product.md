# Produto

## Problema
Preciso fazer backup dos contatos dos meus grupos do WhatsApp de forma simples, sem instalar nada, acessando pelo navegador.

## Objetivo
Uma aplicação web onde o usuário conecta sua conta via QR Code, seleciona grupos para exportação e também importa um CSV de contatos para preparar listas de transmissão.

## Usuário principal
- dono da conta do WhatsApp
- pessoa que precisa exportar contatos dos grupos para uso em outros sistemas

## Casos de uso
- conectar conta pelo QR Code exibido no navegador
- visualizar lista dos grupos da conta
- selecionar um ou mais grupos
- exportar os contatos dos grupos selecionados em JSON
- reexecutar exportação sem duplicar registros
- importar um CSV `Number,Name`
- revisar linhas válidas, inválidas e duplicadas antes de prosseguir
- verificar quais números importados existem no WhatsApp
- baixar um JSON/CSV preparado para criação manual de lista de transmissão
- exportar somente os contatos validados no WhatsApp para reuso em campanha
- subir um arquivo de contatos válidos, um template de mensagem e um CSV de variáveis
- disparar uma mensagem renderizada de forma ligeiramente diferente para cada destinatário

## Requisitos funcionais
- RF01: exibir QR Code no navegador para autenticação
- RF02: detectar autenticação e avançar a tela automaticamente
- RF03: listar grupos da conta autenticada
- RF04: permitir seleção de grupos por checkbox
- RF05: exportar participantes dos grupos selecionados
- RF06: normalizar e deduplicar contatos entre grupos
- RF07: disponibilizar JSON para download direto no navegador
- RF08: registrar erros por grupo sem abortar a exportação
- RF09: validar cabeçalho e linhas do CSV importado
- RF10: normalizar números e deduplicar contatos importados
- RF11: permitir verificação opcional dos contatos importados no WhatsApp
- RF12: disponibilizar saída preparada para transmissão manual
- RF13: exportar apenas os contatos validados no WhatsApp para uso em campanhas
- RF14: permitir template de mensagem com variáveis `$nome_da_variavel`
- RF15: aceitar um CSV de variáveis `Variable,Values`
- RF16: renderizar uma mensagem por destinatário com escolha aleatória de valores
- RF17: enviar a campanha individualmente e gerar relatório final

## Requisitos não funcionais
- RNF01: interface acessível por navegador, sem instalação pelo usuário
- RNF02: QR Code atualizado em tempo real via WebSocket
- RNF03: saída em JSON legível e bem estruturado
- RNF04: suportar reconexão de sessão já autenticada
- RNF05: logs mínimos no servidor para debug
- RNF06: arquitetura modular para evolução futura
