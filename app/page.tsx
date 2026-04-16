'use client'

import Link from 'next/link'
import { Settings } from 'lucide-react'
import { CourseList } from '@/components/courses/course-list'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="text-lg font-bold tracking-tight">Meaningful Learning</span>
          <Link
            href="/settings"
            aria-label="Settings"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <CourseList />
      </main>
    </div>
  )
}
