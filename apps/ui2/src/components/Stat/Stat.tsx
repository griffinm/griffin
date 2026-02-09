interface StatProps {
  value?: number;
  label: string;
}

export function Stat({ value = 0, label }: StatProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-xl font-bold">{value ?? 0}</div>
      <div className="text-sm text-[var(--mantine-color-dimmed)]">{label ?? ''}</div>
    </div>
  );
}
