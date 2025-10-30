# MedicalTime App - Frontend 💊

Aplicação móvel React Native/Expo para gerenciamento de medicamentos e lembretes médicos, integrada com a API MedicalTime.

## 📱 Sobre o Projeto

Este é um aplicativo de saúde que permite aos usuários:

- **Autenticação segura** com JWT e refresh tokens
- **Gerenciamento de medicamentos** e dosagens
- **Lembretes inteligentes** para horários de medicação
- **Histórico completo** de ingestões com paginação
- **Contatos de emergência** para situações críticas
- **Sistema SOS** integrado
- **Notificações push** para lembretes

## 🚀 Tecnologias Utilizadas

- **React Native** com **Expo SDK 54+**
- **Expo Router** (file-based routing)
- **TypeScript** para tipagem estática
- **Zustand** para gerenciamento de estado moderno
- **React Query** para cache e sincronização de dados
- **Axios** para requisições HTTP
- **Expo Secure Store** para armazenamento seguro
- **Expo Notifications** para push notifications
- **Immer** para atualizações imutáveis de estado

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI
- Android Studio (para Android) ou Xcode (para iOS)
- Backend MedicalTime rodando

## ⚙️ Instalação e Configuração

### 1. Clone o repositório e instale dependências

```bash
git clone https://github.com/AndreiGranada/Granada-FrameWork25.git
cd Granada-FrameWork25
git checkout Front-End
npm install
```

### 2. Configuração do ambiente

O projeto possui scripts automatizados para sincronização com o backend:

```bash
# Configuração automática (recomendado)
npm run sync:env

# Ou configuração manual - crie/edite o arquivo .env:
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3000
```

## 🏃‍♂️ Como Executar

### Desenvolvimento básico

```bash
npm start
# ou
npm run start
```

### Plataformas específicas

```bash
# Android (emulador)
npm run android:emulator

# Android (dispositivo físico)
npm run android

# iOS
npm run ios

# Web
npm run web
```

O CI só roda `sdk:update` quando o diff inclui `openapi.yaml`, evitando churn em PRs sem alteração de contrato.

# MedicalTime App – Front-end 💊

Aplicativo móvel desenvolvido com React Native e Expo para auxiliar pacientes e cuidadores no gerenciamento de medicamentos, com lembretes inteligentes, histórico de ingestões e contatos de emergência integrados à plataforma MedicalTime.

## 🧭 Visão geral

O app oferece uma experiência completa para acompanhar o tratamento medicamentoso:

- Autenticação segura com tokens JWT e refresh automático.
- Dashboard com ingestões próximas, destaques de histórico e botão SOS.
- CRUD completo de lembretes (incluindo múltiplos horários por dia e dias da semana).
- Registro de ingestões anteriores com paginação infinita.
- Cadastro e gerenciamento de até cinco contatos de emergência.
- Notificações push para alertas e situações críticas.
- Tema claro/escuro com persistência das preferências do usuário.

## 🔧 Stack principal

| Categoria           | Tecnologias                                              |
| ------------------- | -------------------------------------------------------- |
| Base Mobile         | Expo SDK 54, React Native 0.81, React 19                 |
| Navegação           | Expo Router (file-based routing), React Navigation       |
| Estado & Dados      | Zustand 5, Immer 10, TanStack Query 5                    |
| HTTP/API            | Axios 1.12, SDK gerado a partir da API MedicalTime       |
| Segurança           | Expo Secure Store, interceptadores de refresh token      |
| UI/UX               | Design system próprio (`constants/theme.ts`), Expo Icons |
| Notificações        | Expo Notifications, Expo Device                          |
| Observabilidade     | Sentry (via `sentry-expo`)                               |
| Tipagem & Qualidade | TypeScript 5.9, ESLint 9                                 |

Dependências completas estão descritas em `package.json`.

## ✅ Requisitos de ambiente

- Node.js 18 ou superior
- npm (recomendado) ou Yarn
- Expo CLI (`npx expo`) instalado globalmente ou via `npx`
- Android Studio (para emulador Android) e/ou Xcode (para iOS)
- Backend MedicalTime ativo e acessível na rede local ou via tunnel

## 🚀 Primeiros passos

1. **Clone o repositório e acesse o projeto**

