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
| GitHub Pages v0.3 | Deployed. Served HTML matches the repository entrypoint. |
| Project HTTPS camera | Pending device test |
| Project dual-hand inference | Pending |
| Project pluck audio and latency | Pending |

## v0.3 regression checks
- Pure logic assertions executed before commit: four combinations of hand/finger override on both labels, all 13 chord pitch-class sets and six ordered MIDI pitches, 14 pads in each orientation, separation from string region, downward/upward multi-string crossing, outside-span rejection, A4 frequency, dwell persistence/rearm. Inline JS syntax check: passed.
- Device checks pending: defaults mirror off/numbers on, both global buttons pressed; toggle independently and verify right/left middle/fingertips with strict rules. Press each chord button and verify six displayed frequencies; audition without camera; select via air in portrait bottom and landscape left, then move away and verify retained chord. Verify two fingers cross same string without global suppression, stop and restart camera, rotate while running, and test pinch gate. Verify no accidental chord switching on held fingertip and no spurious strikes during tracking loss.

## v0.4 device acceptance

- Open the page in a fresh session and verify pluck audio is selected and the 55 ms limit is clear. Start hand tracking and pluck without a second audio toggle. Try the camera-only diagnostic independently.
- Sweep and repeat through one string with one finger with the limit on and off. Pluck the same string with two fingers to check independent triggering.
- Pluck a chord, spread a palm briefly over the strings, and verify ringing stops and new notes are blocked until release. Check normal open-hand strums and loss of tracking for unintended stops or notes.
- Hold an air chord with the left hand, pluck with the right and gently rock the left hand. Check pitch in both directions, return to neutral after release, and repeat with screen press and drag. Test mirror, handedness swap and both orientations.
- Run the [microphone and flute device checks](FLUTE.md#實機驗收).

## v0.4.1 performance checks

- Count inference and drawing calls in both scheduling paths. With 60 display callbacks and 30 new video frames in a second, expect 30 inference calls and 30 paints during tracking, or 30 paints and no inference in camera-only mode.
- Hide the tab while holding a chord contact and return. Verify suspended callbacks resume without inheriting the held gesture. Leave while camera permission is pending, then confirm a late result releases the camera. In an active preview, check that Stop cancels further callbacks.
- Compare strum order and note triggers against v0.4 near the string deadband and at both horizontal bounds. Repeat with the per-finger cooldown enabled.
- During flute calibration and audible breath, frequency data should still be analysed. Very quiet frames after calibration should keep the gate and meter at zero while skipping frequency data.
- On an actual Android and desktop device, record camera cadence, inference FPS, interaction delay and dropped frames. Simulated callback counts do not measure device FPS or power consumption.

## v0.4.2 touch and instrument switching

- In screen mode, hold three bottom holes at once and confirm that the panel reports all three closed. Release one finger or slide to another pad and check each displayed state. Restore the latched state on release, cancel and panel collapse.
- Test with half holes off and on. With the switch off, every pad closes a hole and the panel toggles open or closed. With it on, the upper part of each pad can cover half a hole. The camera mode should also report half holes only with the switch on.
- Start the flute with hand tracking active. Stop the microphone and repeat after collapsing the panel. Confirm that microphone tracks close, the camera continues tracking, and pluck audio, hand and finger policies, chord hold, and palm-mute settings keep their selected values.
- Confirm equal fingering keeps the same fundamental with soft and strong breath, with a louder octave harmonic at higher breath levels.
