"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

// `useLayoutEffect` reads the layout before the browser paints, so the toggle
// never shows up a frame late and the block never jumps under the cursor. It
// has no meaning during SSR — there is no layout to measure — and React warns
// when it runs there, hence the swap.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// Around ten lines of body text: enough to judge whether an offer is worth
// reading, short enough to leave the rest of the sheet visible. Expressed in
// rem so it follows the user's font size instead of fighting it.
const COLLAPSED_MAX_HEIGHT = "12rem";

// Long free text shown in a bounded box, with an explicit control to reveal
// the rest. The text itself is never cut: only its display is clamped, so the
// stored value, the line breaks and the copy/paste stay intact.
//
// Whether the control is needed is decided by measuring the real layout
// (`scrollHeight > clientHeight`) rather than by counting characters: the same
// description wraps differently depending on the viewport width, the font and
// the user's zoom level, and a character threshold would be wrong in all
// three cases — either hiding nothing behind a useless button, or clamping a
// text that fitted.
export function CollapsibleText({ text }: { text: string }) {
  const contentId = useId();
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useIsomorphicLayoutEffect(() => {
    // Only measurable while clamped. Expanded, the paragraph is exactly as
    // tall as its content, so the comparison would read "nothing is hidden"
    // and remove the very button needed to collapse it again.
    if (isExpanded) return;

    const element = contentRef.current;
    if (!element) return;

    const measure = () => {
      setIsOverflowing(element.scrollHeight > element.clientHeight);
    };

    // First pass on the real layout, then on every reflow of the paragraph: a
    // window resize or a switch to a narrow screen changes how the text wraps,
    // and with it whether anything is actually hidden.
    measure();

    // Absent from jsdom and from older browsers: the first measure already
    // covers the common case, so a missing observer degrades instead of
    // throwing.
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isExpanded, text]);

  return (
    <>
      <div className="relative">
        <p
          id={contentId}
          ref={contentRef}
          // Clamped with `overflow-hidden`, never `overflow-auto`: a nested
          // scrollbar inside a page that already scrolls traps the wheel and
          // is unusable on touch.
          className={`text-sm text-foreground whitespace-pre-line${
            isExpanded ? "" : " overflow-hidden"
          }`}
          style={isExpanded ? undefined : { maxHeight: COLLAPSED_MAX_HEIGHT }}
        >
          {text}
        </p>
        {/* Shows that the text is cut where the cut happens. Decorative only:
            the button below carries the same information as real content. */}
        {!isExpanded && isOverflowing && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent"
          />
        )}
      </div>
      {/* A real button: keyboard focus, Enter and Space come for free, and
          `aria-expanded` announces the state on the control itself. */}
      {isOverflowing && (
        <button
          type="button"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          className="mt-1.5 rounded text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isExpanded ? "Réduire" : "Voir plus"}
        </button>
      )}
    </>
  );
}
