# Usa un'immagine leggera con Python
FROM python:3.10-alpine

# Installa le dipendenze di sistema
RUN apk add --no-cache \
    ffmpeg \
    bash \
    nodejs \
    npm \
    yt-dlp \
    yt-dlp-ejs \
    yt-dlp-ejs-rt-nodejs

# Installa Flask
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