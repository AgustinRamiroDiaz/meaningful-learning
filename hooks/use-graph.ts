'use client'

import { useCallback, useEffect, useState } from 'react'
import { computeNodeStates, getKnownIds } from '@/lib/graph-engine'
import { saveCourse } from '@/lib/storage'
import type { Course } from '@/lib/types'

export function useGraph(initialCourse: Course | null, onUpdate: (updated: Course) => void) {
  const [currentCourse, setCurrentCourse] = useState<Course | null>(initialCourse)

  // Sync when the parent updates the course (e.g. after a new graph is generated).
  // setState in effect is intentional here: we're syncing derived state from a prop
  // that can legitimately change after local toggles have diverged from the initial value.
  useEffect(() => {
    if (initialCourse !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentCourse(initialCourse)
    }
  }, [initialCourse])

  const toggleNodeKnown = useCallback(
    (nodeId: string) => {
      setCurrentCourse((prev) => {
        if (!prev?.graph) return prev

        const { nodes, edges } = prev.graph
        const knownIds = getKnownIds(nodes)

        if (knownIds.has(nodeId)) {
          knownIds.delete(nodeId)
        } else {
          knownIds.add(nodeId)
        }

        const updatedNodes = computeNodeStates(nodes, edges, knownIds)
        const updated: Course = {
          ...prev,
          updatedAt: new Date().toISOString(),
          graph: { ...prev.graph, nodes: updatedNodes },
        }
        saveCourse(updated)
        onUpdate(updated)
        return updated
      })
    },
    [onUpdate]
  )

  return { currentCourse: currentCourse ?? initialCourse, toggleNodeKnown }
}
