/** 固定頁面（pages collection）的讀取與渲染輔助：模板呼叫 getPage('about') 取得 frontmatter（已套佔位字串）與 Content 元件。 */
import { getEntry, render } from 'astro:content';
import { interpolate } from './placeholders';

export async function getPage(id: string) {
  const entry = await getEntry('pages', id);
  if (!entry) throw new Error(`src/content/pages/${id}.md 不存在`);
  const { Content } = await render(entry);
  const d = entry.data;
  const t = (s?: string) => (s === undefined ? undefined : interpolate(s));
  return { Content, title: d.title, nav: d.nav, description: t(d.description), lead: t(d.lead), leadOpen: t(d.leadOpen), leadClosed: t(d.leadClosed), crumb: d.crumb, banner: d.banner };
}
