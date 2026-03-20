# Produto

## Problema
Preciso fazer backup dos contatos dos meus grupos do WhatsApp de forma simples, sem instalar nada, acessando pelo navegador.

## Objetivo
Uma aplicação web onde o usuário conecta sua conta via QR Code, seleciona os grupos que deseja e baixa um JSON com os contatos.

## Usuário principal
- dono da conta do WhatsApp
- pessoa que precisa exportar contatos dos grupos para uso em outros sistemas

## Casos de uso
- conectar conta pelo QR Code exibido no navegador
- visualizar lista dos grupos da conta
- selecionar um ou mais grupos
- exportar os contatos dos grupos selecionados em JSON
- reexecutar exportação sem duplicar registros

## Requisitos funcionais
- RF01: exibir QR Code no navegador para autenticação
- RF02: detectar autenticação e avançar a tela automaticamente
- RF03: listar grupos da conta autenticada
- RF04: permitir seleção de grupos por checkbox
- RF05: exportar participantes dos grupos selecionados
- RF06: normalizar e deduplicar contatos entre grupos
- RF07: disponibilizar JSON para download direto no navegador
- RF08: registrar erros por grupo sem abortar a exportação

## Requisitos não funcionais
- RNF01: interface acessível por navegador, sem instalação pelo usuário
- RNF02: QR Code atualizado em tempo real via WebSocket
- RNF03: saída em JSON legível e bem estruturado
- RNF04: suportar reconexão de sessão já autenticada
- RNF05: logs mínimos no servidor para debug
- RNF06: arquitetura modular para evolução futura