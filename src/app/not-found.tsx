import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <div className="label-caps">404</div>
      <h1 className="mt-2 text-2xl font-semibold">Not in the atlas</h1>
      <p className="mt-2 text-slate-600">That model, lab or provider does not exist (or was renamed).</p>
      <div className="mt-6 flex gap-2">
        <Link href="/models" className="btn-primary">Browse models</Link>
        <Link href="/" className="btn-secondary">Home</Link>
      </div>
    </div>
  );
}
