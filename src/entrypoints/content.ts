import { defineContentScript } from 'wxt/utils/define-content-script';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  main() {
    // Selection capture is handled by the right-click "Make cards from selection"
    // context menu (registered in the background). A context-menu click carries
    // the user gesture that chrome.sidePanel.open() requires; an in-page button
    // does not, so it can't open a closed side panel — hence no in-page pill.
    //
    // This content script only answers page-extraction requests for the popup's
    // "Capture this page" action.
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type !== 'extractPage') return;

      (async () => {
        try {
          // Dynamic import so it only loads when needed.
          const { Readability } = await import('@mozilla/readability');
          const DOMPurify = await import('dompurify');

          // Clone the document so parsing never mutates the live DOM.
          const docClone = document.cloneNode(true) as Document;
          const article = new Readability(docClone).parse();

          if (!article) {
            sendResponse({ error: 'Failed to extract article' });
            return;
          }

          sendResponse({
            title: article.title,
            byline: article.byline,
            dir: article.dir,
            content: DOMPurify.default.sanitize(article.content ?? ''),
            textContent: article.textContent?.trim() ?? '',
            length: article.length,
            siteName: article.siteName,
          });
        } catch (e) {
          console.error('Extraction failed:', e);
          sendResponse({ error: String(e) });
        }
      })();

      return true; // Keep the message channel open for the async response.
    });
  },
});
