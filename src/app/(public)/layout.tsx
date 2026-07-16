export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-10 h-1.5 bg-accent" />
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-1.5">{children}</div>
    </>
  )
}
