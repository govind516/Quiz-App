import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, HelpCircle, Tag, Sparkles, Upload, Bell, Users, LineChart, Cog } from 'lucide-react';
import { HexMark } from '@/components/HexLogo';

const groups = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard, key: 'dashboard' },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/questions',  label: 'Question bank', icon: HelpCircle, key: 'questions' },
      { to: '/admin/categories', label: 'Categories',    icon: Tag,        key: 'categories' },
      { to: '/admin/ai',         label: 'AI generate',   icon: Sparkles,   key: 'ai' },
      { to: '/admin/import',     label: 'Bulk import',   icon: Upload,     key: 'import' },
      { to: '/admin/review',     label: 'Review queue',  icon: Bell,       key: 'review', badge: 1 },
    ],
  },
  {
    label: 'Platform',
    items: [
      { to: '/admin/users',     label: 'Users',    icon: Users,     key: 'users' },
      { to: '/admin/analytics', label: 'Analytics',icon: LineChart, key: 'analytics' },
      { to: '/admin/settings',  label: 'Settings', icon: Cog,       key: 'settings' },
    ],
  },
];

function SidebarItem({ item }) {
  const Icon = item.icon;
  return (
    <NavLink to={item.to} end={item.end} data-testid={`admin-nav-${item.key}`}
      className={({ isActive }) => `relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] transition-colors ${isActive ? 'bg-[color:var(--violet)]/[0.16] text-[color:var(--violet-2)] border border-[color:var(--violet)]/25' : 'text-[color:var(--ink-2)] hover:text-white hover:bg-white/[0.04] border border-transparent'}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && (
        <span className="min-w-5 h-5 px-1.5 rounded-md bg-[color:var(--gold)]/20 border border-[color:var(--gold)]/30 text-[color:var(--gold)] text-[11px] font-mono grid place-items-center">{item.badge}</span>
      )}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { pathname } = useLocation();
  return (
    <main className="relative pt-28 pb-24" data-testid="admin-layout">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="grid grid-cols-12 gap-8">
          <aside className="col-span-12 lg:col-span-3">
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }} className="glass rounded-3xl p-5 lg:sticky lg:top-28">
              <div className="flex items-center gap-2.5 px-1.5 py-1">
                <HexMark size={22} />
                <span className="font-display text-[19px] leading-none text-white">Hex<span className="text-[color:var(--violet-2)]">Quiz</span></span>
              </div>
              <div className="mt-6 space-y-6">
                {groups.map((g) => (
                  <div key={g.label}>
                    <div className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-[color:var(--mute)] px-1 mb-2">{g.label}</div>
                    <div className="space-y-1">
                      {g.items.map((it) => <SidebarItem key={it.key} item={it} />)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-5 border-t border-white/[0.06] flex items-center gap-3 px-1">
                <div className="w-9 h-9 rounded-full grid place-items-center font-mono text-[11px] text-white/85" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.4), rgba(127,231,206,0.28))', border: '1px solid rgba(255,255,255,0.1)' }}>PA</div>
                <div className="min-w-0">
                  <div className="text-[13.5px] text-white truncate">Platform Admin</div>
                  <div className="font-mono text-[10.5px] text-[color:var(--mute)] truncate">guptagovind516@gmail.com</div>
                </div>
              </div>
            </motion.div>
          </aside>

          <section className="col-span-12 lg:col-span-9" key={pathname}>
            <Outlet />
          </section>
        </div>
      </div>
    </main>
  );
}
