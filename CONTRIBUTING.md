# Contributing to Email Platform - AWS SES

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## How to Contribute

### Reporting Bugs

If you find a bug:

1. Check if it's already reported in [Issues](../../issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - System information (OS, Docker version, etc.)
   - Relevant logs or screenshots

### Suggesting Features

Feature requests are welcome! Please:

1. Check existing issues to avoid duplicates
2. Describe the feature and its benefits
3. Provide use cases
4. Consider implementation complexity

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation

4. **Test your changes**
   ```bash
   # Backend
   docker-compose exec backend python manage.py test

   # Frontend
   docker-compose exec frontend npm run test
   ```

5. **Commit with clear messages**
   ```bash
   git commit -m "Add: Brief description of what you added"
   git commit -m "Fix: Brief description of what you fixed"
   git commit -m "Update: Brief description of what you updated"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Describe what you changed and why
   - Reference any related issues
   - Include screenshots for UI changes

## Code Style

### Python (Backend)
- Follow [PEP 8](https://pep8.org/)
- Use meaningful variable names
- Add docstrings to functions and classes
- Keep functions focused and small
- Use type hints where appropriate

```python
def send_email(recipient: str, subject: str, body: str) -> bool:
    """
    Send an email to a recipient.

    Args:
        recipient: Email address of the recipient
        subject: Email subject line
        body: Email body content

    Returns:
        True if email was sent successfully, False otherwise
    """
    # Implementation
    pass
```

### TypeScript/React (Frontend)
- Use TypeScript for all new code
- Follow React best practices
- Use functional components and hooks
- Keep components small and focused
- Use meaningful prop names

```typescript
interface EmailTemplateProps {
  template: EmailTemplate
  onSave: (template: EmailTemplate) => void
  onCancel: () => void
}

export default function EmailTemplateEditor({ template, onSave, onCancel }: EmailTemplateProps) {
  // Component implementation
}
```

### Git Commit Messages
- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests

```
Add: Visual email editor with drag-and-drop (#123)

- Integrated Unlayer email editor
- Added design JSON persistence
- Created preview tab with sample data
- Updated documentation

Fixes #115
```

## Development Setup

### Prerequisites
- Docker and Docker Compose
- Git
- Code editor (VS Code recommended)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Disparador_aws.git
   cd Disparador_aws
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start containers**
   ```bash
   docker-compose up -d
   ```

4. **Run migrations**
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

5. **Create superuser**
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000
   - Admin: http://localhost:8000/admin

## Testing

### Backend Tests
```bash
# Run all tests
docker-compose exec backend python manage.py test

# Run specific app tests
docker-compose exec backend python manage.py test apps.campaigns

# Run with coverage
docker-compose exec backend coverage run --source='.' manage.py test
docker-compose exec backend coverage report
```

### Frontend Tests
```bash
# Run all tests
docker-compose exec frontend npm run test

# Run in watch mode
docker-compose exec frontend npm run test:watch

# Generate coverage report
docker-compose exec frontend npm run test:coverage
```

## Project Structure

```
Disparador_aws/
├── backend/                    # Django backend
│   ├── apps/
│   │   ├── campaigns/         # Campaign management
│   │   ├── emails/            # Email templates
│   │   ├── contacts/          # Contact management
│   │   ├── analytics/         # Metrics and analytics
│   │   └── core/              # Core services
│   ├── config/                # Django settings
│   ├── tasks/                 # Celery tasks
│   └── manage.py
│
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   └── types/            # TypeScript types
│   └── package.json
│
├── .env.example              # Environment template
├── .gitignore               # Git ignore rules
├── docker-compose.yml       # Docker services
├── LICENSE                  # MIT License
├── README.md               # Project documentation
├── SECURITY.md             # Security guidelines
└── CONTRIBUTING.md         # This file
```

## Areas for Contribution

### High Priority
- [ ] User authentication and authorization
- [ ] Multi-tenancy support
- [ ] Advanced rate limiting
- [ ] Comprehensive test coverage
- [ ] API documentation (Swagger/OpenAPI)

### Medium Priority
- [ ] Email template marketplace
- [ ] A/B testing for campaigns
- [ ] Advanced analytics dashboard
- [ ] Email warmup feature
- [ ] Webhook management UI

### Low Priority
- [ ] Dark mode for frontend
- [ ] Multi-language support (i18n)
- [ ] Mobile responsive improvements
- [ ] Keyboard shortcuts
- [ ] Export reports to PDF

## Questions?

- Open an issue for general questions
- Check existing documentation first
- Be respectful and patient

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- No harassment or discrimination

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing! 🎉**
