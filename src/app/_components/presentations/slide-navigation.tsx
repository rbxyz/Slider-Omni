"use client"

import { Button } from "~/components/ui/button"
import { ChevronLeft, ChevronRight, Home } from "lucide-react"
import Link from "next/link"

interface SlideNavigationProps {
  currentSlide: number
  totalSlides: number
  onPrevious: () => void
  onNext: () => void
  presentationTitle: string
}

export function SlideNavigation({
  currentSlide,
  totalSlides,
  onPrevious,
  onNext,
  presentationTitle,
}: SlideNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Home className="mr-2 h-4 w-4" />
              Início
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" disabled={currentSlide === 1} onClick={onPrevious}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Anterior
            </Button>

            <div className="text-sm font-medium">
              <span className="text-primary">{currentSlide}</span>
              <span className="text-muted-foreground"> / {totalSlides}</span>
            </div>

            <Button variant="outline" size="sm" onClick={onNext} disabled={currentSlide === totalSlides}>
              Próximo
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className="max-w-xs text-sm text-muted-foreground truncate">{presentationTitle}</div>
        </div>
      </div>
    </div>
  )
}
