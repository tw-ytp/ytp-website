import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { isMasked } from './lib/mask.ts';
import { normalizeTags } from './lib/tags.ts';

// 同學姓名遮蔽檢查（PLAN §2.5-4）：開啟後，學生欄位出現未遮蔽的全名，建置直接失敗。
// 預設開啟（2026-09-24 套用遮蔽後）。緊急情況可用 YTP_MASK_GUARD=off 暫時關閉，但不得以此狀態部署。
// 注意：Astro 會快取已驗證的內容，切換此開關後請先刪除 .astro/ 再建置。
const MASK_GUARD = (process.env.YTP_MASK_GUARD ?? 'on') === 'on';
const studentName = z.string().refine(s => !MASK_GUARD || isMasked(s), { message: '同學姓名未遮蔽（見 PLAN-v1 §2、npm run mask）' });

// 內容狀態：revised = 正常；todo = 內容待補（頁面顯示黃色提示，仍會上線）；excerpt = 只有摘錄（舊站搬遷時用，現無）。
// migrated 是 2026-09 搬遷時的註記，2026-10-28 已整批改為 revised，保留在 enum 只為相容舊檔。上下稿一律用 draft。
const status = z.enum(['migrated', 'excerpt', 'todo', 'revised']).default('revised');

// 上稿／下稿機制（2026-10）：
//   draft: true  = 草稿／下架，正式站「完全不建置」這一筆（沒有網址、不進列表、不進搜尋索引）。
//   draft 未填或 false = 上稿。
//   預覽：PUBLIC_SHOW_DRAFTS=true（Cloudflare Pages 的 Preview 環境變數）或 astro dev 會建出草稿並加上「草稿」標示。
//   status（內容狀態）不影響上下稿。
const SHOW_DRAFTS = process.env.PUBLIC_SHOW_DRAFTS === 'true' || process.env.NODE_ENV !== 'production';
const draft = z.boolean().default(false);
/** glob loader 的包裝：載入後把 draft 的項目從 store 移除，所有 getCollection() 呼叫就都看不到草稿，頁面不必各自過濾。 */
const published = (base: string) => {
  const inner = glob({ pattern: '**/*.md', base });
  return {
    name: 'glob-published',
    load: async (ctx: Parameters<typeof inner.load>[0]) => {
      await inner.load(ctx);
      if (SHOW_DRAFTS) return;
      for (const [id, entry] of ctx.store.entries()) if ((entry.data as { draft?: boolean }).draft) ctx.store.delete(id);
    },
  };
};

const news = defineCollection({
  loader: published('./src/content/news'),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    edition: z.number().optional(),
    kind: z.enum(['announcement', 'recap', 'notice']).default('announcement'),
    status,
    draft,
    source_url: z.string().optional(),
  }),
});

const stories = defineCollection({
  loader: published('./src/content/stories'),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    author: z.string(),   // 學員故事（專訪、本人自撰）已徵得同意刊登，保留全名，不套用遮蔽檢查
    school: z.string().optional(),
    cohort: z.string().optional(),
    trip: z.string().optional(),
    kind: z.enum(['overseas', 'interview']).default('overseas'),  // overseas=海外參訪心得；interview=少年圖靈的故事訪談
    cover: z.string().optional(),   // 列表卡片的封面圖（站內路徑）；沒填就用類型色帶
    status,
    draft,
    source_url: z.string().optional(),
  }),
});

const projects = defineCollection({
  loader: published('./src/content/projects'),
  schema: z.object({
    title: z.string(),
    // 作品出處（軌道）：stage2-project = 第 1–10 屆第二階段專題實作；stage2-hackathon = 第 11 屆起第二階段 YTP{年}H2黑客松；
    // turing-plus = 青年圖靈++ 的活動（目前為 YTP{年}黑客松）
    source: z.enum(['stage2-project', 'stage2-hackathon', 'turing-plus']).default('stage2-project'),
    event: z.string().optional(),        // 黑客松作品：turing-plus 填年度（'2026'），stage2-hackathon 填屆次（'11'）
    group: z.enum(['youth', 'senior', 'junior']).optional(),   // 黑客松組別
    team: z.string().optional(),         // 隊名
    theme: z.string().optional(),        // 賽題
    stack: z.string().optional(),        // 技術棧一句話
    advisor: z.string().optional(),      // 指導教授
    edition: z.number(),
    year: z.number(),
    rank: z.number().default(0),
    tags: z.array(z.string()).default([]).transform(normalizeTags),   // 別名 → 正規標籤（src/lib/tags.ts），篩選與搜尋共用
    members: z.array(z.object({ name: studentName, school: z.string() })).default([]),
    overseasReps: z.array(studentName).default([]),
    github: z.string().default(''),
    demo: z.string().default(''),
    poster: z.string().default(''),
    status,
    draft,
    source_url: z.string().optional(),
  }),
});

const faq = defineCollection({
  loader: published('./src/content/faq'),
  schema: z.object({
    question: z.string(),
    audience: z.enum(['student', 'parent', 'teacher']),
    section: z.string(),
    order: z.number(),
    status,
    draft,
  }),
});

