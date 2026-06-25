#!/bin/bash
# 启动 natapp 内网穿透
# 先确保 start.sh 已经运行（后端在 8000 端口运行）

# 用法：确保 natapp 已经在系统 PATH 中
# 下载地址：https://natapp.cn/  -> 下载 Linux 64位 版本

# 检查 natapp 是否存在
NATAPP=$(which natapp 2>/dev/null || echo "/usr/local/bin/natapp")
if [ ! -f "$NATAPP" ]; then
    echo "❌ 未找到 natapp，请先下载:"
    echo "   https://natapp.cn/ -> 下载 linux_amd64 版本"
    echo "   解压后放到 /usr/local/bin/natapp"
    exit 1
fi

# 检查后端是否运行
curl -s -o /dev/null http://localhost:8000/ || {
    echo "❌ 后端未运行，请先执行 start.sh"
    exit 1
}

echo "=== 启动 natapp 隧道 ==="
echo "   本地端口: 8000"
echo "   公网地址: http://t3da2ef8.natappfree.cc"
echo ""
$NATAPP -config=natapp_config.ini
