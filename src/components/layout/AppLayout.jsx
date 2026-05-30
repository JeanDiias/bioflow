import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, History, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/history', label: 'Histórico', icon: History },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background dark">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="flex items-center justify-between h-14 px-4 md:px-6 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary/15">
              <FlaskConical className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-mono text-base font-bold tracking-tight leading-tight">BioFlow</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-tight">
                Monitoramento de Biorreatores
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
