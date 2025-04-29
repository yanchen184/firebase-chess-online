# 双人象棋对战游戏 (Two-Player Chess Game)

![版本](https://img.shields.io/badge/版本-1.0.1-blue.svg)

一个基于React和Firebase构建的双人在线象棋对战应用。玩家可以创建账户、发起对局、邀请其他玩家，并在线进行象棋对战。

## 在线演示

访问 [https://yanchen184.github.io/firebase-chess-online](https://yanchen184.github.io/firebase-chess-online) 体验游戏

## 功能特点

- 📝 用户注册与登录
- 🎮 创建新的对局
- 📧 通过电子邮件邀请对手
- ♟️ 实时对战功能
- 🔄 完整的象棋规则实现
- 📱 响应式设计，支持各种屏幕尺寸

## 技术栈

- **前端框架**: React
- **状态管理**: React Context API
- **路由**: React Router
- **样式**: Tailwind CSS
- **实时数据库**: Firebase Firestore
- **认证**: Firebase Authentication
- **部署**: GitHub Pages

## 本地开发

1. 克隆仓库
   ```bash
   git clone https://github.com/yanchen184/firebase-chess-online.git
   cd firebase-chess-online
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 配置Firebase
   - 在Firebase控制台创建一个新项目
   - 启用Authentication和Firestore服务
   - 复制`.env.example`文件为`.env.local`
   - 在`.env.local`文件中更新Firebase配置变量

4. 启动开发服务器
   ```bash
   npm start
   ```

5. 打开浏览器访问 http://localhost:3000

## 环境变量设置

本项目使用环境变量来存储Firebase配置。您需要在`.env.local`文件中设置以下变量：

```
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

这些值可以在Firebase控制台的项目设置中找到。

## 如何玩

1. 注册账户或登录
2. 在主面板中点击"创建游戏"
3. 输入对手的电子邮件地址
4. 将生成的游戏ID分享给对手
5. 对手接受邀请后，游戏开始
6. 轮流移动棋子进行对战

## 部署

项目配置了GitHub Actions，当代码推送到main分支时会自动构建并部署到GitHub Pages。

要使用GitHub Actions部署，您需要在GitHub仓库设置中添加以下Secrets：

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`

## 故障排除

如果遇到 "CONFIGURATION_NOT_FOUND" 错误，请检查：

1. Firebase项目配置是否正确
2. 是否已在Firebase控制台中启用Email/Password认证方法
3. 环境变量是否正确设置

## 更新日志

### v1.0.1 (2025-04-29)
- 修复了Firebase认证配置问题
- 添加了环境变量支持，提高安全性
- 改进了项目文档

### v1.0.0 (2025-04-23)
- 初始版本发布

## 许可证

MIT