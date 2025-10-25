# Security Policy

## Reporting Security Issues

If you discover a security vulnerability in this project, please report it by emailing the maintainers. **Do not open a public issue.**

## Security Best Practices

### For Development

1. **Never commit `.env` files** - These contain sensitive credentials
2. **Use `.env.example`** as a template with placeholder values
3. **Keep dependencies updated** - Run `pip list --outdated` and `npm outdated` regularly
4. **Review code before committing** - Check for accidentally committed secrets

### For Production Deployment

#### 1. Environment Variables
- ✅ Use secure secret managers (AWS Secrets Manager, HashiCorp Vault, etc.)
- ✅ Generate a strong `SECRET_KEY` for Django (50+ characters)
- ✅ Never use default passwords
- ✅ Rotate credentials regularly

#### 2. Django Settings
```python
DEBUG = False  # NEVER True in production
ALLOWED_HOSTS = ['your-domain.com', 'www.your-domain.com']
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

#### 3. Database
- ✅ Use strong passwords (minimum 20 characters, mixed case, numbers, symbols)
- ✅ Restrict database access to application servers only
- ✅ Enable SSL/TLS for database connections
- ✅ Regular backups with encryption
- ✅ Keep PostgreSQL updated

#### 4. AWS SES
- ✅ Use IAM roles instead of access keys when possible
- ✅ Apply principle of least privilege - only grant necessary SES permissions
- ✅ Enable MFA on AWS account
- ✅ Monitor AWS CloudTrail for suspicious activity
- ✅ Set up AWS Budget alerts
- ✅ Enable SES sending authorization for additional security

#### 5. Docker & Infrastructure
- ✅ Don't expose unnecessary ports publicly
- ✅ Use Docker secrets for sensitive data
- ✅ Keep Docker images updated
- ✅ Scan images for vulnerabilities (`docker scan`)
- ✅ Use non-root users in containers
- ✅ Implement rate limiting
- ✅ Use a reverse proxy (Nginx, Traefik) with SSL/TLS

#### 6. API Security
- ✅ Implement authentication (JWT, OAuth2, etc.)
- ✅ Use HTTPS only
- ✅ Implement rate limiting per IP/user
- ✅ Validate and sanitize all inputs
- ✅ Enable CORS only for trusted domains
- ✅ Keep API keys secret and rotate regularly

#### 7. Email Security
- ✅ Implement DKIM, SPF, and DMARC for your domain
- ✅ Monitor bounce and complaint rates
- ✅ Implement double opt-in for subscriptions
- ✅ Provide easy unsubscribe mechanism
- ✅ Never send to purchased lists
- ✅ Respect suppression lists

#### 8. Monitoring & Logging
- ✅ Set up alerting for suspicious activities
- ✅ Monitor failed login attempts
- ✅ Log all security-relevant events
- ✅ Regularly review logs
- ✅ Use log aggregation service (ELK, CloudWatch, etc.)

#### 9. Celery & Redis
- ✅ Protect Redis with strong password
- ✅ Bind Redis to localhost or private network only
- ✅ Enable Redis SSL/TLS in production
- ✅ Limit Celery worker permissions
- ✅ Monitor task failures and retries

#### 10. Frontend Security
- ✅ Implement Content Security Policy (CSP)
- ✅ Sanitize user inputs
- ✅ Use environment-specific API URLs
- ✅ Don't store sensitive data in localStorage
- ✅ Implement CSRF protection
- ✅ Keep npm dependencies updated

## Known Limitations (Current Version)

This is a **demonstration/educational project**. Before using in production:

1. **No Authentication** - API endpoints are currently open. Implement JWT or session-based auth
2. **Basic Rate Limiting** - Only at SES level. Add application-level rate limiting
3. **No User Management** - Currently single-tenant. Add multi-tenancy if needed
4. **No Audit Logging** - Add detailed audit trails for compliance
5. **Simple Permissions** - Implement role-based access control (RBAC)

## Secure Configuration Checklist

Before deploying to production, verify:

- [ ] All default passwords changed
- [ ] `DEBUG = False` in Django
- [ ] Strong `SECRET_KEY` generated (not the default)
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Firewall configured (only ports 80, 443 exposed)
- [ ] Database not publicly accessible
- [ ] Redis not publicly accessible
- [ ] AWS credentials using IAM roles or stored securely
- [ ] CORS configured for production domains only
- [ ] Rate limiting implemented
- [ ] Authentication added to API
- [ ] Monitoring and alerting configured
- [ ] Backup strategy implemented
- [ ] Incident response plan documented

## Compliance Considerations

If you're sending marketing emails, ensure compliance with:

- **CAN-SPAM Act** (USA)
- **GDPR** (European Union)
- **LGPD** (Brazil)
- **CASL** (Canada)

Key requirements:
- ✅ Clear unsubscribe mechanism
- ✅ Accurate sender information
- ✅ Honor opt-out requests within 10 days
- ✅ Don't send to purchased lists
- ✅ Include physical address
- ✅ Get explicit consent where required

## Dependency Security

### Backend
```bash
# Check for known vulnerabilities
pip install safety
safety check --json

# Update dependencies
pip list --outdated
pip install --upgrade <package>
```

### Frontend
```bash
# Audit dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

## Additional Resources

- [Django Security Checklist](https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [AWS SES Best Practices](https://docs.aws.amazon.com/ses/latest/dg/best-practices.html)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)

---

**Remember: Security is an ongoing process, not a one-time setup. Regularly review and update your security measures.**
