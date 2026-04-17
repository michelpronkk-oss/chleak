export default function DashboardLoadingPage() {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="surface-card h-32 animate-pulse bg-card/60"
          />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.7fr,1fr]">
        <div className="surface-card h-[28rem] animate-pulse bg-card/60" />
        <div className="space-y-5">
          <div className="surface-card h-56 animate-pulse bg-card/60" />
          <div className="surface-card h-56 animate-pulse bg-card/60" />
        </div>
      </div>
    </div>
  )
}
