# Exemplos de Front-end (React Native + Expo)

Esta pasta contém exemplos mínimos de integração do app Expo com a API MedicalTime.

Arquivos principais:

- `src/api/client.ts`: configura BASE e TOKEN do SDK gerado
- `src/api/call.ts`: helper para repetir chamadas após refresh em 401
- `src/auth/store.ts`: login/logout usando o SDK
- `src/notifications/expo.ts`: obter token Expo Push (no app real instale as libs expo)
- `src/screens/LoginScreen.tsx`: tela simples de login
- `src/screens/TodayIntakes.tsx`: lista de intakes do dia com ação "Tomado"
- `src/screens/RemindersList.tsx`: lista de lembretes

Observações importantes:

- Estes arquivos são exemplos para serem copiados para um projeto Expo real; aqui no backend eles não compilam (não há React/Expo instalados). O `tsconfig.json` do backend exclui esta pasta do build.
- No seu app Expo, instale as dependências: react, react-native, @react-navigation/\*, @tanstack/react-query, expo-secure-store, expo-notifications, expo-device.
- Ajuste a base URL com `configureApi(...)` e configure o token com `setAuthTokenFromSecureStore()`.

Passo a passo (resumo):

1. Copie a pasta `frontend-examples/src` para o seu app Expo (ex.: `app/src/examples`)
2. Instale as libs do Expo mencionadas acima
3. Configure `OpenAPI.BASE` e o token
4. Use `LoginScreen` para autenticar e `TodayIntakes`/`RemindersList` para validar as chamadas
