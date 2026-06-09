import { useState } from 'react';
import './styles.css';
import classnames from 'classnames';

export const HtmlPreview = ({ html, maxHeight, scrollHeight }: { html: string, maxHeight?: boolean, scrollHeight?: number }) => {
  const [showFullHtml, setShowFullHtml] = useState(false);

  if (!html) return null;

  // Fixed-height scrollable mode (no click-to-expand) — used for hover popovers
  // that show full content capped to a height.
  if (scrollHeight) {
    return (
      <div
        className="text-sm text-[var(--mantine-color-text)] html-preview"
        style={{ maxHeight: scrollHeight, overflowY: 'auto' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  const classes = classnames('text-sm text-[var(--mantine-color-text)] html-preview py-2 rounded-md', {
    'max-h-[50px] overflow-y-hidden': maxHeight && !showFullHtml,
  });

  return (
    <div onClick={() => setShowFullHtml(!showFullHtml)}>
      <div
        style={{ pointerEvents: 'none' }}
        className={classes}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}