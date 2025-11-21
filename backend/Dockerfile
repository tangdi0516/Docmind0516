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

# 6. 给启动脚本执行权限
RUN chmod +x start.sh

# 7. 使用启动脚本来正确处理 PORT 环境变量
CMD ["./start.sh"]