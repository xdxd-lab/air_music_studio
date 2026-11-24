# Air-Music Studio

以一般 RGB 相機、雙手 AI 骨架追蹤與 Web Audio 實現的瀏覽器虛擬樂器實驗室。

A browser-based gesture-controlled music studio with local hand tracking and experimental virtual strings.

## 開始使用
- 網頁入口：[index.html](index.html)（v0.2）。
- 請透過 HTTPS 網頁或 localhost 使用。GitHub 的原始碼預覽不等於可執行網站。
- Android Chrome：先關閉其他使用相機的分頁，再按「僅測試相機」。成功後停止，按「啟動相機」，授權並等待模型下載。將雙手放進畫面，確認 2/2 hands、42/42 points，再啟用六弦與合成音效。
- 桌面本機：在 repo 根目錄執行 `python -m http.server 8000`，瀏覽 http://localhost:8000/。
- GitHub Pages：Settings → Pages → Deploy from a branch → main → /(root) → Save。部署成功後預期網址 https://xdxd-lab.github.io/air_music_studio/ 。部署尚待確認。

## 版本與文件
- [v0.1](versions/Air-Music_Studio_v0.1.html)：初始雙手追蹤、六弦與撥弦合成。
- [v0.2](versions/Air-Music_Studio_v0.2.html)：加入相機專用測試、權限診斷及分階段錯誤報告。
- [工程架構與開發交接](docs/ARCHITECTURE.md)
- [Android 實測與驗收](docs/TESTING.md)
- [參考資料與致謝 / References & acknowledgments](REFERENCES.md)
- [版本紀錄](CHANGELOG.md)

## 狀態與隱私
相機影像在瀏覽器本機處理；程式與模型從外部 CDN 下載，不含錄影或相機影像上傳功能。已確認 Android Chrome 可在獨立 HTTPS WebRTC 測試頁取得相機；本地 content:// 開啟 v0.2 時權限被拒。本站雙手 AI 追蹤、撥弦與延遲尚未在該實體裝置驗證。程式屬實驗原型，不保證裝置相容性。

## Credits
Uses Google MediaPipe Hand Landmarker and standard browser APIs, with Karplus–Strong-style synthesis. We gratefully acknowledge related independent work, especially the 2011 Cornell ECE 5760 project. See [REFERENCES.md](REFERENCES.md) for authors, links, and attribution scope.
