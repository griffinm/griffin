import { useRef, useState, useEffect } from 'react';
import { useTabsContext } from '@/providers/TabsProvider';
import { Tab } from './Tab';
import { OverflowMenu } from './OverflowMenu';

const TAB_WIDTH = 130; // Approximate width of each tab including gap
const OVERFLOW_BUTTON_WIDTH = 50; // Width reserved for overflow button

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabsContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (tabs.length === 0) {
    return null;
  }

  // Calculate how many tabs can fit
  // First check if all tabs fit without needing the overflow menu
  const tabsWithoutOverflow = Math.max(1, Math.floor(containerWidth / TAB_WIDTH));

  let visibleTabs;
  let overflowTabs;

  if (tabsWithoutOverflow >= tabs.length) {
    // All tabs fit, no overflow needed
    visibleTabs = tabs;
    overflowTabs = [];
  } else {
    // Need overflow menu - reserve space for it
    const availableWidth = containerWidth - OVERFLOW_BUTTON_WIDTH;
    const maxVisibleTabs = Math.max(1, Math.floor(availableWidth / TAB_WIDTH));
    visibleTabs = tabs.slice(0, maxVisibleTabs);
    overflowTabs = tabs.slice(maxVisibleTabs);
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        height: '100%',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {visibleTabs.map((tab) => (
          <Tab
            key={tab.noteId}
            noteId={tab.noteId}
            title={tab.title}
            isActive={activeTabId === tab.noteId}
            onClick={() => setActiveTab(tab.noteId)}
            onClose={() => closeTab(tab.noteId)}
          />
        ))}
      </div>

      {overflowTabs.length > 0 && (
        <OverflowMenu
          tabs={overflowTabs}
          activeTabId={activeTabId}
          onTabClick={setActiveTab}
          onTabClose={closeTab}
        />
      )}
    </div>
  );
}
