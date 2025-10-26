# 🔐 Sistema de Autenticação JWT

## Visão Geral

O sistema de autenticação implementa JWT (JSON Web Tokens) com refresh tokens para garantir segurança máxima. Todas as rotas da aplicação são protegidas, exceto login e registro.

## 🏗️ Arquitetura

### Backend (Django + JWT)

#### Componentes:
- **App de Autenticação** (`apps/authentication`)
  - Views de login, registro e refresh token
  - Serializers para validação
  - Endpoints REST protegidos

#### Endpoints:
- `POST /api/auth/login/` - Login com username e password
- `POST /api/auth/register/` - Registro de novos usuários
- `POST /api/auth/refresh/` - Renovação de access token
- `GET /api/auth/user/` - Dados do usuário atual

#### Segurança:
- Passwords são hasheados com bcrypt (Django default)
- Tokens JWT com expiração:
  - **Access Token**: 1 hora
  - **Refresh Token**: 7 dias
- Rotação automática de tokens
- Blacklist para tokens revogados

### Frontend (React + Context API)

#### Componentes:
- **AuthContext**: Gerencia estado de autenticação
- **ProtectedRoute**: Protege rotas privadas
- **Login/Register Pages**: Interfaces de autenticação
- **Interceptor do Axios**: Adiciona token automaticamente

#### Fluxo de Autenticação:
1. Usuário faz login
2. Backend retorna access + refresh tokens
3. Tokens salvos no localStorage
4. Todas as requisições incluem token no header
5. Se token expirar, refresh automático

## 🔒 Segurança

### Variáveis de Ambiente

Todas as credenciais sensíveis estão no arquivo `.env`:

```env
# Django Secret Key (MAIS IMPORTANTE!)
SECRET_KEY=your-super-secret-key-change-this-in-production

# Credenciais padrão (altere em produção!)
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=Admin@123!

# JWT Configuration (automática)
# Access Token: 1 hora
# Refresh Token: 7 dias
# Blacklist: Ativada
```

### 🔐 Boas Práticas Implementadas

1. **Nunca senhas em texto plano**
   - Django usa bcrypt automaticamente
   - Passwords nunca são armazenadas sem hash

2. **Tokens seguros**
   - JWT assinados com SECRET_KEY
   - Tokens expiram automaticamente
   - Refresh tokens para renovação

3. **Middleware de proteção**
   - Todas as rotas API exigem autenticação
   - Exceções apenas em /login e /register

4. **Validação de senha**
   - Mínimo 8 caracteres
   - Validação de força (Django validators)
   - Senha + confirmação devem coincidir

5. **Refresh automático**
   - Frontend renova token expirado
   - Redireciona para login se refresh falhar

## 🚀 Como Usar

### Primeiro Acesso

1. **Subir containers**:
   ```bash
   docker-compose up -d
   ```

2. **Aguardar inicialização** (30 segundos)

3. **Executar migrations**:
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

4. **Criar superusuário**:
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```
   
   Ou usar as credenciais padrão do `.env`:
   - Username: `admin`
   - Password: `Admin@123!`

5. **Acessar aplicação**:
   - Frontend: http://localhost:5173
   - Redireciona para `/login` automaticamente

### Login

1. Acesse http://localhost:5173/login
2. Entre com suas credenciais
3. Será redirecionado para o dashboard

### Registro de Novo Usuário

1. Acesse http://localhost:5173/register
2. Preencha o formulário
3. Sistema valida e cria conta
4. Login automático após registro

## 📁 Estrutura de Arquivos

```
backend/
├── apps/
│   └── authentication/          # App de autenticação
│       ├── views.py             # Endpoints de login/register
│       ├── urls.py              # Rotas de autenticação
│       └── serializers.py       # Validação de dados
├── config/
│   ├── settings.py              # Configurações JWT
│   └── urls.py                  # URLs principais

frontend/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx      # Context de autenticação
│   ├── components/
│   │   └── ProtectedRoute.tsx   # Componente de proteção
│   ├── pages/
│   │   ├── Login.tsx            # Página de login
│   │   └── Register.tsx         # Página de registro
│   └── services/
│       ├── authApi.ts           # API de autenticação
│       └── api.ts               # Axios com interceptors
└── .env                         # Variáveis de ambiente
```

## ⚠️ Produção

### Alterar ANTES de Deploy:

1. **SECRET_KEY** no `.env`:
   ```bash
   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   ```

2. **Credenciais padrão** - Remover ou mudar senha forte

3. **DEBUG=False** no `.env`

4. **ALLOWED_HOSTS** com domínio real

5. **HTTPS obrigatório** - Configurar certificado SSL

6. **Database** - Usar PostgreSQL externo (não container)

7. **Redis** - Usar Redis externo ou cloud

## 🧪 Testar Autenticação

### Via Curl:

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin@123!"}'

# Resposta:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com"
  }
}

# Usar token em requisições
curl -X GET http://localhost:8000/api/campaigns/ \
  -H "Authorization: Bearer <access_token>"
```

### Via Frontend:

1. Login com usuário e senha
2. Todas as requisições incluem token automaticamente
3. Logout limpa tokens e redireciona para login

## 🛡️ Proteção Implementada

- ✅ JWT com assinatura HMAC-SHA256
- ✅ Tokens com expiração
- ✅ Refresh tokens automático
- ✅ Blacklist de tokens revogados
- ✅ Passwords hasheados (bcrypt)
- ✅ Validação de força de senha
- ✅ CSRF protection (Django)
- ✅ CORS configurado
- ✅ Rotas protegidas no frontend
- ✅ Redirecionamento automático

## 📚 Referências

- [Django REST Framework JWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- [JWT Specification](https://tools.ietf.org/html/rfc7519)
- [Django Authentication](https://docs.djangoproject.com/en/stable/topics/auth/)
- [React Context API](https://react.dev/reference/react/useContext)
