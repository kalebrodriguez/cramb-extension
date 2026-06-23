---
name: New adapter (provider or source)
about: Propose a new model provider or content source
title: 'adapter: '
labels: adapter, good first issue
---

**Adapter type**
- [ ] Model provider (e.g. a new LLM API)
- [ ] Content source (e.g. PDF, EPUB, a specific site)

**What it is**
Name and a link to the relevant API/format docs.

**Provider adapters** implement `LLMProvider` in `src/background/providers/<name>.ts`
(see the existing OpenAI/Anthropic/Google/Ollama adapters). They must read the key
only in the background worker and send content only to that provider's endpoint.

**Source adapters** add a `background/` adapter (+ a `content/` extractor hook if a
page reach is needed), self-contained, returning sanitized text.

**Structured output / format notes**
How does this provider return JSON, or how is this source's text extracted?

**Are you planning to implement this?**
- [ ] Yes, I'd like to open a PR
- [ ] No, just proposing
