// content.js
(() => {
  const LOG_PREFIX = '[NotionLangHotkey]';

  // 설정: 필요 시 PAGE_KEYDOWN을 true로 바꾸면 페이지 내 keydown도 사용합니다.
  const CONFIG = {
    COOLDOWN_MS: 250,
    PAGE_KEYDOWN: false, // background 메시지 기반을 기본값으로 권장
    SHORTCUT: { alt: true, shift: true, code: 'KeyC' }, // PAGE_KEYDOWN=true일 때만 사용
  };

  let lastTriggeredAt = 0;

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
    if (el.isContentEditable) return true; // 노션 에디터 영역
    return false;
  };

  const findClosestBlock = (node) => {
    // node가 텍스트노드일 수 있으므로 엘리먼트로 승격
    let el = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    while (el) {
      if (el.hasAttribute?.('data-block-id')) return el;
      el = el.parentElement;
    }
    return null;
  };

  const getCurrentBlock = () => {
    // 1) activeElement 기준
    const byActive = document.activeElement?.closest?.('[data-block-id]');
    if (byActive) return byActive;

    // 2) selection 기준 (캐럿이 다른 곳에 있어도 찾기)
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

    // 전략 1: 기존에 주로 쓰이던 chevron 경로
    let btn = blockEl.querySelector('[role="button"] > .chevronDown')?.parentElement;
    if (btn instanceof HTMLButtonElement) return btn;

    // 전략 2: aria-label 기반(한/영 모두 시도)
    btn = blockEl.querySelector(
      'button[aria-label*="언어"],button[aria-label*="Language"],button[aria-label*="language"]'
    );
    if (btn) return btn;

    // 전략 3: SVG 아이콘(드롭다운 트리거) 기반 후보
    btn = blockEl.querySelector('button svg')?.closest('button');
    if (btn) return btn;

    // 전략 4: role=button 일반 버튼(최후의 보루)
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

  // --- background → content 메시지 진입점 ---
  const onRuntimeMessage = (msg) => {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type !== 'NOTION_TOGGLE_LANGUAGE') return;

    if (inCooldown()) return;
    tryOpenLanguageDropdown();
  };

  // --- (옵션) 페이지 내 keydown 핸들러 ---
  const matchesShortcut = (e) => {
    return (
      e.code === CONFIG.SHORTCUT.code &&
      !!e.altKey === CONFIG.SHORTCUT.alt &&
      !!e.shiftKey === CONFIG.SHORTCUT.shift
    );
  };

  const onKeyDown = (event) => {
    if (!CONFIG.PAGE_KEYDOWN) return;
    if (!matchesShortcut(event)) return;

    // 입력 필드(특히 input/textarea) 타이핑 중엔 동작하지 않도록
    const targetTag = event.target?.tagName?.toLowerCase();
    if (isEditableField(document.activeElement) && (targetTag === 'input' || targetTag === 'textarea')) {
      return;
    }

    if (inCooldown()) return;

    event.preventDefault();
    tryOpenLanguageDropdown();
  };

  // 초기화
  const init = () => {
    // background 메시지 리스너
    try {
      chrome.runtime?.onMessage?.addListener(onRuntimeMessage);
    } catch (e) {
      // 일부 환경(비크롬)에서 chrome.*가 없을 수 있음
      warn('chrome.runtime.onMessage를 사용할 수 없습니다:', e);
    }

    // (옵션) 페이지 keydown
    if (CONFIG.PAGE_KEYDOWN) {
      document.addEventListener('keydown', onKeyDown, true);
    }

    log('content script loaded');
  };

  init();
})();
