"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent")
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "true")
    setShowBanner(false)
  }
  const handleReject = () => {
    localStorage.clear();
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-muted text-sm text-foreground shadow-md p-4 flex justify-between items-center">
      <span>
        This site uses cookies to enhance your experience. By continuing, you agree to our use of cookies.
      </span>
      <Button className="ml-4" onClick={handleAccept}>
        Accept
      </Button>
      <Button className="ml-4" onClick={handleReject}>
        Reject
      </Button>
    </div>
  )
}
