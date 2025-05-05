# Firebase Chess Online

Firebase Chess Online 是一個基於 React 和 Firebase 開發的在線國際象棋應用程序，允許玩家在線上進行即時象棋對戰。

## 版本

當前版本：v1.1.0

## 功能概述

### 已實現功能

- **完整的國際象棋規則**:
  - [x] 基本棋子移動規則
  - [x] 將軍檢查
  - [x] 將死判斷
  - [x] 和棋情況（僵局、不足子力、三次重複、50步規則等）
  - [x] 兵的升變
  - [x] 王車易位
  - [x] 吃過路兵

- **用戶系統**:
  - [x] 使用 Firebase 身份驗證
  - [x] 用戶註冊與登錄
  - [x] 個人資料管理

- **遊戲機制**:
  - [x] 創建新遊戲
  - [x] 加入現有遊戲
  - [x] 顯示遊戲列表
  - [x] 即時更新遊戲狀態
  - [x] 投降功能
  - [x] 和棋提議功能
  - [x] 棋盤翻轉（根據玩家顏色）
  - [x] 遊戲歷史記錄與回放
  - [x] 國際象棋代數符號顯示
  - [x] 觀戰功能
  - [x] 遊戲聊天

- **界面**:
  - [x] 響應式設計
  - [x] 棋盤與棋子美觀顯示
  - [x] 有效移動提示
  - [x] 最後一步移動標記
  - [x] 升變選擇介面

### 待實現功能

- **遊戲增強**:
  - [ ] 時鐘/計時器
  - [ ] ELO 評分系統
  - [ ] 悔棋請求

- **用戶體驗**:
  - [ ] 主題選擇（棋盤和棋子風格）
  - [ ] 聲音效果
  - [ ] 國際化支持
  - [ ] 遊戲回放功能
  - [ ] 移動動畫

- **進階功能**:
  - [ ] 對戰機器人
  - [ ] 遊戲分析
  - [ ] 殘局教學
  - [ ] 線上錦標賽
  - [ ] 好友列表
  - [ ] 遊戲挑戰

- **行動平台**:
  - [ ] PWA 支持
  - [ ] iOS 和 Android 應用

## 最近更新

### v1.1.0
- 新增觀戰功能，讓用戶可以觀看其他玩家的對戰
- 新增遊戲聊天功能，讓玩家和觀眾可以交流
- 改進了遊戲界面，添加了觀眾列表
- 遊戲事件（如移動、將軍、將死等）會在聊天中顯示

### v1.0.0
- 初始版本發布
- 實現基本國際象棋功能和規則

## 技術堆棧

- **前端**:
  - React
  - Firebase SDK
  - CSS Modules

- **後端**:
  - Firebase Firestore (資料庫)
  - Firebase Authentication (身份驗證)
  - Firebase Hosting (部署)
  - Firebase Cloud Functions (伺服器功能)

## 架構

該項目使用模塊化架構，將國際象棋邏輯拆分為更小、更專注的模塊：

```
src/utils/chess/
├── index.js                 // 主要導出點
├── board.js                 // 棋盤相關函數
├── pieces.js                // 棋子相關函數
├── moves/
│   ├── index.js            // 移動相關的主函數
│   ├── pawn.js             // 兵的移動邏輯
│   ├── rook.js             // 車的移動邏輯
│   ├── knight.js           // 馬的移動邏輯
│   ├── bishop.js           // 象的移動邏輯
│   ├── queen.js            // 后的移動邏輯
│   └── king.js             // 王的移動邏輯
├── rules/
│   ├── index.js            // 規則相關的主函數
│   ├── check.js            // 將軍/將死相關
│   ├── castling.js         // 王車易位
│   ├── enPassant.js        // 吃過路兵
│   ├── promotion.js        // 兵的升變
│   └── draw.js             // 和棋條件
└── utils.js                // 通用工具函數
```

## 安裝與設置

### 前提條件

- Node.js (v14 或更高)
- npm 或 yarn
- Firebase 帳號

### 安裝

1. 克隆資源庫
```bash
git clone https://github.com/yanchen184/firebase-chess-online.git
cd firebase-chess-online
```

2. 安裝依賴
```bash
npm install
```

3. 設置 Firebase
   - 在 Firebase 控制台創建新項目
   - 啟用 Authentication 和 Firestore
   - 設置身份驗證方法 (郵件和密碼)
   - 創建 `.env` 檔案並添加 Firebase 配置

4. 啟動開發伺服器
```bash
npm start
```

## 部署

```bash
npm run build
firebase deploy
```

## Firebase 資料結構

```
/users/{userId}
  - displayName: string
  - email: string
  - photoURL: string
  - createdAt: timestamp
  - elo: number (未來功能)

/games/{gameId}
  - white: string (白方玩家名稱)
  - black: string (黑方玩家名稱)
  - whitePlayer: { uid, displayName }
  - blackPlayer: { uid, displayName }
  - board: Array (棋盤狀態)
  - currentTurn: string ('white' | 'black')
  - status: string ('active' | 'completed')
  - winner: string ('white' | 'black' | 'draw' | null)
  - winReason: string
  - drawOfferBy: string ('white' | 'black' | null)
  - moves: Array (移動歷史)
  - notation: Array (代數符號)
  - boardPositions: Array (棋盤歷史)
  - lastMove: Object
  - createdAt: timestamp
  - updatedAt: timestamp

/games/{gameId}/messages/{messageId}
  - text: string
  - uid: string
  - displayName: string
  - photoURL: string
  - playerStatus: string ('white' | 'black' | 'spectator')
  - timestamp: timestamp
  - isSystem: boolean
  - type: string (針對系統消息)

/games/{gameId}/spectators/{userId}
  - uid: string
  - displayName: string
  - photoURL: string
  - active: boolean
  - joinedAt: timestamp
  - lastActive: timestamp
```

## 貢獻

歡迎貢獻！請隨時提交 Pull Requests 或創建 Issues。

## 未來發展方向

1. **遊戲體驗增強**
   - 實現時間控制功能，增加比賽感和緊張感
   - 添加悔棋請求功能
   - 改進觀戰功能，支持高級過濾和搜索

2. **社交功能**
   - 添加好友系統
   - 實現私人訊息功能
   - "觀戰中"狀態顯示

3. **競爭性功能**
   - 實現 ELO 評分系統
   - 創建積分榜
   - 支持錦標賽功能

4. **可訪問性**
   - 提高對視覺障礙用戶的可訪問性
   - 支持盲目象棋標記法
   - 添加音效和聲音提示

## 許可證

MIT 許可證
