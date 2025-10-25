#!/bin/bash

echo "========================================="
echo "Email Platform - Setup Script"
echo "========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker e tente novamente."
    exit 1
fi

echo "✅ Docker está rodando"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "Por favor, configure o arquivo .env com suas credenciais AWS SES."
    exit 1
fi

echo "✅ Arquivo .env encontrado"
echo ""

# Build and start containers
echo "📦 Construindo e iniciando containers..."
docker-compose up -d --build

echo ""
echo "⏳ Aguardando serviços iniciarem (30 segundos)..."
sleep 30

# Run migrations
echo ""
echo "🔄 Executando migrations do banco de dados..."
docker-compose exec -T backend python manage.py makemigrations
docker-compose exec -T backend python manage.py migrate

# Create superuser (interactive)
echo ""
echo "👤 Criar superusuário admin..."
docker-compose exec backend python manage.py createsuperuser

# Seed data
echo ""
echo "🌱 Populando banco com dados de exemplo..."
docker-compose exec -T backend python manage.py seed_data

echo ""
echo "========================================="
echo "✅ Setup completo!"
echo "========================================="
echo ""
echo "🌐 Acesse a aplicação:"
echo "   Frontend:    http://localhost:5173"
echo "   API Backend: http://localhost:8000/api/"
echo "   Admin:       http://localhost:8000/admin/"
echo "   Flower:      http://localhost:5555"
echo ""
echo "📝 Lembre-se de configurar suas credenciais AWS SES no arquivo .env"
echo ""
echo "Para parar os containers: docker-compose down"
echo "Para ver logs: docker-compose logs -f [service-name]"
echo ""
