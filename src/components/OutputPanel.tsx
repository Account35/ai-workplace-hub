import { Check, Copy, RefreshCw, AlertCircle } from "lucide-react";
import { useState } from "react";

export function OutputPanel({
  value,
  onChange,
  loading,
  error,
  onRegenerate,
  canRegenerate,
  emptyHint,
  label = "AI output",
}: {
  value: string;
  onChange: (v: string) => void;
  loading: boolean;
  error: string | null;
  onRegenerate: () => void;
  canRegenerate: boolean;
  emptyHint: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-card shadow-panel">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">{label}</h2>
          <p className="text-xs text-muted-foreground">Editable — refine the text before you use it.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copy}
            disabled={!value}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={!canRegenerate || loading}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Regenerate
          </button>
        </div>
      </header>

      <div className="p-4">
        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && !value ? (
          <div className="space-y-2.5 py-2" aria-live="polite">
            <p className="text-sm text-muted-foreground">Generating a professional response…</p>
            {[90, 100, 75, 95, 60].map((w, i) => (
              <div
                key={i}
                className="h-3 animate-pulse rounded bg-muted"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        ) : value ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck
            className="min-h-72 w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-sans text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring"
          />
        ) : (
          !error && <p className="py-10 text-center text-sm text-muted-foreground">{emptyHint}</p>
        )}
      </div>
    </section>
  );
}
