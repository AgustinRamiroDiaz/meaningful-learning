export function GraphLegend() {
  return (
    <div className="flex items-center gap-4 px-3 py-2 text-xs">
      <span className="text-muted-foreground font-medium">Legend:</span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full border-2 border-green-500 bg-green-100" />
        <span>Known</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full border-2 border-amber-400 bg-amber-100 ring-1 ring-amber-300" />
        <span>Next up (edge of knowledge)</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full border-2 border-zinc-300 bg-zinc-100" />
        <span>Future</span>
      </span>
    </div>
  )
}
