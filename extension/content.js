// content.js

// 1. 설정값 정의
const CONFIG = {
  shortcutKeyCode: 'KeyC', // 단축키: Alt + Shift + C
  languages: [           // 변경할 언어 목록 (순서대로 순환)
    'javascript',
    'typescript',
    'python',
    'java',
    'css',
    'html',
    'json',
    'plaintext'
  ],
};

// 2. 현재 언어 순번을 기억할 변수
let languageIndex = 0;

// 3. 키보드 입력 감지
document.addEventListener('keydown', (event) => {
  // 4. 단축키 조합 확인 (Alt + Shift + L)
  if (event.altKey && event.shiftKey && event.code === CONFIG.shortcutKeyCode) {
    // 5. Notion의 기본 동작 방지
    event.preventDefault();

    // 6. 현재 활성화된(커서가 있는) 요소 찾기
    const activeElement = document.activeElement;
    if (!activeElement) return;

    // 7. 가장 가까운 Notion 블록의 ID 찾기
    const notionBlock = activeElement.closest('[data-block-id]');
    if (!notionBlock) {
      console.log('Notion 코드 블록을 찾을 수 없습니다.');
      return;
    }
    const blockId = notionBlock.dataset.blockId;

    // 8. 다음 언어 결정 및 순번 업데이트
    const nextLanguage = CONFIG.languages[languageIndex];
    languageIndex = (languageIndex + 1) % CONFIG.languages.length; // 목록 끝에 도달하면 처음으로

    console.log(`단축키 감지! 블록 ID: ${blockId}, 변경할 언어: ${nextLanguage}`);

    // 9. 백그라운드 스크립트에 작업 요청 메시지 전송
    chrome.runtime.sendMessage({
      type: 'UPDATE_LANGUAGE',
      payload: {
        blockId: blockId,
        language: nextLanguage,
      },
    });
  }
});