# Plataforma de Disparo de Emails - AWS SES

Plataforma completa para gerenciamento e disparo de campanhas de email usando Amazon SES, com métricas em tempo real, agendamento e gestão de falhas.

## 🚀 Tecnologias

### Backend
- **Python 3.11+** com **Django 5.0** e **Django REST Framework**
- **PostgreSQL 15** para banco de dados
- **Redis** para cache e broker Celery
- **Celery** com **Celery Beat** para processamento assíncrono e agendamento
- **Boto3** para integração com AWS SES
- **Flower** para monitoramento de tasks

### Frontend
- **React 18** com **TypeScript**
- **Vite** como build tool
- **TanStack Query** (React Query) para gerenciamento de estado
- **React Router v6** para roteamento
- **TailwindCSS** para estilização
- **Recharts** para gráficos
- **Axios** para requisições HTTP
- **Unlayer Email Editor** para criação visual de emails

### Infraestrutura
- **Docker** e **Docker Compose** para containerização completa
- **AWS SES** para envio de emails
- **AWS SNS** para webhooks de eventos

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Conta AWS com acesso ao SES
- Node.js 20+ (apenas para desenvolvimento local do frontend)
- Python 3.11+ (apenas para desenvolvimento local do backend)

## ⚙️ Configuração

### 1. Clonar o repositório

```bash
cd Disparador_aws
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Django
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://emailuser:emailpass123@db:5432/emailplatform

# Redis
REDIS_URL=redis://redis:6379/0

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# AWS SES (PREENCHA COM SUAS CREDENCIAIS)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_SES_REGION=us-east-1
AWS_SES_CONFIGURATION_SET=your-configuration-set-name

# SES Rate Limiting
SES_RATE_LIMIT_PER_SECOND=14

# Frontend
VITE_API_URL=http://localhost:8000
```

## 🔧 Configuração AWS SES

### Passo 1: Criar conta AWS e acessar SES

