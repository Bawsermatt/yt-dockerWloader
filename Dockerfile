# Usa un'immagine leggera con Python
FROM python:3.12-alpine

# Installa le dipendenze di sistema
RUN apk add --no-cache \
    ffmpeg \
    bash \
    nodejs \
    npm

# Installa Flask, Gunicorn e yt-dlp tramite pip per avere l'ultima versione
RUN pip install --no-cache-dir flask gunicorn yt-dlp

# Configura yt-dlp per usare nodejs e scaricare i solver JS (necessario per YouTube)
RUN mkdir -p /etc && echo -e "--js-runtimes node\n--remote-components ejs:github" > /etc/yt-dlp.conf

# Crea le cartelle di lavoro
WORKDIR /app
RUN mkdir /downloads

# Copia i file del tuo progetto
COPY . .

# Espone la porta del sito web
EXPOSE 5000

# Comando per avviare l'app con Gunicorn (server di produzione)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "4", "--timeout", "120", "app:app"]