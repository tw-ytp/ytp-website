import { defineConfig } from 'astro/config';

/** 移除 Markdown 內文裡的 HTML 註解。
 *  內容檔用 <!-- TODO: … --> 記錄待補事項，那是給維運者看的，
 *  不應該出現在正式站的 HTML 原始碼裡。 */
function stripHtmlComments() {
  return (tree) => {
    const walk = (node) => {
      if (!node.children) return;
      node.children = node.children.filter(
        (c) => !(c.type === 'html' && /^\s*<!--/.test(c.value))
      );
      node.children.forEach(walk);
    };
    walk(tree);
  };
}

export default defineConfig({
  site: 'https://www.tw-ytp.org',
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: { remarkPlugins: [stripHtmlComments] },
});
