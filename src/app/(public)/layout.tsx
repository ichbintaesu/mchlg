export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 size-96 -translate-x-1/2 rounded-full bg-accent opacity-[0.1] blur-3xl" />
        <div className="absolute -bottom-24 -right-24 size-96 rounded-full bg-[#8b93ff] opacity-[0.08] blur-3xl" />
      </div>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4">{children}</div>
    </>
  )
}
