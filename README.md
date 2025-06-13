# 🎤 Voice-to-Voice Chat Application

Real-time voice-to-voice chat application using WebSocket and OpenAI APIs, deployed with Docker on DigitalOcean.

## ✨ Features

- 🎙️ Real-time voice recording
- 🗣️ Speech-to-text transcription (OpenAI Whisper)
- 🤖 AI-powered responses (GPT-3.5-turbo)
- 🔊 Text-to-speech synthesis (OpenAI TTS)
- 📊 Audio visualization
- 💬 Chat history
- 🌐 WebSocket real-time communication
- 🐳 Docker containerization
- ☁️ Cloud deployment ready

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express, WebSocket
- **AI Services**: OpenAI (Whisper, GPT, TTS)
- **Audio**: MediaRecorder API, Web Audio API
- **Deployment**: Docker, DigitalOcean
- **Containerization**: Docker Compose

## 🌐 Live Demo

**Production URL**: http://143.244.153.34:3000

*Note: Microphone access requires HTTPS in production. The demo works but may have microphone permission issues on HTTP.*

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- Docker & Docker Compose
- OpenAI API key
- DigitalOcean account (for deployment)

### Local Development

1. **Clone the repository**:
```bash
git clone https://github.com/SIMMONA-hub/voice-to-voice-AI-.git
cd voice-to-voice-AI-
```

2. **Set up environment variables**:
```bash
# Create .env file in server directory
cp server/.env.example server/.env

# Edit with your OpenAI API key
nano server/.env
```

3. **Add your API key to server/.env**:
```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=development
```

4. **Run with Docker Compose**:
```bash
docker-compose up --build
```

5. **Or run locally without Docker**:
```bash
cd server
npm install
npm start
```

6. **Open your browser**:
```
http://localhost:3000
```

### Production Deployment

#### Option 1: Docker (Recommended)

1. **Build and run with Docker**:
```bash
# Build the image
docker build -t voice-app .

# Run the container
docker run -d \
  --name voice-app \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file server/.env \
  voice-app
```

#### Option 2: DigitalOcean Deployment

1. **Create a DigitalOcean Droplet**:
   - Ubuntu 24.10 with Docker pre-installed
   - Minimum: 2 vCPUs, 4GB RAM

2. **SSH into your server**:
```bash
ssh root@YOUR_SERVER_IP
```

3. **Clone and deploy**:
```bash
# Install dependencies
apt update && apt install -y git curl

# Clone repository
git clone https://github.com/SIMMONA-hub/voice-to-voice-AI-.git
cd voice-to-voice-AI-

# Create .env file
nano server/.env
# Add your OpenAI API key

# Build and run
docker build -t voice-app .
docker run -d --name voice-app --restart unless-stopped -p 3000:3000 --env-file server/.env voice-app
```

4. **Configure firewall**:
```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw allow 3000  # App port
ufw enable
```

## 📁 Project Structure

```
voice-to-voice-AI-/
├── client/
│   ├── index.html          # Main HTML interface
│   ├── style.css           # Styles and responsive design
│   └── script.js           # Frontend logic and WebSocket client
├── server/
│   ├── package.json        # Server dependencies
│   ├── server.js           # WebSocket server + OpenAI integration
│   └── .env               # Environment variables (not in repo)
├── Dockerfile             # Docker container configuration
├── docker-compose.yml     # Docker Compose orchestration
├── .dockerignore          # Docker ignore rules
├── .gitignore             # Git ignore rules
├── nginx.conf             # Nginx configuration (for SSL)
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Required
OPENAI_API_KEY=sk-your-openai-api-key-here
PORT=3000

# Optional
NODE_ENV=production
```

### OpenAI API Settings

The application uses these OpenAI models:
- **Speech-to-Text**: `whisper-1`
- **Chat**: `gpt-3.5-turbo` 
- **Text-to-Speech**: `tts-1` with `alloy` voice

### Audio Settings

- **Sample Rate**: Auto-detected by browser
- **Channels**: Mono (1 channel)
- **Format**: WebM with Opus codec (preferred)
- **Echo Cancellation**: Disabled for better quality
- **Noise Suppression**: Disabled for cleaner recording

## 🐳 Docker Configuration

### Dockerfile Features

