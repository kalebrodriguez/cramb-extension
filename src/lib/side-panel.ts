/**
 * Open Cramb's workspace panel in a cross-browser way.
 *
 * Chromium exposes `chrome.sidePanel`; Firefox exposes `sidebarAction` (WXT maps
 * the sidepanel entrypoint to `sidebar_action`). `chrome.sidePanel` is
 * `undefined` at runtime in Firefox, so calling it directly throws — hence this
 * feature-detecting helper. Both panel APIs only honor the open when called
 * within a user gesture (a context-menu or popup click), so call this straight
 * from the handler, not after an `await`.
 *
 * Returns true if a panel API was found and invoked.
 */
type SidePanelApi = { open: (opts: { tabId?: number; windowId?: number }) => Promise<void> };
type SidebarApi = { open: () => Promise<void> };

export async function openWorkspace(target: {
  tabId?: number;
  windowId?: number;
}): Promise<boolean> {
  // Chromium / Edge / Brave.
  const sidePanel = (chrome as unknown as { sidePanel?: SidePanelApi }).sidePanel;
  if (sidePanel?.open) {
    try {
      await sidePanel.open(target);
      return true;
    } catch {
      // Fall through to the Firefox path / fallback.
    }
  }

  // Firefox.
  const g = globalThis as unknown as { browser?: { sidebarAction?: SidebarApi } };
  const sidebar =
    g.browser?.sidebarAction ?? (chrome as unknown as { sidebarAction?: SidebarApi }).sidebarAction;
  if (sidebar?.open) {
    try {
      await sidebar.open();
      return true;
    } catch {
      // Fall through to fallback.
    }
  }

  return false;
}
