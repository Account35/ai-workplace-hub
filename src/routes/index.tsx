import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, BookOpen, MessageSquare, ShieldCheck, Clock, PenLine } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Workplace AI — Productivity Assistant for Professionals" },
      {
        name: "description",
        content:
          "Draft workplace emails, summarise research and ask an AI assistant work questions in one clean dashboard.",
      },
      { property: "og:title", content: "Workplace AI — Productivity Assistant" },
      {
        property: "og:description",
        content:
          "Draft workplace emails, summarise research and ask an AI assistant work questions in one clean dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const TOOLS = [
  {
    to: "/email",
    icon: Mail,
    title: "Smart Email Generator",
    body: "Complete, ready-to-send workplace emails in a formal, friendly or persuasive tone.",
  },
  {
    to: "/research",
    icon: BookOpen,
    title: "Research Assistant",
    body: "Turn a topic, pasted text or an article link into a summary, insights and recommendations.",
  },
  {
    to: "/chat",
    icon: MessageSquare,
    title: "AI Workplace Chat",
    body: "Ask about meetings, feedback, planning, difficult conversations and day-to-day work questions.",
  },
] as const;

const POINTS = [
  { icon: PenLine, text: "Every output is editable, copyable and can be regenerated instantly." },
  { icon: Clock, text: "Structured prompts keep results consistent and professional." },
  { icon: ShieldCheck, text: "No accounts, no stored data — nothing is saved after you leave." },
];

function Dashboard() {
  return (
    <AppShell
      title="Dashboard"
      description="Three focused AI tools for everyday professional work."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map(({ to, icon: Icon, title, body }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-lg border border-border bg-card p-5 shadow-panel transition-colors hover:border-ring/40"
          >
            <span className="inline-flex rounded-md bg-secondary p-2 text-secondary-foreground">
              <Icon className="size-4" />
            </span>
            <h2 className="mt-3 text-sm font-semibold">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
            <span className="mt-3 inline-block text-xs font-medium text-foreground group-hover:underline">
              Open →
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-6 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold">How it works</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex gap-2.5 text-sm text-muted-foreground">
              <Icon className="mt-0.5 size-4 shrink-0 text-foreground" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
