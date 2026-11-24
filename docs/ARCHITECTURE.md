# Architecture & developer handoff

## Pipeline
RGB camera → getUserMedia → video frame → MediaPipe Hand Landmarker (VIDEO mode, numHands=2, GPU then CPU fallback) → per-hand landmarks and handedness → gesture/crossing detection → Canvas 2D and Web Audio.

### v0.3 gesture engine
- `eligibleFingers(label, rule, settings)` is the reusable global policy; anyHand and anyFinger default true independently. Base rules: chord selection Left/#8; pluck configurable role (Right default)/#8. Tips #4/8/12/16/20. Optional pinch is a separate whole-hand gate, not a finger restriction.
- Each track is matched approximately by wrist proximity with handedness penalty; per-track/per-finger crossing history and per-track/per-finger/per-string 55 ms cooldown allow simultaneous strikes. Track IDs are heuristic, not persistent identity. Audio compressor prevents excessive peaks. Crossing thresholds and dwell times need real-device tuning.
- `CHORDS` stores six MIDI pitches low-to-high, display reverses to string 1–6 high-to-low. MIDI pitch to Hz = 440*2^((m-69)/12). Default C; C D E F G A Am Dm Em G7 C7 D7 Bm and Open. Voicings are all-sounding chord tones, not literal guitar tablature. Chord changes affect new strikes; previous sounds decay naturally.
- `layoutFor` chooses bottom (portrait viewport) or left (landscape), separated from horizontal string region. 140 ms dwell, 180 ms selection lockout, deterministic first contact arbitration; existing contacts must move/re-enter a pad to select again. All eligible fingers may select; only one persistent chord globally active. Screen buttons and canvas tap use same setChord function. Coordinates are image projection, not absolute 3D touch.
- Root index and v0.3 version snapshot are identical. Older versions remain unchanged.

### v0.2 historical prototype
- 21 landmarks per hand; index tip #8, thumb tip #4, wrist #0 and middle MCP #9. Mirror display and left/right label swap are configurable. X/Y normalized image coordinates; Z relative depth, not calibrated camera distance.
- Fixed horizontal strings E4 B3 G3 D3 A2 E2; y = 0.24 + 0.104*i, x span 0.13–0.87. Trigger by index fingertip crossing; hysteresis ±0.012 normalized height, minimum vertical speed 0.12 image heights/s, per-string cooldown 95 ms, history gap 180 ms. Optional pinch threshold distance(4,8)/distance(0,9) < 0.43; distances are measured in image pixel scale.
- Synthesis: noise-filled ring buffer, period approximately sampleRate/frequency minus half a sample, adjacent-sample averaging and damping, amplitude based on vertical speed. String animation and latest note display. No external music recordings.
- v0.2 separates camera-only test from model initialization. Reports origin, secure context, media API, permissions policy, permission status, device count. Request user authorization; never bypass camera permissions.
- Source is currently single-file HTML; both historical versions retained with updated project branding. Historical v0.2 snapshot remains available.

## Limits and roadmap
1. P0: deploy HTTPS, validate camera-only then AI tracking on Android Chrome and desktop, verify front/back camera choice and portrait/landscape aspect ratio.
2. P1: improve track continuity, mirrored handedness, occlusion, jitter, cooldown and crossing interpolation; measure missed and false triggers. Avoid treating FPS as end-to-end latency.
3. P2: left hand chords/pitch and right hand pluck; configurable gesture thresholds, calibration, touch sound test, velocity and strum timing.
4. P3: dynamic string creation by two-hand pinch, tension/length and release, physically inspired vibration; investigate related work and cite any adopted material.
5. P4: modular instruments, scales, MIDI, recording with explicit consent, Web Worker/AudioWorklet performance work.

Monocular RGB provides no reliable absolute depth between hands. Start with 2D/2.5D interaction; calibrated stereo/depth sensors are optional future work. No performance or recognition accuracy claims without measurement.
