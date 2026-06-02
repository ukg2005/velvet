"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function useAuth(redirect = true) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      setIsAuthenticated(false)
      if (redirect) {
        router.replace("/")
      }
    } else {
      setIsAuthenticated(true)
    }
  }, [redirect, router])

  return { isAuthenticated }
}
