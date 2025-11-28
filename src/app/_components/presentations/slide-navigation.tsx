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
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/30 backdrop-blur-md opacity-0 hover:opacity-100 transition-opacity duration-300">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-8 text-white/80 hover:text-white hover:bg-white/10">
              <Home className="mr-1.5 h-3.5 w-3.5" />
              <span className="text-xs">Início</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentSlide === 1} 
              onClick={onPrevious}
              className="h-8 border-white/20 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <div className="text-xs font-medium text-white/80 px-2">
              <span className="text-white">{currentSlide}</span>
              <span className="text-white/60"> / {totalSlides}</span>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={onNext} 
              disabled={currentSlide === totalSlides}
              className="h-8 border-white/20 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white text-xs"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="max-w-xs text-xs text-white/60 truncate hidden sm:block">{presentationTitle}</div>
        </div>
      </div>
    </div>
  )
}
