# Camera debugging and acceptance tests

## Observations — 2026-11-24 (user screenshots)
Android Chrome opened the downloaded v0.2 HTML with content://media/external/download... . Diagnostics: standalone yes; secure context yes; media API available; permissions policy allowed; permission denied; enumerable cameras 1. Camera request raised NotAllowedError; zero hands / zero landmarks; inference FPS not available. This is a camera-stage failure; model not yet tested.

Control: https://webrtc.github.io/samples/src/content/getusermedia/gum/ displayed a camera permission prompt and, after user approval, a live image plus camera indicator. Hardware and Chrome HTTPS capture demonstrated. Most likely content:// origin permission restriction; not proof every HTTPS origin will succeed. Screenshots not published to avoid disclosing unrelated device information.

## Reproduction / fixes
- Use a standalone HTTPS page (GitHub Pages recommended), not Android content:// or a sandboxed preview. Localhost is a desktop development alternative. A plain HTTP LAN IP may not be a secure context.
- Close other camera tabs; confirm Chrome Android application permissions and site camera permission. If necessary reset the specific site's permission and reload. Do not attempt to bypass permissions.
- Start camera-only test; if successful stop before full AI mode. First AI start requires network access to jsDelivr and Google's model hosting. Camera denial and model/network errors are separate.
- Test front/back selection after authorization; verify correct camera and mirrored overlay. Stop must release camera.
- Full AI: one hand = 21 points, two hands = 42; check classification, orientation, occlusion, frame rate, and pinch. Enable sound by user tap and pluck one string at a time, then sweep; confirm no repeated notes when still.
- Record device/browser, orientation, model delegate, FPS, camera resolution and observed latency. Test permission denied, no device, network failure and background/resume.

## Verification status
| Check | Status |
|---|---|
| Android Chrome HTTPS WebRTC control | PASS |
| Android downloaded content:// v0.2 camera | FAIL: NotAllowedError |
| Project HTTPS camera | Pending deployment and device test |
| Project dual-hand inference | Pending |
| Project pluck audio and latency | Pending |
