"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <div className="label-caps">Error</div>
      <h1 className="mt-2 text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-slate-600">The catalog could not be loaded. This is usually a temporary database issue.</p>
      {error.digest && <code className="mt-2 text-xs text-slate-400">ref: {error.digest}</code>}
      <button type="button" onClick={reset} className="btn-primary mt-6">Try again</button>
    </div>
  );
}
