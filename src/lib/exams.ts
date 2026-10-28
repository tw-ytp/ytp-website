/** 歷年考古題（exams collection）的排序：年份新→舊、高中組在國中組前、階段依 初賽→復活賽→挑戰營→國際賽。 */
import { getCollection } from 'astro:content';
const GROUP = { senior: 0, junior: 1 } as const;
const STAGE = { prelim: 0, revival: 1, camp: 2, international: 3 } as const;
export const STAGE_NAME = { camp: '程式挑戰營', prelim: '線上初賽', revival: '線上復活賽', international: '國際賽（APAC）' } as const;
export const GROUP_NAME = { senior: '高中職五專組', junior: '國中組' } as const;
export async function getExams() {
  const all = await getCollection('exams');
  return all.map(e => e.data).sort((a, b) => b.year - a.year || GROUP[a.group] - GROUP[b.group] || STAGE[a.stage] - STAGE[b.stage]);
}
