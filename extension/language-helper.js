// language-helper.js (runs in page context, not in isolated world)
(() => {
  const LOG = (...a) => console.log('[NotionLangHelper]', ...a);

  // ===== 최신 모달/리스트 유틸 =====
  const qTopDialog = () => {
    const dialogs = [...document.querySelectorAll('div[role="dialog"][aria-modal="true"]')];
    return dialogs.at(-1) || null;
  };
  const qListbox = (root = document) => root?.querySelector?.('[role="listbox"]') || null;
  const getOptions = (root) => [...(root?.querySelectorAll?.('[role="option"]') || [])];
  const textOf = (el) => (el?.textContent || '').trim();

  const findOptionByExact = (root, exactText) => {
    const items = getOptions(root);
    const needle = (exactText || '').toLowerCase();
    return items.find(el => textOf(el).toLowerCase() === needle) || null;
  };

  // ===== React 합성 이벤트 호환 클릭/키보드 =====
  function reactClick(el) {
    if (!el) return;
    const opts = { bubbles: true, cancelable: true, composed: true, view: window, detail: 1, buttons: 1 };
    el.dispatchEvent(new PointerEvent('pointerdown', opts));
    el.dispatchEvent(new MouseEvent('mousedown', opts));
    el.focus?.();
    el.dispatchEvent(new PointerEvent('pointerup', opts));
    el.dispatchEvent(new MouseEvent('mouseup', opts));
    el.dispatchEvent(new MouseEvent('click', opts));
  }

  function pressKey(target, key) {
    if (!target) return;
    const init = { bubbles: true, cancelable: true, composed: true, key, code: key };
    target.dispatchEvent(new KeyboardEvent('keydown', init));
    target.dispatchEvent(new KeyboardEvent('keyup', init));
  }

  function chooseByKeyboard(inputEl, optionIndex) {
    if (!inputEl || optionIndex < 0) return false;
    inputEl.focus();
    // 보수적으로 첫 항목 선택까지 ArrowDown을 optionIndex+1회
    for (let i = 0; i <= optionIndex; i++) pressKey(inputEl, 'ArrowDown');
    pressKey(inputEl, 'Enter');
    return true;
  }

  // ===== 입력값 갱신 유틸 (React 인풋 갱신 보장) =====
  function setInputValue(input, value) {
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (nativeSetter) nativeSetter.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true, cancelable: true }));
  }

  // ===== 표준 언어 표시 매핑 =====
  const CANON_TO_DISPLAY = new Map([
    ['java', 'Java'],
    ['javascript', 'JavaScript'],
    ['typescript', 'TypeScript'],
    ['python', 'Python'],
    ['c', 'C'],
    ['c++', 'C++'],
    ['c#', 'C#'],
    ['go', 'Go'],
    ['kotlin', 'Kotlin'],
    ['swift', 'Swift'],
    ['ruby', 'Ruby'],
    ['php', 'PHP'],
    ['rust', 'Rust'],
    ['scala', 'Scala'],
    ['haskell', 'Haskell'],
    ['elixir', 'Elixir'],
    ['clojure', 'Clojure'],
    ['dart', 'Dart'],
    ['plain text', 'Plain text'],
  ]);

  // ===== 한글/별칭/한영반전 룰 (긴 패턴 우선) =====
  const KO_RULES = [
    [/씨\s*(샵|#|샾)/i, 'c#'],
    [/씨\s*(플러스\s*플러스|플플|\+\+)/i, 'c++'],

    // 부분 입력 허용
    [/자바\s*스크(립트)?/i, 'javascript'],
    [/자스|제이에스|js\b|노드(\.js)?|node(\.js)?/i, 'javascript'],

    [/타입\s*스크(립트)?|ts\b/i, 'typescript'],
    [/파이썬|파썬|파이\b/i, 'python'],
    [/루비/i, 'ruby'],
    [/피에이치피|피에취피|php\b/i, 'php'],
    [/코틀린/i, 'kotlin'],
    [/스위프트/i, 'swift'],
    [/고랭|고\b/i, 'go'],
    [/러스트/i, 'rust'],
    [/스칼라/i, 'scala'],
    [/하스켈/i, 'haskell'],
    [/엘릭서/i, 'elixir'],
    [/클로저/i, 'clojure'],
    [/다트/i, 'dart'],
    [/플레인\s*텍스트|텍스트/i, 'plain text'],

    [/^자바$/i, 'java'], // 정확히 '자바'일 때만 Java
    [/^씨$/i, 'c'],      // 정확히 '씨'일 때만 C
  ];

  // ===== 두벌식 간단 한영반전(영→한) 조합 =====
  const ENG_TO_JAMO = new Map(Object.entries({
    q:'ㅂ', w:'ㅈ', e:'ㄷ', r:'ㄱ', t:'ㅅ', y:'ㅛ', u:'ㅕ', i:'ㅑ', o:'ㅐ', p:'ㅔ',
    a:'ㅁ', s:'ㄴ', d:'ㅇ', f:'ㄹ', g:'ㅎ', h:'ㅗ', j:'ㅓ', k:'ㅏ', l:'ㅣ',
    z:'ㅋ', x:'ㅌ', c:'ㅊ', v:'ㅍ', b:'ㅠ', n:'ㅜ', m:'ㅡ',
    Q:'ㅃ', W:'ㅉ', E:'ㄸ', R:'ㄲ', T:'ㅆ', O:'ㅒ', P:'ㅖ'
  }));

  const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const JUNG_COMB = new Map([['ㅗㅏ','ㅘ'],['ㅗㅐ','ㅙ'],['ㅗㅣ','ㅚ'],['ㅜㅓ','ㅝ'],['ㅜㅔ','ㅞ'],['ㅜㅣ','ㅟ'],['ㅡㅣ','ㅢ']]);
  const JONG_COMB = new Map([['ㄱㅅ','ㄳ'],['ㄴㅈ','ㄵ'],['ㄴㅎ','ㄶ'],['ㄹㄱ','ㄺ'],['ㄹㅁ','ㄻ'],['ㄹㅂ','ㄼ'],['ㄹㅅ','ㄽ'],['ㄹㅌ','ㄾ'],['ㄹㅍ','ㄿ'],['ㄹㅎ','ㅀ'],['ㅂㅅ','ㅄ']]);

  function composeHangulFromJamo(jamo){
    const out=[]; let cho='',jung='',jong='';
    const flush=()=>{ if(cho&&jung){ const L=CHO.indexOf(cho),V=JUNG.indexOf(jung),T=JONG.indexOf(jong||'');
      if(L>=0&&V>=0&&T>=0){ out.push(String.fromCharCode(0xAC00+(L*21+V)*28+T));}
      else{ if(cho)out.push(cho); if(jung)out.push(jung); if(jong)out.push(jong);} }
      else{ if(cho)out.push(cho); if(jung)out.push(jung); if(jong)out.push(jong);} cho='';jung='';jong='';};
    for(const ch of jamo){
      if (JUNG.includes(ch)){
        if (!cho) out.push(ch);
        else if (!jung) jung=ch;
        else { const comb=JUNG_COMB.get(jung+ch); if (comb) jung=comb; else { flush(); jung=ch; } }
        continue;
      }
      const isConsonant = CHO.includes(ch) || ch==='ㅇ';
      if (isConsonant){
        if (!cho) cho=ch;
        else if (!jung){ out.push(cho); cho=ch; }
        else if (!jong){ if (JONG.includes(ch)) jong=ch; else { flush(); cho=ch; } }
        else { const comb=JONG_COMB.get(jong+ch); if (comb) jong=comb; else { flush(); cho=ch; } }
        continue;
      }
      flush(); out.push(ch);
    }
    flush(); return out.join('');
  }

  function engToHangulLetters(str){
    const jamo=[]; for(const ch of str) jamo.push(ENG_TO_JAMO.get(ch)||ch);
    return composeHangulFromJamo(jamo);
  }

  // 입력값을 바꾸지 않고 표준 언어명만 계산(필요 시에만 변환)
  function normalizeLanguageQueryNoMutate(raw){
    if (!raw) return null;
    const s = raw.trim();

    // 이미 표준 영문?
    if (CANON_TO_DISPLAY.has(s.toLowerCase())) return s.toLowerCase();

    // 한영 반전 후보(영문으로만 구성됐으면 영→한 조합 후 룰 적용)
    if (/^[a-zA-Z#+\s.+-]+$/.test(s)) {
      const asHangul = engToHangulLetters(s);
      for (const [re, canon] of KO_RULES) if (re.test(asHangul)) return canon;
      for (const [re, canon] of KO_RULES) if (re.test(s)) return canon;
    } else {
      for (const [re, canon] of KO_RULES) if (re.test(s)) return canon;
    }
    return null;
  }

  // ===== 검색 입력창 바인딩 =====
  function findSearchInput(dialog) {
    // 로캘별 placeholder가 다를 수 있으므로, 우선순위: placeholder → combobox → 첫 번째 text input
    const byPlaceholder =
      dialog.querySelector('input[placeholder="작업을 검색하세요"]') ||
      dialog.querySelector('input[placeholder="Search actions"]');
    if (byPlaceholder) return byPlaceholder;

    const byRole = dialog.querySelector('input[role="combobox"]');
    if (byRole) return byRole;

    return dialog.querySelector('input[type="text"]');
  }

  function bindSearchInput(input){
    if (!input || input.__langHelperBound) return;
    input.__langHelperBound = true;
    input.focus();

    input.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter') return;

      const dlg = qTopDialog(); // 최신 모달
      const listbox = qListbox(dlg);
      const query = (input.value || '').trim();

      // 표준명/표시 텍스트 계산
      const canon = normalizeLanguageQueryNoMutate(query);
      const display = canon ? CANON_TO_DISPLAY.get(canon) : null;

      if (listbox) {
        const options = getOptions(listbox);
        const texts = options.map(textOf);

        // 1) 현재 리스트에 "정확히" display가 있으면 직접 선택
        if (display) {
          const exactIndex = texts.findIndex(t => t.toLowerCase() === display.toLowerCase());
          if (exactIndex >= 0) {
            e.preventDefault();
            e.stopPropagation();

            // 클릭 우선
            reactClick(options[exactIndex]);

            // 클릭이 먹지 않으면 키보드 폴백
            setTimeout(() => chooseByKeyboard(input, exactIndex), 0);
            return;
          }
        }

        // 2) 리스트가 비었고(display도 계산됨) → 자동 변환: 입력값을 display로 바꾸고 리스트 재갱신 후 선택
        const isEmpty = options.length === 0;
        if (isEmpty && display) {
          e.preventDefault();
          e.stopPropagation();

          // 입력값을 display로 교체 → 리스트 갱신 대기
          setInputValue(input, display);
          // 몇 프레임 기다려 React가 결과를 렌더하도록
          for (let i = 0; i < 6; i++) await new Promise(r => requestAnimationFrame(r));

          const dlg2 = qTopDialog();
          const listbox2 = qListbox(dlg2);
          const options2 = getOptions(listbox2);
          const texts2 = options2.map(textOf);

          const exactIndex2 = texts2.findIndex(t => t.toLowerCase() === display.toLowerCase());
          if (exactIndex2 >= 0) {
            // 클릭 시도 + 폴백
            reactClick(options2[exactIndex2]);
            setTimeout(() => chooseByKeyboard(input, exactIndex2), 0);
            return;
          }

          // 마지막 수단: 첫 항목이라도 선택 시도(보통 display로 갱신되면 첫 항목이 목표)
          if (options2.length > 0) {
            reactClick(options2[0]);
            setTimeout(() => chooseByKeyboard(input, 0), 0);
          }
          return;
        }

        // 3) 그 외에는 Notion 기본 동작 유지
        return;
      }

      // listbox 자체가 없으면: 자동 변환 경로만 시도
      if (display) {
        e.preventDefault();
        e.stopPropagation();
        setInputValue(input, display);
        for (let i = 0; i < 6; i++) await new Promise(r => requestAnimationFrame(r));
        const dlg2 = qTopDialog();
        const listbox2 = qListbox(dlg2);
        if (!listbox2) return;
        const options2 = getOptions(listbox2);
        const texts2 = options2.map(textOf);
        const exactIndex2 = texts2.findIndex(t => t.toLowerCase() === display.toLowerCase());
        if (exactIndex2 >= 0) {
          reactClick(options2[exactIndex2]);
          setTimeout(() => chooseByKeyboard(input, exactIndex2), 0);
        } else if (options2.length > 0) {
          reactClick(options2[0]);
          setTimeout(() => chooseByKeyboard(input, 0), 0);
        }
      }
    }, { capture: true }); // capture로 React 기본 처리 전에 가로채기
  }

  // ===== 모달 감지 (포털 대응) =====
  const mo = new MutationObserver(() => {
    const dlg = qTopDialog();
    if (!dlg) return;
    const input = findSearchInput(dlg);
    if (input) bindSearchInput(input);
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  // ===== 확장에서 보내는 트리거 수신 =====
  window.addEventListener('message', (ev) => {
    const data = ev?.data;
    if (!data || !data.__fromExt) return;
    if (data.type === 'NOTION_LANGUAGE_HELPER') {
      const dlg = qTopDialog();
      if (dlg) {
        const input = findSearchInput(dlg);
        if (input) input.focus();
        return;
      }
      LOG('작업 모달이 열려있지 않습니다. Notion에서 Ctrl + / (또는 Ctrl + ?)로 먼저 여세요.');
    }
  });
})();
