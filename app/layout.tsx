import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FleetPro — Gestione Flotta',
  description: 'Dashboard gestionale flotta auto professionale',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
