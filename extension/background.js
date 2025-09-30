// background.js
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-language-dropdown') return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { type: 'NOTION_TOGGLE_LANGUAGE' });
});
