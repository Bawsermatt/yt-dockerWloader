# Usa un'immagine leggera con Python
FROM python:3.10-alpine

# Installa le dipendenze di sistema (yt-dlp ha bisogno di ffmpeg e Node.js per il JS runtime)
RUN apk add --no-cache \
    ffmpeg \
    bash \
    nodejs \
    npm \
    yt-dlp \
    yt-dlp-ejs \
    yt-dlp-ejs-rt-nodejs

# Installa yt-dlp e Flask
RUN pip install --no-cache-dir flask

# Crea le cartelle di lavoro
WORKDIR /app
RUN mkdir /downloads

# Copia i file del tuo progetto
COPY . .

# Espone la porta del sito web
EXPOSE 5000

# Comando per avviare l'app
CMD ["python", "app.py"]