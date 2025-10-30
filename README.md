# Granada FrameWork25 - MedicalTime Platform 💊

Plataforma completa para gerenciamento de medicamentos e lembretes médicos, composta por um backend robusto em Node.js/TypeScript e um aplicativo móvel React Native/Expo.

## 📋 Visão Geral do Projeto

O **Granada FrameWork25** é uma solução integrada que permite:

- **Autenticação segura** com JWT e refresh tokens rotacionados
- **Gerenciamento completo de medicamentos** e dosagens
- **Lembretes inteligentes** com múltiplos horários e notificações
- **Histórico detalhado** de ingestões com paginação
- **Sistema de emergência (SOS)** com contatos configuráveis
- **Notificações push** multiplataforma (WhatsApp, FCM, Expo)
- **API REST** documentada com OpenAPI/Swagger
- **Aplicativo móvel** cross-platform com tema claro/escuro

## 🏗️ Arquitetura do Sistema

```
Granada-FrameWork25/
├── BackEnd/MedicalTime/     # API Node.js + TypeScript + Prisma
│   ├── src/                 # Código fonte da API
│   ├── prisma/             # Schema e migrações do banco
│   ├── sdk/                # SDK TypeScript gerado
│   └── docs/               # Documentação técnica
│
└── FrontEnd/my-app/        # App React Native + Expo
    ├── app/                # Telas (Expo Router)
    ├── components/         # Componentes reutilizáveis
    ├── src/               # Lógica de negócio
    └── sdk-backend/       # SDK sincronizado do backend
```

## 🚀 Tecnologias Utilizadas

### Backend (API)

- **Runtime**: Node.js 18+ com TypeScript
- **Framework**: Express.js com middlewares de segurança
- **Banco de dados**: MySQL 8+ com Prisma ORM
- **Autenticação**: JWT com refresh tokens rotacionados
- **Documentação**: OpenAPI 3.0 + Swagger UI
- **Testes**: Jest + Supertest
- **Deploy**: Docker + Docker Compose
- **Notificações**: Providers para WhatsApp, FCM e Expo
- **Logs**: Pino com estruturação JSON

### Frontend (Mobile)

- **Framework**: React Native com Expo SDK 54+
- **Navegação**: Expo Router (file-based routing)
- **Estado**: Zustand + Immer para gerenciamento moderno
- **Cache/Sync**: TanStack Query (React Query)
- **HTTP**: Axios com interceptadores automáticos
- **Segurança**: Expo Secure Store para tokens
- **Notificações**: Expo Notifications + push nativo
- **Tipagem**: TypeScript com SDK gerado automaticamente
- **Observabilidade**: Sentry integrado

## 🛠️ Pré-requisitos

- **Node.js 18+**
- **MySQL 8+** ou Docker para containerização
- **Git** para versionamento
- **Expo CLI** para desenvolvimento mobile
- **Android Studio** (Android) ou **Xcode** (iOS)

## ⚡ Setup Rápido

### 1. Clone o repositório

```bash
git clone https://github.com/AndreiGranada/Granada-FrameWork25.git
cd Granada-FrameWork25
```

### 2. Configuração do Backend

```bash
cd BackEnd/MedicalTime

# Instalar dependências
npm install

# Configurar ambiente (copie .env.example para .env)
cp .env.example .env

# Configurar banco de dados no .env
# DATABASE_URL="mysql://user:password@localhost:3306/medicaltime"

# Executar migrações
npm run migrate

# Gerar Prisma Client
npm run generate

# Iniciar servidor
npm run dev
```

**Backend estará rodando em:** `http://localhost:3000`  
**Documentação Swagger:** `http://localhost:3000/docs`

### 3. Configuração do Frontend

```bash
cd FrontEnd/my-app

# Instalar dependências
npm install

# Sincronizar configurações automaticamente
npm run sync:env
npm run sync:backend-front

# Iniciar aplicativo
npm start
```

### 4. Setup com Docker (Alternativo)

```bash
cd BackEnd/MedicalTime

# Subir backend + MySQL
docker compose up -d --build

# Ver logs
docker compose logs -f api
```

## 📱 Como Usar

### Desenvolvimento Web

```bash
# Frontend - modo web
cd FrontEnd/my-app
npm run web
# Acesse: http://localhost:8081
```

### Desenvolvimento Mobile

```bash
# Android (emulador)
npm run android:emulator

# Android (dispositivo físico)
npm run android

# iOS (requer macOS)
npm run ios
```

Use o **Expo Go** para escanear o QR code ou acesse via web.

## 🔐 Recursos de Segurança

- **Autenticação JWT** com tokens de acesso e refresh
- **Rate limiting** configurável por endpoint
- **CORS** restritivo para produção
- **Helmet** para headers de segurança
- **Validação rigorosa** com Zod schemas
- **Recuperação de senha** via email com tokens temporários
- **Logs estruturados** com correlation IDs

