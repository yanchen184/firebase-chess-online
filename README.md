# Firebase 線上遊戲平台

基於 React 和 Firebase 開發的在線遊戲平台，允許玩家在線上進行即時對戰。目前支持國際象棋和 1A2B 猜數字遊戲。

## 版本

當前版本：v2.0.0

## 功能概述

### 遊戲平台功能

- **多遊戲支持**:
  - [x] 國際象棋
  - [x] 1A2B 猜數字遊戲
  - [ ] 更多遊戲（未來擴展）

- **用戶系統**:
  - [x] 使用 Firebase 身份驗證
  - [x] 用戶註冊與登錄
  - [x] 個人資料管理

- **社交功能**:
  - [x] 觀戰功能
  - [x] 遊戲聊天
  - [ ] 好友列表
  - [ ] 私人訊息

### 國際象棋功能

- **完整的國際象棋規則**:
  - [x] 基本棋子移動規則
  - [x] 將軍檢查
  - [x] 將死判斷
  - [x] 和棋情況（僵局、不足子力、三次重複、50步規則等）
  - [x] 兵的升變
  - [x] 王車易位
  - [x] 吃過路兵

- **遊戲機制**:
  - [x] 創建新遊戲
  - [x] 加入現有遊戲
  - [x] 即時更新遊戲狀態
  - [x] 投降功能
  - [x] 和棋提議功能
  - [x] 棋盤翻轉（根據玩家顏色）
  - [x] 遊戲歷史記錄與回放
  - [x] 國際象棋代數符號顯示

- **界面**:
  - [x] 棋盤與棋子美觀顯示
  - [x] 有效移動提示
  - [x] 最後一步移動標記
  - [x] 升變選擇介面

### 1A2B 猜數字遊戲功能

- **遊戲規則**:
  - [x] 自動生成不重複的4位數字
  - [x] A 表示數字和位置正確
  - [x] B 表示數字正確但位置錯誤
  - [x] 有限猜測次數（10次）
  - [x] 勝利條件（猜中4A）

- **遊戲機制**:
  - [x] 創建新遊戲
  - [x] 加入現有遊戲
  - [x] 輪流猜測
  - [x] 即時結果反饋
  - [x] 歷史猜測記錄
  - [x] 提示系統

- **界面**:
  - [x] 猜測輸入表單
  - [x] 歷史猜測表格
  - [x] 遊戲狀態顯示
  - [x] 猜測次數計數器
  - [x] 遊戲規則說明

## 待實現功能

- **遊戲增強**:
  - [ ] 時鐘/計時器
  - [ ] ELO 評分系統
  - [ ] 悔棋請求
  - [ ] 更多遊戲類型（五子棋、圍棋等）

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
  - [ ] 遊戲挑戰

- **行動平台**:
  - [ ] PWA 支持
  - [ ] iOS 和 Android 應用

## 最近更新

### v2.0.0
- 新增 1A2B 猜數字遊戲功能
- 重構應用為多遊戲平台
- 更新遊戲選擇界面
- 自動遊戲類型路由功能

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

該項目使用模塊化架構：

```
src/
├── components/        # 共享UI組件
├── contexts/          # React Contexts 
├── firebase/          # Firebase 配置
├── pages/             # 頁面組件
├── services/          # 服務層（API調用）
├── styles/            # CSS 樣式
└── utils/             # 工具函數
    ├── chess/         # 國際象棋邏輯
    └── 1a2b/          # 1A2B 遊戲邏輯
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
  - gameType: string ('chess' | '1a2b')
  - player1: { uid, displayName }
  - player2: { uid, displayName }
  - status: string ('waiting' | 'active' | 'completed')
  - winner: string
  - winReason: string
  - createdAt: timestamp
  - updatedAt: timestamp

  # 國際象棋特定欄位
  - white: string (白方玩家名稱)
  - black: string (黑方玩家名稱)
  - whitePlayer: { uid, displayName }
  - blackPlayer: { uid, displayName }
  - board: Array (棋盤狀態)
  - currentTurn: string ('white' | 'black')
  - drawOfferBy: string ('white' | 'black' | null)
  - moves: Array (移動歷史)
  - notation: Array (代數符號)
  - boardPositions: Array (棋盤歷史)
  - lastMove: Object

  # 1A2B 特定欄位
  - secretNumber: string (4位密碼)
  - currentTurn: string ('player1' | 'player2')
  - guesses: Array (猜測歷史)
  - maxGuesses: number
  - remainingGuesses: number

/games/{gameId}/messages/{messageId}
  - text: string
  - uid: string
  - displayName: string
  - photoURL: string
  - playerStatus: string
  - timestamp: timestamp
  - isSystem: boolean
  - type: string

/games/{gameId}/spectators/{userId}
  - uid: string
  - displayName: string
  - photoURL: string
  - active: boolean
  - joinedAt: timestamp
  - lastActive: timestamp
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

## 未來發展方向

1. **遊戲種類擴展**
   - 添加更多經典遊戲，如五子棋、圍棋、黑白棋等
   - 添加卡牌遊戲，如UNO、撲克等
   - 開發不需要多人的單人遊戲

2. **遊戲體驗增強**
   - 實現時間控制功能
   - 添加悔棋請求功能
   - 改進觀戰功能

3. **社交功能**
   - 添加好友系統
   - 實現私人訊息功能
   - "觀戰中"狀態顯示

4. **競爭性功能**
   - 實現 ELO 評分系統
   - 創建積分榜
   - 支持錦標賽功能

## 貢獻

歡迎貢獻！請隨時提交 Pull Requests 或創建 Issues。

## 許可證

MIT 許可證