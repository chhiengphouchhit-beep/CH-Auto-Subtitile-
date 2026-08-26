FROM node:18-bullseye

# Install FFmpeg, Chromium, and Fontconfig for 100% Khmer font & video rendering
RUN apt-get update && apt-get install -y \
    ffmpeg \
    chromium \
    fonts-noto-core \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 1100

CMD ["node", "server.js"]
