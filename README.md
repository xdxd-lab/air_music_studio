# Air-Music Studio

以一般 RGB 相機、雙手 AI 骨架追蹤與 Web Audio 實現的瀏覽器虛擬樂器實驗室。可用手勢撥弦，也可選用麥克風氣聲試奏曲笛。

A browser-based gesture-controlled music studio with local hand tracking and experimental virtual strings.

## 開始使用
- 網頁入口：[index.html](index.html)（v0.4）。
- 請透過 HTTPS 網頁或 localhost 使用。GitHub 的原始碼預覽不等於可執行網站。
- Android Chrome：先關閉其他使用相機的分頁，再按「僅測試相機」。成功後停止，按「啟動相機」，授權並等待模型下載。將雙手放進畫面，確認 2/2 hands、42/42 points，即可試撥六弦。
- 桌面本機：在 repo 根目錄執行 `python -m http.server 8000`，瀏覽 http://localhost:8000/。
- 正式網站：[GitHub Pages](https://xdxd-lab.github.io/air_music_studio/)（v0.4）。由 `main` 根目錄自動部署。

## v0.4 使用方式
- 預設關閉鏡像、顯示關節編號、兩個全域解除限制開關均開啟。
- 預設 C 和弦；14 組調弦選項（13 和弦＋標準吉他調弦），螢幕按鍵與空中區同步。六弦均發聲，不是實體吉他含消音弦的指法譜。
- 空中選和弦：直式底部、橫式左方，指尖停留約 140 ms，選定後保持；預設兩手十指都可。關閉手別／手指限制後的嚴格規則為左手食指選和弦、右手食指撥弦（撥弦手可另選）。
- 撥弦音效預設開啟，啟動相機時解鎖音訊。各指尖獨立撥弦。55 ms 同指同弦間隔預設關閉，需要時可勾選。
- 張掌在弦區稍停可止住六弦。左手停在空中和弦格內左右輕搖，右手撥弦可產生搖韻。也可在螢幕長按和弦鍵左右拖動。
- 展開「曲笛實驗」，啟用麥克風並等背景校正。相機模式用兩手食指、中指、無名指開、半按或閉孔，也可切成螢幕按孔。輕吹控制發聲，強吹可試高八度。

## 版本與文件
- [v0.4](versions/Air-Music_Studio_v0.4.html)：張掌止弦、按弦搖韻、可切換撥弦間隔、麥克風曲笛原型。
- [曲笛原型設計與實測清單](docs/FLUTE.md)
- [v0.3](versions/Air-Music_Studio_v0.3.html)：全域手別／指尖規則、十指撥弦、和弦切換與自適應空中和弦區。
- [v0.1](versions/Air-Music_Studio_v0.1.html)：初始雙手追蹤、六弦與撥弦合成。
- [v0.2](versions/Air-Music_Studio_v0.2.html)：加入相機專用測試、權限診斷及分階段錯誤報告。
- [開發對話交接與未完成項目](docs/HANDOFF.md)
- [工程架構](docs/ARCHITECTURE.md)
- [Android 實測與驗收](docs/TESTING.md)
- [參考資料與致謝 / References & acknowledgments](REFERENCES.md)
- [版本紀錄](CHANGELOG.md)

## 狀態與隱私
相機影像與選用的麥克風資料在瀏覽器本機處理。程式與模型從外部 CDN 下載。已確認 Android Chrome 可在獨立 HTTPS WebRTC 測試頁取得相機；本地 content:// 開啟 v0.2 時權限被拒。本站雙手 AI 追蹤、撥弦、氣聲和延遲尚未在該實體裝置驗證。程式屬實驗原型，不保證裝置相容性。

## Credits
Uses Google MediaPipe Hand Landmarker and standard browser APIs, with Karplus–Strong-style synthesis. We gratefully acknowledge related independent work, especially the 2011 Cornell ECE 5760 project. See [REFERENCES.md](REFERENCES.md) for authors, links, and attribution scope.
