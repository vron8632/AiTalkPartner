#!/bin/bash
# ============================================================
# 言值AI - 智能口才陪练 · 宝塔一键部署脚本（适配「网站 → Python 项目」）
#
# 前置：已按教程在宝塔添加 Python 项目（路径指向 backend/，自动创建 venv）
# 本脚本自动完成：装依赖 → import 校验(防假安装) → 建库 → 生成 .env
#                  → migrate → collectstatic → media 授权 → 创建管理员
#
# 用法（在宝塔 SSH 终端，进入部署包解压目录执行）：
#   bash deploy.sh /www/wwwroot/yanzhi/backend
#
# 环境变量（可预先 export）：
#   MYSQL_ROOT_PASSWORD   宝塔 MySQL root 密码（不传则跳过自动建库）
#   DOMAIN                你的域名（写入 .env 的 ALLOWED_HOSTS）
#   DB_NAME / DB_USER / DB_PASSWORD   默认 karu_speech / yanzhi / 随机
# ============================================================
set -e

BACKEND_DIR="${1:-/www/wwwroot/yanzhi/backend}"
DOMAIN="${DOMAIN:-}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-}"
DB_NAME="${DB_NAME:-karu_speech}"
DB_USER="${DB_USER:-yanzhi}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -hex 8)}"
VENV_DIR="$BACKEND_DIR/venv"

if [ ! -f "$BACKEND_DIR/manage.py" ]; then
  echo "❌ 未找到 $BACKEND_DIR/manage.py"
  echo "   请检查路径是否为后端代码目录（含 manage.py 的那一层）"
  exit 1
fi
if [ ! -d "$VENV_DIR" ]; then
  echo "❌ 未找到虚拟环境 $VENV_DIR"
  echo "   请先在宝塔「网站 → Python 项目」添加项目："
  echo "     项目路径: $BACKEND_DIR"
  echo "     Python版本: 3.11.4 | 启动方式: Gunicorn | 端口: 8000"
  echo "   添加后宝塔会自动创建 venv，再重新运行本脚本"
  exit 1
fi

PY="$VENV_DIR/bin/python"
echo "======================================"
echo "言值AI 部署开始（宝塔 Python 项目）"
echo "  后端目录: $BACKEND_DIR"
echo "======================================"

# ---------- 1. 安装依赖 + import 校验 ----------
echo "[1/6] 安装 Python 依赖 ..."
"$PY" -m pip install -q --upgrade pip
"$PY" -m pip install -q -r "$BACKEND_DIR/requirements.txt"
if "$PY" -c "import pymysql, rest_framework, rest_framework_simplejwt, djoser" 2>/dev/null; then
  echo "[1/6] ✅ 依赖安装完成，import 校验通过（防假安装）"
else
  echo "❌ 模块 import 失败，请查看上方报错（可能是 pip 装到了系统 python，确认使用 $PY）"
  exit 1
fi

# ---------- 2. 自动建库建用户 ----------
if [ -n "$MYSQL_ROOT_PASSWORD" ]; then
  echo "[2/6] 创建数据库 $DB_NAME / 用户 $DB_USER ..."
  mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "
    CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
    GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
    FLUSH PRIVILEGES;
  "
  echo "[2/6] ✅ 数据库创建完成（若需导入数据，见教程第一步的 phpMyAdmin 导入）"
else
  echo "[2/6] ⏭️  未提供 MYSQL_ROOT_PASSWORD，跳过自动建库（请用 phpMyAdmin 手动创建 $DB_NAME，字符集 utf8mb4_general_ci）"
fi

# ---------- 3. 生成 .env ----------
ENV_FILE="$BACKEND_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "[3/6] 生成 .env 配置文件 ..."
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
  echo "[3/6] ✅ 已生成 $ENV_FILE（请补充 DEEPSEEK_API_KEY / BAIDU_* 后重启项目）"
  echo "       若手动建库，请把 DB_PASSWORD 改成实际密码"
else
  echo "[3/6] ⏭️  .env 已存在，保留不动"
fi

# ---------- 4. 迁移 ----------
echo "[4/6] 执行数据库迁移 ..."
cd "$BACKEND_DIR"
"$PY" manage.py migrate --noinput
echo "[4/6] ✅ 迁移完成"

# ---------- 5. 静态文件 + 媒体目录 ----------
echo "[5/6] 收集静态文件 ..."
"$PY" manage.py collectstatic --noinput
mkdir -p "$BACKEND_DIR/media/avatars" "$BACKEND_DIR/media/audio"
chown -R www:www "$BACKEND_DIR/media" 2>/dev/null || true
echo "[5/6] ✅ 静态文件与媒体目录就绪"

# ---------- 6. 创建管理员 ----------
echo "[6/6] 创建后台管理员（输入账号/邮箱/密码）..."
if [ -t 0 ]; then
  "$PY" manage.py createsuperuser
else
  echo "    ⏭️  非交互模式跳过，请稍后手动执行: $PY manage.py createsuperuser"
fi
echo "[6/6] ✅"

echo ""
echo "======================================"
echo "✅ 部署完成！接下来："
echo "   1. 宝塔 → 网站 → 添加站点(域名) → 申请 SSL 证书"
echo "   2. 站点设置 → 配置文件 → 粘贴 nginx.conf 模板（替换域名为你的）"
echo "   3. 宝塔 → Python 项目 → yanzhi → 重启"
echo "   4. 访问 https://你的域名/ 进入前台，/admin/ 进后台"
echo "======================================"
