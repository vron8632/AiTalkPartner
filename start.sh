#!/bin/bash
BASE="/media/oyp/数据/Projects/039_AiCode/AiTalkPartner/karu-speech"

echo "=== 启动后端 ==="
kill $(lsof -ti:8000) 2>/dev/null
nohup /home/oyp/miniconda3/envs/aitalk/bin/python "$BASE/backend/manage.py" runserver 0.0.0.0:8000 > /tmp/django.log 2>&1 &
disown
sleep 2
echo "后端 PID: $(lsof -ti:8000)"

echo "=== 启动前端 ==="
kill $(lsof -ti:5173) 2>/dev/null
cd "$BASE/frontend"
nohup npm run dev -- --host 0.0.0.0 > /tmp/vite.log 2>&1 &
disown
sleep 4
echo "前端 PID: $(lsof -ti:5173)"

echo ""
echo "✅ 已启动"
echo "   电脑访问: https://localhost:5173/"
echo "   手机访问: https://192.168.1.124:5173/"
echo "   管理后台: https://192.168.1.124:5173/admin/ (admin/admin123)"
echo ""
echo "   ⚠️ 手机第一次访问会有安全警告"
echo "      浏览器点「高级 → 继续前往」即可"