## 📊 Funcionalidades Principais

### Backend API

- ✅ **Auth**: Register, login, forgot/reset password, refresh tokens
- ✅ **Lembretes**: CRUD completo com múltiplos horários
- ✅ **Ingestões**: Histórico, eventos futuros, confirmação de tomada
- ✅ **Emergência**: Contatos SOS e disparos de alerta
- ✅ **Dispositivos**: Gerenciamento de tokens push
- ✅ **Jobs**: Scheduler de eventos, processador de alarmes, limpeza
- ✅ **Notificações**: WhatsApp, FCM, Expo com retry/backoff

### Frontend Mobile

- ✅ **Dashboard**: Visão geral de ingestões e acesso rápido ao SOS
- ✅ **Lembretes**: Criação/edição com interface intuitiva
- ✅ **Histórico**: Timeline paginado de todas as ingestões
- ✅ **Perfil**: Configurações da conta e preferências
- ✅ **Emergência**: CRUD de contatos e botão SOS
- ✅ **Notificações**: Push notifications nativas
- ✅ **Tema**: Modo claro/escuro persistente

## 🧪 Testes e Qualidade

### Backend

```bash
cd BackEnd/MedicalTime

# Suíte completa
npm test

# Testes de contrato
npm run test:contract

# Smoke test end-to-end
npm run smoke
```

### Frontend

```bash
cd FrontEnd/my-app

# Lint
npm run lint

# Smoke tests
npm run smoke:frontend

# Fluxo E2E
npm run qa:e2e
```

## 🔄 Sincronização e SDK

O projeto possui **automação completa** entre backend e frontend:

- **SDK gerado automaticamente** a partir da OpenAPI spec
- **Sincronização de URLs** e variáveis de ambiente
- **Scripts de verificação** de compatibilidade
- **CI/CD** integrado para atualizações do contrato

```bash
# Backend - gerar e sincronizar SDK
cd BackEnd/MedicalTime
npm run sdk:update

# Frontend - verificar sincronização
cd FrontEnd/my-app
npm run sdk:verify
```

## 📚 Documentação Técnica

### Backend

- **OpenAPI Spec**: `/BackEnd/MedicalTime/openapi.yaml`
- **Swagger UI**: `http://localhost:3000/docs`
- **README Backend**: `/BackEnd/MedicalTime/README.md`
- **Mailtrap Setup**: `/BackEnd/MedicalTime/docs/MAILTRAP_SETUP.md`

### Frontend

- **README Frontend**: `/FrontEnd/my-app/README.md`
- **Guias de desenvolvimento** na pasta `/FrontEnd/my-app/docs/`

## 🐛 Troubleshooting

### Problemas Comuns

**Backend não conecta no banco:**

- Verifique `DATABASE_URL` no `.env`
- Execute `npm run migrate` após mudanças no schema

**Frontend não conecta na API:**

- Execute `npm run sync:env` para atualizar URLs
- Verifique se backend está rodando na porta correta
- Use `npm run start:tunnel` se estiver em redes diferentes

**Erro de CORS:**

- Configure `CORS_ORIGINS` no backend
- Use `npm run sync:backend-front` para sincronizar URLs

**Problemas de cache:**

- Backend: Reinicie o servidor
- Frontend: `npx expo start --clear`

## 🚀 Deploy e Produção

### Backend

- **Docker**: Use `docker-compose.yml` para produção
- **Variáveis**: Configure `.env` com secrets seguros
- **Banco**: Use MySQL em produção (não SQLite)
- **Email**: Configure SMTP real (não Mailtrap)

### Frontend

- **EAS Build**: Para distribuição via Expo
- **Web**: Deploy estático via `expo export:web`
- **Stores**: Google Play / App Store via Expo Application Services

## 👥 Contribuição

1. **Fork** o repositório
2. **Crie** uma branch: `git checkout -b feature/nova-feature`
3. **Commit** suas mudanças: `git commit -m 'Add nova feature'`
4. **Push** para a branch: `git push origin feature/nova-feature`
5. **Abra** um Pull Request

### Padrões de Commit

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `test:` Testes
- `refactor:` Refatoração

## 📄 Licença

Este projeto é de uso interno/educacional. Consulte os responsáveis antes de redistribuir.

## 👨‍💻 Desenvolvedor

**Andrei Granada**  
📧 Email: [contato via GitHub](https://github.com/AndreiGranada)  
🔗 Repositório: [Granada-FrameWork25](https://github.com/AndreiGranada/Granada-FrameWork25)

---
Obrigado por usar o Granada FrameWork25 - MedicalTime Platform! 🚀💊