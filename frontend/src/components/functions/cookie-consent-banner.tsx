"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"

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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-muted text-sm text-foreground shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-center sm:text-left">
            This site uses cookies to enhance your experience. By continuing, you agree to our use of cookies.
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleReject} className="w-full sm:w-auto">
              Reject
            </Button>
            <Button onClick={handleAccept} className="w-full sm:w-auto">
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
