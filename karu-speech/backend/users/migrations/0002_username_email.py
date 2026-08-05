from django.db import migrations, models


def fill_username(apps, schema_editor):
    """将现有用户的 phone 回填为 username，并生成占位 email。"""
    User = apps.get_model('users', 'User')
    for u in User.objects.all().iterator():
        if not u.username:
            u.username = u.phone or f'user_{u.id}'
        if not u.email:
            u.email = f'{u.username}@example.com'
        u.save(update_fields=['username', 'email'])


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='username',
            field=models.CharField(max_length=150, null=True, verbose_name='账号'),
        ),
        migrations.AddField(
            model_name='user',
            name='email',
            field=models.EmailField(blank=True, max_length=254, verbose_name='邮箱'),
        ),
        migrations.AlterField(
            model_name='user',
            name='phone',
            field=models.CharField(blank=True, max_length=20, null=True, unique=True, verbose_name='手机号'),
        ),
        migrations.RunPython(fill_username, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='user',
            name='username',
            field=models.CharField(max_length=150, unique=True, verbose_name='账号'),
        ),
    ]
