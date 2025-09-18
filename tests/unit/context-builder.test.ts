import { describe, it, expect } from 'vitest';
import { assembleContext, sumIncludedTokens, ContextItem } from '@/lib/context-builder';

function mk(name: string, content: string, t: ContextItem['t'] = 'snippet', included = true, tokens = Math.ceil(content.length / 4)): ContextItem {
  return { t, name, content, included, tokens };
}

describe('context-builder', () => {
  it('sumIncludedTokens sums only included items', () => {
    const items = [
      mk('A', 'abcd'), // 1 token
      { ...mk('B', 'abcdabcd'), included: false }, // excluded 2 tokens
      mk('C', 'abcdefgh'), // 2 tokens
    ];
    expect(sumIncludedTokens(items)).toBe(1 + 2);
  });

  it('assembleContext text format combines with headers', () => {
    const items = [mk('Note1', 'hello'), mk('Note2', 'world')];
    const out = assembleContext(items, 'text');
    expect(out).toContain('---- Note1 [snippet] ----');
    expect(out).toContain('hello');
    expect(out).toContain('---- Note2 [snippet] ----');
    expect(out).toContain('world');
  });

  it('assembleContext xml format wraps in <context> and <item> tags with CDATA', () => {
    const items = [mk('N', 'alpha ]]> omega')];
    const out = assembleContext(items, 'xml');
    expect(out.startsWith('<context timestamp="')).toBe(true);
    expect(out).toContain('<item type="snippet" name="N"><![CDATA[');
    expect(out).toContain('alpha ] ]> omega'); // escaped to avoid raw ]]> inside CDATA
    expect(out).toContain(']]></item>');
    expect(out.endsWith('</context>')).toBe(true);
  });
});