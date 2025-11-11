import { TaskStatusHistory, TaskStatus } from "@/types/task";
import { formatDistanceToNow, format } from "date-fns";
import { IconCircleCheck, IconClock, IconProgress, IconChevronDown, IconChevronsUp, IconChevronsDown, IconChevronUp } from "@tabler/icons-react";
import { useState } from "react";
import { Button, Box, Group, Text, Stack, ThemeIcon, Collapse, ActionIcon } from "@mantine/core";

interface StatusHistoryProps {
  history?: TaskStatusHistory[];
}

const statusConfig = {
  [TaskStatus.TODO]: {
    icon: IconClock,
    color: "gray",
    label: "To Do",
  },
  [TaskStatus.IN_PROGRESS]: {
    icon: IconProgress,
    color: "blue",
    label: "In Progress",
  },
  [TaskStatus.COMPLETED]: {
    icon: IconCircleCheck,
    color: "green",
    label: "Completed",
  },
};

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
        <Stack gap="xs" mb="sm">
          {visibleHistory.map((entry, index) => {
            const config = statusConfig[entry.status];
            const Icon = config.icon;
            const isLatest = index === 0;

            return (
              <Group
                key={entry.id}
                gap="sm"
                p="xs"
                style={{
                  borderRadius: '8px',
                  backgroundColor: isLatest ? 'var(--mantine-color-gray-0)' : 'transparent',
                  border: isLatest ? '1px solid var(--mantine-color-gray-3)' : 'none',
                }}
              >
                <ThemeIcon 
                  variant="light" 
                  color={config.color}
                  size="sm"
                >
                  <Icon size={14} />
                </ThemeIcon>
                <Text size="sm" fw={500}>
                  {config.label}
                </Text>
                <Text size="xs" c="dimmed">
                  {format(new Date(entry.changedAt), "MMM d, h:mm a")}
                </Text>
                <Text size="xs" c="dimmed" ml="auto">
                  {formatDistanceToNow(new Date(entry.changedAt), {
                    addSuffix: true,
                  })}
                </Text>
              </Group>
            );
          })}
        </Stack>

        <ViewMoreButton
          onClick={() => setShowAll(!showAll)}
          hasMore={hasMore}
          showAll={showAll}
        />
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

