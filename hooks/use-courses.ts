'use client'

import { useCallback, useState } from 'react'
import { deleteCourse, getAllCourses, saveCourse } from '@/lib/storage'
import type { CourseSummary } from '@/lib/types'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function useCourses() {
  const [courses, setCourses] = useState<CourseSummary[]>(() => getAllCourses())

  const createCourse = useCallback((name: string): string => {
    const id = generateId()
    const now = new Date().toISOString()
    saveCourse({ id, name, createdAt: now, updatedAt: now, graph: null })
    setCourses(getAllCourses())
    return id
  }, [])

  const removeCourse = useCallback((id: string) => {
    deleteCourse(id)
    setCourses(getAllCourses())
  }, [])

  return { courses, createCourse, deleteCourse: removeCourse }
}
