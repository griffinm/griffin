import { useState } from "react";
import { Text } from "@mantine/core";

const TRUNCATION_LENGTH = 100;

export function TruncatedDescription({ description }: { description?: string }) {
  const [expanded, setExpanded] = useState(false);

  if (!description) {
    return null;
  }

  const truncateRequired = description.length > TRUNCATION_LENGTH;
  const isTruncated = truncateRequired && !expanded;

  return (
    <p onClick={() => setExpanded(!expanded)} className="text-xs text-gray-600 ">
      {description.substring(0, isTruncated ? TRUNCATION_LENGTH : description.length)}
      {isTruncated && !expanded && '...'}
    </p>
  );
}
