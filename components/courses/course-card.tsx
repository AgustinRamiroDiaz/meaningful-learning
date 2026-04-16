'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CourseSummary } from '@/lib/types'

interface CourseCardProps {
  course: CourseSummary
  onClick: () => void
}

export function CourseCard({ course, onClick }: CourseCardProps) {
  const formattedDate = new Date(course.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const progressText =
    course.nodeCount === 0
      ? 'No graph yet'
      : `${course.knownCount} / ${course.nodeCount} concepts known`

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick()
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold leading-tight">{course.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-muted-foreground text-sm">{progressText}</p>
        <p className="text-muted-foreground text-xs">Created {formattedDate}</p>
      </CardContent>
    </Card>
  )
}
