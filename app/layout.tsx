import type { Metadata } from 'next'
import { Inter, Public_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public' })

export const metadata: Metadata = {
  title: 'NagarikAI – Governance Intelligence Portal',
  description: 'Official Governance Intelligence Platform for Administrative Operations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${publicSans.variable} antialiased`}>
      <body className="min-h-screen gov-shell flex flex-col font-[var(--font-public)]">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
