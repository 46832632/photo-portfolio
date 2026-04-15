# 桂花落 · Photography Portfolio

一个极简主义的摄影作品集网站，基于 GitHub Pages 托管。

## 🎨 设计理念

「人闲桂花落，夜静春山空」—— 用镜头捕捉静谧中的诗意。

## 📁 项目结构

```
├── index.html          # 网站首页
├── admin.html          # 照片管理系统
├── data/
│   └── photos.json     # 照片元数据
└── images/             # 照片存放目录
```

## 🚀 快速开始

### 1. 部署到 GitHub Pages

1. Fork 本仓库或创建新仓库
2. 进入仓库 Settings → Pages
3. Source 选择 "Deploy from a branch"，Branch 选择 "main / (root)"
4. 等待几分钟后，你的网站将上线

### 2. 配置上传功能

1. 打开 `admin.html`
2. 进入「设置」页面
3. 配置你的 GitHub Token（需要 repo 权限）
4. 测试连接成功后即可使用

### 3. 生成 GitHub Token

1. 访问 https://github.com/settings/tokens
2. Generate new token (classic)
3. 勾选 `repo` 权限
4. 复制生成的 Token 并配置到 admin 页面

## ✨ 功能特性

### 网站前台 (index.html)
- 响应式瀑布流画廊
- 分类筛选（城市、自然、人物、建筑、饮食）
- 键盘导航支持
- 优雅的灯箱查看

### 管理后台 (admin.html)
- 📷 **批量上传**：拖拽或选择多张照片
- 📝 **元数据编辑**：标题、地点、年份、描述
- 📊 **照片管理**：分类筛选、搜索、分页
- 🔢 **排序控制**：自定义照片显示顺序
- 🗑️ **批量删除**：多选后一键删除
- ⚙️ **GitHub 集成**：所有操作自动同步到仓库

## 📷 上传照片

1. 打开 `admin.html` → 「上传照片」
2. 设置默认分类、地点、年份
3. 拖拽照片或点击选择
4. 点击「上传全部」
5. 等待自动部署完成

## 🎯 分类说明

| 分类 | category | 说明 |
|:---|:---|:---|
| 城市 | city | 城市街拍、建筑风貌 |
| 自然 | nature | 风景、植物、自然光影 |
| 人物 | people | 人像、人文纪实 |
| 建筑 | arch | 建筑摄影、室内设计 |
| 饮食 | food | 美食、静物摄影 |

## ⚙️ 照片数据格式

```json
{
  "photos": [
    {
      "id": "img_1234567890_0",
      "filename": "IMG_CITY_abc123.jpg",
      "seq": 1,
      "titleZh": "城市之夜",
      "titleEn": "City Night",
      "location": "上海",
      "year": "2026",
      "category": "city",
      "catLabel": "城市",
      "desc": "夜幕降临，灯火阑珊",
      "date": "2026-04-15"
    }
  ]
}
```

## 🔧 技术栈

- 纯前端实现，无需后端
- GitHub API 实现数据存储
- GitHub Actions 自动部署
- Google Fonts 中文字体
- 响应式设计，移动端优先

## 📝 注意事项

1. **图片大小**：建议单张不超过 5MB
2. **部署延迟**：上传后需等待 1-2 分钟自动部署
3. **Token 安全**：不要将 Token 提交到代码仓库
4. **图片路径**：照片需上传到 `images/` 目录

## 🌸 License

MIT
