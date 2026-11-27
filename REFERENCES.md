# References & acknowledgments / 參考資料與致謝

調查日期：2026-11-24。專案正式名稱為 Air-Music Studio。以下外部作品保留其作者原本的名稱，不作品牌替換。

## A. 實際使用的技術、演算法及測試工具

1. Google AI Edge — [MediaPipe Hand Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker)。程式直接依賴 @mediapipe/tasks-vision 0.10.21、WASM 與官方 hand_landmarker.task 模型，每手 21 點，最多兩手。另見 [官方 Web 範例](https://github.com/google-ai-edge/mediapipe-samples-web)。
2. WebRTC project — [getUserMedia camera sample](https://webrtc.github.io/samples/src/content/getusermedia/gum/)。使用者在 Android Chrome 實際授權成功並取得影像。此為相機對照測試，不是本站程式碼來源。
3. MDN — [MediaDevices.getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)、[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)、[Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)。平台技術文件。
4. Kevin Karplus and Alex Strong (1983). Digital Synthesis of Plucked-String and Drum Timbres. Computer Music Journal 7(2), 43–55. [DOI: 10.2307/3680062](https://doi.org/10.2307/3680062)。原型採用此類延遲線與低通回授撥弦合成；論文為演算法學術來源，並不表示直接複製其程式。
5. GitHub — [Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。部署參考。

6. Chen-Gia Tsai 等，〈[Relating the harmonic-rich sound of the Chinese flute (dizi) to the cubic nonlinearity of its membrane](https://scholars.lib.ntu.edu.tw/entities/publication/3ce026f4-6100-4057-9841-761e48325a1c)〉；Xinmeng Luan 等，〈[Acoustic characterization of the resonator in the Chinese transverse flute (dizi)](https://doi.org/10.1121/10.0036742)〉。笛膜共鳴與泛音的學術參考。本站使用自製的竹管主音、奇次泛音為主的笛膜聲與合成的吹氣聲，為音色近似，不是實錄取樣或完整聲學模擬。

## B. 相關先行作品與致謝（本次調查發現）

We acknowledge these related independent works with respect. They were identified in the post-prototype literature/project search on 2026-11-24. They are references for comparison and future development, not evidence that their code or assets were used in v0.1/v0.2. Dates are supplied only where verified.

- **Air String (2011)** — Young Hwa (Terry) Kim and Varsha Madhuranath, Cornell University ECE 5760. [Original project report](https://people.ece.cornell.edu/land/courses/ece5760/FinalProjects/f2011/yk579_vm285/yk579_vm285/index.html). Webcam/camcorder, green fingertip markers, FPGA and Karplus–Strong synthesis. Particularly relevant early work; thanks also to Prof. Land as credited by the authors. [Mike Szczys, Hackaday, December 12, 2011](https://hackaday.com/2011/12/12/get-ready-to-play-some-wicked-air-harp/).
- **AirString** — Armaan Budhiraja. [GitHub](https://github.com/ArmaanBudhiraja/AirString). Browser-local MediaPipe with React/TypeScript and Tone.js for two-hand chord and sound control.
- **Air Strings / SuperTime Motion** — SuperTime. [Official product page](https://supertimeultra.com/air-strings), page updated 2026-11-22. Two-hand pinch-and-stretch creates strings; finger sweeps pluck them, endpoints retune them. Relevant to future dynamic-string interaction.
- **Air String Pro** — Rudranil Goswami. [Author's project announcement/profile](https://in.linkedin.com/in/rudranil-goswami). Python, OpenCV and Pygame MIDI gesture instrument.
- **AirString** — Aditya Sajwan. [Author's announcement](https://www.linkedin.com/posts/adityasajwan18_deeplearning-computervision-mediapipe-activity-7445442150269513728-RWsu). Webcam hand-sign classification for guitar chords.
- **AirStrum** — rsarkin. [GitHub README](https://github.com/rsarkin/AirStrum/blob/main/README.md). Similar browser-based virtual guitar, with six visual strings, MediaPipe and Web Audio.

No affiliation or endorsement is implied. Third-party project names, code and assets belong to their respective owners. Review applicable licenses before incorporating external code or assets; attribution alone is not permission. This survey is not a comprehensive patent or trademark clearance.
