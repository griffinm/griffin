import { parse, NodeType, type HTMLElement, type Node, type TextNode } from 'node-html-parser';

// HTML void elements have no children and no closing tag.
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface TruncateState {
  remaining: number;
}

const serializeChildren = (parent: Node, state: TruncateState): string => {
  let out = '';
  for (const child of parent.childNodes) {
    if (state.remaining <= 0) break;
    out += serializeNode(child, state);
  }
  return out;
};

const serializeNode = (node: Node, state: TruncateState): string => {
  if (state.remaining <= 0) return '';

  if (node.nodeType === NodeType.TEXT_NODE) {
    const text = (node as TextNode).text; // entity-decoded visible text
    if (text.length <= state.remaining) {
      state.remaining -= text.length;
      return node.toString(); // raw text, preserves original entities
    }
    // Budget runs out mid-text: cut at the boundary and finish with an ellipsis.
    const slice = text.slice(0, state.remaining);
    state.remaining = 0;
    return escapeHtml(slice) + '…';
  }

  if (node.nodeType === NodeType.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tag = el.rawTagName;
    // Root/fragment node has no tag — just walk its children.
    if (!tag) return serializeChildren(el, state);

    const openTag = `<${tag}${el.rawAttrs ? ` ${el.rawAttrs}` : ''}>`;
    if (VOID_TAGS.has(tag.toLowerCase())) return openTag;

    // Emit the inner content first; the closing tag below is what keeps the
    // output well-formed even when the budget runs out deep inside this element.
    const inner = serializeChildren(el, state);
    return `${openTag}${inner}</${tag}>`;
  }

  // Comments and anything else are dropped from the preview.
  return '';
};

/**
 * Build a short, well-formed HTML excerpt of a note's content for list/card previews.
 *
 * Keeps whole subtrees while a visible-character budget remains and only ever cuts
 * inside a text node, so the result can never contain a broken or unclosed tag.
 * Returns the input unchanged when it is null/empty.
 */
export function buildNotePreview(content: string | null, maxChars = 300): string | null {
  if (!content) return content;

  const root = parse(content);
  const html = serializeChildren(root, { remaining: maxChars }).trim();
  return html || null;
}
