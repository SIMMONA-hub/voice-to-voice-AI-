import WebSocket, { WebSocketServer } from 'ws';
import OpenAI from 'openai';
import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Загружаем переменные окружения
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Инициализируем Express приложение
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Инициализируем OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Обслуживаем статические файлы из папки client
app.use(express.static(path.join(__dirname, '../client')));

// Класс голосовой сессии
class VoiceSession {
  constructor(ws) {
    this.ws = ws;
    this.isProcessing = false;
    console.log('Новая голосовая сессия создана');
  }

  async processAudio(audioData) {
    if (this.isProcessing) {
      console.log('Уже обрабатывается, пропускаем...');
      return;
    }
    
    this.isProcessing = true;
    console.log('Обрабатываем аудио данные...');

    try {
      // Шаг 1: Конвертируем аудио в текст
      const transcription = await this.transcribeAudio(audioData);
      console.log('Расшифровка:', transcription);
      
      if (transcription && transcription.trim()) {
        // Отправляем расшифровку клиенту
        this.ws.send(JSON.stringify({
          type: 'transcription',
          text: transcription
        }));

        // Шаг 2: Получаем ответ от ИИ
        const response = await this.getAIResponse(transcription);
        console.log('Ответ ИИ:', response);
        
        // Шаг 3: Конвертируем ответ в речь
        const audioResponse = await this.textToSpeech(response);
        
        // Отправляем аудио обратно клиенту
        this.ws.send(JSON.stringify({
          type: 'audio_response',
          audio: audioResponse,
          text: response
        }));
      } else {
        console.log('Расшифровка не получена');
        this.ws.send(JSON.stringify({
          type: 'error',
          message: 'Не удалось понять аудио'
        }));
      }
    } catch (error) {
      console.error('Ошибка обработки аудио:', error);
      this.ws.send(JSON.stringify({
        type: 'error',
        message: 'Не удалось обработать аудио: ' + error.message
      }));
    } finally {
      this.isProcessing = false;
    }
  }

  async transcribeAudio(audioData) {
    try {
      console.log('Начинаем расшифровку...');
      
      // Конвертируем base64 в буфер
      const buffer = Buffer.from(audioData, 'base64');
      
      // Создаем File объект для OpenAI
      const file = new File([buffer], 'audio.webm', { type: 'audio/webm' });
      
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'ru', // Русский язык
      });

      return transcription.text;
    } catch (error) {
      console.error('Ошибка расшифровки:', error);
      throw new Error('Расшифровка не удалась: ' + error.message);
    }
  }

  async getAIResponse(text) {
    try {
      console.log('Получаем ответ ИИ для:', text);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Ты дружелюбный голосовой ассистент. Отвечай живо и естественно, как в разговоре. На приветствия отвечай тепло и приветливо. Используй разговорный стиль. Ограничивай ответы 2-3 предложениями. Отвечай на русском языке.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 150,
        temperature: 0.8,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Ошибка ответа ИИ:', error);
      return "Извините, у меня проблемы с обработкой этого запроса.";
    }
  }

  async textToSpeech(text) {
    try {
      console.log('Конвертируем текст в речь:', text);
      
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy', // Варианты: alloy, echo, fable, onyx, nova, shimmer
        input: text,
        speed: 1.0,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      return buffer.toString('base64');
    } catch (error) {
      console.error('Ошибка TTS:', error);
      throw new Error('Конвертация текста в речь не удалась: ' + error.message);
    }
  }
}

// Обработка WebSocket соединений
wss.on('connection', (ws, req) => {
  console.log('Новый клиент подключился');
  const session = new VoiceSession(ws);

  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Подключен к голосовому серверу'
  }));

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Получено сообщение типа:', data.type);
      
      switch (data.type) {
        case 'audio_data':
          console.log('Обрабатываем аудио данные...');
          await session.processAudio(data.audio);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        default:
          console.log('Неизвестный тип сообщения:', data.type);
      }
    } catch (error) {
      console.error('Ошибка обработки сообщения:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Неверный формат сообщения'
      }));
    }
  });

  ws.on('close', () => {
    console.log('Клиент отключился');
  });

  ws.on('error', (error) => {
    console.error('Ошибка WebSocket:', error);
  });
});

// Запускаем сервер
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Голосовой сервер запущен на http://localhost:${PORT}`);
  console.log('📁 Обслуживаем клиентские файлы из папки ../client');
  console.log('🎤 WebSocket сервер готов к голосовым соединениям');
});