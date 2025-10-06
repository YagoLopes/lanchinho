# Lanchinho

Aplicativo React Native (Expo + TypeScript) para ajudar a manter o cronograma de refeicoes e acompanhar o progresso da sua dieta, totalmente offline.

## Tecnologias

- Expo SDK 51 (workflow managed) com React Native e TypeScript
- Gerenciamento de estado com Zustand
- Persistencia local usando AsyncStorage
- Notificacoes locais com `expo-notifications`
- Navegacao com React Navigation (stack + bottom tabs)
- Interface responsiva com suporte a tema claro/escuro

## Configuracao do projeto

```bash
# instalar dependencias
npm install

# iniciar o projeto
npx expo start
```

Dependencias adicionais instaladas:

```bash
npm install @react-native-async-storage/async-storage expo-notifications @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-toast-message zustand dayjs expo-file-system expo-document-picker
npx expo install expo-notifications react-native-safe-area-context react-native-screens
```

## Principais funcionalidades

- CRUD completo de dietas e refeicoes
- Definicao de dieta ativa com agendamento automatico de notificacoes
- Lembretes por refeicao com repeticao semanal, snooze de 5/10/15 minutos e acao "Comi agora" diretamente da notificacao
- Tela "Hoje" com status (futura, atrasada, concluida) e marcacao rapida
- Tela "Progresso" com adesao em 7 e 30 dias e historico diario detalhado
- Tela "Configuracoes" com tema, soneca padrao, exportacao/importacao de JSON e atalho para permissoes do sistema
- Persistencia offline de dietas, historico e configuracoes (AsyncStorage)
- Seed inicial com planos Bulking, Cut e Manutencao

## Permissoes de notificacao

O app solicita permissao quando a opcao de notificacoes e ativada nas configuracoes. Para garantir que os alarmes funcionem:

1. Abra **Configuracoes → Notificacoes** dentro do app
2. Ative "Alarmes de refeicao"
3. Aceite o prompt do sistema
4. Certifique-se de manter o Lanchinho com permissao de notificar em primeiro plano e segundo plano

No Android, o canal "Lanchinho" e criado automaticamente com som e vibracao.

## Snooze

Na tela "Hoje" cada refeicao oferece atalhos de soneca (5, 10, 15 min). O valor definido como padrao em Configuracoes fica destacado. Na notificacao push tambem existe a acao "Soneca 10 min".

## Exportar / Importar dados

- **Exportar JSON**: gera um arquivo em `FileSystem.documentDirectory` (o caminho completo e exibido em um toast). Compartilhe manualmente o arquivo conforme sua preferencia.
- **Importar JSON**: abre o seletor de documentos. As dietas e historicos sao mesclados por `id`; dados existentes sao atualizados.

## Estrutura de pastas

```
/src
  /components
  /hooks
  /navigation
  /screens
  /services
  /store
  /types
  /utils
```

## Testes

Ainda nao ha testes automatizados inclusos. Para validar manualmente:

1. Execute `npx expo start`
2. Ative uma das dietas seed
3. Ajuste horarios para os proximos minutos e teste notificacoes/snooze
4. Marque refeicoes em "Hoje" e verifique os percentuais na aba "Progresso"
5. Exporte os dados, apague o app ou limpe AsyncStorage e importe novamente

Bom proveito!
