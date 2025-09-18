export type ContextItem = {
  t: 'file' | 'snippet' | 'note';
  name: string;
  content: string;
  included: boolean;
  tokens: number;
};

export type ContextFormat = 'text' | 'xml';

export function sumIncludedTokens(items: Array<Pick<ContextItem, 'included' | 'tokens'>>): number {
  return items.filter(i => i.included).reduce((sum, i) => sum + (i.tokens || 0), 0);
}

function escapeForCdata(s: string): string {
  // Keep consistent with existing inline logic: avoid literal ']]>' inside CDATA by spacing
  return s.replace(/]]>/g, '] ]>');
}

export function assembleContext(items: ContextItem[], fmt: ContextFormat): string {
  const list = items.filter(i => i.included);
  if (fmt === 'text') {
    return list.map(i => `---- ${i.name} [${i.t}] ----\n${i.content}\n`).join("\n");
  }
  const ts = new Date().toISOString();
  return `<context timestamp="${ts}">` +
    list.map(i => `<item type="${i.t}" name="${i.name}"><![CDATA[${escapeForCdata(i.content)}]]></item>`).join('') +
    `</context>`;
}