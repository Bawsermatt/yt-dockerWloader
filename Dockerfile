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

# Installa Flask e Gunicorn (server WSGI di produzione)
RUN pip install --no-cache-dir flask gunicorn

# Crea le cartelle di lavoro
WORKDIR /app
RUN mkdir /downloads

# Copia i file del tuo progetto
COPY . .

# Espone la porta del sito web
EXPOSE 5000

# Comando per avviare l'app con Gunicorn (server di produzione)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "4", "--timeout", "120", "app:app"]