```bash
git clone https://github.com/AndreiGranada/Granada-FrameWork25.git
cd Granada-FrameWork25
git checkout Front-End
cd FrontEnd/my-app
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure o ambiente**

O fluxo padrão já sincroniza variáveis automaticamente ao iniciar o projeto:

```bash
npm run sync:env
npm run sync:backend-front
```

Para configuração manual, crie/edite `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3000
```

> Prefira sempre o IP da máquina que executa o backend. O script `sync-backend-env.js` detecta automaticamente quando possível.

## ▶️ Executando o aplicativo

| Comando                       | Uso                                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| `npm start`                   | Fluxo padrão: sincroniza `.env`, atualiza `FRONTEND_URL` no backend e inicia o Expo (LAN por padrão). |
| `npm run android`             | Sincroniza e abre no Android (dispositivo físico conectado).                                          |
| `npm run android:emulator`    | Sincroniza e abre no emulador Android oficial.                                                        |
| `npm run ios`                 | Sincroniza e abre no simulador iOS (macOS).                                                           |
| `npm run web`                 | Inicia em modo web (`http://localhost:8081`).                                                         |
| `npm run start:lan`           | Força host LAN com IP específico (edite o script conforme necessário).                                |
| `npm run start:auto`          | Detecta automaticamente o IP e mantém o host LAN.                                                     |
| `npm run start:web:localhost` | Ideal para cenários em que o backend está rodando no mesmo computador.                                |
| `npm run start:tunnel`        | Cria tunnel via Expo (útil quando o dispositivo não está na mesma rede).                              |

> Ao rodar `npm start`, use o Expo Go para escanear o QR code ou pressione `w` no terminal para abrir a versão web.

### 🖥️ Se a versão web não abrir

1. Garanta que o backend esteja acessível pelo endereço configurado em `EXPO_PUBLIC_API_BASE_URL`.
2. Rode `npm run start:web:localhost` para forçar o host local.
3. Limpe o cache do Metro/Expo com `npx expo start --clear`.
4. Verifique se nenhuma outra aplicação está usando a porta `8081`.
5. Para logs adicionais, use `npm run web -- --verbose`.

## 🗂️ Estrutura do projeto

```
my-app
├── app/                     # Telas registradas via Expo Router
│   ├── _layout.tsx          # Navegação principal e providers globais
│   ├── index.tsx            # Tela inicial (após login)
│   ├── login.tsx            # Fluxo de autenticação
│   ├── home.tsx             # Dashboard com ingestões e SOS
│   ├── reminders.tsx        # Lista e edição de lembretes
│   ├── intakes.tsx          # Ingestões futuras (24h)
│   ├── intakes-history.tsx  # Histórico paginado
│   ├── profile.tsx          # Perfil do usuário
│   ├── reset.tsx            # Recuperação de senha
│   └── emergency-contacts/  # CRUD de contatos de emergência
├── components/              # Componentes reutilizáveis
│   ├── ui/                  # Design system (Card, Button, Badge, Toast...)
│   └── EmergencyContactForm.tsx
├── constants/               # Temas, espaçamentos, paleta de cores
├── hooks/                   # Hooks utilitários para tema, cores, etc.
├── src/
│   ├── api/                 # Camada axios + tipagens de domínio
│   ├── auth/                # Persistência de tokens e sessão
│   ├── config/              # Helper de ambiente e constantes
│   ├── lib/                 # Providers legados e utilitários gerais
│   ├── observability/       # Integração com Sentry
│   ├── push/                # Registro de notificações
│   ├── screens/             # Containers específicos por domínio
│   ├── services/            # Adapters sobre o SDK gerado
│   └── store/               # Zustand stores (auth, tema, lembretes, etc.)
├── sdk-backend/             # SDK gerado a partir da OpenAPI do backend
├── scripts/                 # Automação (sync de env, smoke tests, e2e)
├── __tests__/               # Testes unitários e de integração
└── test/                    # Configuração Jest
```

## 🧠 Gerenciamento de estado e dados

- **Zustand** organiza os estados críticos (`authStore`, `remindersStore`, `notificationsStore`, `intakesUiStore`, `themeStore`).
- **Immer** facilita atualizações imutáveis e reduz boilerplate.
- **TanStack Query** cuida de cache, sincronização e invalidação de chamadas à API.
- Persistência de sessão/tema ocorre automaticamente via `expo-secure-store`.

## 📡 Integração com a API MedicalTime

- Chamadas HTTP são centralizadas em `src/api/client.ts`, com interceptadores para refresh token, logging e friendly errors.
- `sdk-backend/` contém o cliente gerado a partir da especificação OpenAPI; os adapters em `src/services` encapsulam seu uso.
- Campos opcionais introduzidos na versão 1.2 da API (ex.: `purpose`, `pricePaid`, `photoUrl`) são tratados de forma tolerante: o app ignora o que ainda não usa sem quebrar contratos.
- Registro de dispositivos para push notifications acontece em `src/push/registerForPush.ts` logo após o login.

## 🔔 Notificações e UX global

