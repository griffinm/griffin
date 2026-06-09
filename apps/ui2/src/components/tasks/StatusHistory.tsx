import { TaskStatusHistory } from "@/types/task";
import { formatDistanceToNow, format } from "date-fns";
import { IconChevronsUp, IconChevronsDown, IconChevronUp, IconChevronDown } from "@tabler/icons-react";
import { useState } from "react";
import { Button, Box, Group, Text, ActionIcon, Collapse } from "@mantine/core";
import { statusMeta } from "./taskVisuals";

interface StatusHistoryProps {
  history?: TaskStatusHistory[];
}

const MAX_VISIBLE_ITEMS = 3;

export function StatusHistory({ history }: StatusHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!history || history.length === 0) {
    return null;
  }

  const visibleHistory = showAll ? history : history.slice(0, MAX_VISIBLE_ITEMS);
  const hasMore = history.length > MAX_VISIBLE_ITEMS;

  return (
    <Box>
      <Group 
        gap="xs" 
        style={{ cursor: 'pointer' }}
        onClick={() => setIsExpanded(!isExpanded)}
        mb="sm"
      >
        <ActionIcon 
          variant="subtle" 
          color="gray" 
          size="sm"
        >
          {isExpanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        </ActionIcon>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase">
          Status History ({history.length})
        </Text>
      </Group>
      
      <Collapse in={isExpanded}>
        <div className="relative mb-3 pl-5">
          {/* timeline rail */}
          <span className="absolute bottom-2 left-[5px] top-2 w-px bg-[var(--at-line)]" />
          {visibleHistory.map((entry) => {
            const meta = statusMeta(entry.status);
            return (
              <div key={entry.id} className="relative flex items-center justify-between py-1.5">
                <span
                  className={`absolute -left-[15px] h-2.5 w-2.5 rounded-full ring-2 ring-[var(--mantine-color-body)] ${meta.dotClass}`}
                />
                <div className="flex min-w-0 items-center gap-2">
                  <Text size="sm" fw={500}>
                    {meta.label}
                  </Text>
                  <span className="task-meta text-[10px] text-[var(--mantine-color-dimmed)]">
                    {format(new Date(entry.changedAt), "MMM d, h:mm a")}
                  </span>
                </div>
                <span className="task-meta shrink-0 text-[10px] text-[var(--mantine-color-dimmed)]">
                  {formatDistanceToNow(new Date(entry.changedAt), { addSuffix: true })}
                </span>
              </div>
            );
          })}
        </div>

        <ViewMoreButton onClick={() => setShowAll(!showAll)} hasMore={hasMore} showAll={showAll} />
      </Collapse>
    </Box>
  );
}

export const ViewMoreButton = ({
  onClick,
  hasMore,
  showAll,
}: {
  onClick: () => void;
  hasMore: boolean;
  showAll: boolean;
}) => {
  if (!hasMore) {
    return null;
  }

  const buttonText = showAll ? "View less" : "View full history";
  const buttonIcon = showAll ? <IconChevronsUp size={14} /> : <IconChevronsDown size={14} />;
  
  return (
    <Button
      onClick={onClick}
      variant="subtle"
      color="gray"
      size="xs"
      leftSection={buttonIcon}
    >
      {buttonText}
    </Button>
  );
};

