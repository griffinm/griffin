import Heading from '@tiptap/extension-heading';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { CollapsibleHeadingComponent } from './Component';

export const collapsePluginKey = new PluginKey('collapsibleHeading');

function findCollapsedSectionEnd(
  doc: ProseMirrorNode,
  headingPos: number,
  level: number
): number {
  // Find the index of the heading node in the doc
  let currentPos = 0;
  let headingIndex = -1;

  for (let i = 0; i < doc.childCount; i++) {
    if (currentPos === headingPos) {
      headingIndex = i;
      break;
    }
    currentPos += doc.child(i).nodeSize;
  }

  if (headingIndex === -1) {
    return doc.content.size;
  }

  // Start from the node after the heading
  currentPos = headingPos + doc.child(headingIndex).nodeSize;

  for (let i = headingIndex + 1; i < doc.childCount; i++) {
    const node = doc.child(i);
    // Stop at next heading of same or higher level (lower number)
    if (node.type.name === 'heading' && node.attrs.level <= level) {
      return currentPos;
    }
    currentPos += node.nodeSize;
  }

  return doc.content.size;
}

function computeHiddenDecorations(doc: ProseMirrorNode): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (node.type.name === 'heading' && node.attrs.collapsed) {
      const level = node.attrs.level;
      const contentStart = pos + node.nodeSize;
      const endPos = findCollapsedSectionEnd(doc, pos, level);

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
          init() {
            // Always start with nothing collapsed when opening a note
            return DecorationSet.empty;
          },
          apply(tr, oldDecorations, _oldState, newState) {
            // Only recalculate when user explicitly toggles collapse
            if (tr.getMeta(collapsePluginKey)) {
              return computeHiddenDecorations(newState.doc);
            }
            // On doc changes, map existing decorations to new positions (preserves collapse state)
            if (tr.docChanged) {
              return oldDecorations.map(tr.mapping, newState.doc);
            }
            return oldDecorations;
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
