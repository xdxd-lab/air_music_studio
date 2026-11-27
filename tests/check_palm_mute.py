"""Run the palm-hold regression against the inline application script."""

from pathlib import Path
import re
import shutil
import subprocess
from tempfile import TemporaryDirectory


APP = Path(__file__).resolve().parents[1] / "index.html"
JSC = Path("/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc")

STUBS = """
const cv = {width: 960, height: 540};
const geometry = {lo: .14, hi: .96, ys: [.12, .222, .324, .426, .528, .63]};
const elements = {
  palmMute: {checked: true}, strings: {checked: true},
  role: {value: 'Right'}, pinch: {checked: false}
};
const $ = id => elements[id];
const px = point => point.x;
const dist = (a, b) => Math.hypot((a.x - b.x) * cv.width, (a.y - b.y) * cv.height);
const palmCandidates = new Map(), history = new Map(), cooldowns = new Map();
const flash = Array(6).fill(0);
let mutedUntil = -Infinity, stringsMuted = false, flute = null, chordGrip = null;
let plucks = 0, silences = 0, restores = 0;
const trackHands = result => result.rows;
const settings = () => ({anyHand: true, anyFinger: true});
const selectAirChords = () => {};
const detectPlucks = () => { plucks++; };
const showStringGesture = () => {};
const reportTracking = () => {};
const silenceStrings = () => { silences++; };
const restoreStringOutput = () => { restores++; };
"""

CHECKS = """
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const coordinates = [
  [.5,.55], [.46,.53], [.42,.51], [.37,.47], [.33,.44],
  [.44,.48], [.43,.40], [.42,.32], [.41,.24], [.48,.46],
  [.48,.37], [.48,.29], [.48,.21], [.52,.46], [.53,.38],
  [.54,.30], [.55,.23], [.56,.48], [.58,.41], [.60,.35], [.62,.29]
];
const hand = coordinates.map(([x, y]) => ({x, y, z: 0}));
const rows = [{id: 7, hand, label: 'Right'}];
const tick = time => report({rows}, time);
assert(isOpenPalm(hand, cv.width / cv.height), 'Synthetic hand must qualify as open');

for (const time of [0, 100, 200, 300, 400, 499]) tick(time);
assert(!stringsMuted && silences === 0, '499 ms must leave strings unmuted');
assert(plucks === 6, 'All six frames before the threshold must allow pluck detection');
tick(500);
assert(stringsMuted && silences === 1 && plucks === 6, '500 ms must silence and block plucks');

report({rows: []}, 550);
for (const time of [551, 651, 751, 851, 951, 1050]) tick(time);
assert(!stringsMuted && silences === 1 && restores === 1, 'Loss of tracking must restart the hold');
tick(1051);
assert(stringsMuted && silences === 2, 'The replacement hold must mute after its own 500 ms');
elements.palmMute.checked = false;
tick(1052);
assert(!stringsMuted && restores === 2, 'Switching off palm mute must restore output');

elements.palmMute.checked = true;
const outside = hand.map(point => ({...point, x: point.x - .4}));
for (const time of [2000, 2100, 2200, 2300, 2400]) tick(time);
report({rows: [{...rows[0], hand: outside}]}, 2450);
for (const time of [2500, 2600, 2700, 2800, 2900, 2999]) tick(time);
assert(!stringsMuted && silences === 2, 'Leaving the string area must restart the hold');
tick(3000);
assert(stringsMuted && silences === 3, 'A full new hold in the string area must mute');
report({rows: []}, 3099);
assert(stringsMuted, 'Release grace must hold before 100 ms since the last qualifying frame');
report({rows: []}, 3100);
assert(!stringsMuted && restores === 3, 'Release grace must end at 100 ms');

for (const time of [4000, 4100, 4200, 4300, 4400]) tick(time);
for (const time of [4600, 4700, 4800, 4900, 5000, 5099]) tick(time);
assert(!stringsMuted, 'A gap with no new frames must not count toward the hold');
tick(5100);
assert(stringsMuted && silences === 4, 'A continuous hold after the frame gap must mute');

(typeof print === 'function' ? print : console.log)('PASS: 500 ms hold, pluck routing, tracking and area resets, and release grace');
"""


def main():
    engine = shutil.which("node")
    if engine is None and JSC.exists():
        engine = str(JSC)
    if engine is None:
        raise SystemExit("Install Node.js or run on macOS with JavaScriptCore's jsc.")

    source = APP.read_text(encoding="utf-8")
    names = ("fingerExtension", "isOpenPalm", "updatePalmMute", "report")
    snippets = []
    for name in names:
        match = re.search(r"^function " + name + r"\(.*?^}", source, re.MULTILINE | re.DOTALL)
        if not match:
            raise SystemExit(f"Could not extract {name} from {APP.name}")
        snippets.append(match[0])
    for pattern in (r"^const clamp = [^\n]+", r"^const PALM_MUTE_HOLD_MS = [^\n]+"):
        match = re.search(pattern, source, re.MULTILINE)
        if not match:
            raise SystemExit(f"Could not extract a palm-mute dependency from {APP.name}")
        snippets.append(match[0])

    with TemporaryDirectory() as directory:
        script = Path(directory) / "check_palm_mute.js"
        script.write_text("\n".join([STUBS, *snippets, CHECKS]), encoding="utf-8")
        subprocess.run([engine, str(script)], check=True)


if __name__ == "__main__":
    main()
