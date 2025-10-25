# 🚀 Guia Rápido de Início

## Setup em 5 minutos

### 1️⃣ Pré-requisitos
- Docker e Docker Compose instalados
- Conta AWS com SES configurado

### 2️⃣ Configurar AWS SES

**Importante**: Antes de rodar a aplicação, configure o AWS SES:

1. Acesse [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Verifique um email em **Verified identities** → **Create identity**
3. Anote suas credenciais IAM (Access Key e Secret Key)

### 3️⃣ Configurar credenciais

Edite o arquivo `.env` e preencha:

```env
AWS_ACCESS_KEY_ID=sua-access-key-aqui
AWS_SECRET_ACCESS_KEY=sua-secret-key-aqui
AWS_SES_REGION=us-east-1
```

### 4️⃣ Executar setup automático

```bash
./setup.sh
```

Ou manualmente:

```bash
# Iniciar containers
docker-compose up -d

# Aguardar 30 segundos para serviços iniciarem

# Criar banco e migrar
docker-compose exec backend python manage.py migrate

# Criar admin
docker-compose exec backend python manage.py createsuperuser

# Popular dados de exemplo
docker-compose exec backend python manage.py seed_data
```

### 5️⃣ Acessar aplicação

- **Frontend**: http://localhost:5173
- **Admin Django**: http://localhost:8000/admin/
- **API**: http://localhost:8000/api/
- **Flower (Celery)**: http://localhost:5555

## 📧 Testar envio

### Via Admin Django:

1. Acesse http://localhost:8000/admin/
2. Faça login com o superusuário criado
3. Vá em **Campaigns** → Selecione uma campanha
4. No shell do container:
   ```bash
   docker-compose exec backend python manage.py shell
   ```
5. Execute:
   ```python
   from apps.campaigns.models import Campaign
   from tasks.email_tasks import send_campaign_task

   campaign = Campaign.objects.first()
   campaign.status = 'sending'
   campaign.save()
   send_campaign_task.delay(campaign.id)
   ```

### Via API:

```bash
# Listar campanhas
curl http://localhost:8000/api/campaigns/

# Enviar campanha
curl -X POST http://localhost:8000/api/campaigns/1/send/
```

## ⚠️ Importante - SES Sandbox

Se sua conta SES está em **Sandbox Mode**:
- ✅ Você pode enviar emails
- ❌ Só para emails **verificados** no SES
- ❌ Limite de 200 emails por dia

**Para produção**: Solicite saída do sandbox no AWS Console.

## 🛑 Parar aplicação

```bash
docker-compose down
```

## 🔧 Ver logs

```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend
docker-compose logs -f celery_worker
```

## 🆘 Problemas?

### Erro: "SES credentials não configuradas"
→ Verifique o arquivo `.env` com as credenciais AWS

### Erro: "Database connection refused"
→ Aguarde mais tempo para PostgreSQL iniciar (`sleep 30`)

### Emails não enviam
→ Verifique se está em Sandbox e se emails estão verificados no SES

### Frontend não carrega
→ Aguarde o npm install completar no container frontend

---

**Para documentação completa, veja [README.md](README.md)**
