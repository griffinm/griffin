import Heading from '@tiptap/extension-heading';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { CollapsibleHeadingComponent } from './Component';

export const collapsePluginKey = new PluginKey('collapsibleHeading');

function findCollapsedSectionEnd(
  doc: ProseMirrorNode,
  startPos: number,
  level: number
): number {
  let endPos = doc.content.size;

  doc.nodesBetween(startPos, doc.content.size, (node, pos) => {
    // If we find a heading with same or higher level (lower number), stop here
    if (node.type.name === 'heading' && node.attrs.level <= level) {
      endPos = pos;
      return false; // Stop iteration
    }
    return true;
  });

  return endPos;
}

function computeHiddenDecorations(doc: ProseMirrorNode): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (node.type.name === 'heading' && node.attrs.collapsed) {
      const level = node.attrs.level;
      const contentStart = pos + node.nodeSize;
      const endPos = findCollapsedSectionEnd(doc, contentStart, level);

      // Add decorations for each block node in the collapsed range
      if (contentStart < endPos) {
        doc.nodesBetween(contentStart, endPos, (childNode, childPos) => {
          if (childNode.isBlock && childPos >= contentStart && childPos < endPos) {
            decorations.push(
              Decoration.node(childPos, childPos + childNode.nodeSize, {
                class: 'collapsed-content',
              })
            );
            return false; // Don't descend into this node's children
          }
          return true;
        });
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}

export const CollapsibleHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      collapsed: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-collapsed') === 'true',
        renderHTML: (attributes) => {
          if (!attributes.collapsed) {
            return {};
          }
          return { 'data-collapsed': 'true' };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CollapsibleHeadingComponent);
  },

  addProseMirrorPlugins() {
    const parentPlugins = this.parent?.() || [];

    return [
      ...parentPlugins,
      new Plugin({
        key: collapsePluginKey,
        state: {
          init(_, { doc }) {
            return computeHiddenDecorations(doc);
          },
          apply(tr, oldDecorations, _oldState, newState) {
            // Recalculate if document changed or collapse was toggled
            if (tr.docChanged || tr.getMeta(collapsePluginKey)) {
              return computeHiddenDecorations(newState.doc);
            }
            return oldDecorations.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return collapsePluginKey.getState(state);
          },
        },
      }),
    ];
  },
});
