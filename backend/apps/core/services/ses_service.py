"""
AWS SES Service for sending emails
"""
import boto3
from botocore.exceptions import ClientError, BotoCoreError
from django.conf import settings
import logging
import time
from string import Template
import redis

logger = logging.getLogger(__name__)


class SESService:
    """Service class for interacting with AWS SES"""

    def __init__(self):
        self.client = boto3.client(
            'ses',
            region_name=settings.AWS_SES_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        self.configuration_set = settings.AWS_SES_CONFIGURATION_SET
        self.rate_limit = settings.SES_RATE_LIMIT_PER_SECOND
        self.redis_client = redis.from_url(settings.REDIS_URL)
        self.rate_key = 'ses_rate_limit'

    def send_email(self, to_email, from_email, from_name, subject, html_content, plain_text_content):
        """
        Send an email via SES

        Args:
            to_email: Recipient email
            from_email: Sender email
            from_name: Sender name
            subject: Email subject
            html_content: HTML content
            plain_text_content: Plain text content

        Returns:
            dict: Response from SES with MessageId
        """

        # Rate limiting check
        self._check_rate_limit()

        try:
            source = f"{from_name} <{from_email}>"

            response = self.client.send_email(
                Source=source,
                Destination={
                    'ToAddresses': [to_email]
                },
                Message={
                    'Subject': {
                        'Data': subject,
                        'Charset': 'UTF-8'
                    },
                    'Body': {
                        'Html': {
                            'Data': html_content,
                            'Charset': 'UTF-8'
                        },
                        'Text': {
                            'Data': plain_text_content,
                            'Charset': 'UTF-8'
                        }
                    }
                },
                ConfigurationSetName=self.configuration_set if self.configuration_set else None
            )

            # Increment rate counter
            self._increment_rate_counter()

            logger.info(f"Email sent successfully to {to_email}, MessageId: {response['MessageId']}")

            return {
                'success': True,
                'message_id': response['MessageId'],
                'error': None
            }

        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']

            logger.error(f"SES ClientError: {error_code} - {error_message}")

            # Handle throttling with exponential backoff
            if error_code == 'Throttling':
                return self._handle_throttling(
                    to_email, from_email, from_name, subject,
                    html_content, plain_text_content
                )

            return {
                'success': False,
                'message_id': None,
                'error': f"{error_code}: {error_message}"
            }

        except BotoCoreError as e:
            logger.error(f"BotoCoreError: {str(e)}")
            return {
                'success': False,
                'message_id': None,
                'error': str(e)
            }

        except Exception as e:
            logger.error(f"Unexpected error sending email: {str(e)}")
            return {
                'success': False,
                'message_id': None,
                'error': str(e)
            }

    def render_template(self, template_content, data):
        """
        Render template with data

        Args:
            template_content: Template string
            data: Dictionary with template variables

        Returns:
            str: Rendered content
        """
        try:
            template = Template(template_content)
            return template.safe_substitute(data)
        except Exception as e:
            logger.error(f"Template rendering error: {str(e)}")
            raise

    def verify_email_identity(self, email):
        """
        Verify an email identity in SES

        Args:
            email: Email address to verify

        Returns:
            dict: Response from SES
        """
        try:
            response = self.client.verify_email_identity(EmailAddress=email)
            logger.info(f"Verification email sent to {email}")
            return {'success': True, 'message': 'Verification email sent'}
        except ClientError as e:
            logger.error(f"Error verifying email: {str(e)}")
            return {'success': False, 'error': str(e)}

    def get_send_quota(self):
        """
        Get SES sending quota and usage

        Returns:
            dict: Quota information
        """
        try:
            response = self.client.get_send_quota()
            return {
                'success': True,
                'max_24_hour_send': response['Max24HourSend'],
                'max_send_rate': response['MaxSendRate'],
                'sent_last_24_hours': response['SentLast24Hours']
            }
        except ClientError as e:
            logger.error(f"Error getting send quota: {str(e)}")
            return {'success': False, 'error': str(e)}

    def test_connection(self):
        """
        Test SES connection

        Returns:
            dict: Connection test result
        """
        try:
            quota = self.get_send_quota()
            if quota['success']:
                return {
                    'success': True,
                    'message': 'SES connection successful',
                    'quota': quota
                }
            else:
                return {
                    'success': False,
                    'message': 'SES connection failed',
                    'error': quota.get('error')
                }
        except Exception as e:
            return {
                'success': False,
                'message': 'SES connection failed',
                'error': str(e)
            }

    def _check_rate_limit(self):
        """Check if we're within rate limits"""
        current_count = self.redis_client.get(self.rate_key)

        if current_count and int(current_count) >= self.rate_limit:
            # Wait for a second if rate limit reached
            time.sleep(1)
            self.redis_client.delete(self.rate_key)

    def _increment_rate_counter(self):
        """Increment the rate limiting counter"""
        pipe = self.redis_client.pipeline()
        pipe.incr(self.rate_key)
        pipe.expire(self.rate_key, 1)  # Expire after 1 second
        pipe.execute()

    def _handle_throttling(self, to_email, from_email, from_name, subject, html_content, plain_text_content, retry=1, max_retries=3):
        """
        Handle SES throttling with exponential backoff

        Args:
            Same as send_email, plus:
            retry: Current retry attempt
            max_retries: Maximum number of retries

        Returns:
            dict: Response from SES
        """
        if retry > max_retries:
            return {
                'success': False,
                'message_id': None,
                'error': 'Max retries exceeded due to throttling'
            }

        # Exponential backoff: 2^retry seconds
        wait_time = 2 ** retry
        logger.info(f"Throttling detected, waiting {wait_time} seconds before retry {retry}/{max_retries}")
        time.sleep(wait_time)

        # Retry sending
        return self.send_email(to_email, from_email, from_name, subject, html_content, plain_text_content)
