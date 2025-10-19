import { TaskStatusHistory, TaskStatus } from "@/types/task";
import { formatDistanceToNow, format } from "date-fns";
import { IconCircleCheck, IconClock, IconProgress, IconChevronDown, IconChevronsUp, IconChevronsDown } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@mantine/core";

interface StatusHistoryProps {
  history?: TaskStatusHistory[];
}

const statusConfig = {
  [TaskStatus.TODO]: {
    icon: IconClock,
    color: "text-gray-500",
    bgColor: "bg-gray-100",
    label: "To Do",
  },
  [TaskStatus.IN_PROGRESS]: {
    icon: IconProgress,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "In Progress",
  },
  [TaskStatus.COMPLETED]: {
    icon: IconCircleCheck,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Completed",
  },
};

const MAX_VISIBLE_ITEMS = 3;

export function StatusHistory({ history }: StatusHistoryProps) {
  const [showAll, setShowAll] = useState(false);

  if (!history || history.length === 0) {
    return null;
  }

  const visibleHistory = showAll ? history : history.slice(0, MAX_VISIBLE_ITEMS);
  const hasMore = history.length > MAX_VISIBLE_ITEMS;

  return (
    <div className="border-t pt-3 mt-3 border-gray-300">
      <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
        Status History
      </h3>
      <div className="space-y-1">
        {visibleHistory.map((entry, index) => {
          const config = statusConfig[entry.status];
          const Icon = config.icon;
          const isLatest = index === 0;

          return (
            <div
              key={entry.id}
              className={`flex items-center gap-2 text-xs py-1 px-2 rounded ${
                isLatest ? "bg-gray-50 border border-gray-200" : ""
              }`}
            >
              <div className={`${config.bgColor} p-1 rounded`}>
                <Icon size={14} className={config.color} />
              </div>
              <span className="font-medium text-gray-700">
                {config.label}
              </span>
              <span className="text-gray-500 text-[11px]">
                {format(new Date(entry.changedAt), "MMM d, h:mm a")}
              </span>
              <span className="text-gray-400 text-[11px] ml-auto">
                {formatDistanceToNow(new Date(entry.changedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          );
        })}
      </div>

        <ViewMoreButton
          onClick={() => setShowAll(!showAll)}
          hasMore={hasMore}
          showAll={showAll}
        />
    </div>
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

