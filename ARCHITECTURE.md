# Cards项目架构设计文档

> 创建日期：2026-04-20
> 文档版本：v1.0
> 性质：讨论方案完整记录

---

## 一、项目背景与目标

### 1.1 为什么要创建Cards项目

**核心问题**：Boss项目的cards功能正在进行大规模重构（30个Skill），需要在不干扰现有生产环境的情况下进行开发和测试。

**解决方案**：创建完全独立的cards项目（cards.mrwhalex.com），作为Skill/卡片的开发和测试环境。

### 1.2 项目目标

- **独立开发**：在独立环境中开发所有30个Skill
- **零风险**：测试项目完全不干扰boss生产环境
- **平滑迁移**：测试完成后，Skill代码可直接迁移到boss项目
- **统一架构**：所有Skill采用相同的架构标准

---

## 二、核心架构决策

### 2.1 后端策略：完全复用现有后端

**决策**：Cards项目只建前端，后端完全复用chatapi.mrwhalex.com

**理由**：
1. 现有后端已具备完整的Skill支持能力
2. 数据库已经是按tenant隔离的，无需新建
3. 认证体系（JWT）可以直接复用
4. 减少维护成本，避免数据同步问题

**复用的后端API**：

| API端点 | 用途 | 说明 |
|---------|------|------|
| `POST /api/admin/boss/chat` | Skill对话接口 | 传入scenario_id触发对应Skill |
| `/api/cards/competitor-intel/*` | 竞品情报员API | 已存在的复杂Skill示例 |
| `/api/cards/{skill-id}/*` | 其他复杂Skill | 需要时新增 |
| `/api/admin/boss/platform-config` | 平台配置 | 打赏/推广等配置 |

### 2.2 数据存储策略：复用现有D1数据库

**决策**：所有Skill数据存储在现有D1数据库中

**理由**：
1. 现有数据库已经是多租户架构（按tenant_id隔离）
2. 锦囊系统需要分析cards的使用数据，共享数据库可以无缝获取
3. 无需考虑数据同步问题

**数据表规划**：

| Skill | 数据表 | 说明 |
|-------|--------|------|
| 竞品情报员 | `competitor_monitors`, `competitor_alerts` | 已存在 |
| 合同审查官 | `contract_reviews`, `contract_clauses` | 待创建 |
| 财务报表分析师 | `financial_reports`, `financial_metrics` | 待创建 |
| 其他Skill | 按需创建 | 每个复杂Skill独立表 |

### 2.3 认证策略：复用Boss认证体系

**决策**：使用boss_token进行认证

**实现方式**：
1. Cards项目读取localStorage中的`boss_token`
2. 所有API请求携带`Authorization: Bearer {token}`
3. 后端自动解析token获取tenant_id和admin_id

**跨域处理**：
- 前端域名：cards.mrwhalex.com
- 后端域名：chatapi.mrwhalex.com
- 需要配置CORS允许cards.mrwhalex.com访问

### 2.4 Skill分类：所有Skill都是复杂Skill

**重要决策**：30个Skill全部采用复杂Skill架构，没有简单Skill

**理由**：
1. 根据Skill开发路线图，每个Skill都要"做深做硬"
2. 每个Skill都需要独立的交互界面
3. 每个Skill都可能需要数据持久化

**复杂Skill标准架构**：
```
skills/{skill-id}/
├── index.html      # 页面入口
├── style.css       # 独立样式
├── app.js          # 业务逻辑
└── components/     # 可复用组件（可选）
```

---

## 三、项目目录结构

