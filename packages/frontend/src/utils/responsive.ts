export const RESPONSIVE_BREAKPOINTS = {
	sm: 576,
	md: 768,
	lg: 992,
	xl: 1200,
} as const;

export type Breakpoint = keyof typeof RESPONSIVE_BREAKPOINTS;

export const responsiveWidthCSS = `
.responsive-wide.offcanvas.offcanvas-end {
  width: 90vw;
}

@media (min-width: ${RESPONSIVE_BREAKPOINTS.sm}px) {
  .responsive-wide.offcanvas.offcanvas-end {
    width: 85vw;
  }
}

@media (min-width: ${RESPONSIVE_BREAKPOINTS.md}px) {
  .responsive-wide.offcanvas.offcanvas-end {
    width: 70vw;
  }
}

@media (min-width: ${RESPONSIVE_BREAKPOINTS.lg}px) {
  .responsive-wide.offcanvas.offcanvas-end {
    width: 60vw;
  }
}

@media (min-width: ${RESPONSIVE_BREAKPOINTS.xl}px) {
  .responsive-wide.offcanvas.offcanvas-end {
    width: 50vw;
    max-width: 800px;
  }
}`;

export const previewPopoverCSS = `
.preview-popover {
  position: fixed;
  z-index: 1070;
  max-height: 75vh;
  overflow: auto;
  width: 90vw;
}

@media (min-width: ${RESPONSIVE_BREAKPOINTS.sm}px) {
  .preview-popover {
    width: min(calc(100% - 85vw), 85vw);
  }
}

@media (min-width: ${RESPONSIVE_BREAKPOINTS.md}px) {
  .preview-popover {
    width: min(calc(100% - 70vw), 70vw);
  }
}

@media (min-width: ${RESPONSIVE_BREAKPOINTS.lg}px) {
  .preview-popover {
    width: min(calc(100% - 60vw), 60vw);
  }
}

@media (min-width: ${RESPONSIVE_BREAKPOINTS.xl}px) {
  .preview-popover {
    width: min(calc(100% - 50vw), 50vw);
    max-width: 800px;
  }
}`;

export function generateResponsiveCSS(): string {
	return `${responsiveWidthCSS}\n\n${previewPopoverCSS}`;
}
