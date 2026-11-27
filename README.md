# Air-Music Studio

以一般 RGB 相機、雙手 AI 骨架追蹤與 Web Audio 實現的瀏覽器虛擬樂器實驗室。可用手勢撥弦，也可選用麥克風氣聲試奏曲笛。

A browser-based gesture-controlled music studio with local hand tracking and experimental virtual strings.

## 開始使用
- 網頁入口：[index.html](index.html)（v0.4.3）。
- 請透過 HTTPS 網頁或 localhost 使用。GitHub 的原始碼預覽不等於可執行網站。
- Android Chrome：先關閉其他使用相機的分頁，再按「僅測試相機」。成功後停止，按「啟動相機」，授權並等待模型下載。將雙手放進畫面，確認 2/2 hands、42/42 points，即可試撥六弦。
- 桌面本機：在 repo 根目錄執行 `python -m http.server 8000`，瀏覽 http://localhost:8000/。
- 正式網站：[GitHub Pages](https://xdxd-lab.github.io/air_music_studio/)（v0.4.3）。由 `main` 根目錄自動部署。

## 目前入口的使用方式
- 預設關閉鏡像、顯示關節編號、兩個全域解除限制開關均開啟。
- 預設 C 和弦；14 組調弦選項（13 和弦＋標準吉他調弦），螢幕按鍵與空中區同步。六弦均發聲，不是實體吉他含消音弦的指法譜。
- 空中選和弦：直式底部、橫式左方，指尖停留約 140 ms，選定後保持；預設兩手十指都可。關閉手別／手指限制後的嚴格規則為左手食指選和弦、右手食指撥弦（撥弦手可另選）。
- 撥弦音效預設開啟，啟動相機時解鎖音訊。各指尖獨立撥弦。55 ms 同指同弦間隔預設關閉，需要時可勾選。
- 張掌在弦區維持 0.5 秒可止住六弦。左手停在空中和弦格內左右輕搖，右手撥弦可產生搖韻。也可在螢幕長按和弦鍵左右拖動。
- 「曲笛實驗」預設展開；麥克風須手動啟用。啟用後先保持安靜約一秒，讓背景音完成校正。
- 切換成「螢幕按孔」進入演奏區。手機橫放時讓主麥克風在左側；六道從上到下的淡色帶從左往右依序是左食指、左中指、左無名指、右食指、右中指、右無名指。第一道貼左邊，為其他每一道的 1.5 倍；在右側可將整組等比例調為 50% 到 150%，預設 100%；窄螢幕不縮小色帶，超出部分裁切。直放時改為由下向上排列。按住遮孔，放開開孔，不會把孔位留在按下狀態。兩種按孔方式都固定以左食指半按、其他五指全按。
- 孔位控制音名，吹氣強弱控制音量。查看即時頻譜與高／中頻比；同一指法的高頻相對中頻持續達門檻就會升高八度。門檻可選 1/2 到 1/8，預設 1/3。演奏區可直接停用麥克風，或返回設定查看頻譜；收合主面板會停用麥克風。

## 版本與文件
- [v0.4.3](versions/Air-Music_Studio_v0.4.3.html)：曲笛頻譜、可調高八度判定，以及直向六指色帶與寬度試調。
- [v0.4.2](versions/Air-Music_Studio_v0.4.2.html)：底部六孔即時觸控、選用半孔、固定基音與改善六弦切換。
- [v0.4.1](versions/Air-Music_Studio_v0.4.1.html)：減少重複影格繪製、手勢配置與氣聲分析的工作量。
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
