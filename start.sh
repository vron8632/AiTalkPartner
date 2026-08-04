#!/bin/bash
BASE="/media/oyp/数据/Projects/039_AiCode/AiTalkPartner/karu-speech"

echo "=== 检查后端 (统一服务 API + 前端) ==="
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "✅ 后端已在运行 (PID: $(lsof -ti:8000 | tr '\n' ' '))，跳过启动"
    echo "   本机访问: http://localhost:8000/"
    echo "   管理后台: http://localhost:8000/admin/ (admin/admin123)"
    echo ""
    echo "   如需重启: kill \$(lsof -ti:8000) 后再执行 bash start.sh"
    exit 0
fi

echo "=== 启动后端 ==="
cd "$BASE/backend"
/home/oyp/miniconda3/envs/aitalk/bin/python manage.py collectstatic --noinput > /dev/null 2>&1
nohup /home/oyp/miniconda3/envs/aitalk/bin/python manage.py runserver 0.0.0.0:8000 > /tmp/django.log 2>&1 &
disown
sleep 2

if ! lsof -ti:8000 > /dev/null 2>&1; then
    echo "❌ 后端启动失败，请查看日志: tail -50 /tmp/django.log"
    exit 1
fi
echo "后端 PID: $(lsof -ti:8000)"

echo ""
echo "✅ 已启动"
echo "   本机访问: http://localhost:8000/"
echo "   手机局域网: http://192.168.1.124:8000/"
echo "   管理后台: http://192.168.1.124:8000/admin/ (admin/admin123)"
echo ""
echo "💻 前端开发模式 (热更新):"
echo "   另开终端: npm run dev -- --host 0.0.0.0 (在 frontend 目录)"
echo "   访问: http://localhost:5173/"