1. Acesse o [AWS Console](https://console.aws.amazon.com/)
2. Navegue para **Amazon SES**
3. Selecione a região (recomendado: us-east-1)

### Passo 2: Verificar Email ou Domínio

#### Verificar Email Individual:
1. No SES, vá em **Verified identities**
2. Clique em **Create identity**
3. Selecione **Email address**
4. Digite seu email e clique em **Create identity**
5. Verifique sua caixa de entrada e clique no link de verificação

#### Verificar Domínio (Recomendado para produção):
1. No SES, vá em **Verified identities**
2. Clique em **Create identity**
3. Selecione **Domain**
4. Digite seu domínio
5. Configure os registros DNS conforme instruído pela AWS

### Passo 3: Sair do Sandbox (Obrigatório para produção)

Por padrão, contas SES estão em "sandbox mode" e só podem enviar para emails verificados.

1. No SES, vá em **Account dashboard**
2. Clique em **Request production access**
3. Preencha o formulário com:
   - Tipo de caso de uso
   - Descrição de como você vai usar o SES
   - Processo de gerenciamento de bounces/complaints
4. Aguarde aprovação (geralmente 24-48 horas)

### Passo 4: Criar Configuration Set

1. No SES, vá em **Configuration sets**
2. Clique em **Create set**
3. Nomeie como `email-platform-config` (ou outro nome de sua escolha)
4. Clique em **Create set**

### Passo 5: Configurar Event Publishing com SNS

1. Dentro do Configuration Set criado, vá em **Event destinations**
2. Clique em **Add destination**
3. Selecione os eventos: **Sends**, **Deliveries**, **Bounces**, **Complaints**, **Opens**, **Clicks**
4. Escolha **Amazon SNS** como destino
5. Crie um novo tópico SNS ou use existente
6. **Importante**: Configure a subscrição do SNS para apontar para:
   ```
   https://seu-dominio.com/api/webhooks/ses/
   ```

### Passo 6: Criar Credenciais IAM

1. Vá para **IAM** no AWS Console
2. Crie um novo usuário para a aplicação
3. Anexe a policy **AmazonSESFullAccess**
4. Gere as credenciais (Access Key ID e Secret Access Key)
5. Copie as credenciais para o arquivo `.env`

## 🐳 Executar com Docker

### Iniciar todos os serviços

```bash
docker-compose up -d
```

Isso iniciará 7 containers:
- **db**: PostgreSQL
- **redis**: Redis
- **backend**: Django API (porta 8000)
- **celery_worker**: Worker Celery
- **celery_beat**: Scheduler Celery
- **flower**: Monitoramento Celery (porta 5555)
- **frontend**: Vite dev server (porta 5173)

### Criar migrations e migrar banco de dados

```bash
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
```

### Criar superusuário admin

```bash
docker-compose exec backend python manage.py createsuperuser
```

### Popular banco com dados de exemplo

```bash
docker-compose exec backend python manage.py seed_data
```

## 🌐 Acessar a aplicação

- **Frontend**: http://localhost:5173
- **API Backend**: http://localhost:8000/api/
- **Admin Django**: http://localhost:8000/admin/
- **Flower (Celery)**: http://localhost:5555

## 📊 Estrutura do Projeto

```
Disparador_aws/
├── backend/                 # Django API
│   ├── config/             # Settings Django
│   ├── apps/
│   │   ├── campaigns/      # Gestão de campanhas
│   │   ├── emails/         # Templates e envio
│   │   ├── contacts/       # Contatos e listas
│   │   ├── analytics/      # Métricas e eventos
│   │   └── core/           # Utils e services
│   ├── tasks/              # Celery tasks
│   └── manage.py
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # API calls
│   │   └── types/          # TypeScript types
│   └── package.json
├── docker-compose.yml
├── .env
└── README.md
```

## 🔥 Funcionalidades Principais

### ✅ Gestão de Campanhas
- Criar, editar e deletar campanhas
- Envio imediato ou agendado
- Pausar campanhas em andamento
- Métricas em tempo real

### ✅ Templates de Email
- **Editor Visual Drag-and-Drop** (Unlayer) - Crie emails profissionais sem saber HTML
- Editor HTML avançado para desenvolvedores
- Preview em tempo real com dados de exemplo
- Variáveis dinâmicas com merge tags
- Templates reutilizáveis
- Persistência de design JSON

### ✅ Gestão de Contatos
- Importação CSV em massa
- Organização em listas
- Custom fields por contato
- Lista de supressão automática

### ✅ Métricas e Analytics
- Dashboard com visão geral
- Métricas por campanha
- Gráficos de performance
- Tracking de opens e clicks

### ✅ Integração AWS SES
- Envio via SES
- Webhooks para eventos
- Rate limiting inteligente
- Retry automático com backoff exponencial

### ✅ Processamento Assíncrono
- Celery para envios em background
- Celery Beat para agendamento
- Flower para monitoramento

## 📝 API Endpoints

### Campaigns
- `GET /api/campaigns/` - Listar campanhas
- `POST /api/campaigns/` - Criar campanha
- `GET /api/campaigns/{id}/` - Detalhes
- `POST /api/campaigns/{id}/send/` - Enviar
- `POST /api/campaigns/{id}/schedule/` - Agendar
- `POST /api/campaigns/{id}/pause/` - Pausar
- `GET /api/campaigns/{id}/metrics/` - Métricas

### Templates
- `GET /api/templates/` - Listar templates
- `POST /api/templates/` - Criar template
- `POST /api/templates/{id}/preview/` - Preview

### Contacts
- `GET /api/contacts/` - Listar contatos
- `POST /api/contacts/` - Criar contato
- `POST /api/contacts/bulk_upload/` - Upload CSV

### Analytics
- `GET /api/analytics/dashboard/` - Métricas gerais
- `GET /api/analytics/campaign/{id}/` - Métricas da campanha

## 🛠️ Desenvolvimento Local

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🧪 Testar Envio de Email

1. Acesse o Django Admin: http://localhost:8000/admin/
2. Vá em **Campaigns**
3. Selecione uma campanha draft
4. No backend, execute:
   ```bash
   docker-compose exec backend python manage.py shell
   ```
5. No shell Python:
   ```python
   from apps.campaigns.models import Campaign
   from tasks.email_tasks import send_campaign_task

   campaign = Campaign.objects.first()
   campaign.status = 'sending'
   campaign.save()
   send_campaign_task.delay(campaign.id)
   ```

## 📊 Monitoramento

### Flower (Celery Monitoring)

Acesse http://localhost:5555 para visualizar:
- Tasks em execução
- Tasks completadas/falhadas
- Gráficos de performance
- Workers ativos

### Logs

Ver logs de um serviço específico:
```bash
docker-compose logs -f backend
docker-compose logs -f celery_worker
docker-compose logs -f celery_beat
```

## 🚨 Troubleshooting

### Erro: "SES não está configurado"
- Verifique se preencheu as credenciais AWS no `.env`
- Confirme que o email remetente está verificado no SES
- Teste a conexão: http://localhost:8000/admin/ → Core → Test SES

### Erro: "Database connection refused"
- Aguarde o container do PostgreSQL estar totalmente iniciado
- Execute `docker-compose ps` para verificar status dos containers

### Emails não são enviados
- Verifique se está em sandbox mode no SES
- Confirme que o email destinatário está verificado (se em sandbox)
- Verifique os logs do Celery Worker
- Acesse o Flower para ver se as tasks estão sendo executadas

### Frontend não conecta com backend
- Verifique se `VITE_API_URL` no `.env` está correto
- Confirme que o backend está rodando na porta 8000
- Verifique CORS settings no Django

## 🔐 Segurança

### Para Produção:
1. Altere o `SECRET_KEY` do Django
2. Configure `DEBUG=False`
3. Configure `ALLOWED_HOSTS` adequadamente
4. Use HTTPS
5. Configure firewall para proteger portas sensíveis
6. Implemente autenticação na API
7. Use variáveis de ambiente seguras (AWS Secrets Manager, etc)

## 📸 Screenshots

<!-- Adicione screenshots do projeto aqui -->
_Screenshots em desenvolvimento - contribua com capturas de tela!_

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

Este projeto é de código aberto e pode ser usado para fins educacionais e comerciais.

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja o guia [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes sobre como contribuir.

### Como Contribuir:
1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add: Amazing feature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

Veja também [SECURITY.md](SECURITY.md) para práticas de segurança.

## 📧 Suporte

Para questões sobre AWS SES, consulte a [documentação oficial](https://docs.aws.amazon.com/ses/).

---

**Desenvolvido com ❤️ usando Django, React e AWS SES**
