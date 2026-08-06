# AGENTS.md — 项目开发规则

本项目为「言值AI - 智能口才陪练」(AiTalkPartner)。

## 技术栈（以项目代码为准）

- 前端：React + TypeScript + Vite + TailwindCSS + axios
- 后端：Django 5.2 + Django REST Framework + SimpleUI
- 数据库：MySQL（驱动 **pymysql**，`pymysql.install_as_MySQLdb()`），可视化工具 DBeaver-ce
- API：DRF 书写，符合 RESTful 规范（资源操作用 ViewSet；动作类接口如上传/评价可用自定义端点）
- 认证：**JWT** — djangorestframework-simplejwt（Bearer token，`/api/auth/jwt/create|refresh/`）
- 用户模块：**djoser** 完成用户注册登录（账号/密码/邮箱/昵称），`/api/auth/users/` 注册、`/api/auth/users/me/` 当前用户；保留 `/api/auth/login/` 旧手机号登录兼容
- 邮箱验证：**e_mail** 应用 — 邮箱验证码（2分钟有效）注册/登录/改密/找回密码，SMTP 参数存 `e_mail` 表、后台「邮箱配置」管理，接口 `/api/e_mail/send-code|login|change-password|reset-password/`

## 协作规则

- 默认中文回复，严格按需求输出
- 代码简洁无冗余，无特殊要求不用写测试代码
- 忽略注释问题，不主动生成图片
- 回答精准直接，不泛谈、不使用"你可以"类话术
- 以专业技术标准沟通，直接给出精确答案
