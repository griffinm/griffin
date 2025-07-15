interface Props {
  children: React.ReactNode;
}

export function PageContainer({ children }: Props) {
  return (
    <div>
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}
