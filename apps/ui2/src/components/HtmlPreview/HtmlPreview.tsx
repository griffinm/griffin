import { useState } from 'react';
import './styles.css';
import classnames from 'classnames';

export const HtmlPreview = ({ html, maxHeight }: { html: string, maxHeight?: boolean }) => {
  if (!html) return null;
  const [showFullHtml, setShowFullHtml] = useState(false);

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