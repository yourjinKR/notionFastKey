// content.js
(() => {
  const LOG_PREFIX = '[NotionLangHotkey]';

  const CONFIG = {
    COOLDOWN_MS: 250,
    PAGE_KEYDOWN: true, // 커스텀 단축키를 쓰기 위해 true로 전환
  };

  let lastTriggeredAt = 0;
  let customShortcut = null; // storage에서 불러오는 사용자 지정 단축키

  const storage = chrome.storage?.sync ?? chrome.storage?.local;

  const log = (...args) => console.log(LOG_PREFIX, ...args);
  const warn = (...args) => console.warn(LOG_PREFIX, ...args);
  const error = (...args) => console.error(LOG_PREFIX, ...args);

  const inCooldown = () => {
    const now = Date.now();
    if (now - lastTriggeredAt < CONFIG.COOLDOWN_MS) return true;
    lastTriggeredAt = now;
    return false;
  };

  const isEditableField = (el) => {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return true;
    if (el.isContentEditable) return true;
    return false;
  };

  const findClosestBlock = (node) => {
    let el = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    while (el) {
      if (el.hasAttribute?.('data-block-id')) return el;
      el = el.parentElement;
    }
    return null;
  };

  const getCurrentBlock = () => {
    const byActive = document.activeElement?.closest?.('[data-block-id]');
    if (byActive) return byActive;
    const sel = window.getSelection?.();
    const anchor = sel?.anchorNode;
    if (anchor) {
      const bySelection = findClosestBlock(anchor);
      if (bySelection) return bySelection;
    }
    return null;
  };

  const findLanguageButton = (blockEl) => {
    if (!blockEl) return null;
    let btn = blockEl.querySelector('[role="button"] > .chevronDown')?.parentElement;
    if (btn instanceof HTMLButtonElement) return btn;
    btn = blockEl.querySelector('button[aria-label*="언어"],button[aria-label*="Language"],button[aria-label*="language"]');
    if (btn) return btn;
    btn = blockEl.querySelector('button svg')?.closest('button');
    if (btn) return btn;
    btn = blockEl.querySelector('button[role="button"], [role="button"]');
    if (btn) return btn;
    return null;
  };

  const tryOpenLanguageDropdown = () => {
    const block = getCurrentBlock();
    if (!block) {
      log('현재 선택된 노션 코드 블록을 찾지 못했습니다.');
      return;
    }
    const languageBtn = findLanguageButton(block);
    if (languageBtn) {
      log('언어 선택 버튼 클릭', languageBtn);
      languageBtn.click();
    } else {
      error('언어 선택 버튼을 찾지 못했습니다. 선택자 업데이트가 필요할 수 있습니다.');
    }
  };

  // background → content
  const onRuntimeMessage = (msg) => {
    if (!msg || msg.type !== 'NOTION_TOGGLE_LANGUAGE') return;
    if (inCooldown()) return;
    tryOpenLanguageDropdown();
  };

  // 커스텀 단축키 매칭
  const matchCustomShortcut = (e) => {
    if (!customShortcut) return false;
    return (
      e.code === customShortcut.code &&
      !!e.ctrlKey === !!customShortcut.ctrl &&
      !!e.shiftKey === !!customShortcut.shift &&
      !!e.altKey === !!customShortcut.alt &&
      !!e.metaKey === !!customShortcut.meta
    );
  };

  const onKeyDown = (event) => {
    if (!CONFIG.PAGE_KEYDOWN) return;

    // 입력창에서의 실수 방지
    const targetTag = event.target?.tagName?.toLowerCase();
    if (isEditableField(document.activeElement) && (targetTag === 'input' || targetTag === 'textarea')) {
      return;
    }

    if (!matchCustomShortcut(event)) return;
    if (inCooldown()) return;

    event.preventDefault();
    tryOpenLanguageDropdown();
  };

  // storage에서 커스텀 단축키 로딩
  const loadShortcut = async () => {
    try {
      const { customShortcut: s } = await storage.get(['customShortcut']);
      customShortcut = s || null;
      log('custom shortcut loaded:', customShortcut || '(none)');
    } catch (e) {
      warn('failed to load custom shortcut:', e);
    }
  };

  // 옵션 페이지에서 실시간 변경 반영
  const onStorageChanged = (changes, area) => {
    if (area !== 'sync' && area !== 'local') return;
    if (changes.customShortcut) {
      customShortcut = changes.customShortcut.newValue || null;
      log('custom shortcut updated:', customShortcut || '(cleared)');
    }
  };

  const init = async () => {
    try {
      chrome.runtime?.onMessage?.addListener(onRuntimeMessage);
    } catch (e) {
      warn('chrome.runtime.onMessage 사용 불가:', e);
    }

    if (CONFIG.PAGE_KEYDOWN) {
      document.addEventListener('keydown', onKeyDown, true);
    }

    await loadShortcut();
    try {
      chrome.storage?.onChanged?.addListener(onStorageChanged);
    } catch (e) {
      warn('chrome.storage.onChanged 사용 불가:', e);
    }

    log('content script loaded');
  };

  init();
})();
