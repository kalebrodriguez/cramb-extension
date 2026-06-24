# Cramb — Chrome Web Store Submission Answers

This document contains all the copy and answers needed to submit the Cramb extension to the Chrome Web Store developer console. 

---

## 1. Store Listing Tab

### Category
Select **Productivity** (or **Education** if available).

### Description
Cramb is a privacy-first browser extension that bridges the gap between reading and remembering. It instantly turns the articles you read and the videos you watch into spaced-repetition flashcards, so the things you learn actually stick.

No accounts. No tracking. No expensive subscriptions. Everything lives locally on your device.

✦ HOW IT WORKS
1. Capture: Highlight text or one-click an entire article or YouTube video while browsing.
2. Generate: Your chosen AI model instantly extracts the key concepts and generates editable flashcards (Basic, Cloze, or Multiple Choice).
3. Review: Cards are scheduled using the state-of-the-art FSRS algorithm. Review them at the perfect time, right inside your browser's side panel.

✦ BRING YOUR OWN AI
Cramb does not charge a monthly subscription because you bring your own AI. Paste your API key for OpenAI, Anthropic, or Google—or connect to a local Ollama instance for a 100% free, entirely offline generation experience. 

✦ 100% PRIVATE & LOCAL-FIRST
Your data is yours. Decks, cards, and review history are stored locally in your browser via IndexedDB. Your API key never leaves your device. Cramb has no backend servers and no telemetry.

✦ NO LOCK-IN
While Cramb has a powerful, keyboard-friendly review engine built right into the browser, you are never locked in. You can export any deck directly to an Anki (.apkg) file at any time.

Open-source (MIT) and built for learners who care about their privacy.

### Homepage URL
`https://github.com/kalebrodriguez/cramb-extension`

### Support URL
`https://github.com/kalebrodriguez/cramb-extension/issues`

---

## 2. Privacy Tab

### Single Purpose Description
The single purpose of Cramb is to allow users to extract text from the current webpage they are reading and use an AI model (configured locally) to generate spaced-repetition flashcards to help them study and remember the content.

### Permission Justifications

**`activeTab` justification**
Required so the extension can access and extract the readable text (the article or blog post) on the current tab when the user clicks the "Capture this page" button.

**`scripting` justification**
Required to inject the DOM extraction script (Readability.js) into the active tab to safely parse the article text the user wants to turn into flashcards.

**`storage` justification**
Required to save the user's generated flashcards locally (IndexedDB) and securely store the user's AI API keys in `chrome.storage.local`.

**`sidePanel` justification**
Required to display the flashcard editing queue, the deck management interface, and the spaced-repetition review engine directly alongside the browser window.

**`contextMenus` justification**
Required to add a "Make cards from selection" option to the browser's right-click menu, so users can highlight a specific paragraph and generate cards from just that text.

**Host permission justification (`<all_urls>`)**
Required so the user can use the "Capture this page" or "Make cards from selection" functionality on any webpage or article they are currently reading across the internet.

### Are you using remote code?
Select: **No, I am not using Remote code**

---

## 3. Data Usage

**What user data do you plan to collect from users now or in the future?**
*Check exactly ONE box:*
- [x] **Website content** (For example: text, images, sounds, videos, or hyperlinks)
*(Reason: Because the extension extracts the text of the webpage the user asks it to read).*

**I certify that the following disclosures are true:**
*Check ALL THREE boxes:*
- [x] I do not sell or transfer user data to third parties, outside of the approved use cases
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

---

## 4. Privacy Policy

**Privacy policy URL**
`https://kalebrodriguez.github.io/cramb-extension/privacy.html`
