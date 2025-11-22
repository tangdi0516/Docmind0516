# ⚡️ Supabase 配置指南

你已经成功将后端升级为使用 Supabase (PostgreSQL)！这意味着你的数据现在将安全地存储在云端数据库中，不会再丢失。

## 🚀 配置步骤

### 1. 获取 Supabase 连接字符串

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard).
2. 创建一个新项目（如果还没有的话）。
3. 进入项目设置：点击左下角的 **Settings (齿轮图标)** -> **Database**.
4. 找到 **Connection String** 部分。
5. 点击 **URI** 标签页。
6. 复制连接字符串。它看起来像这样：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xyz.supabase.co:5432/postgres
   ```
   *注意：你需要用你创建项目时设置的数据库密码替换 `[YOUR-PASSWORD]`。*

### 2. 配置 Railway 环境变量

1. 登录 [Railway Dashboard](https://railway.app/dashboard).
2. 点击你的后端服务 (`docmind0516-production`).
3. 进入 **Variables** 标签页.
4. 添加一个新的环境变量：
   - **Variable Name**: `DATABASE_URL`
   - **Value**: 粘贴你刚才复制的 Supabase 连接字符串

### 3. 重新部署

添加环境变量后，Railway 通常会自动重新部署。如果没有，请手动点击 "Redeploy"。

---

## ✅ 验证配置

部署完成后，系统会自动：
1. 连接到你的 Supabase 数据库。
2. 自动启用 `vector` 扩展（用于 AI 搜索）。
3. 自动创建 `user_settings` 表和 `docmind_vectors` 向量表。

你可以去 Supabase 的 **Table Editor** 查看，应该能看到这些表被创建出来了。

## ❌ 如果遇到问题

- **密码错误**：确保连接字符串里的密码是你创建项目时设置的密码，不要保留方括号 `[]`。
- **网络问题**：Supabase 默认允许所有 IP 连接，但如果你配置了 Network Restrictions，请确保允许 Railway 的 IP（通常建议暂时允许所有 `0.0.0.0/0`）。
- **Transaction Pooler**：如果你使用 Supabase 的 Transaction Pooler (端口 6543)，请确保在连接字符串末尾添加 `?pgbouncer=true`，不过对于我们的应用，直接连接 (端口 5432) 通常更好且支持 Prepared Statements。

---

**现在，去 Railway 配置 `DATABASE_URL` 吧！**
