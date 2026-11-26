# Changelog

## v0.4.1
- Process and paint fresh camera frames, with a fallback for browsers without video frame callbacks. Pause camera processing in hidden tabs and discard stale gesture state before resuming.
- Reuse crossing state and group landmark drawing operations. Update tracking diagnostics less often than hand gestures.
- Skip flute frequency analysis for samples that cannot open or hold the breath gate. Keep full frequency analysis during calibration.
- Guard camera startup and frame callbacks against a completed stop or page navigation.

## v0.4
- Turn on pluck audio by default and unlock it on camera start. Make the 55 ms per-finger/string cooldown optional and off by default.
- Add open-palm string damping and chord-hold vibrato for a left-hand grip or a held screen button.
- Add an experimental flute with locally analysed microphone breath, six camera or screen finger holes, half-hole slides and an octave register.

## v0.3 — 2026-11-24
- Mirror off and joint labels on by default.
- Independent global any-hand / any-finger controls, default enabled; per-finger per-string cooldown and audio compression.
- 13 chords plus standard tuning, six active pitches, selectable via screen or air pads; persistent active chord, frequency display and audition.
- Portrait bottom / landscape left chord layout, 140 ms dwell, separate pluck area. Pure-logic checks run. [Pages deployment succeeded](https://github.com/xdxd-lab/air_music_studio/actions/runs/45381173185). Device validation remains pending.

## v0.2 — 2026-11-24
- Camera-only test and permission/environment diagnostics.
- Separate camera-stage and model-stage errors.
- User test: local Android content:// denied; HTTPS WebRTC control worked.
- Project renamed Air-Music Studio across published page titles, headings, filenames and documentation; references preserve external authors' titles.
- Static Pages entrypoint prepared and [deployed](https://github.com/xdxd-lab/air_music_studio/actions/runs/45371013539). Full on-device testing remains pending.

## v0.1
- Initial single-page camera/dual-hand landmark lab, optional six-string crossing and sound synthesis.
- Mirror, joint labels, finger coordinates, inference FPS and GPU/CPU fallback.
