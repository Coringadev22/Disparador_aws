from django.db import models


class EmailTemplate(models.Model):
    """Email template with HTML and plain text content"""

    name = models.CharField(max_length=255, unique=True)
    subject_template = models.CharField(max_length=500)
    html_content = models.TextField()
    plain_text_content = models.TextField()
    variables = models.JSONField(
        default=dict,
        blank=True,
        help_text="Available variables: {name, email, custom_fields}"
    )
    design_json = models.JSONField(
        null=True,
        blank=True,
        help_text="Unlayer email editor design JSON"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'email_templates'
        ordering = ['-created_at']

    def __str__(self):
        return self.name
