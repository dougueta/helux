export default function Loading() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-3">
      <div className="h-6 w-36 bg-helux-surface rounded-lg animate-pulse mb-6" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-helux-surface border border-helux-border rounded-2xl h-20 animate-pulse" />
      ))}
    </div>
  )
}
