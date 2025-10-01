// content.js
(() => {
  // 1) 페이지 컨텍스트에 helper 스크립트 주입 (React 합성 이벤트 호환)
  const inject = () => {
    const url = chrome.runtime.getURL('language-helper.js');
    const s = document.createElement('script');
    s.src = url;
    s.onload = () => s.remove();
    (document.head || document.documentElement).appendChild(s);
  };
  inject();

  // 2) background → page bridge
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'NOTION_LANGUAGE_HELPER') {
      window.postMessage({ __fromExt: true, type: 'NOTION_LANGUAGE_HELPER' }, '*');
    }
  });
})();
