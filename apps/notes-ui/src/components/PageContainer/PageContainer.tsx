interface Props {
  children: React.ReactNode;
}

export function PageContainer({ children }: Props) {
  return (
    <div>
      <div className="p-5 max-w-[1000px]">
        {children}
      </div>
    </div>
  )
}
