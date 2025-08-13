import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface PreviewPopoverProps {
  content: ReactNode;
  x: number;
  y: number;
  onLeave: () => void;
}

export function PreviewPopover({ content, x, y, onLeave }: PreviewPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      const offset = 20;
      const div = ref.current;
      div.style.left = `${x - div.offsetWidth - offset}px`;
      div.style.top = `${y + offset}px`;
      div.style.visibility = "visible";
    }
  }, [x, y]);

  return createPortal(
    <>
      <style>{`
        .preview-popover {
          position: fixed;
          z-index: 1070;
          max-height: 75vh;
          overflow: auto;
        }

        .preview-popover.responsive-wide {
          width: 90vw;
        }

        @media (min-width: 576px) {
          .preview-popover.responsive-wide {
            width: min(calc(100% - 85vw), 85vw);
          }
        }

        @media (min-width: 768px) {
          .preview-popover.responsive-wide {
            width: min(calc(100% - 70vw), 70vw);
          }
        }

        @media (min-width: 992px) {
          .preview-popover.responsive-wide {
            width: min(calc(100% - 60vw), 60vw);
          }
        }

        @media (min-width: 1200px) {
          .preview-popover.responsive-wide {
            width: min(calc(100% - 50vw), 50vw);
            max-width: 800px;
          }
        }
      `}</style>
      <div
        ref={ref}
        className="card position-fixed p-2 preview-popover responsive-wide"
        style={{ visibility: "hidden" }}
        onMouseLeave={onLeave}
      >
        {content}
      </div>
    </>,
    document.body
  );
}
