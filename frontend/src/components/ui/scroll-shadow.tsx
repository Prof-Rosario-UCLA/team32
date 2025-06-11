import * as React from "react";
import { cn } from "../../lib/utils";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

interface ScrollShadowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  orientation?: "vertical" | "horizontal";
}

export function ScrollShadow({ 
  className, 
  children, 
  orientation = "vertical",
  ...props 
}: ScrollShadowProps) {
  const [showStartShadow, setShowStartShadow] = React.useState(false);
  const [showEndShadow, setShowEndShadow] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = React.useCallback(() => {
    if (!containerRef.current) return;
    
    if (orientation === "horizontal") {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setShowStartShadow(scrollLeft > 0);
      setShowEndShadow(scrollLeft + clientWidth < scrollWidth);
    } else {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      setShowStartShadow(scrollTop > 0);
      setShowEndShadow(scrollTop + clientHeight < scrollHeight);
    }
  }, [orientation]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    handleScroll();
    container.addEventListener("scroll", handleScroll);
    
    // Also check on resize in case content changes
    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(container);
    
    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [handleScroll]);

  const isHorizontal = orientation === "horizontal";

  return (
    <div className={cn("relative", isHorizontal ? "w-full" : "h-full", className)} {...props}>
      {/* Start shadow (top for vertical, left for horizontal) */}
      {showStartShadow && (
        <div 
          className={cn(
            "absolute pointer-events-none z-10",
            isHorizontal 
              ? "top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-background to-transparent"
              : "top-0 left-0 right-0 h-8 bg-gradient-to-b from-background to-transparent"
          )}
        />
      )}
      
      <ScrollAreaPrimitive.Root className={isHorizontal ? "w-full" : "h-full"}>
        <ScrollAreaPrimitive.Viewport 
          ref={containerRef} 
          className={cn(
            isHorizontal ? "w-full pb-4" : "h-full pr-4"
          )}
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
        
        <ScrollAreaPrimitive.Scrollbar
          className={cn(
            "flex select-none touch-none p-0.5 bg-transparent transition-colors duration-[160ms] ease-out hover:bg-transparent",
            isHorizontal 
              ? "flex-col h-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
              : "w-2.5 data-[orientation=vertical]:w-2.5"
          )}
          orientation={orientation}
        >
          <ScrollAreaPrimitive.Thumb 
            className="flex-1 bg-border rounded-full relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" 
          />
        </ScrollAreaPrimitive.Scrollbar>
      </ScrollAreaPrimitive.Root>
      
      {/* End shadow (bottom for vertical, right for horizontal) */}
      {showEndShadow && (
        <div 
          className={cn(
            "absolute pointer-events-none z-10",
            isHorizontal 
              ? "top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-background to-transparent"
              : "bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent"
          )}
        />
      )}
    </div>
  );
}