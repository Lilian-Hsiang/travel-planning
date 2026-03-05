# 旅遊規劃 App (Travel Planning App) 開發計畫

本文件概述了旅遊規劃應用程式的前端頁面功能與後端架構需求。

## 📱 前端功能與頁面規劃 (Frontend Features)

### 1. 行程規劃 (Itinerary)
提供使用者建立與管理每日旅遊行程的核心功能。
* **基本功能**：行程的 CRUD（新增、讀取、更新、刪除）操作。
* **資料欄位**：
  * 時間分類 (Time Category)
  * 行程名稱 (Itinerary Name)
  * 地點 (Location) - *需具備超連結功能，可直接跳轉至 Google Maps*
* **進階功能**：
  * 整合 Google Maps API，自動計算並顯示行程點與點之間的距離與預估交通時間。

### 2. 購物清單 (Shopping List)
讓使用者記錄各個地點預計購買的商品。
* **基本功能**：購物清單的 CRUD 操作。
* **資料欄位**：
  * 店家名稱 (Store Name)
  * 地點 (Location) - *需具備超連結功能，可直接跳轉至 Google Maps*
* **進階功能**：
  * 支援「店家內購物項目」的子層級 CRUD 操作。
  * 每個購物項目需附帶核取方塊 (Checkbox)，以便標記是否已購買/完成。

### 3. 美食清單 (Food List)
協助使用者收集與追蹤旅途中的必吃美食。
* **基本功能**：美食清單的 CRUD 操作。
* **資料欄位**：
  * 餐廳名稱 (Restaurant Name)
  * 地點 (Location) - *需具備超連結功能，可直接跳轉至 Google Maps*
* **進階功能**：
  * 支援「餐廳內必吃品項」的子層級 CRUD 操作。
  * 每個美食項目需附帶核取方塊 (Checkbox)，以便標記是否已品嚐/完成。

### 4. 旅遊手帳 (Travel Journal)
提供使用者記錄旅途點滴與心情的空間。
* **基本功能**：旅遊日記的 CRUD 操作。
* **資料欄位**：
  * 日期 (Date)
  * 今日心情 (Today's Mood) - *提供內建貼圖庫 (Sticker library) 供使用者選擇*
  * 照片上傳 (Upload Photo) - *上傳至 Firebase Storage*
  * 主題名稱 (Theme Name)
  * 心得與內容 (Thoughts / Content)

### 5. 記帳 / 分帳 (Expense Tracker)
沿用現行的分帳功能精神，提供記帳與金額拆分管理。
* **基本功能**：記帳條目的 CRUD 操作，含整筆刪除與更新。
* **資料欄位**：
  * 商品名稱 (Item Name)
  * 總金額 (Total Amount)
  * 分帳金額或比例 (Split Amount) - *可輸入每人應付金額或自動依現有分帳邏輯計算*
  * 備註 (Notes) - *選填，用於紀錄誰支付或特殊說明*
* **進階功能**：
  * 與現有分帳模組銜接，直接帶入參與成員與分攤規則。
  * 提供已結清/待結清狀態切換，快速了解每筆費用的處理進度。
  * 支援依人員或日期進行篩選與統計，以便核對分帳結果。

---

## ⚙️ 後端功能與架構規劃 (Backend Features)

採用 Nuxt Server API (Nitro) 封裝 Firebase 操作，前端不直接接觸資料庫。

### 1. 資料庫整合 (Database Integration)
* **Firebase Firestore**：作為主要的雲端資料庫，負責儲存所有使用者的行程、清單與日記資料。
* **Firebase Storage**：用於儲存旅遊手帳上傳的照片。

### 2. API 開發 (API Development)
開發與前端功能完全對應的 RESTful APIs：
* **行程 API (`/api/itinerary`)**：處理行程表與時間節點的 CRUD。
* **購物清單 API (`/api/shopping`)**：處理店家資訊及底下購物項目的 CRUD 與狀態更新。
* **美食清單 API (`/api/food`)**：處理餐廳資訊及底下美食項目的 CRUD 與狀態更新。
* **旅遊手帳 API (`/api/journal`)**：處理日記內容的 CRUD，並整合 Firebase Storage 處理照片上傳與圖片網址儲存。
* **記帳 / 分帳 API (`/api/ledger`)**：沿用分帳邏輯提供記帳條目的 CRUD，紀錄商品名稱、金額與分帳狀態，並可回傳各成員應付金額摘要。