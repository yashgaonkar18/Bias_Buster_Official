import os
import resend
import asyncio
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
import logging

from app.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        print("EmailService initialized")
        print("API Key:", settings.RESEND_API_KEY[:8] + "...")
        print("Sender:", settings.EMAIL_FROM)
        
        resend.api_key = settings.RESEND_API_KEY
        self.sender = settings.EMAIL_FROM
        
        # Setup Jinja2 environment for templates
        template_dir = Path(__file__).resolve().parent.parent / "templates" / "emails"
        self.env = Environment(loader=FileSystemLoader(str(template_dir)))

    def _render_template(self, template_name: str, **kwargs) -> str:
        template = self.env.get_template(template_name)
        return template.render(**kwargs)

    async def _send_email(self, to: str, subject: str, html_content: str):
        if not resend.api_key:
            logger.warning("RESEND_API_KEY is not set. Skipping email send.")
            return False
        
        print("Inside _send_email()")
        print("Recipient:", to)
        print("Sender:", self.sender)
        print("API Key Exists:", bool(resend.api_key))
        
            
        try:
            # Use asyncio.to_thread to make the synchronous SDK call non-blocking
            
            print("Calling Resend...")
            
            response = await asyncio.to_thread(
                resend.Emails.send,
                {
                    "from": self.sender,
                    "to": to,
                    "subject": subject,
                    "html": html_content
                }
            )
            
            print("Response:", response)
            
            logger.info(f"Email sent successfully to {to}. Response: {response}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to}: {e}")
            return False

    async def send_verification_email(self, to: str, name: str, verify_link: str):
        html_content = self._render_template(
            "verify_email.html", 
            name=name, 
            verify_link=verify_link
        )
        return await self._send_email(to, "Verify your BiasBuster email", html_content)

    async def send_password_reset_email(self, to: str, name: str, reset_link: str):
        html_content = self._render_template(
            "forgot_password.html", 
            name=name, 
            reset_link=reset_link
        )
        return await self._send_email(to, "Reset your BiasBuster password", html_content)

    async def send_welcome_email(self, to: str, name: str, login_link: str):
        html_content = self._render_template(
            "welcome.html", 
            name=name, 
            login_link=login_link
        )
        return await self._send_email(to, "Welcome to BiasBuster!", html_content)
