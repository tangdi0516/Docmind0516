# 1. 选择 Python 基础镜像
FROM python:3.10-slim

# 2. 设置容器内部的工作目录
WORKDIR /app

# 3. 将依赖文件复制进去
COPY requirements.txt .

# 4. 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 5. 复制所有应用代码到容器
COPY . .

# 6. 定义容器启动命令：使用 uvicorn 运行 main.py 中的 app 实例
# 容器必须监听 0.0.0.0 和 Cloud Run 默认的 8080 端口
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]