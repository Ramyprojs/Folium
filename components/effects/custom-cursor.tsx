"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CursorMode = "default" | "text" | "button" | "image" | "sidebar";

type Ripple = {
  id: number;
  x: number;
  y: number;
};

export function CustomCursor(): JSX.Element | null {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<CursorMode>("default");
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const mouse = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });

  const modeStyle = useMemo(() => {
    if (mode === "text") {
      return {
        ringSize: 28,
        color: "rgba(124,58,237,0.75)",
        borderWidth: 2,
        boxShadow: "0 0 14px rgba(124,58,237,0.35)",
      };
    }
    if (mode === "button") {
      return {
        ringSize: 40,
        color: "rgba(124,58,237,0.85)",
        borderWidth: 2,
        boxShadow: "0 0 22px rgba(124,58,237,0.42)",
      };
    }
    if (mode === "image") {
      return {
        ringSize: 34,
        color: "rgba(255,255,255,0.9)",
        borderWidth: 1,
        boxShadow: "0 0 16px rgba(31,31,31,0.25)",
      };
    }
    if (mode === "sidebar") {
      return {
        ringSize: 16,
        color: "rgba(107,107,101,0.65)",
        borderWidth: 1,
        boxShadow: "0 0 8px rgba(0,0,0,0.15)",
      };
    }

    return {
      ringSize: 24,
      color: "rgba(124,58,237,0.65)",
      borderWidth: 1,
      boxShadow: "0 0 10px rgba(124,58,237,0.25)",
    };
  }, [mode]);

  useEffect(() => {
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(!isCoarse && !reduced);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("cursor-enhanced", enabled);

    return () => {
      document.body.classList.remove("cursor-enhanced");
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const update = () => {
      const follow = mode === "sidebar" ? 0.12 : mode === "button" ? 0.2 : 0.16;
      ring.current.x += (mouse.current.x - ring.current.x) * follow;
      ring.current.y += (mouse.current.y - ring.current.y) * follow;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouse.current.x - 4}px, ${mouse.current.y - 4}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.current.x - modeStyle.ringSize / 2}px, ${ring.current.y - modeStyle.ringSize / 2}px, 0)`;
      }

      rafRef.current = window.requestAnimationFrame(update);
    };

    rafRef.current = window.requestAnimationFrame(update);
    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [enabled, mode, modeStyle.ringSize]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onMove = (event: MouseEvent) => {
      mouse.current = { x: event.clientX, y: event.clientY };
      const target = event.target as HTMLElement | null;

      if (!target) {
        setMode("default");
        return;
      }

      const tag = target.tagName.toLowerCase();
      const editable = target.closest("[contenteditable='true']");
      const inText = tag === "input" || tag === "textarea" || tag === "p" || tag === "span" || !!editable;
      const inButton = !!target.closest("button, a, [role='button']");
      const inImage = tag === "img" || !!target.closest("[data-folium-image-src]");
      const inSidebar = !!target.closest("aside");

      if (inText) {
        setMode("text");
      } else if (inButton) {
        setMode("button");
      } else if (inImage) {
        setMode("image");
      } else if (inSidebar) {
        setMode("sidebar");
      } else {
        setMode("default");
      }
    };

    const onClick = (event: MouseEvent) => {
      const ripple: Ripple = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        x: event.clientX,
        y: event.clientY,
      };
      setRipples((prev) => [...prev, ripple]);
      window.setTimeout(() => {
        setRipples((prev) => prev.filter((item) => item.id !== ripple.id));
      }, 360);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[120] h-2 w-2 rounded-full bg-[rgb(var(--accent-rgb))]"
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[119] rounded-full"
        style={{
          width: modeStyle.ringSize,
          height: modeStyle.ringSize,
          border: `${modeStyle.borderWidth}px solid ${modeStyle.color}`,
          boxShadow: modeStyle.boxShadow,
          transition: "width 140ms ease, height 140ms ease, border-color 120ms ease, box-shadow 120ms ease",
        }}
      >
        {mode === "image" && (
          <span className="absolute inset-0 flex items-center justify-center text-[11px] text-white">⌕</span>
        )}
        {mode === "text" && (
          <span className="absolute left-1/2 top-1/2 h-4 w-[1px] -translate-x-1/2 -translate-y-1/2 bg-[rgb(var(--accent-rgb))]" />
        )}
      </div>

      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none fixed z-[118] h-6 w-6 rounded-full border border-[rgb(var(--accent-rgb))]"
          style={{
            left: ripple.x - 12,
            top: ripple.y - 12,
            animation: "cursor-ripple 360ms ease-out forwards",
          }}
        />
      ))}
    </>
  );
}
