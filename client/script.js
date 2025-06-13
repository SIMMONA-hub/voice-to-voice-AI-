class VoiceChat {
    constructor() {
        this.ws = null;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.analyser = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.isConnected = false;
        
        // Инициализируем приложение
        this.initElements();
        this.initWebSocket();
        this.initVisualizer();
        
        console.log('VoiceChat инициализирован');
    }

    initElements() {
        // Получаем DOM элементы
        this.statusEl = document.getElementById('status');
        this.statusText = document.getElementById('statusText');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.messagesEl = document.getElementById('messages');
        this.canvas = document.getElementById('visualizer');
        this.canvasCtx = this.canvas.getContext('2d');

        // Добавляем обработчики событий
        this.startBtn.addEventListener('click', () => this.startListening());
        this.stopBtn.addEventListener('click', () => this.stopListening());
        
        console.log('DOM элементы инициализированы');
    }

    initWebSocket() {
        // Определяем URL WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        console.log('Подключаемся к WebSocket:', wsUrl);
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket подключен');
            this.isConnected = true;
            this.updateStatus('connected', '✅ Подключено - Готов к разговору!');
        };

        this.ws.onmessage = (event) => {
            console.log('Получено сообщение WebSocket');
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Ошибка парсинга сообщения WebSocket:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket отключен');
            this.isConnected = false;
            this.updateStatus('disconnected', '❌ Отключено');
            
            // Попытка переподключения через 3 секунды
            setTimeout(() => {
                if (!this.isConnected) {
                    console.log('Попытка переподключения...');
                    this.initWebSocket();
                }
            }, 3000);
        };

        this.ws.onerror = (error) => {
            console.error('Ошибка WebSocket:', error);
            this.updateStatus('error', '⚠️ Ошибка соединения');
        };
    }

    initVisualizer() {
        // Устанавливаем размер canvas
        this.canvas.width = 400;
        this.canvas.height = 100;
        
        // Рисуем начальное состояние
        this.drawVisualizerIdle();
    }

    updateStatus(status, text) {
        this.statusEl.className = `status ${status}`;
        this.statusText.textContent = text;
        console.log('Статус обновлен:', status, text);
    }

    async startListening() {
        console.log('Начинаем слушать...');
        
        try {
            // Запрашиваем доступ к микрофону с улучшенными настройками
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,     // Моно
                    echoCancellation: false,  // Отключаем эхо-компенсацию
                    noiseSuppression: false,  // Отключаем шумоподавление  
                    autoGainControl: false    // Отключаем автоусиление
                } 
            });

            console.log('Доступ к микрофону получен');

            // Настраиваем аудио контекст для визуализации
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);

            // Настраиваем media recorder
            const mimeType = this.getSupportedMimeType();
            
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType
            });

            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                    console.log('Записан аудио чанк:', event.data.size, 'байт');
                }
            };

            this.mediaRecorder.onstop = () => {
                console.log('Запись остановлена, обрабатываем...');
                this.processRecording();
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('Ошибка MediaRecorder:', event.error);
                this.updateStatus('error', '❌ Ошибка записи');
            };

            // Начинаем запись
            this.mediaRecorder.start(); // Записываем всё в один блок
            this.isRecording = true;
            
            // Обновляем UI
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.updateStatus('listening', '🎤 Слушаю... Говорите сейчас!');
            
            // Запускаем визуализацию
            this.startVisualization();

        } catch (error) {
            console.error('Ошибка начала записи:', error);
            
            let errorMessage = 'Не удалось получить доступ к микрофону. ';
            if (error.name === 'NotAllowedError') {
                errorMessage += 'Пожалуйста, разрешите доступ к микрофону и попробуйте снова.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'Микрофон не найден.';
            } else {
                errorMessage += 'Проверьте настройки микрофона.';
            }
            
            alert(errorMessage);
            this.updateStatus('error', '❌ Ошибка микрофона');
        }
    }

    getSupportedMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/wav',
            'audio/mp4',
            'audio/mpeg'
        ];
        
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                console.log('Используем MIME тип:', type);
                return type;
            }
        }
        
        console.warn('Не найден поддерживаемый MIME тип, используем default');
        return '';
    }

    stopListening() {
        console.log('Останавливаем прослушивание...');
        
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Останавливаем все треки
            if (this.mediaRecorder.stream) {
                this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
            
            // Обновляем UI
            this.startBtn.disabled = false;
            this.stopBtn.disabled = true;
            this.updateStatus('processing', '⏳ Обрабатываем ваш голос...');
        }
    }

    async processRecording() {
        if (this.audioChunks.length === 0) {
            console.log('Нет аудио данных для обработки');
            this.updateStatus('connected', '❌ Аудио не записано');
            return;
        }

        try {
            // Создаем аудио blob
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            console.log('Создан аудио blob:', audioBlob.size, 'байт');
            
            // Конвертируем в base64
            const arrayBuffer = await audioBlob.arrayBuffer();
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            
            console.log('Аудио конвертировано в base64, длина:', base64Audio.length);

            // Отправляем на сервер
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                console.log('Отправляем аудио на сервер...');
                this.ws.send(JSON.stringify({
                    type: 'audio_data',
                    audio: base64Audio
                }));
            } else {
                console.error('WebSocket не подключен');
                this.updateStatus('error', '❌ Нет соединения с сервером');
            }
        } catch (error) {
            console.error('Ошибка обработки записи:', error);
            this.updateStatus('error', '❌ Обработка не удалась');
        }
    }

    handleMessage(data) {
        console.log('Обрабатываем сообщение:', data.type);
        
        switch (data.type) {
            case 'connection':
                console.log('Соединение подтверждено:', data.message);
                break;
                
            case 'transcription':
                console.log('Получена расшифровка:', data.text);
                this.addMessage('user', data.text);
                this.updateStatus('processing', '🤖 ИИ думает...');
                break;
                
            case 'audio_response':
                console.log('Получен аудио ответ');
                this.addMessage('assistant', data.text);
                if (data.audio) {
                    this.playAudio(data.audio);
                }
                this.updateStatus('connected', '✅ Готов к следующему вопросу!');
                break;
                
            case 'error':
                console.error('Ошибка сервера:', data.message);
                this.addMessage('system', `Ошибка: ${data.message}`);
                this.updateStatus('connected', '❌ Произошла ошибка');
                break;
                
            case 'pong':
                console.log('Получен pong');
                break;
                
            default:
                console.log('Неизвестный тип сообщения:', data.type);
        }
    }

    addMessage(sender, text) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${sender}`;
        
        const contentEl = document.createElement('div');
        contentEl.className = 'message-content';
        contentEl.textContent = text;
        
        messageEl.appendChild(contentEl);
        this.messagesEl.appendChild(messageEl);
        
        // Прокручиваем вниз
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
        
        console.log('Сообщение добавлено:', sender, text);
    }

    async playAudio(base64Audio) {
        try {
            console.log('Воспроизводим аудио ответ...');
            
            // Конвертируем base64 в array buffer
            const audioData = atob(base64Audio);
            const arrayBuffer = new ArrayBuffer(audioData.length);
            const view = new Uint8Array(arrayBuffer);
            
            for (let i = 0; i < audioData.length; i++) {
                view[i] = audioData.charCodeAt(i);
            }

            // Создаем и воспроизводим аудио
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();
            
            console.log('Воспроизведение аудио начато');
            
        } catch (error) {
            console.error('Ошибка воспроизведения аудио:', error);
            
            // Резервный вариант: используем HTML5 audio элемент
            try {
                const audioBlob = new Blob([atob(base64Audio)], { type: 'audio/mpeg' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                await audio.play();
                
                // Очищаем
                audio.onended = () => URL.revokeObjectURL(audioUrl);
                
            } catch (fallbackError) {
                console.error('Резервное воспроизведение аудио не удалось:', fallbackError);
            }
        }
    }

    startVisualization() {
        if (!this.analyser || !this.isRecording) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!this.isRecording) {
                this.drawVisualizerIdle();
                return;
            }

            requestAnimationFrame(draw);

            this.analyser.getByteFrequencyData(dataArray);

            // Очищаем canvas
            this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.canvasCtx.fillStyle = '#f8f9fa';
            this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            const barWidth = (this.canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            // Рисуем частотные полосы
            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * this.canvas.height * 0.8;

                // Создаем градиент
                const gradient = this.canvasCtx.createLinearGradient(0, this.canvas.height, 0, this.canvas.height - barHeight);
                gradient.addColorStop(0, '#007bff');
                gradient.addColorStop(1, '#667eea');
                
                this.canvasCtx.fillStyle = gradient;
                this.canvasCtx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
                
                if (x >= this.canvas.width) break;
            }
        };

        draw();
    }

    drawVisualizerIdle() {
        // Рисуем неактивное состояние
        this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvasCtx.fillStyle = '#f8f9fa';
        this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисуем текст по центру
        this.canvasCtx.fillStyle = '#6c757d';
        this.canvasCtx.font = '16px sans-serif';
        this.canvasCtx.textAlign = 'center';
        this.canvasCtx.fillText('Нажмите "Начать слушать" для отображения уровня звука', this.canvas.width / 2, this.canvas.height / 2);
    }
}

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, инициализируем VoiceChat...');
    new VoiceChat();
});

// Обрабатываем изменения видимости страницы
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Страница скрыта');
    } else {
        console.log('Страница видима');
    }
});