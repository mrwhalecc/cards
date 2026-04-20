# Cards 项目

BOSS 情景卡片的独立开发和测试环境。

## 项目地址

- **生产环境**: https://cards.mrwhalex.com
- **后端 API**: https://chatapi.mrwhalex.com

## 项目结构

```
cards/
├── css/              # 样式文件
├── js/               # 公共 JS 库
├── skills/           # 各 Skill 页面
│   └── competitor-intel/
├── index.html        # 首页
└── wrangler.toml     # Cloudflare 配置
```

## 开发指南

### 本地开发

```bash
# 进入项目目录
cd cards

# 启动本地服务器
python3 -m http.server 8080

# 或
npx serve .
```

### 部署

代码推送到 GitHub 后，Cloudflare Pages 会自动部署。

## Skill 开发

每个 Skill 是一个独立目录：

```
skills/{skill-id}/
├── index.html    # 页面入口
├── style.css     # 独立样式
└── app.js        # 业务逻辑
```

### 示例：竞品情报员

访问: `/skills/competitor-intel/`

功能:
- 添加竞品监控
- 自动网页爬虫
- 变化检测告警
- 对比矩阵

## 技术栈

- 前端: 原生 HTML/CSS/JS
- UI 组件: 自定义 (js/ui.js)
- 图表: ECharts (可选)
- 后端: Cloudflare Workers
- 部署: Cloudflare Pages
