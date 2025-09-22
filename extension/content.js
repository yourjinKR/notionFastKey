// content.js

// 1. 설정값 정의 (이 부분이 다시 추가되었습니다)
const CONFIG = {
  shortcutKeyCode: 'KeyC', // 단축키: Alt + Shift + C
};

// 2. 키보드 입력 감지
document.addEventListener('keydown', (event) => {
  if (event.altKey && event.shiftKey && event.code === CONFIG.shortcutKeyCode) {
    event.preventDefault();

    const activeElement = document.activeElement;
    if (!activeElement) return;

    // 현재 커서가 있는 코드 블록을 찾음
    const notionBlock = activeElement.closest('[data-block-id]');
    if (!notionBlock) {
      console.log('Notion 코드 블록을 찾을 수 없습니다.');
      return;
    }

    // 해당 코드 블록 내에서 언어 선택 버튼을 정확히 찾아냄
    const languageButton = notionBlock.querySelector('[role="button"] > .chevronDown')?.parentElement;

    // 버튼을 찾았다면 클릭!
    if (languageButton) {
      console.log('언어 선택 버튼을 찾았습니다!', languageButton);
      languageButton.click();
    } else {
      console.error('언어 선택 버튼을 찾지 못했습니다.');
    }
  }
});