- Sistema unificado de banners e toasts via `components/ui/NotificationContainer.tsx`.
- Botão SOS respeita regra de até cinco contatos ativos (desabilitado caso contrário).
- Tela de login apresenta feedback imediato para erros de credenciais ou rede.
- Tema claro/escuro alternável via `themeStore`, com persistência.

## 📄 Scripts & automações

| Script                                         | Descrição                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| `npm start`                                    | Sincroniza `.env`, ajusta FRONTEND_URL no backend e inicia o Expo.       |
| `npm run sync:env`                             | Apenas sincroniza o arquivo `.env` local com o backend.                  |
| `npm run sync:backend-front`                   | Atualiza a variável `FRONTEND_URL` no backend (útil para push/webhooks). |
| `npm run web`                                  | Inicia apenas o bundler web.                                             |
| `npm run android` / `npm run android:emulator` | Inicia o projeto direcionado para Android.                               |
| `npm run ios`                                  | Abre no simulador iOS (requer macOS).                                    |
| `npm run start:tunnel`                         | Usa túnel da Expo (quando não for possível usar LAN).                    |
| `npm run smoke:frontend`                       | Executa smoke tests rápidos definidos em `scripts/smoke-frontend.js`.    |
| `npm run qa:e2e`                               | Fluxo E2E automatizado (requer backend preparado).                       |
| `npm run lint`                                 | Verificação estática com ESLint.                                         |

Scripts utilitários adicionais podem ser executados diretamente, por exemplo:

```bash
node scripts/smoke-auth-flow.js
node scripts/smoke-highlight.js
node scripts/sdk-sync-check.js
```

## 🧪 Testes e qualidade

- **Lint**: `npm run lint`
- **Smoke tests**: `npm run smoke:frontend`
- **Fluxo QA/E2E**: `npm run qa:e2e`
- **Testes unitários**: utilize `npx jest` (configuração em `test/jestSetup.ts`) para executar a suíte Jest localizada em `__tests__/`.

Recomenda-se executar smoke tests antes de abrir PRs para validar flows críticos como login, criação de lembretes e sincronização com o backend.

## 🛠️ Dicas para desenvolvimento web

- Ajuste `EXPO_PUBLIC_API_BASE_URL` para `http://localhost:3000` caso backend esteja local.
- Limpe caches com `npx expo start --web --clear` se o navegador exibir tela branca.
- Habilite console verbose (`npm run web -- --verbose`) para investigar warnings do bundler.
- Em cenários corporativos com proxy, use `npm run start:tunnel`.

### Auto login de desenvolvimento (opcional)

Para agilizar testes locais, é possível habilitar um auto-login em ambiente de desenvolvimento que tenta autenticar com credenciais de seed. Adicione ao `.env`:

```env
EXPO_PUBLIC_DEV_AUTO_AUTH=1
# Opcional (defaults):
# EXPO_PUBLIC_DEV_LOGIN_EMAIL=seed.user@medicaltime.local
# EXPO_PUBLIC_DEV_LOGIN_PASSWORD=secret123
```

Com isso, ao abrir o app sem sessão, o app tentará logar automaticamente (ou registrar e logar) usando as credenciais acima. Recurso ignorado em produção.

## 📚 Documentação complementar

- [`FRONTEND_KICKSTART.md`](./FRONTEND_KICKSTART.md) – Guia rápido para onboarding.
- [`FRONTEND_GUIDE.md`](./FRONTEND_GUIDE.md) – Referência completa de integrações com backend.
- [`FRONTEND_ACTION_CHECKLIST.md`](./FRONTEND_ACTION_CHECKLIST.md) – Checklist para revisões.
- [`LOG.md`](./LOG.md) – Diário de desenvolvimento.
- Backend: consulte `BackEnd/MedicalTime/README.md` e `openapi.yaml` para detalhes da API.

## 🤝 Contribuindo

1. Crie um fork do repositório.
2. Crie uma branch descritiva: `git checkout -b feature/nome-da-feature`.
3. Implemente e adicione testes quando aplicável.
4. Garanta que `npm run lint` e `npm run smoke:frontend` passam.
5. Abra um Pull Request para a branch `Front-End` descrevendo mudanças, evidências e qualquer impacto em dependências.

## � Licença

Este repositório é privado e o uso é restrito aos participantes autorizados do projeto MedicalTime. Consulte os responsáveis antes de redistribuir ou reutilizar o conteúdo.

---

**Desenvolvido por:** Andrei Granada  
**Repositório:** [Granada-FrameWork25](https://github.com/AndreiGranada/Granada-FrameWork25)

- **Notificações** globais unificadas (success/error/warning/info)
