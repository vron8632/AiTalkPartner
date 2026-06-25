# 🎙️ AI卡耐基口才陪练

基于卡耐基经典演说理论构建的 AI 口才训练平台，提供 **理论 → 跟读 → 练习 → 评价** 四步学习闭环。

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | Django 5.2 + DRF + SimpleUI |
| 数据库 | MySQL 8.0 |
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS 4 |
| 语音识别 | 百度短语音识别 (ASR) |
| AI 评价 | DeepSeek Chat API |
| 认证 | JWT 手机号一键登录 |

## 功能

- **五阶课程体系** — 从破冰到魅力演说，15 节课循序渐进
- **四步学习法** — 理论学习 → 范例跟读录音 → 自主练习 → AI 五维评分
- **AI 智能评价** — DeepSeek 从自信度、结构、情感、逻辑、语言五个维度评分
- **语音识别** — 百度 ASR 自动将录音转为文字
- **管理后台** — SimpleUI 界面，管理用户/课程/订单/练习记录
- **手机端适配** — 响应式设计，手机 HTTPS 麦克风录制

## 快速开始

```bash
# 1. 启动服务
bash start.sh

# 2. 访问
# 前端: https://localhost:5173/
# 后台: https://localhost:5173/admin/ (admin/admin123)
```

## 项目结构

```
karu-speech/
├── backend/              # Django 后端
│   ├── config/           # Django 配置
│   ├── users/            # 用户 + 认证
│   ├── lessons/          # 课程 + 进度
│   ├── practice/         # 练习记录
│   ├── payment/          # 支付订单
│   └── services/         # ASR / AI 评价服务
└── frontend/             # React 前端
    └── src/
        ├── pages/        # 页面
        ├── components/   # 组件
        ├── hooks/        # 状态管理
        └── lib/          # 工具
```

## 截图

> 首页 | 学习页 | 评价结果页
