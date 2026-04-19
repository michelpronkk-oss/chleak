export function MobileHeroSupportStrip() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-full border border-border/55 bg-card/24 px-3.5 py-2.5">
      <div className="grid grid-cols-3 items-center gap-2 text-center">
        <span className="truncate font-mono text-[0.55rem] tracking-[0.075em] uppercase text-foreground/78">
          Checkout friction
        </span>
        <span className="truncate border-x border-border/45 px-2 font-mono text-[0.55rem] tracking-[0.075em] uppercase text-foreground/78">
          Payment gaps
        </span>
        <span className="truncate font-mono text-[0.55rem] tracking-[0.075em] uppercase text-foreground/78">
          Billing recovery
        </span>
      </div>
    </div>
  )
}
