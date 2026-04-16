'use client'

import { useRouter } from 'next/navigation'
import { CourseCard } from './course-card'
import { NewCourseDialog } from './new-course-dialog'
import { useCourses } from '@/hooks/use-courses'

export function CourseList() {
  const router = useRouter()
  const { courses, createCourse } = useCourses()

  const handleCreate = (name: string) => {
    const id = createCourse(name)
    router.push(`/course/${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <NewCourseDialog onCreateCourse={handleCreate} />
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <p className="text-muted-foreground text-lg font-medium">No courses yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Create your first course to start learning.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => router.push(`/course/${course.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
