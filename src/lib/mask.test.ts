// 執行：npm run test:mask
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maskName, isMasked, MASK } from './mask.ts';

const m = (s: string) => maskName(s).masked;

test('PLAN §2.2 中文姓名', () => {
  assert.equal(m('劉徹'), 'O徹');           // 單姓＋單名：遮姓
  assert.equal(m('王彦仁'), '王O仁');       // 單姓＋雙名：遮中間
  assert.equal(m('歐陽修'), '歐陽O');       // 複姓＋單名
  assert.equal(m('歐陽大凱'), '歐陽O凱');   // 複姓＋雙名
  assert.equal(m('張簡志明'), '張簡O明');   // 雙姓＋雙名
  assert.equal(m('張簡明'), '張簡O');
});

test('PLAN §2.3 英文名與原住民族名', () => {
  assert.equal(m('王彦仁 Kevin Wang'), '王O仁');      // 中英並列只留中文
  assert.equal(m('Kevin Wang'), 'Kevin W.');
  assert.equal(m('Yen-Jen Wang'), 'Yen-Jen W.');
  assert.equal(m('Pasuya Poiconx'), 'Pasuya P.');
  assert.equal(m('巴蘇亞‧博伊哲努'), '巴蘇亞‧O');
});

test('邊界情況', () => {
  assert.equal(m(''), '');
  assert.equal(m('  王彦仁  '), '王O仁');     // 前後空白
  assert.equal(m('王O仁'), '王O仁');          // 冪等
  assert.equal(m('O徹'), 'O徹');
  assert.equal(m('Kevin W.'), 'Kevin W.');
  assert.equal(m(m('歐陽大凱')), '歐陽O凱');
});

test('無法確定者標記人工複核', () => {
  assert.equal(maskName('黃林明').certain, false);   // 可能是雙姓
  assert.equal(maskName('李王大明').certain, false);  // 4 字不在複姓清單
  assert.equal(maskName('Kevin').certain, false);
  assert.equal(maskName('王彦仁').certain, true);
});

test('isMasked', () => {
  assert.ok(isMasked(`王${MASK}仁`));
  assert.ok(!isMasked('王彦仁'));
  assert.ok(isMasked('Kevin W.'));
  assert.ok(!isMasked('Kevin Wang'));
});
