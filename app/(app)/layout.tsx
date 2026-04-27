'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router  = useRouter()
  const [user, setUser]       = useState<{ email?: string } | null>(null)
  const [ready, setReady]     = useState(false)

  useEffect(() => {
    // Check session on mount
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login')
      } else {
        setUser({ email: data.session.user.email })
        setReady(true)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar userEmail={user?.email} />
      <main className="flex-1 ml-[220px] min-w-0">
        {children}
      </main>
    </div>
  )
}
