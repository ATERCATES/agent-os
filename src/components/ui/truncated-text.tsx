"use client";

import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TruncatedTextProps {
  text: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}

export function TruncatedText({
  text,
  className,
  side = "right",
}: TruncatedTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setIsTruncated(el.scrollWidth > el.clientWidth);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  return (
    <Tooltip open={isTruncated ? undefined : false}>
      <TooltipTrigger asChild>
        <span ref={ref} className={cn("truncate", className)}>
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-[420px] text-xs break-words">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
