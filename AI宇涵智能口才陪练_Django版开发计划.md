# AI卡耐基口才陪练 — Django + DRF + MySQL 开发计划

## 一、项目结构

```
karu-speech/
├── backend/                        # Django 后端
│   ├── config/                     # Django 配置
│   │   ├── settings.py             # 配置（MySQL/SimpleUI/DRF/JWT）
│   │   ├── urls.py                 # 全局路由
│   │   └── wsgi.py
│   ├── users/                      # 用户模块
│   │   ├── models.py               # User / SmsCode
│   │   ├── admin.py                # SimpleUI 管理后台
│   │   ├── serializers.py          # DRF 序列化
│   │   ├── views.py                # DRF ViewSet
│   │   ├── urls.py                 # API 路由
│   │   └── urls_auth.py            # JWT 登录路由
│   ├── lessons/                    # 课程模块
│   │   ├── models.py               # Lesson / UserProgress
│   │   ├── admin.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── practice/                   # 练习模块
│   │   ├── models.py               # PracticeRecord
│   │   ├── admin.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── payment/                    # 支付模块
│   │   ├── models.py               # PaymentOrder
│   │   ├── admin.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── services/                   # 服务层（后续）
│   │   ├── asr.py                  # 语音识别
│   │   ├── evaluate.py             # AI 评价引擎
│   │   ├── sms.py                  # 短信服务
│   │   └── payment.py              # 支付封装
│   ├── manage.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/                       # React 前端
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx        # 首页/课程总览
│   │   │   ├── LoginPage.tsx       # 手机号登录
│   │   │   ├── PracticePage.tsx    # 练习页（核心）
│   │   │   ├── ResultPage.tsx      # 评价结果页
│   │   │   ├── ProfilePage.tsx     # 个人中心
│   │   │   └── PaymentPage.tsx     # 支付/订阅页
│   │   ├── components/
│   │   │   ├── AudioRecorder.tsx   # 录音组件
│   │   │   ├── EmotionActivator.tsx # 情绪开关
│   │   │   ├── ScoreRadar.tsx      # 雷达图
│   │   │   ├── CourseTree.tsx      # 课程树
│   │   │   ├── FeedbackCard.tsx    # 反馈卡片
│   │   │   ├── PaymentQR.tsx       # 支付二维码
│   │   │   └── Layout.tsx          # 响应式布局壳
│   │   ├── hooks/
│   │   │   ├── useAuth.ts          # 认证状态hook
│   │   │   ├── useAudio.ts         # 录音逻辑hook
│   │   │   └── useApi.ts           # 统一API请求
│   │   ├── lib/
│   │   │   ├── api.ts              # axios封装+JWT拦截
│   │   │   └── constants.ts        # 课程数据/配置
│   │   └── App.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
└── docs/
    ├── prompt-templates.md
    └── api-reference.md
```

---

## 二、数据库表设计（MySQL 8.0）

### 2.1 users 用户表

