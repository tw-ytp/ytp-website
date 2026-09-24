// 同學姓名遮蔽規則（PLAN-v1 §2.2–2.3）。全站唯一的規則來源：
// 網站 schema 檢查、scripts/mask-names.ts 掃描替換、單元測試都 import 這支。
import { CLASSIC, TW_DOUBLE, TW_DOUBLE_UNCERTAIN } from './compound-surnames.ts';

/** 遮蔽字元。要改成「〇」只改這裡。 */
export const MASK = 'O';

export interface MaskResult {
  masked: string;
  /** false = 規則無法確定，必須人工複核 */
  certain: boolean;
  reason?: string;
}

const HAN = /[㐀-鿿豈-﫿]/;
const HAN_NAME = /^[㐀-鿿豈-﫿]+$/;
const INDIGENOUS_SEP = /[‧・·•]/;

function maskHan(name: string): MaskResult {
  // 原住民族名（漢字音譯，以「‧」分隔）：保留第一段，其餘各段以 MASK 取代
  if (INDIGENOUS_SEP.test(name)) {
    const sep = name.match(INDIGENOUS_SEP)![0];
    const [first, ...rest] = name.split(INDIGENOUS_SEP);
    return { masked: [first, ...rest.map(() => MASK)].join(sep), certain: true };
  }
  const n = [...name];
  const head2 = n.slice(0, 2).join('');
  switch (n.length) {
    case 1:
      return { masked: name, certain: false, reason: '只有一個字，無法判斷' };
    case 2: // 單姓＋單名：遮姓
      return { masked: MASK + n[1], certain: true };
    case 3:
      if (CLASSIC.includes(head2) || TW_DOUBLE.includes(head2)) return { masked: head2 + MASK, certain: true }; // 複姓＋單名
      if (TW_DOUBLE_UNCERTAIN.includes(head2))
        return { masked: head2 + MASK, certain: false, reason: `「${head2}」可能是雙姓，也可能是單姓＋名` };
      return { masked: n[0] + MASK + n[2], certain: true }; // 單姓＋雙名：遮中間
    case 4: { // 複姓／雙姓＋雙名：保留前兩字，遮名的第一字
      const known = CLASSIC.includes(head2) || TW_DOUBLE.includes(head2);
      return { masked: head2 + MASK + n[3], certain: known, reason: known ? undefined : `4 字但「${head2}」不在複姓清單` };
    }
    default: // 5 字以上：保留前兩字與最後一字，其餘遮蔽
      return { masked: head2 + MASK.repeat(n.length - 3) + n[n.length - 1], certain: false, reason: '5 字以上' };
  }
}

function maskLatin(name: string): MaskResult {
  const parts = name.split(/\s+/);
  if (parts.length === 1) return { masked: name, certain: false, reason: '只有一個英文字，無法判斷名與姓' };
  // 名＋姓首字母：Kevin Wang → Kevin W.；Pasuya Poiconx → Pasuya P.
  const last = parts[parts.length - 1];
  return { masked: `${parts[0]} ${last[0].toUpperCase()}.`, certain: parts.length === 2, reason: parts.length === 2 ? undefined : '3 段以上的英文名' };
}

/** 判斷是否已是遮蔽後的格式（冪等用，也是 schema 檢查的依據） */
export function isMasked(name: string): boolean {
  const s = name.trim();
  if (!s) return true;
  if (HAN.test(s)) return s.includes(MASK);                  // 中文名：含 MASK
  return /^[A-Z][A-Za-z'-]*\s[A-Z]\.$/.test(s);              // 英文名：Given F.
}

export function maskName(input: string): MaskResult {
  const name = input.trim();
  if (!name) return { masked: '', certain: true };
  if (isMasked(name)) return { masked: name, certain: true };
  if (HAN.test(name)) {
    // 同時有中文名與英文名：只保留遮蔽後的中文名
    const han = name.replace(/[A-Za-z][A-Za-z .'-]*/g, '').replace(/[()（）\s]/g, '');
    if (!HAN_NAME.test(han.replace(INDIGENOUS_SEP, ''))) return { masked: name, certain: false, reason: '含無法辨識的字元' };
    return maskHan(han);
  }
  return maskLatin(name);
}
