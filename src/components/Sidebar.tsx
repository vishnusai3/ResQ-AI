import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Flame,
  Truck,
  Building2,
  Home,
  Bot,
  BarChart3,
  Sliders,
  ChevronRight,
} from 'lucide-react';

export type ActiveTab =
  | 'command-center'
  | 'incidents'
  | 'resources'
  | 'simulation';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeIncidentsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeIncidentsCount,
}) => {
  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
    { id: 'incidents', label: 'Incidents', icon: Flame, badge: activeIncidentsCount },
    { id: 'resources', label: 'Resources', icon: Truck },
    { id: 'simulation', label: 'Simulation', icon: Sliders },
  ];

  return (
    <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none">
      <nav className="p-2 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm shadow-rose-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-rose-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-rose-600 text-white">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-rose-400" />}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[10px] text-slate-500 flex items-center justify-between font-mono">
        <span>HYDERABAD SECTOR</span>
        <span className="text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          ONLINE
        </span>
      </div>
    </aside>
  );
};
