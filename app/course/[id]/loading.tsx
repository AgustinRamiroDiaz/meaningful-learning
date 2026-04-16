export default function CourseLoading() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="h-8 w-8 animate-pulse rounded-md bg-zinc-200" />
        <div className="h-5 w-40 animate-pulse rounded bg-zinc-200" />
      </div>

      {/* Prompt input skeleton */}
      <div className="flex gap-2 border-b px-4 py-3">
        <div className="h-10 flex-1 animate-pulse rounded-md bg-zinc-200" />
        <div className="h-10 w-24 animate-pulse rounded-md bg-zinc-200" />
      </div>

      {/* Graph skeleton */}
      <div className="flex flex-1 items-center justify-center bg-zinc-50">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
      </div>
    </div>
  )
}
