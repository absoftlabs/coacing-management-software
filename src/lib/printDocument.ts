const BASE_STYLES = `
  body { font-family: ui-sans-serif, system-ui, -apple-system; margin: 0; padding: 20px; color: #111; background: #fff; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #333; padding: 6px 8px; font-size: 13px; text-align: left; }
  @media print { @page { margin: 12mm; } }
`;

function openPrintWindow(title: string, bodyHtml: string, extraStyles = ""): Window | null {
    const win = window.open("", "_blank");
    if (!win) return null;
    win.document.write(
        `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title><style>${BASE_STYLES}${extraStyles}</style></head><body>${bodyHtml}</body></html>`
    );
    win.document.close();
    win.focus();
    return win;
}

/** Opens a new window with the given HTML and triggers the browser print dialog. */
export function printHtml(title: string, bodyHtml: string, extraStyles = "") {
    const win = openPrintWindow(title, bodyHtml, extraStyles);
    if (!win) return;
    setTimeout(() => win.print(), 250);
}
