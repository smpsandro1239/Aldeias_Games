"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "./use-auth"
import { apiRequest } from "@/lib/api-client"

const POLL_INTERVAL = 30_000

export function usePendingChangesCount() {
  const { user, isAuthenticated } = useAuth()
  const [count, setCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated || !user) return
    const role = user.role
    if (role !== "super_admin" && role !== "aldeia_admin") return

    try {
      const res = await apiRequest("/api/pending-changes?estado=pendente&limit=1")
      if (res.ok) {
        const data = await res.json()
        setCount(data.total || 0)
      }
    } catch {
      // silently ignore — badge is non-critical
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    fetchCount()
    intervalRef.current = setInterval(fetchCount, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchCount])

  return count
}
