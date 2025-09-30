const DEFAULT_CONFIG = {
  // content.js에서 background 메시지 방식은 계속 지원하고,
  // 커스텀 키는 '추가' 경로로 동작합니다.
  customShortcut: { alt: true, shift: true, ctrl: false, meta: false, code: 'KeyC' } // 초기값
};

const storage = chrome.storage?.sync ?? chrome.storage?.local;

const displayEl = document.getElementById('shortcutDisplay');
const captureEl = document.getElementById('shortcutCapture');
const clearBtn = document.getElementById('clearBtn');

function formatShortcut(s) {
  if (!s) return '(설정 안 함)';
  const parts = [];
  if (s.ctrl) parts.push('Ctrl');
  if (s.shift) parts.push('Shift');
  if (s.alt) parts.push('Alt');
  if (s.meta) parts.push('Meta');
  // code는 'KeyK', 'Digit1' 같은 값이므로 마지막만 예쁘게
  parts.push(s.code);
  return parts.join(' + ');
}

async function loadConfig() {
  const { customShortcut } = await storage.get(['customShortcut']);
  const cfg = customShortcut ?? DEFAULT_CONFIG.customShortcut;
  displayEl.value = formatShortcut(cfg);
}

function isForbiddenKey(e) {
  // 시스템과 충돌이 잦은 키들 배제(원한다면 완화 가능)
  const forbiddenCodes = new Set(['Escape', 'F5', 'F11']);
  return forbiddenCodes.has(e.code);
}

function normalizeShortcut(e) {
  return {
    ctrl: !!e.ctrlKey,
    shift: !!e.shiftKey,
    alt: !!e.altKey,
    meta: !!e.metaKey,
    code: e.code // 'KeyA', 'KeyC', 'Slash', 'Backslash', 'Digit1' 등
  };
}

async function saveShortcut(s) {
  await storage.set({ customShortcut: s });
  displayEl.value = formatShortcut(s);
}

captureEl.addEventListener('keydown', async (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (isForbiddenKey(e)) {
    captureEl.value = '이 키는 사용할 수 없습니다.';
    return;
  }
  // 수정키 없이 알파벳 하나만은 위험하니 권장하지 않음(원한다면 허용 가능)
  if (!e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
    captureEl.value = 'Ctrl/Shift/Alt/Meta 중 하나 이상과 조합하세요.';
    return;
  }

  const s = normalizeShortcut(e);
  await saveShortcut(s);
  captureEl.value = formatShortcut(s);
});

clearBtn.addEventListener('click', async () => {
  await storage.remove('customShortcut');
  displayEl.value = '(설정 안 함)';
  captureEl.value = '';
});

loadConfig();
