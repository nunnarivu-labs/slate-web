/** Index readable Markdown text alongside the title, without link destinations. */
export function buildSearchText(title: string, markdown: string): string {
  const text = markdown
    .replace(/<!--[^]*?-->/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*\[[^\]]+\]:.*$/gm, '')
    .replace(/!?\[([^\]]*)\]\[[^\]]*\]/g, '$1')
    .replace(/<\/?[a-z][\w-]*(?:\s[^>]*)?>/gi, ' ')
    .replace(/^\s*```[^\n]*$/gm, '')
    .replace(
      /^\s*(?:#{1,6}\s+|>\s*|[-*+]\s+(?:\[[ xX]\]\s*)?|\d+[.)]\s+)/gm,
      '',
    )
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `${title.trim()}\n${text}`.trim();
}
