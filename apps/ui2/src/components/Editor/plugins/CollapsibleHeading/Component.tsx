import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { IconChevronRight, IconChevronDown } from '@tabler/icons-react';
import { collapsePluginKey } from './Extension';

export function CollapsibleHeadingComponent({
  node,
  updateAttributes,
  editor,
}: NodeViewProps) {
  const level = node.attrs.level as number;
  const collapsed = node.attrs.collapsed as boolean;
  const textAlign = node.attrs.textAlign as string | undefined;

  const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    updateAttributes({ collapsed: !collapsed });

    // Signal the plugin to recalculate decorations
    const { tr } = editor.state;
    tr.setMeta(collapsePluginKey, true);
    editor.view.dispatch(tr);
  };

  return (
    <NodeViewWrapper
      as={HeadingTag}
      className="collapsible-heading"
      style={{ textAlign: textAlign || undefined }}
      data-collapsed={collapsed ? 'true' : undefined}
    >
      <NodeViewContent as="span" className="heading-content" />
      <button
        type="button"
        className="collapse-toggle"
        onClick={handleToggle}
        contentEditable={false}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand section' : 'Collapse section'}
      >
        {collapsed ? (
          <IconChevronRight size={16} />
        ) : (
          <IconChevronDown size={16} />
        )}
      </button>
    </NodeViewWrapper>
  );
}
