export default function Loading() {
  return (
    <div className="container-page animate-pulse py-8" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 rounded bg-slate-100" />
      <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-100" />
      <div className="mt-8 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-slate-50" />
        ))}
      </div>
    </div>
  );
}
