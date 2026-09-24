// 複姓清單（PLAN-v1 §2.2）。3 字姓名先比對此表，命中才視為「複姓＋單名」。
// CLASSIC：歷史複姓，判定可信。TW_DOUBLE：台灣常見雙姓（冠姓、雙姓並列）；
// 其中 TW_DOUBLE_UNCERTAIN 也可能只是「單姓＋名字第一字」，命中時列入人工複核。
export const CLASSIC = ['歐陽', '司馬', '諸葛', '上官', '東方', '皇甫', '司徒', '夏侯', '公孫', '令狐', '長孫', '慕容', '尉遲', '端木', '呼延', '宇文', '鍾離'];
export const TW_DOUBLE = ['張簡', '范姜', '張廖'];
export const TW_DOUBLE_UNCERTAIN = ['周黃', '簡林', '劉張', '陳吳', '江謝', '黃林'];
export const COMPOUND_SURNAMES = [...CLASSIC, ...TW_DOUBLE, ...TW_DOUBLE_UNCERTAIN];
