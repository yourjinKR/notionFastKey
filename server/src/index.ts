// src/index.ts

import express from 'express';
import dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import cors from 'cors';

// 1. .env 파일 로드 및 Notion 클라이언트 초기화
dotenv.config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const app = express();
const PORT = 3000;

// 2. 서버가 JSON 형태의 요청을 받을 수 있도록 설정
app.use(cors()); // <--- 2. cors 미들웨어 사용하기 (app.use(express.json()) 위 또는 아래)
app.use(express.json());

// 3. 핵심 API 엔드포인트 생성
app.post('/api/update-language', async (req, res) => {
  try {
    const { blockId, language } = req.body;

    // 4. 요청 데이터 유효성 검사
    if (!blockId || !language) {
      return res.status(400).json({ error: 'blockId와 language는 필수입니다.' });
    }

    // 5. Notion API 호출하여 코드 블록 업데이트
    const response = await notion.blocks.update({
      block_id: blockId,
      code: {
        language: language,
      },
    });

    console.log('Notion API 응답:', response);
    res.status(200).json({ message: '언어 변경에 성공했습니다.', data: response });

  } catch (error) {
    console.error('API 처리 중 오류 발생:', error);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
});


app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});