```
cards/                          # Cards项目根目录
├── ARCHITECTURE.md             # 本文档：架构设计记录
├── index.html                  # 首页：展示所有30个Skill
├── wrangler.toml               # Cloudflare Pages部署配置
├── css/
│   ├── cards.css              # 全局样式
│   └── variables.css          # CSS变量定义
├── js/
│   ├── api.js                 # API调用层（复用chatapi）
│   ├── auth.js                # 认证相关
│   ├── router.js              # 前端路由
│   └── utils.js               # 工具函数
└── skills/                     # 30个Skill目录
    ├── data-analysis/          # 数据智查（已存在，复制改造）
    │   ├── index.html
    │   ├── style.css
    │   └── app.js
    ├── competitor-intel/       # 竞品情报员（已存在）
    │   ├── index.html
    │   ├── style.css
    │   └── app.js
    ├── contract-review/        # 合同审查官（待开发）
    │   ├── index.html
    │   ├── style.css
    │   └── app.js
    ├── financial-analyst/      # 财务报表分析师（待开发）
    │   ├── index.html
    │   ├── style.css
    │   └── app.js
    └── ...                     # 其他26个Skill
```

---

## 四、技术规范

### 4.1 前端技术栈

- **框架**：纯Vanilla JS（不引入React/Vue，保持轻量）
- **样式**：CSS3 + CSS Variables
- **构建**：无需构建工具，原生JS/CSS/HTML
- **部署**：Cloudflare Pages

### 4.2 API调用规范

```javascript
// 标准API调用方式
const response = await CardsAPI.request('/api/admin/boss/chat', {
    method: 'POST',
    body: {
        scenario_id: 'contract_review',
        message: userMessage,
        session_id: sessionId
    }
});
```

### 4.3 Skill开发规范

每个Skill必须包含：
1. **独立页面**：index.html
2. **独立样式**：style.css
3. **独立逻辑**：app.js
4. **统一返回按钮**：返回cards首页
5. **统一头部**：显示Skill名称

---

## 五、迁移策略

### 5.1 迁移流程

```
开发阶段（cards项目）
    ↓
测试验证（cards.mrwhalex.com）
    ↓
代码复制（复制到boss项目）
    ↓
上线发布（boss.mrwhalex.com）
```

### 5.2 迁移检查清单

- [ ] Skill功能完整测试通过
- [ ] 样式在移动端适配
- [ ] API调用正常
- [ ] 数据存储正常
- [ ] 代码复制到boss/js/skills/
- [ ] boss路由配置更新
- [ ] 回归测试通过

---

## 六、锦囊系统集成

### 6.1 锦囊如何获取Cards数据

**方式**：锦囊系统直接查询现有数据库

```sql
-- 锦囊系统查询示例：获取用户在cards中的使用记录
SELECT * FROM copilot_sessions 
WHERE tenant_id = ? 
AND source = 'cards'  -- 标记来源为cards
ORDER BY created_at DESC;
```

**无需特殊处理**：因为cards和boss共享同一个后端和数据库，锦囊系统自动能看到cards的使用数据。

---

## 七、部署配置

### 7.1 Cloudflare Pages部署

**wrangler.toml配置**：
```toml
name = "cards"
compatibility_date = "2024-12-01"

[site]
bucket = "./"
```

**部署命令**：
```bash
cd cards
wrangler pages deploy . --project-name=cards
```

**访问地址**：https://cards.mrwhalex.com

### 7.2 生产环境部署

测试完成后，将skills/目录复制到boss项目：

```bash
# 复制Skill代码
cp -r cards/skills/* boss/js/skills/

# 复制API层（如果需要）
cp cards/js/api.js boss/js/cards-api.js
```

---

## 八、总结

### 8.1 核心原则

1. **只建前端**：后端完全复用chatapi
2. **复用数据库**：使用现有D1，无需新建
3. **统一认证**：使用boss_token
4. **复杂Skill**：30个Skill全部采用复杂架构
5. **平滑迁移**：测试完成后复制代码到boss

### 8.2 风险点

| 风险 | 应对方案 |
|------|----------|
| CORS跨域问题 | 后端配置允许cards.mrwhalex.com访问 |
| 数据权限问题 | 确保tenant_id正确传递 |
| Skill数量多 | 按优先级分批开发 |

### 8.3 下一步行动

1. [ ] 创建基础文件结构（api.js, auth.js等）
2. [ ] 部署cards-test环境
3. [ ] 开发第一个Skill（数据智查）
4. [ ] 验证架构可行性
5. [ ] 批量开发剩余29个Skill

---

*本文档记录了完整的架构讨论过程和决策依据，后续开发应严格遵循本文档规范。*
