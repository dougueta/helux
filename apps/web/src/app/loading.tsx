export default function Loading() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-4">
      <div className="h-6 w-48 bg-helux-surface rounded-lg animate-pulse" />
      <div className="bg-helux-surface border border-helux-border rounded-2xl h-48 animate-pulse" />
      <div className="bg-helux-surface border border-helux-border rounded-2xl h-12 animate-pulse" />
    </div>
  )
}
