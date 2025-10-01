// background.js (MV3 service worker)
chrome.commands.onCommand.addListener(async (command) => {
  // 하나의 커맨드만 사용: notion-language-helper
  if (command !== 'notion-language-helper') return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  // content.js가 모달 열려 있으면 검색창 포커스/정규화 처리,
  // 없으면 필요 시 단축키(CTRL + /) 시뮬레이션 등을 내부 로직으로 처리하도록 위임
  chrome.tabs.sendMessage(tab.id, { type: 'NOTION_LANGUAGE_HELPER' });
});
