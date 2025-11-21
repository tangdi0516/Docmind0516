# 🚂 Railway 持久化存储配置指南

## 问题说明

目前你的数据（PDF 文件、向量数据库、用户设置）存储在容器的文件系统中。每次推送新代码到 Git 时，Railway 会重新构建并部署一个全新的容器，导致所有数据丢失。

## 解决方案：配置 Railway Volumes

Railway Volumes 是持久化存储卷，即使容器重新部署，数据也会保留。

### 📋 配置步骤

#### 1. 登录 Railway Dashboard
访问：https://railway.app/dashboard

#### 2. 选择你的 DocMind 项目
找到并点击你的后端服务（`docmind0516-production`）

#### 3. 创建 Volume
1. 点击 **"Settings"** 标签
2. 滚动到 **"Volumes"** 部分
3. 点击 **"+ New Volume"**

#### 4. 配置 Volume 参数
创建一个 Volume 并设置以下参数：

**Volume 1: 数据存储**
- **Mount Path**: `/app/data`
- **Name**: `docmind-data`

点击 **"Add"** 保存。

#### 5. 更新代码以使用持久化路径

我已经为你准备好了更新后的代码，你只需要：

1. **推送更新后的代码**（我会帮你完成）
2. **在 Railway 中配置 Volume**（按照上面的步骤）
3. **重新部署**

### 📁 数据存储结构

配置完成后，所有数据将存储在 `/app/data/` 目录下：

```
/app/data/
├── chroma_db/          # ChromaDB 向量数据库
├── uploads/            # 上传的 PDF 文件
└── user_data.json      # 用户设置和配置
```

### ✅ 验证配置

配置完成后，你可以：

1. 上传一个测试 PDF 文件
2. 推送一次代码更新
3. 检查数据是否还在

### 🔒 重要提示

- **Volume 是按使用量计费的**，但通常很便宜（几 GB 的数据每月只需几美分）
- **数据会在 Volume 中永久保存**，除非你手动删除
- **每次部署时，容器会自动挂载这个 Volume**

### 🆘 如果遇到问题

1. 确保 Mount Path 设置为 `/app/data`
2. 确保 Volume 已经成功创建并绑定到服务
3. 检查 Railway 的日志，确认应用启动时能访问 `/app/data` 目录

---

**下一步**：我现在会更新代码，将所有数据路径指向 `/app/data/`，然后你只需要在 Railway Dashboard 中配置 Volume 即可。
