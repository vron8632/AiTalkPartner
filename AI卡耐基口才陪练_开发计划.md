# AI卡耐基口才陪练 — 开发计划

## 技术栈

| 层 | 技术 |
|--|------|
| 后端 | Django 5.2 + Django REST Framework + SimpleUI |
| 数据库 | MySQL 8.0 |
| 认证 | JWT (手机号一键登录) |
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS 4 |
| 语音 | Web Audio API → 百度ASR → DeepSeek AI评价 |

## API 接口

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 认证 | POST | /api/auth/login/ | 手机号一键登录 |
| 认证 | POST | /api/auth/refresh/ | 刷新JWT |
| 认证 | GET | /api/auth/me/ | 获取当前用户 |
| 课程 | GET | /api/lessons/ | 课程列表 |
| 课程 | GET | /api/lessons/{id}/ | 课程详情 |
| 课程 | GET | /api/lessons/progress/ | 课程+用户进度 |
| 课程 | POST | /api/lessons/{id}/complete/ | 完成课程 |
| 练习 | POST | /api/practice/upload/ | 上传录音 |
| 练习 | POST | /api/practice/evaluate/{id}/ | ASR+AI评价 |
| 练习 | GET/POST | /api/practice/records/ | 练习记录CRUD |
| 支付 | GET/POST | /api/payment/orders/ | 订单管理 |

## 功能模块（按优先级）

### Phase 1 — 核心闭环 ✅
- [x] 项目初始化 (Django + DRF + SimpleUI + MySQL)
- [x] 用户认证 (手机号一键登录 + JWT)
- [x] 课程体系 (15课 + 五阶递进 + 免费/付费)
- [x] 用户进度系统 (锁定/解锁/完成)
- [x] 管理后台 (SimpleUI全模型管理)
- [x] HTTPS + 局域网手机访问

### Phase 2 — 练习流程 ✅
- [x] 录音上传 + 回听播放
- [x] 百度语音识别 (ASR) — 自动转文字
- [x] DeepSeek AI 评价 (五维评分 + 优缺点 + 建议)
- [x] 评价结果页 (评分条 + 评语 + 改进建议)
- [x] 完整闭环：登录→选课→录音→ASR→评价→看结果

### Phase 2.5 — 学习体验优化（当前开发中）
- [ ] 课程四步学习法：理论讲解 → 范例跟读 → 自主练习 → AI评价
- [ ] 情绪开关（练习前破冰动画 + 练习中能量条 + 练习后成就确认）
- [ ] 15课理论内容 + 范例文本填充

### Phase 3 — 增值功能
- [ ] 支付体系 (支付宝扫码付)
- [ ] 会员权限校验 (付费课程拦截)
- [ ] 个人中心 (练习历史/趋势图/打卡日历/成就徽章)
- [ ] 语音特征分析 (语速/音量/填充词检测)
- [ ] 课程内容继续填充 + Prompt 精调
- [ ] 真实短信服务接入

## 学习流程设计

每节课的四步学习法：

```
📖 理论学习  →  🎧 范例跟读  →  🎤 自主练习  →  🤖 AI评价
 卡耐基方法论   模仿标准表达     自由录音表达     五维度评分反馈
```

## 启动命令

```bash
bash start.sh   # 一键启动前后端
```

- 前端: https://localhost:5173/
- 管理后台: https://localhost:5173/admin/ (admin/admin123)
