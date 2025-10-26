# 🔐 Feature: Sistema de Autenticação JWT e Gerenciamento de Usuários

## 📋 Resumo

Implementação completa de sistema de autenticação JWT com gerenciamento de usuários, onde apenas administradores podem criar novos usuários.

## ✨ Principais Features

### 🔒 Autenticação JWT
- ✅ Login com username e password
- ✅ Tokens JWT com expiração (Access: 1h, Refresh: 7 dias)
- ✅ Refresh automático de tokens
- ✅ Rotação de refresh tokens
- ✅ Blacklist de tokens revogados
- ✅ Passwords hasheados com bcrypt

### 👥 Gerenciamento de Usuários
- ✅ **Apenas admin pode criar/ver outros usuários**
- ✅ Usuários criados têm acesso completo à plataforma (exceto gerenciar usuários)
- ✅ Interface única para todos os usuários
- ✅ Lista de usuários com detalhes
- ✅ Validação de senhas

### 🎨 Frontend
- ✅ Página de login moderna e responsiva
- ✅ Context de autenticação (AuthContext)
- ✅ Rotas protegidas (ProtectedRoute)
- ✅ Página de gerenciamento de usuários
- ✅ Interceptors Axios para tokens automáticos
- ✅ Logout funcional

### 🔐 Segurança
- ✅ Credenciais sensíveis em variáveis de ambiente (.env)
- ✅ Validação de força de senha
- ✅ CSRF protection
- ✅ CORS configurado
- ✅ Secret Key no .env (não hardcoded)

## 📁 Arquivos Criados/Modificados

### Backend
- `apps/authentication/` - Novo app de autenticação
  - `views.py` - Endpoints de login, registro, refresh
  - `urls.py` - Rotas de autenticação
  - `serializers.py` - Validação de dados
- `config/settings.py` - Configurações JWT adicionadas
- `requirements.txt` - Adicionado `djangorestframework-simplejwt`

### Frontend
- `pages/Login.tsx` - Página de login
- `pages/Users.tsx` - Página de gerenciamento de usuários
- `pages/Register.tsx` - Removida (apenas admin cria usuários)
- `contexts/AuthContext.tsx` - Context de autenticação
- `components/ProtectedRoute.tsx` - Proteção de rotas
- `services/authApi.ts` - API client de autenticação
- `services/api.ts` - Interceptors para tokens
- `App.tsx` - Rotas atualizadas

### Configuração
- `.env` - Variáveis de ambiente (recriado com base no .env.example)
- `.env.example` - Template completo com documentação
- `AUTHENTICATION.md` - Documentação completa

## 🚀 Como Usar

### 1. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Edite o .env com suas credenciais AWS
```

### 2. Subir containers
```bash
docker-compose up -d
```

### 3. Criar superusuário
```bash
docker-compose exec backend python manage.py createsuperuser
```

### 4. Acessar
- Frontend: http://localhost:5173
- Login automático no `/login`

## 🔑 Credenciais Padrão
- Username: `admin`
- Password: `Admin@123!`

**⚠️ Alterar em produção!**

## 📊 Fluxo de Permissões

### Admin
- ✅ Todas as funcionalidades
- ✅ Gerenciar outros usuários
- ✅ Acesso completo

### Usuário Normal
- ✅ Todas as funcionalidades (campanhas, templates, contatos, etc.)
- ❌ **NÃO** pode gerenciar outros usuários
- ✅ Mesma interface do admin

## 🔧 Tecnologias

- **Backend**: Django 5.0 + Django REST Framework
- **JWT**: djangorestframework-simplejwt
- **Frontend**: React 18 + TypeScript
- **Auth**: JWT com refresh tokens
- **Estado**: Context API + LocalStorage

## ✅ Testes

```bash
# Testar login via API
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123!"}'
```

## 📝 Breaking Changes
- ❌ Removido registro público
- ✅ Apenas admin pode criar usuários

## 🔒 Segurança
- Senhas nunca em texto plano
- Tokens com assinatura HMAC-SHA256
- Refresh tokens automático
- Blacklist de tokens revogados
- Validação de força de senha

## 📚 Documentação
Veja `AUTHENTICATION.md` para documentação completa.

## 🎯 Checklist

- [x] Autenticação JWT implementada
- [x] Login funcional
- [x] Gerenciamento de usuários
- [x] Proteção de rotas no frontend
- [x] API protegida com autenticação
- [x] Documentação completa
- [x] Variáveis de ambiente configuradas
- [x] Segurança implementada
- [x] Interface moderna
- [x] Validações de dados

---

**Desenvolvido com ❤️**
