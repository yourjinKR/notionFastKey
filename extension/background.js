// background.js

// 1. 서버 API의 주소
const API_ENDPOINT = 'http://localhost:3000/api/update-language';

// 2. content.js로부터 메시지를 수신 대기
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 3. 우리가 보낸 메시지가 맞는지 확인
  if (message.type === 'UPDATE_LANGUAGE') {
    const { blockId, language } = message.payload;
    
    console.log(`백그라운드 수신: Block ID - ${blockId}, Language - ${language}`);

    // 4. 백엔드 서버에 fetch API 요청 보내기
    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blockId: blockId,
        language: language,
      }),
    })
    .then(response => response.json().then(data => ({ ok: response.ok, data })))
    .then(({ ok, data }) => {
      if (ok) {
        console.log('서버 응답 (성공):', data.message);
      } else {
        console.error('서버 응답 (에러):', data.error);
      }
    })
    .catch(error => {
      console.error('네트워크 또는 서버 연결 에러:', error);
    });

    // 비동기 메시지 처리를 위해 true를 반환하는 것이 좋습니다.
    return true; 
  }
});