- **Base Image**: `node:18-alpine` (lightweight)
- **Multi-stage**: Optimized for production
- **Security**: Runs as non-root user
- **Health Check**: Built-in health monitoring

### Docker Compose Services

- **voice-app**: Main application container
- **nginx**: Reverse proxy with SSL (optional)

### Commands

```bash
# Development with hot reload
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker logs voice-app

# Scale the application
docker-compose up --scale voice-app=3
```

## 🌐 Deployment Options

### 1. DigitalOcean App Platform
```bash
# Deploy directly from GitHub
doctl apps create --spec app.yaml
```

### 2. AWS EC2 with ECS
```bash
# Using AWS CLI
aws ecs create-cluster --cluster-name voice-app-cluster
```

### 3. Google Cloud Run
```bash
# Deploy to Cloud Run
gcloud run deploy voice-app --source .
```

### 4. Heroku
```bash
# Deploy to Heroku
heroku create voice-app
git push heroku main
```

## 🔐 SSL/HTTPS Setup (Optional)

For microphone access in production, HTTPS is required:

### Using Let's Encrypt with Nginx

1. **Install Certbot**:
```bash
apt install -y certbot python3-certbot-nginx
```

2. **Get SSL certificate**:
```bash
certbot --nginx -d your-domain.com
```

3. **Update nginx.conf** with SSL configuration

4. **Auto-renewal**:
```bash
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

## 🐛 Troubleshooting

### Common Issues

1. **Microphone not working**:
   - ✅ Ensure HTTPS is enabled
   - ✅ Allow microphone permissions in browser
   - ✅ Check browser compatibility (Chrome recommended)

2. **Docker build fails**:
   - ✅ Check Docker is running
   - ✅ Verify Dockerfile syntax
   - ✅ Ensure all files are present

3. **API errors**:
   - ✅ Verify OpenAI API key is valid
   - ✅ Check API credits/billing
   - ✅ Ensure network connectivity

4. **Container won't start**:
   - ✅ Check logs: `docker logs voice-app`
   - ✅ Verify .env file exists
   - ✅ Check port conflicts

### Debugging Commands

```bash
# Check container status
docker ps -a

# View application logs
docker logs -f voice-app

# Access container shell
docker exec -it voice-app sh

# Check resource usage
docker stats voice-app

# Test API connectivity
curl http://localhost:3000/health
```

## 📊 Monitoring & Logging

### Health Check Endpoint

```bash
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-06-13T17:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Log Levels

- **ERROR**: Critical issues
- **WARN**: Warning messages  
- **INFO**: General information
- **DEBUG**: Detailed debugging info

## 🔒 Security Considerations

- ✅ Environment variables for secrets
- ✅ Non-root Docker user
- ✅ Input validation and sanitization
- ✅ Rate limiting (recommended for production)
- ✅ CORS configuration
- ✅ HTTPS/WSS in production

## 📈 Performance Optimization

### Production Recommendations

- **Use nginx as reverse proxy**
- **Enable gzip compression**
- **Implement Redis for session storage**
- **Add CDN for static assets**
- **Monitor with Prometheus + Grafana**

### Scaling Options

```bash
# Horizontal scaling with Docker Compose
docker-compose up --scale voice-app=3

# Load balancing with nginx
# See nginx.conf for configuration
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Setup

```bash
# Install dependencies
cd server && npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Code formatting
npm run format
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing excellent AI APIs
- **Docker** for containerization platform
- **DigitalOcean** for reliable cloud hosting
- **WebSocket** for real-time communication
- **Node.js** community for amazing packages

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/SIMMONA-hub/voice-to-voice-AI-/issues)
- **Discussions**: [GitHub Discussions](https://github.com/SIMMONA-hub/voice-to-voice-AI-/discussions)
- **Email**: [Your Email]
- **Documentation**: [Wiki](https://github.com/SIMMONA-hub/voice-to-voice-AI-/wiki)

## 🚀 Roadmap

- [ ] **SSL/HTTPS setup automation**
- [ ] **Multi-language support**
- [ ] **Voice activity detection**
- [ ] **Custom wake words**
- [ ] **Speech emotion recognition**
- [ ] **WebRTC peer-to-peer audio**
- [ ] **Mobile app development**
- [ ] **Kubernetes deployment**

---

**⭐ Star this repository if you found it helpful!**

**Made with ❤️ using OpenAI APIs, Docker, and modern web technologies**
