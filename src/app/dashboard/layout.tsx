import { BarChart3 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20 dark:from-slate-950 dark:via-teal-950/20 dark:to-cyan-950/10">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b border-teal-200/60 bg-white/80 px-6 backdrop-blur-sm dark:border-teal-800/40 dark:bg-slate-900/80">
        <BarChart3 className="h-6 w-6 text-teal-600 dark:text-teal-400" />
        <span className="text-lg font-semibold text-teal-800 dark:text-teal-200">Proveli</span>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
