import json
import os
import smtplib
import urllib.request
from email.message import EmailMessage
from typing import Any, Dict, Tuple


def _post_json(url: str, payload: Dict[str, Any], headers: Dict[str, str]) -> Tuple[bool, str]:
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as resp:
            if 200 <= resp.status < 300:
                return True, ""
            return False, f"status {resp.status}"
    except Exception as exc:
        return False, str(exc)


def send_webhook(target: str, payload: Dict[str, Any]) -> Tuple[bool, str]:
    if not target:
        return False, "missing target"
    return _post_json(target, payload, {"Content-Type": "application/json"})


def send_email(target: str, subject: str, body: str) -> Tuple[bool, str]:
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT") or "587")
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASS")
    sender = os.getenv("SMTP_FROM") or user
    if not host or not user or not password or not sender or not target:
        return False, "smtp config missing"

    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = target
        msg.set_content(body)
        with smtplib.SMTP(host, port, timeout=10) as server:
            server.starttls()
            server.login(user, password)
            server.send_message(msg)
        return True, ""
    except Exception as exc:
        return False, str(exc)


def send_whatsapp(target: str, body: str) -> Tuple[bool, str]:
    token = os.getenv("WHATSAPP_TOKEN")
    phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    if not token or not phone_id or not target:
        return False, "whatsapp config missing"

    url = f"https://graph.facebook.com/v18.0/{phone_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": target,
        "type": "text",
        "text": {"body": body},
    }
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    return _post_json(url, payload, headers)
