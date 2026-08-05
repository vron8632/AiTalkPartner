"""邮箱验证码服务：生成/校验验证码，通过后台配置的 SMTP 发送邮件。

SMTP 参数不写死在代码里，统一从 e_mail 配置表（后台可管理）读取。
"""
import random
from datetime import timedelta

from django.core.mail import EmailMessage, get_connection
from django.utils import timezone

from e_mail.models import EmailConfig, EmailVerifyCode

CODE_TTL_MINUTES = 2          # 验证码有效期
CODE_LENGTH = 6               # 验证码位数
RESEND_INTERVAL_SECONDS = 60  # 同一邮箱同一用途重复发送最小间隔

PURPOSES = ('verify', 'login', 'change_password', 'reset_password')


class EmailNotConfiguredError(Exception):
    """后台未配置 SMTP 邮箱。"""


class CodeInvalidError(Exception):
    """验证码无效/过期/已使用。"""


class SendTooFrequentError(Exception):
    """发送过于频繁。"""


def get_email_config() -> EmailConfig:
    cfg = EmailConfig.objects.first()
    if not cfg:
        raise EmailNotConfiguredError('后台尚未配置邮箱服务，请联系管理员在「邮箱配置」中填写 SMTP 参数')
    return cfg


def generate_code(email: str, purpose: str) -> str:
    """生成并保存验证码（2 分钟有效）。"""
    if purpose not in PURPOSES:
        raise ValueError(f'未知用途: {purpose}')

    # 简单限流：同一邮箱同一用途 60 秒内不重复发送
    recent = EmailVerifyCode.objects.filter(
        email=email, purpose=purpose,
        created_at__gte=timezone.now() - timedelta(seconds=RESEND_INTERVAL_SECONDS),
    ).first()
    if recent:
        raise SendTooFrequentError('发送过于频繁，请稍后再试')

    code = f'{random.randint(0, 999999):06d}'
    EmailVerifyCode.objects.create(
        email=email,
        code=code,
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=CODE_TTL_MINUTES),
    )
    return code


def verify_code(email: str, code: str, purpose: str, mark_used: bool = True) -> bool:
    """校验验证码；通过后默认标记为已使用。"""
    rec = EmailVerifyCode.objects.filter(
        email=email, code=code, purpose=purpose, used=False,
    ).order_by('-created_at').first()
    if not rec:
        raise CodeInvalidError('验证码错误')
    if rec.expires_at < timezone.now():
        raise CodeInvalidError('验证码已过期，请重新获取')
    if mark_used:
        rec.used = True
        rec.save(update_fields=['used'])
    return True


def send_email(subject: str, body: str, to_email: str) -> None:
    """通过后台配置的 SMTP 发送邮件（端口 465 走 SSL，587/25 走 STARTTLS）。"""
    cfg = get_email_config()
    kwargs = dict(
        host=cfg.smtp_host,
        port=cfg.smtp_port,
        # 授权密码为空时跳过 AUTH（兼容无需认证的内网 SMTP / 本地调试服务器）
        username=cfg.smtp_user or None,
        password=cfg.smtp_password or None,
        use_tls=False,
        use_ssl=False,
        fail_silently=False,
    )
    if cfg.smtp_port == 465:
        kwargs['use_ssl'] = True
    elif cfg.smtp_port in (587, 25):
        kwargs['use_tls'] = True

    from_email = f'{cfg.sender_name or "验证码"} <{cfg.smtp_user}>'
    msg = EmailMessage(subject, body, from_email, [to_email], connection=get_connection(**kwargs))
    msg.send()


def send_verify_code(email: str, purpose: str) -> None:
    """生成验证码并发送到邮箱。"""
    code = generate_code(email, purpose)
    try:
        send_email(
            subject='【宇涵智能演说】验证码',
            body=(
                f'你的验证码是：{code}\n'
                f'验证码 {CODE_TTL_MINUTES} 分钟内有效，请勿泄露给他人。'
                f'\n（若非本人操作，请忽略本邮件）'
            ),
            to_email=email,
        )
    except Exception:
        # 发送失败则回滚验证码，避免出现无效验证码
        EmailVerifyCode.objects.filter(email=email, code=code, purpose=purpose).delete()
        raise
