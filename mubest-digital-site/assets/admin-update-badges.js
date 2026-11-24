/* Mubest Digital Content Studio · release-aware, dismissible "NEW" badges.
 * Only add a section here when THAT section receives a real new feature/update.
 * For example: aiintelligence: "2026-12-01.1".
 * Increment the version for another update; never badge unrelated sections.
 * No entries now: existing features must NOT carry permanent "NEW" labels.
 */
(() => {
  "use strict";

  const FEATURE_RELEASES = Object.freeze({});
  const STORAGE_PREFIX = "mubest-content-studio-seen-updates-v1:";
  let storageKey = "";
  let seen = Object.create(null);

  function loadSeen() {
    if (!storageKey) return Object.create(null);
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
      if (saved && typeof saved === "object" && !Array.isArray(saved)) return saved;
    } catch { /* Storage might be disabled in private browsing. */ }
    return Object.create(null);
  }

  function persistSeen() {
    if (!storageKey) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(seen)); } catch {}
  }

  function renderBadges() {
    const nav = document.querySelector(".sidebar-nav");
    if (!nav) return;
    nav.querySelectorAll("[data-view], [data-update-section]").forEach(item => {
      const key = item.dataset.updateSection || item.dataset.view;
      const version = FEATURE_RELEASES[key];
      let badge = item.querySelector(".md-update-badge");
      if (storageKey && typeof version === "string" && version && seen[key] !== version) {
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "md-update-badge";
          badge.textContent = "NEW";
          badge.setAttribute("aria-label", "New update");
          item.append(badge);
        }
      } else if (badge) {
        badge.remove();
      }
    });
  }

  function acknowledge(section) {
    const version = FEATURE_RELEASES[section];
    if (!storageKey || !version || seen[section] === version) return;
    seen[section] = version;
    persistSeen();
    renderBadges();
  }

  // Only start after successful admin authentication, and scope persistence
  // to the signed-in account on this browser.
  window.addEventListener("mubest-admin-ready", event => {
    const account = String(event.detail?.email || "administrator").trim().toLowerCase();
    storageKey = STORAGE_PREFIX + account;
    seen = loadSeen();
    renderBadges();
  });

  // Run in capture phase: link destinations can navigate immediately.
  document.addEventListener("click", event => {
    const target = event.target?.closest?.(
      ".sidebar-nav [data-view], .sidebar-nav [data-update-section], #adminPanel [data-go]"
    );
    if (target) acknowledge(target.dataset.updateSection || target.dataset.view || target.dataset.go);
  }, true);

  // Keep multiple tabs in sync without inserting any badge on the public site.
  window.addEventListener("storage", event => {
    if (!storageKey || event.key !== storageKey) return;
    seen = loadSeen();
    renderBadges();
  });
})();
