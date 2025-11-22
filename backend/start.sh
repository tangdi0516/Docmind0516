#!/bin/bash
# Railway 启动脚本 - 正确处理 PORT 环境变量

# Railway 会注入 PORT 环境变量，如果没有则使用 8080
PORT=${PORT:-8080}

echo "Installing Playwright browsers..."
playwright install chromium --with-deps || echo "Warning: Playwright browser installation failed, crawler may not work for protected sites"

echo "🚀 Starting uvicorn on port $PORT..."
uvicorn main:app --host 0.0.0.0 --port $PORT
