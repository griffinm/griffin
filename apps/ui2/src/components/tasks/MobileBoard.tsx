import { useRef, useState } from 'react';
import { ActionIcon } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { TaskStatus, Task } from '@/types/task';
import { TaskColumn } from './TaskColumn';

export interface BoardColumn {
  status: TaskStatus;
  title: string;
}

interface MobileBoardProps {
  columns: BoardColumn[];
  searchTasks?: Task[];
  selectedPriorities?: string[];
  selectedTags?: string[];
}

/**
 * Mobile board: a horizontal scroll-snap pager. Swipe (or use the chevrons /
 * dot indicators) to move between status columns. Status changes happen via the
 * inline control on each card, since horizontal swipe owns the touch gesture.
 */
export function MobileBoard({ columns, searchTasks, selectedPriorities, selectedTags }: MobileBoardProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const scrollTo = (index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(columns.length - 1, index));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
    setActive(clamped);
  };

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== active) setActive(index);
  };

  return (
    <div className="mt-3 flex flex-col">
      {/* Pager header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <ActionIcon
          variant="subtle"
          color="gray"
          radius="xl"
          disabled={active === 0}
          onClick={() => scrollTo(active - 1)}
          aria-label="Previous column"
        >
          <IconChevronLeft size={18} />
        </ActionIcon>

        <div className="flex flex-col items-center gap-2">
          <span className="font-display text-base font-medium text-[var(--mantine-color-text)]">
            {columns[active]?.title}
          </span>
          <div className="flex items-center gap-1.5">
            {columns.map((column, index) => (
              <button
                key={column.status}
                type="button"
                aria-label={column.title}
                onClick={() => scrollTo(index)}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  index === active ? 'w-5 bg-[var(--at-accent)]' : 'w-1.5 bg-[var(--mantine-color-default-border)]'
                }`}
              />
            ))}
          </div>
        </div>

        <ActionIcon
          variant="subtle"
          color="gray"
          radius="xl"
          disabled={active === columns.length - 1}
          onClick={() => scrollTo(active + 1)}
          aria-label="Next column"
        >
          <IconChevronRight size={18} />
        </ActionIcon>
      </div>

      {/* Snap scroller */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="task-column-scroll flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
        style={{ touchAction: 'pan-x' }}
      >
        {columns.map((column) => (
          <div
            key={column.status}
            className="h-[calc(100vh-250px)] min-h-[320px] w-full min-w-full shrink-0 snap-center snap-always px-0.5"
          >
            <TaskColumn
              status={column.status}
              title={column.title}
              mobile
              hideHeader
              searchTasks={searchTasks}
              selectedPriorities={selectedPriorities}
              selectedTags={selectedTags}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