const hub = defineCollection({
  loader: published('./src/content/hub'),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    type: z.enum(['solution', 'guide', 'video']),
    year: z.number().optional(),
    group: z.enum(['junior', 'senior', 'both']).default('both'),
    video_url: z.string().default(''),
    status,
    draft,
  }),
});

// 黑客松共用欄位：青年圖靈++ 的 YTP{年}黑客松，與少年圖靈計畫第 11 屆起第二階段的 YTP{年}H2黑客松，共用同一套版面
const ymd = z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, '日期格式須為 YYYY、YYYY-MM 或 YYYY-MM-DD');
const hackathonFields = {
  title: z.string(),
  label: z.string(),                       // 短標，如「2026 上半年」
  state: z.enum(['archived', 'upcoming', 'planning']),
  regStart: ymd.optional(),                // 報名開始日：時間軸上這一場的起點
  start: ymd.optional(),                   // 競賽開始日（機器可讀），供時間軸使用；未定則留空
  end: ymd.optional(),
  tagline: z.string().optional(),
  period: z.string(),                      // 顯示用競賽期間
  venue: z.string().optional(),
  organizer: z.string().optional(),
  coOrganizers: z.array(z.string()).default([]),
  partners: z.array(z.string()).default([]),     // 合作單位
  themes: z.array(z.object({ name: z.string(), detail: z.string() })).default([]),
  groups: z.array(z.string()).default([]),
  eligibility: z.array(z.string()).default([]),
  timeline: z.array(z.object({ date: z.string(), label: z.string(), detail: z.string().optional() })).default([]),
  judging: z.array(z.object({ name: z.string(), weight: z.string() })).default([]),
  prizes: z.array(z.object({ group: z.string(), items: z.array(z.string()) })).default([]),
  links: z.object({
    brochure: z.string().optional(), briefingVideo: z.string().optional(),
    registerYouth: z.string().optional(), registerSenior: z.string().optional(),
    github: z.string().optional(), recapPdf: z.string().optional(), original: z.string().optional(),
  }).default({}),
  stats: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  banner: z.string().optional(),                 // 主視覺橫幅（站內路徑）
  logo: z.string().optional(),                   // 活動 logo，白字透明底，需深色底才看得見
  partnerLogos: z.array(z.object({ image: z.string(), alt: z.string() })).default([]), // 單位 logo 圖，白字透明底，標題已燒在圖上
  status,
  draft,
};

// 青年圖靈++：YTP 校友的年度活動，每年上半年，檔名 = 年度（2026.md → /turing-plus/2026/）。2026 為第 1 場。
const turingPlus = defineCollection({
  loader: published('./src/content/turing-plus'),
  schema: z.object({ ...hackathonFields, year: z.number().optional() }),
});

// 少年圖靈計畫第二階段（第 11 屆起）：YTP{年}H2黑客松，檔名 = 屆次（11.md → /cohorts/11/hackathon/）
const stageHackathons = defineCollection({
  loader: published('./src/content/stage-hackathons'),
  schema: z.object({ ...hackathonFields, edition: z.number() }),
});

// 少年圖靈計畫：每屆三階段，每屆一檔（01.md … 11.md）。首頁時間軸、屆次頁、計畫總覽都從這裡讀。
const cohortEvent = z.object({
  name: z.string(),                        // 子活動名稱：線上初賽、程式挑戰營、專題實作期間、成果發表、海外參訪選拔、海外參訪出訪…
  start: ymd.optional(),                   // 未知就留空，頁面顯示「日期待補」；不得推估
  end: ymd.optional(),
  note: z.string().optional(),             // 公開顯示的補充說明
});
const cohorts = defineCollection({
  loader: published('./src/content/cohorts'),
  schema: z.object({
    edition: z.number(),
    year: z.number(),
    era: z.enum(['project', 'hackathon']),   // project = 第 1–10 屆（第二階段專題實作）；hackathon = 第 11 屆起（第二階段黑客松）
    stages: z.array(z.object({
      phase: z.number().int().min(1).max(3),
      type: z.enum(['camp', 'project', 'hackathon', 'overseas']),
      title: z.string(),
      events: z.array(cohortEvent).default([]),
      note: z.string().optional(),
    })).length(3),
    status,
  }),
});

// 網站固定頁面（關於、計畫介紹、報名、規則…）：一頁一檔，正文 Markdown 可在後台改；頁面不可新增或刪除（版面在 src/pages 對應的模板裡）。
// 正文與 lead 可用 {{season.edition}} 等佔位字串（src/lib/placeholders.ts）。
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    nav: z.string().optional(),            // 選單／麵包屑用的短名
    description: z.string().optional(),    // SEO
    lead: z.string().optional(),
    leadOpen: z.string().optional(),       // 報名頁：報名期間的 lead
    leadClosed: z.string().optional(),     // 報名頁：非報名期間的 lead
    crumb: z.string().optional(),
    banner: z.string().optional(),         // public/banners/{banner}-1800.webp
  }),
});

export const collections = { pages, news, stories, projects, faq, hub, turingPlus, stageHackathons, cohorts };
