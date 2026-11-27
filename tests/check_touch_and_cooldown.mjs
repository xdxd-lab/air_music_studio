import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const extract = name => html.match(new RegExp('^function '+name+'\\([\\s\\S]*?^}', 'm'))[0];
const setting = {checked:false};
let coarse = true;
const {passesCooldown, suppressTouchLongPress} = runInNewContext([
  extract('passesCooldown'), extract('suppressTouchLongPress'), '({passesCooldown, suppressTouchLongPress})'
].join('\n'), {
  $: () => setting, cooldowns:new Map(), matchMedia:q => ({matches: q === '(pointer:coarse)' && coarse})
});
assert.doesNotMatch(html.match(/<input[^>]+id="pluckCooldown"[^>]*>/)[0], /\bchecked\b/);
for (const t of [0, 1, 2]) assert.ok(passesCooldown('same finger:string 1', t));
setting.checked = true;
assert.ok(passesCooldown('same finger:string 1', 100));
assert.ok(!passesCooldown('same finger:string 1', 154));
assert.ok(passesCooldown('same finger:string 2', 126));
assert.ok(passesCooldown('another finger:string 1', 126));
assert.ok(passesCooldown('same finger:string 1', 155));
setting.checked = false;
assert.ok(passesCooldown('same finger:string 1', 156));

function suppressed({app=true, native=false, ...event}={}){
  let prevented = false;
  suppressTouchLongPress({
    target:{closest: test => test.startsWith('main') ? app : native},
    preventDefault:()=>{prevented=true;}, ...event
  });
  return prevented;
}
assert.ok(suppressed({pointerType:'touch'}));
assert.ok(suppressed());
assert.ok(suppressed({sourceCapabilities:{firesTouchEvents:true}}));
assert.ok(!suppressed({pointerType:'mouse'}));
assert.ok(!suppressed({pointerType:'touch', native:true}));
assert.ok(!suppressed({pointerType:'touch', app:false}));
coarse = false;
assert.ok(!suppressed());
assert.ok(suppressed({pointerType:'touch'}));
assert.match(html, /\['contextmenu', 'selectstart', 'dragstart'\][\s\S]*?document\.addEventListener\(type, suppressTouchLongPress/);
console.log('PASS: cooldown default-off, exact 55 ms opt-in, scoped touch menu and selection guard');
