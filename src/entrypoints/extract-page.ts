import { Readability } from '@mozilla/readability';
import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script';

export default defineUnlistedScript(() => {
  try {
    // Readability works on a clone so extraction never mutates the live page.
    const article = new Readability(document.cloneNode(true) as Document).parse();
    const textContent = article?.textContent?.trim() ?? '';

    if (!article || !textContent) {
      return { error: 'No readable article text was found on this page.' };
    }

    // Return plain text only. Page HTML never crosses into the extension.
    return {
      title: article.title || undefined,
      byline: article.byline || undefined,
      textContent,
      siteName: article.siteName || undefined,
    };
  } catch (error) {
    return { error: `Page extraction failed: ${String(error)}` };
  }
});
