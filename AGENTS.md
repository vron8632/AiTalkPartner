# AGENTS.md — 项目开发规则

本项目为「AI宇涵智能口才陪练」(AiTalkPartner)。

## 技术栈（以项目代码为准）

- 前端：React + TypeScript + Vite + TailwindCSS + axios
- 后端：Django 5.2 + Django REST Framework + SimpleUI
- 数据库：MySQL（驱动 **pymysql**，`pymysql.install_as_MySQLdb()`），可视化工具 DBeaver-ce
- API：DRF 书写，符合 RESTful 规范（资源操作用 ViewSet；动作类接口如上传/评价可用自定义端点）
- 认证：**JWT** — djangorestframework-simplejwt（Bearer token，`/api/auth/login|refresh|me/`）
- 用户模块：自定义 `users` app（非 djoser）

## 协作规则

- 默认中文回复，严格按需求输出
- 代码简洁无冗余，无特殊要求不用写测试代码
- 忽略注释问题，不主动生成图片
- 回答精准直接，不泛谈、不使用"你可以"类话术
- 以专业技术标准沟通，直接给出精确答案
