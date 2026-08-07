#!/bin/bash
# ============================================================
# 言值AI - 智能口才陪练 · 宝塔面板一键部署脚本
#
# 功能：自动建库建用户 → 安装依赖 → 生成 .env → 迁移 →
#       collectstatic → 生成 gunicorn systemd 服务 → 生成 Nginx 配置模板
#
# 用法：
#   bash deploy.sh [后端代码目录] [域名]
#   例: bash deploy.sh /www/wwwroot/yanzhi/backend www.example.com
#
# 环境变量（可预先 export）：
#   MYSQL_ROOT_PASSWORD   宝塔 MySQL root 密码（建库必需）
#   DB_NAME               数据库名   (默认 karu_speech)
#   DB_USER               数据库用户 (默认 yanzhi)
#   DB_PASSWORD           数据库密码 (默认自动生成随机)
# ============================================================
set -e

# ---------- 配置 ----------
BACKEND_DIR="${1:-/www/wwwroot/yanzhi/backend}"
DOMAIN="${2:-}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-}"
DB_NAME="${DB_NAME:-karu_speech}"
DB_USER="${DB_USER:-yanzhi}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -hex 8)}"
VENV_DIR="$BACKEND_DIR/venv"

if [ ! -f "$BACKEND_DIR/manage.py" ]; then
  echo "❌ 未找到 $BACKEND_DIR/manage.py，请传入正确的后端代码目录"
  exit 1
fi
if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
  echo "⚠️  未设置 MYSQL_ROOT_PASSWORD，跳过自动建库（请手动创建库 $DB_NAME 或重跑时传入密码）"
fi

echo "======================================"
echo "言值AI 部署开始"
echo "  后端目录: $BACKEND_DIR"
echo "  数据库:   $DB_NAME / 用户 $DB_USER"
echo "======================================"

# ---------- 1. Python 虚拟环境 ----------
cd "$BACKEND_DIR"
if [ ! -d "$VENV_DIR" ]; then
  echo "[1/6] 创建虚拟环境 venv ..."
  python3 -m venv "$VENV_DIR"
fi
PY="$VENV_DIR/bin/python"
"$PY" -m pip install -q --upgrade pip
echo "[1/6] ✅ 虚拟环境就绪"

# ---------- 2. 安装依赖 ----------
echo "[2/6] 安装 Python 依赖 (requirements.txt + gunicorn) ..."
"$PY" -m pip install -q -r requirements.txt gunicorn
echo "[2/6] ✅ 依赖安装完成"

# ---------- 3. 自动建库建用户 ----------
if [ -n "$MYSQL_ROOT_PASSWORD" ]; then
  echo "[3/6] 创建数据库 $DB_NAME / 用户 $DB_USER ..."
  mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "
    CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
    GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
    FLUSH PRIVILEGES;
  "
  echo "[3/6] ✅ 数据库创建完成"
else
  echo "[3/6] ⏭️  跳过建库（未提供 MYSQL_ROOT_PASSWORD）"
fi

# ---------- 4. 生成 .env（已存在则跳过） ----------
ENV_FILE="$BACKEND_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "[4/6] 生成 .env 配置文件 ..."
  SECRET_KEY=$("$PY" -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
  cat > "$ENV_FILE" <<EOF
DJANGO_SECRET_KEY=$SECRET_KEY
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=${DOMAIN:-localhost}

DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_HOST=localhost
DB_PORT=3306

DEEPSEEK_API_KEY=
BAIDU_APP_ID=
BAIDU_API_KEY=
BAIDU_SECRET_KEY=
EOF
  echo "[4/6] ✅ 已生成 $ENV_FILE （请补充 DEEPSEEK_API_KEY / BAIDU_* 后重启服务）"
else
  echo "[4/6] ⏭️  .env 已存在，保留不动（如需更新请手动编辑 $ENV_FILE）"
fi

# ---------- 5. 迁移 + collectstatic ----------
echo "[5/6] 执行数据库迁移 ..."
"$PY" manage.py migrate --noinput
echo "[5/6] 收集静态文件 ..."
"$PY" manage.py collectstatic --noinput
# 媒体目录（头像/录音）与权限
mkdir -p "$BACKEND_DIR/media/avatars" "$BACKEND_DIR/media/audio"
chown -R www:www "$BACKEND_DIR/media" 2>/dev/null || true
echo "[5/6] ✅ 迁移与静态文件完成"

# ---------- 6. gunicorn systemd 服务 ----------
echo "[6/6] 生成 systemd 服务 /etc/systemd/system/yanzhi.service ..."
cat > /etc/systemd/system/yanzhi.service <<EOF
[Unit]
Description=言值AI Django (gunicorn)
After=network.target

[Service]
Type=simple
User=www
Group=www
WorkingDirectory=$BACKEND_DIR
# .env 由 Django settings 自动加载，无需 EnvironmentFile
ExecStart=$VENV_DIR/bin/gunicorn config.wsgi:application -b 127.0.0.1:8000 -w 2 --timeout 180
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable yanzhi
systemctl restart yanzhi
sleep 2
if systemctl is-active --quiet yanzhi; then
  echo "[6/6] ✅ 服务已启动 (systemctl status yanzhi 查看状态)"
else
  echo "❌ 服务启动失败，查看日志: journalctl -u yanzhi -n 50"
  exit 1
fi

# ---------- Nginx 配置模板 ----------
NGINX_CONF="$BACKEND_DIR/nginx.conf"
if [ -n "$DOMAIN" ]; then
  cat > "$NGINX_CONF" <<EOF
# 宝塔站点配置（站点设置 → 配置文件 中粘贴，需先申请 SSL 证书）
server {
    listen 80;
    server_name $DOMAIN;
    client_max_body_size 50m;   # 录音上传，必须调大

    # 媒体/静态文件直出（更快）
    location /media/  { alias $BACKEND_DIR/media/; }
    location /static/ { alias $BACKEND_DIR/staticfiles/; }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300;   # AI 评价耗时较长，防 502
    }
}
EOF
  echo "📄 Nginx 配置模板已生成: $NGINX_CONF"
  echo "   请到宝塔 → 网站 → 添加站点($DOMAIN) → 配置文件中粘贴该模板"
  echo "   ⚠️ 录音功能需要 HTTPS：申请 Let's Encrypt 证书并开启强制 HTTPS"
fi

echo ""
echo "======================================"
echo "✅ 部署完成！"
echo "   .env 路径:   $ENV_FILE"
echo "   gunicorn:    systemctl status yanzhi"
echo "   Nginx 模板:  $NGINX_CONF (如配置了域名)"
echo "   后台管理:    http://$DOMAIN/admin/  (先用 manage.py createsuperuser 创建管理员)"
echo "======================================"
