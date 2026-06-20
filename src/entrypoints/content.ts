import { defineContentScript } from 'wxt/utils/define-content-script';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  main() {
    let toolbar: HTMLElement | null = null;

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') removeToolbar();
    });

    function handleSelection() {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (!selection || !text || text.length < 20 || selection.rangeCount === 0) {
        removeToolbar();
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      showToolbar(text, rect);
    }

    function showToolbar(text: string, rect: DOMRect) {
      removeToolbar();

      const host = document.createElement('cramb-toolbar');
      const shadow = host.attachShadow({ mode: 'closed' });

      const style = document.createElement('style');
      style.textContent = `
        .cramb-pill {
          position: fixed;
          z-index: 2147483000;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: #1E293B;
          color: #F8FAFC;
          border: 1px solid #334155;
          border-radius: 9999px;
          font: 500 13px/18px Inter, system-ui, sans-serif;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          cursor: pointer;
          user-select: none;
          transition: background 120ms ease-out;
        }
        .cramb-pill:hover { background: #334155; }
        .cramb-pill .icon { color: #8C7DF7; }
        .cramb-close {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 0 0 0 4px;
          font-size: 14px;
          line-height: 1;
        }
        .cramb-close:hover { color: #F8FAFC; }
      `;

      const pill = document.createElement('div');
      pill.className = 'cramb-pill';
      pill.innerHTML = `
        <span class="icon">✦</span>
        <span>Make cards</span>
        <button class="cramb-close" aria-label="Dismiss">✕</button>
      `;

      // Toolbar is position: fixed, so use viewport-relative coordinates.
      pill.style.top = `${rect.bottom + 8}px`;
      pill.style.left = `${rect.left + rect.width / 2}px`;
      pill.style.transform = 'translateX(-50%)';

      pill.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.cramb-close')) {
          removeToolbar();
          return;
        }
        chrome.runtime.sendMessage({
          type: 'capture.fromSelection',
          payload: {
            text,
            url: window.location.href,
            title: document.title,
          },
        });
        removeToolbar();
      });

      shadow.appendChild(style);
      shadow.appendChild(pill);
      document.body.appendChild(host);
      toolbar = host;
    }

    function removeToolbar() {
      if (toolbar) {
        toolbar.remove();
        toolbar = null;
      }
    }
  },
});
