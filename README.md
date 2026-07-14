# 桂落春山 · 个人摄影作品集网站

以「人闲桂花落，夜静春山空」为意境主题的东方极简风摄影作品集网站。

---

## 项目结构

```
摄影网站项目/
├── index.html              ← 单页入口
├── css/
│   └── style.css           ← 全局样式
├── js/
│   └── main.js             ← 交互逻辑 + 作品配置
├── assets/
│   └── placeholder.svg     ← 图片加载失败占位图
└── README.md               ← 本文档
```

## 快速开始

直接用浏览器打开 `index.html` 即可预览（双击文件或拖入浏览器）。

---

## Cloudflare R2 配置指引

### 1. 创建 R2 桶

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **R2** → **Create Bucket**
3. 命名桶（如 `photo-gallery`），选择区域后创建

### 2. 上传作品图片

按分类目录结构上传：

```
R2 桶根目录/
├── portrait/
│   ├── portrait-001.jpg
│   └── portrait-002.jpg
├── landscape/
│   ├── landscape-001.jpg
│   └── landscape-002.jpg
├── street/
│   └── street-001.jpg
└── still-life/
    └── still-life-001.jpg
```

可通过 Cloudflare Dashboard 上传，或使用 rclone / Cloudflare CLI。

### 3. 绑定自定义域名

1. 在 R2 桶设置中找到 **Static website hosting**
2. 绑定你的自定义域名（如 `cdn.yourdomain.com`）
3. 在 Cloudflare DNS 中添加 CNAME 记录指向 R2 端点

### 4. 修改前端配置

打开 [js/main.js](js/main.js)，找到 `CONFIG` 对象，修改：

```javascript
R2_DOMAIN: 'https://cdn.yourdomain.com',  // ← 替换为你的 R2 自定义域名
```

### 5. 添加新作品

在 `CONFIG.WORKS` 数组中添加新对象：

```javascript
{
    id: 10,
    title: '作品标题',
    category: 'portrait',           // 需与 R2 目录名一致
    description: '作品简介',
    image: 'portrait-003.jpg',      // R2 中的文件名
    aspectRatio: 0.75,              // 宽/高比，影响卡片高度
    date: '2026-07-01'
},
```

---

## 本地预览

直接双击打开 `index.html` 文件即可在浏览器中预览完整效果，无需服务器。

---

## 浏览器兼容

- Chrome / Edge 90+
- Firefox 88+
- Safari 14+
- 移动端 Safari / Chrome