```sql
CREATE TABLE users_user (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone         VARCHAR(11)  NOT NULL UNIQUE,
  password      VARCHAR(255),
  nickname      VARCHAR(50),
  avatar_url    VARCHAR(255),
  is_member     TINYINT      DEFAULT 0 COMMENT '0=免费 1=会员',
  member_expire DATETIME     COMMENT '会员到期时间',
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2.2 sms_codes 验证码表

```sql
CREATE TABLE users_smscode (
  id         BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone      VARCHAR(11)  NOT NULL,
  code       VARCHAR(6)   NOT NULL,
  used       TINYINT      DEFAULT 0,
  expires_at DATETIME     NOT NULL,
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone_code (phone, used)
);
```

### 2.3 lessons 课程表

```sql
CREATE TABLE lessons_lesson (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  level_id      INT           NOT NULL COMMENT '1-5阶',
  lesson_id     INT           NOT NULL COMMENT '课程序号',
  title         VARCHAR(100)  NOT NULL,
  description   TEXT,
  prompt_key    VARCHAR(50)   NOT NULL COMMENT '对应的AI Prompt模板名',
  exercise_type VARCHAR(30)   NOT NULL COMMENT 'speech|impromptu|story|debate',
  duration_goal INT           DEFAULT 60 COMMENT '目标练习时长(秒)',
  is_free       TINYINT       DEFAULT 1 COMMENT '0=付费 1=免费',
  sort_order    INT           DEFAULT 0,
  UNIQUE KEY uk_level_lesson (level_id, lesson_id)
);
```

### 2.4 user_progress 用户进度表

```sql
CREATE TABLE lessons_userprogress (
  id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id      BIGINT        NOT NULL,
  lesson_id    INT           NOT NULL,
  status       VARCHAR(20)   DEFAULT 'locked' COMMENT 'locked|unlocked|completed',
  best_score   DECIMAL(5,1),
  completed_at DATETIME,
  UNIQUE KEY uk_user_lesson (user_id, lesson_id),
  FOREIGN KEY (user_id) REFERENCES users_user(id)
);
```

### 2.5 practice_records 练习记录表

```sql
CREATE TABLE practice_practicerecord (
  id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id      BIGINT        NOT NULL,
  lesson_id    INT           NOT NULL,
  audio_url    TEXT,
  transcript   TEXT,
  scores       JSON          COMMENT '{"confidence":85,"structure":72,...}',
  feedback     JSON          COMMENT '{"strengths":[],"improvements":[],"summary":"","tips":[]}',
  duration_sec INT           DEFAULT 0,
  created_at   DATETIME      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users_user(id)
);
```

### 2.6 payment_orders 支付订单表

```sql
CREATE TABLE payment_paymentorder (
  id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id      BIGINT        NOT NULL,
  order_no     VARCHAR(32)   NOT NULL UNIQUE,
  plan_type    VARCHAR(20)   NOT NULL COMMENT 'monthly|quarterly|yearly',
  amount_cents INT           NOT NULL COMMENT '金额(分)',
  status       VARCHAR(20)   DEFAULT 'pending' COMMENT 'pending|paid|expired|refunded',
  channel      VARCHAR(20)   COMMENT 'alipay|wxpay',
  trade_no     VARCHAR(64)   COMMENT '支付平台交易号',
  paid_at      DATETIME,
  created_at   DATETIME      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users_user(id)
);
```

---

## 三、课程体系设计（卡耐基五阶）

### 3.1 五阶递进结构

| 阶段 | 主题 | 核心目标 | 练习形式 | 评价重点 |
|------|------|---------|---------|---------|
| **L1 破冰** | 克服恐惧，建立自信 | 敢开口说60秒 | 自我介绍/最骄傲的事 | 时长、完整性 |
| **L2 结构** | 黄金三段论 | 有逻辑地表达3分钟 | 观点阐述/产品介绍 | 开头-主体-结尾 |
| **L3 情感** | 故事力与感染力 | 用故事打动听众 | 个人故事/案例分享 | 情感表达、画面感 |
| **L4 说服** | 观点植入与即兴 | 临场发挥+说服力 | 即兴演讲/辩论模拟 | 逻辑、说服力 |
| **L5 魅力** | 综合进阶与应用 | 5分钟魅力演讲 | 完整演讲/综合演练 | 综合评分 |

### 3.2 情绪开关设计

每次练习前、中、后插入情绪开关操作：

| 阶段 | 情绪开关 | 交互设计 |
|------|---------|---------|
| 练习前 | **破冰三分钟**：深呼吸 × 3 + 身体打开 + 正向暗示 | 引导动画 + 逐步确认 |
| 练习中 | **能量条**：实时显示音量/语速/投入度 | 动态进度条 + 颜色渐变 |
| 练习后 | **成就确认**：识别进步点，正向反馈先行 | 祝贺动画 + 进步标记 |

---

## 四、API 接口设计

### 4.1 认证模块 `/api/auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login/` | 用户名密码登录 -> 返回JWT |
| POST | `/api/auth/refresh/` | 刷新Token |

### 4.2 课程模块 `/api/lessons`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/lessons/` | 获取课程列表 |
| GET | `/api/lessons/{id}/` | 获取单课详情 |

### 4.3 练习模块 `/api/practice`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/practice/records/` | 获取练习历史 |
| POST | `/api/practice/records/` | 创建练习记录 |
| GET | `/api/practice/records/{id}/` | 获取单次详情 |

### 4.4 支付模块 `/api/payment`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/payment/plans/` | 获取订阅套餐 |
| POST | `/api/payment/orders/` | 创建支付订单 |
| GET | `/api/payment/orders/{id}/` | 查询订单状态 |

---

## 五、管理后台（SimpleUI）

后台地址：`/admin/`

| 模块 | 管理功能 |
|------|---------|
| 用户管理 | 查看/搜索用户、会员状态管理 |
| 验证码 | 查看短信验证码记录 |
| 课程管理 | 增删改查课程、设置免费/付费、排序 |
| 用户进度 | 查看各用户的学习进度、解锁/完成状态 |
| 练习记录 | 查看所有练习记录、评分数据 |
| 支付订单 | 查看订单状态、手动处理退款 |

