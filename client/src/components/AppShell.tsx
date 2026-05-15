import { useLocation } from "wouter";
import { Home, FolderOpen, Image, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  showNav?: boolean;
  title?: string;
  backHref?: string;
  actions?: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "首页" },
  { href: "/projects", icon: FolderOpen, label: "项目" },
  { href: "/projects/new", icon: Plus, label: "新建", primary: true },
  { href: "/media", icon: Image, label: "素材" },
  { href: "/settings", icon: Settings, label: "设置" },
];

export default function AppShell({ children, showNav = true, title, backHref, actions }: AppShellProps) {
  const [location, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-start justify-center">
      {/* Desktop background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.15_0.02_290)_0%,oklch(0.08_0.015_285)_70%)] pointer-events-none" />

      {/* Mobile shell */}
      <div className="mobile-shell relative flex flex-col">
        {/* Soundwave background decoration */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[430px] h-full pointer-events-none overflow-hidden z-0">
          <SoundwaveBackground />
        </div>

        {/* Header */}
        {(title || backHref || actions) && (
          <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border">
            {backHref && (
              <button
                onClick={() => navigate(backHref)}
                className="w-8 h-8 flex items-center justify-center rounded-lg glass-card text-foreground/70 hover:text-foreground transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            {title && (
              <h1 className="flex-1 text-base font-semibold truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {title}
              </h1>
            )}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </header>
        )}

        {/* Content */}
        <main className="flex-1 relative z-10 overflow-y-auto" style={{ paddingBottom: showNav ? "80px" : "0" }}>
          <div className="page-enter">{children}</div>
        </main>

        {/* Bottom Navigation */}
        {showNav && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-background/90 backdrop-blur-xl border-t border-border">
            <div className="flex items-center justify-around px-2 py-2">
              {NAV_ITEMS.map((item) => {
                const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    className={cn(
                      "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200",
                      item.primary
                        ? "bg-gradient-to-br from-[oklch(0.6_0.28_290)] to-[oklch(0.7_0.22_200)] text-white shadow-lg shadow-[oklch(0.6_0.28_290/0.3)] -mt-4 p-3 rounded-2xl"
                        : isActive
                        ? "text-[oklch(0.6_0.28_290)]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon size={item.primary ? 22 : 20} strokeWidth={item.primary ? 2.5 : isActive ? 2 : 1.5} />
                    {!item.primary && (
                      <span className="text-[10px] font-medium">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}

function SoundwaveBackground() {
  return (
    <svg
      className="absolute bottom-20 left-0 right-0 w-full opacity-[0.04]"
      viewBox="0 0 430 200"
      preserveAspectRatio="none"
    >
      {Array.from({ length: 40 }).map((_, i) => {
        const x = (i / 39) * 430;
        const h = 20 + Math.sin(i * 0.8) * 60 + Math.sin(i * 0.3) * 40;
        return (
          <rect
            key={i}
            x={x - 3}
            y={(200 - h) / 2}
            width={6}
            height={h}
            rx={3}
            fill="url(#waveGrad)"
            style={{
              animation: `soundwave ${1 + (i % 5) * 0.2}s ease-in-out infinite`,
              animationDelay: `${(i * 0.05) % 1}s`,
            }}
          />
        );
      })}
      <defs>
        <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.6 0.28 290)" />
          <stop offset="100%" stopColor="oklch(0.7 0.22 200)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
