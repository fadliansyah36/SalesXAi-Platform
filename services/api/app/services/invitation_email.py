from __future__ import annotations

import asyncio
import smtplib
import ssl
from email.message import EmailMessage
from html import escape

from app.config import Settings
from app.errors import APIError


async def send_organization_invitation(
    settings: Settings,
    *,
    recipient: str,
    organization_name: str,
    role_key: str,
    invitation_url: str,
) -> None:
    """Deliver an existing-user organization invitation through configured SMTP.

    The raw invitation token exists only in the message body and is never logged
    or persisted by this service.
    """
    if not settings.smtp_host or not settings.smtp_from_email:
        raise APIError(
            503,
            "invitation_email_not_configured",
            "Configure SMTP_HOST and SMTP_FROM_EMAIL in the API secret manager before sending invitations.",
        )
    if bool(settings.smtp_username) != bool(settings.smtp_password):
        raise APIError(
            503,
            "invitation_email_not_configured",
            "Configure both SMTP_USERNAME and SMTP_PASSWORD, or leave both empty for an unauthenticated relay.",
        )

    subject = f"Undangan bergabung ke {organization_name} — SalesX-Ai"
    text_body = (
        f"Anda diundang untuk bergabung ke {organization_name} sebagai {role_key}.\n\n"
        f"Terima undangan: {invitation_url}\n\n"
        "Tautan ini bersifat pribadi dan hanya dapat digunakan oleh akun "
        "dengan alamat email penerima undangan."
    )
    html_body = (
        "<p>Anda diundang untuk bergabung ke <strong>"
        + escape(organization_name)
        + "</strong> sebagai <strong>"
        + escape(role_key)
        + "</strong>.</p><p><a href=\""
        + escape(invitation_url, quote=True)
        + "\">Terima undangan SalesX-Ai</a></p>"
        "<p>Tautan ini bersifat pribadi dan hanya dapat digunakan oleh akun "
        "dengan alamat email penerima undangan.</p>"
    )
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    message["To"] = recipient
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    def deliver() -> None:
        with smtplib.SMTP(
            settings.smtp_host,
            settings.smtp_port,
            timeout=settings.smtp_timeout_seconds,
        ) as client:
            client.ehlo()
            if settings.smtp_starttls:
                client.starttls(context=ssl.create_default_context())
                client.ehlo()
            if settings.smtp_username and settings.smtp_password:
                client.login(
                    settings.smtp_username,
                    settings.smtp_password.get_secret_value(),
                )
            client.send_message(message)

    try:
        await asyncio.to_thread(deliver)
    except (OSError, TimeoutError, smtplib.SMTPException) as exc:
        raise APIError(
            503,
            "invitation_email_delivery_failed",
            "The invitation could not be delivered. The administrator can retry after checking the SMTP provider.",
        ) from exc