SimpleUI 特性：
- 现代化中文界面
- 可折叠菜单
- 主体/菜单/标签页等多级主题定制
- 首页信息面板配置

---

## 六、响应式布局方案

### 6.1 断点策略（Tailwind默认）

| 断点 | 宽度 | 目标设备 |
|------|------|---------|
| 默认 | < 768px | 手机竖屏 |
| `md` | >= 768px | 平板 / 手机横屏 |
| `lg` | >= 1024px | PC笔记本 |
| `xl` | >= 1280px | 大屏PC |

### 6.2 关键页面的响应式布局同上

---

## 七、AI评价Prompt模板

（同原 FastAPI 版，内容不变）

---

## 八、15天开发计划

| 天 | 后端任务 | 前端任务 | 今日可验证成果 |
|----|---------|---------|--------------|
| **D1** | Django项目初始化 + SimpleUI + MySQL建表 + DRF API骨架 + Admin后台 + 课程数据种子 | Vite初始化 + Tailwind + 路由搭建 + Layout组件 | `localhost:5173` 看到首页框架，`localhost:8000/admin/` 看到SimpleUI后台 |
| **D2** | JWT登录API + 用户注册接口 | 登录页（手机号输入 -> 验证码 -> 登录） | 登录成功，跳转首页 |
| **D3** | 课程列表API + 用户进度联表查询 | 首页课程树 + 关卡锁定/解锁 + useAuth | 登录后看到五阶课程 |
| **D4** | 录音文件上传接口 | 录音组件（权限申请 -> 录音 -> 上传） | 录音 -> 上传进度 |
| **D5** | ASR服务层（阿里云/Whisper） | 录音后自动转录，显示文字 | 录音完成 -> 文字上屏 |
| **D6** | AI评价引擎（DeepSeek API）+ 评价接口 | 提交按钮 -> 跳转结果页 | 看到5维度评分 |
| **D7** | 练习记录CRUD | 结果展示页（雷达图+反馈卡片） + 情绪开关 | **跑通完整闭环** |
| **D8** | 进度更新接口 | 情绪开关优化 | 完成练习后下一关解锁 |
| **D9** | 会员/免费课程权限校验 | 支付套餐页 + 二维码 | 付费课程 -> 支付页面 |
| **D10** | 支付宝扫码付接入 | 支付状态轮询 + 成功动画 | 扫码支付 -> 课程解锁 |
| **D11** | 语音特征分析 | 评价维度增加语音指标 | 雷达图5维变7维 |
| **D12** | 个人中心API | 个人主页（历史/趋势/徽章） | 练习趋势图 |
| **D13** | 响应式适配 + 错误处理 | 移动端微调 + 各状态处理 | 手机和PC都流畅 |
| **D14** | 20课内容入库 + Prompt精调 | 课程内容逐关填充 | 完整课表可练 |
| **D15** | 修bug + 性能优化 | 修bug + 响应式测试 | 全部功能跑通 |

---

## 九、关键依赖清单

### backend/requirements.txt

```
django==5.2
djangorestframework==3.17
djangorestframework-simplejwt==5.5
django-simpleui==2026.1
django-cors-headers==4.9
pymysql==1.1.1
```

### frontend/package.json 关键依赖

同原 FastAPI 版

---

## 十、Django 管理后台截图指引

1. 启动后端：`python manage.py runserver`
2. 访问 `http://localhost:8000/admin/`
3. 登录凭据：`admin` / `admin123`
4. 在SimpleUI管理后台中可管理用户、课程、练习记录、支付订单

---

## 十一、避坑指南

| 问题 | 预防方案 |
|------|---------|
| MySQL 连接失败 | 检查 .env 配置，确保 MySQL 服务运行 |
| 录音格式兼容性 | 前端统一转 webm，后端用 ffmpeg 转 mp3 |
| JWT过期无声失效 | axios拦截器处理 401 -> 自动跳登录页 |
| ASR中文识别不准 | 阿里云实时识别对普通话>95% |
| LLM返回非JSON | Prompt最后强调"只返回JSON"，代码加异常重试 |
| 录音权限被拒绝 | 前端catch error，给友好的引导提示 |

---

## 十二、启动命令

```bash
# 后端
cd karu-speech/backend
conda activate aitalk
python manage.py runserver 0.0.0.0:8000

# 前端
cd karu-speech/frontend
npm run dev -- --host 0.0.0.0
```
