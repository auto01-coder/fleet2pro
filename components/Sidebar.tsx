'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface SidebarProps {
  userEmail?: string
  alertCount?: number
}

const NAV = [
  {
    section: null,
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/>
          <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/>
          <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/>
          <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/>
        </svg>
      )},
    ]
  },
  {
    section: 'Flotta',
    items: [
      { href: '/flotta', label: 'Veicoli', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 11l2-5h8l2 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="1" y="11" width="14" height="3" rx="1.5" fill="currentColor" opacity=".6"/>
          <circle cx="4.5" cy="14.5" r="1.5" fill="currentColor"/>
          <circle cx="11.5" cy="14.5" r="1.5" fill="currentColor"/>
        </svg>
      ), badge: true },
      { href: '/flotta/nuova', label: 'Aggiungi', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      )},
    ]
  },
]

export default function Sidebar({ userEmail, alertCount = 0 }: SidebarProps) {
  const path = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userEmail
    ? userEmail.charAt(0).toUpperCase()
    : 'U'

  return (
    <aside className="fixed inset-y-0 left-0 w-[220px] bg-slate-900 flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg">🚗</div>
          <div>
            <div className="text-sm font-bold text-white leading-none">FleetPro</div>
            <div className="text-[10px] text-slate-500 tracking-wider mt-0.5">GESTIONE FLOTTA</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
        {NAV.map((group, gi) => (
          <div key={gi}>
            {group.section && (
              <div className="px-2 mb-1.5 text-[9px] font-bold tracking-[0.15em] uppercase text-slate-600">
                {group.section}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      group flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium
                      transition-all duration-100 relative
                      ${active
                        ? 'bg-white/10 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }
                    `}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-indigo-400 rounded-r-full" />
                    )}
                    <span style={{ color: active ? '#818cf8' : undefined }}>{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {'badge' in item && item.badge && alertCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {alertCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 border-t border-slate-800 pt-3">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-slate-800/60">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-200 truncate">
              {userEmail?.split('@')[0] ?? 'Utente'}
            </div>
            <div className="text-[10px] text-slate-500 truncate">{userEmail}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-700"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
