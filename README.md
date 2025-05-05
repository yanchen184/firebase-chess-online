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

3. 启动开发服务器
   ```bash
   npm start
   ```

4. 打开浏览器访问 http://localhost:3000

## Firebase 设置

本项目使用与 choiceLight 项目相同的 Firebase 配置，已在代码中设置好。如果遇到认证问题，请确保在 Firebase 控制台中：

1. 项目 `choicelight-99618` 存在且状态正常
2. 已启用 Email/Password 认证方法
3. 已创建 Firestore 数据库（如果尚未创建）

## 如何玩

1. 注册账户或登录
2. 在主面板中点击"创建游戏"
3. 输入对手的电子邮件地址
4. 将生成的游戏ID分享给对手
5. 对手接受邀请后，游戏开始
6. 轮流移动棋子进行对战

## 部署

项目配置了GitHub Actions，当代码推送到main分支时会自动构建并部署到GitHub Pages。

## 故障排除

如果遇到 "CONFIGURATION_NOT_FOUND" 错误，请尝试以下解决方案：

1. 确保在 Firebase 控制台中启用了 Authentication 服务
   - 登录 [Firebase 控制台](https://console.firebase.google.com/)
   - 选择项目 "choicelight-99618"
   - 点击左侧导航栏中的 "Authentication"
   - 进入 "Sign-in method" 标签
   - 确保 "Email/Password" 方法已启用

2. 确保在 Firebase 控制台中创建了 Firestore 数据库
   - 在同一项目中点击 "Firestore Database"
   - 如果尚未创建，点击 "创建数据库"
   - 选择适当的起始模式（测试模式或生产模式）

3. 检查浏览器控制台中的详细错误信息，以获取更多诊断信息

## 更新日志

### v1.0.1 (2025-05-05)
- 修复了 Firebase Firestore 嵌套数组错误
- 将棋盘数据结构从二维数组改为一维对象数组
- 修复了游戏邀请查询逻辑，被邀请的玩家现在可以看到待处理的游戏
- 改进了通过电子邮件邀请玩家的功能

### v1.0.0 (2025-04-23)
- 初始版本发布

## 许可证

MIT