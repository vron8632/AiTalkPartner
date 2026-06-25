#!/bin/bash
BASE="/media/oyp/数据/Projects/039_AiCode/AiTalkPartner/karu-speech"

echo "=== 启动后端 (统一服务 API + 前端) ==="
kill $(lsof -ti:8000) 2>/dev/null
cd "$BASE/backend"
/home/oyp/miniconda3/envs/aitalk/bin/python manage.py collectstatic --noinput > /dev/null 2>&1
nohup /home/oyp/miniconda3/envs/aitalk/bin/python manage.py runserver 0.0.0.0:8000 > /tmp/django.log 2>&1 &
disown
sleep 2
echo "后端 PID: $(lsof -ti:8000)"

echo ""
echo "✅ 已启动"
echo "   本机访问: http://localhost:8000/"
echo "   手机局域网: http://192.168.1.124:8000/"
echo "   管理后台: http://192.168.1.124:8000/admin/ (admin/admin123)"
echo ""
echo "📡 内网穿透 (natapp):"
echo "   1. 从 https://natapp.cn 下载 linux_amd64 版本"
echo "   2. 解压放到 /usr/local/bin/natapp"
echo "   3. 运行: bash start_natapp.sh"
echo "   4. 公网访问: http://t3da2ef8.natappfree.cc"
echo ""
echo "💻 前端开发模式 (热更新):"
echo "   另开终端: npm run dev -- --host 0.0.0.0 (在 frontend 目录)"
echo "   访问: http://localhost:5173/"
