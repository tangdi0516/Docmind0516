#!/bin/bash
# Railway 部署前的本地测试脚本

echo "🔍 检查环境变量..."
if [ ! -f .env ]; then
    echo "❌ .env 文件不存在，请从 .env.example 复制并填写 OPENAI_API_KEY"
    exit 1
fi

echo "📦 安装依赖..."
pip install -r requirements.txt

echo "🚀 启动服务器 (按 Ctrl+C 停止)..."
export PORT=8080
uvicorn main:app --host 0.0.0.0 --port $PORT --reload
