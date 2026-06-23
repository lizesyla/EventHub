import smtplib
from email.message import EmailMessage

from app.config import settings


def send_email(to_email: str, subject: str, body: str):
    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    smtp_user = settings.SMTP_USER
    smtp_password = settings.SMTP_PASSWORD
    from_email = settings.FROM_EMAIL or smtp_user

    if not smtp_host or not smtp_user or not smtp_password:
        print(f"[EMAIL SKIPPED] To: {to_email} | Subject: {subject}")
        return

    msg = EmailMessage()
    msg["From"] = f"EventHub Notifications <{from_email}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)

    print(f"[EMAIL SENT] To: {to_email} | Subject: {subject}")