# yt-dockerWloader 

**yt-dockerWloader** è una potente interfaccia web self-hosted per `yt-dlp`, progettata per essere eseguita in un ambiente **Docker**. Ti permette di scaricare video e audio da YouTube (e centinaia di altri siti supportati) con facilità, utilizzando preset personalizzabili o comandi avanzati.

## ✨ Caratteristiche

* **Interfaccia Web Intuitiva**: Gestisci i tuoi download comodamente dal browser.
* **Gestione Preset**: Crea e salva configurazioni personalizzate (es. Solo MP3, MP4 720p, Migliore Qualità).
* **Modalità Avanzata**: Inserisci flag personalizzati di `yt-dlp` direttamente dall'interfaccia.
* **Monitoraggio in Tempo Reale**: Visualizza i log di scaricamento in diretta e lo stato del processo.
* **Cronologia Download**: Tieni traccia dei video scaricati con relative miniature e metadati.
* **Dockerized**: Installazione rapida e pulita senza dipendenze locali (FFmpeg e Python sono inclusi nel container).
* **Verifica Formati**: Strumento integrato per listare tutti i formati disponibili per un determinato URL.

## 🛠️ Tecnologie utilizzate

* **Backend**: Python, Flask
* **Frontend**: HTML5, CSS3, jQuery (AJAX per il polling degli stati)
* **Core**: [yt-dlp](https://github.com/yt-dlp/yt-dlp)
* **Containerizzazione**: Docker & Alpine Linux

---

## 🚀 Installazione Rapida

### 1. Prerequisiti

Assicurati di avere **Docker** installato sul tuo sistema.

### 2. Clonazione e Configurazione

Clona la repository e naviga nella cartella:

```bash
git clone https://github.com/bawsermatt/yt-dockerWloader.git
cd yt-dockerWloader

```

### 3. Build e Avvio

Costruisci l'immagine Docker e avvia il container:

```bash
docker build -t yt-dockerwloader .
docker run -d \
  -p 5000:5000 \
  -v /path/to/folder:/downloads \
  --name yt-downloader \
  yt-dockerwloader

```

*Nota: Sostituisci `/path/to/folder` con la cartella sul tuo PC dove vuoi salvare i file.*

### 4. Utilizzo

Apri il browser e vai su: `http://IP_ADDRESS:5000`

---

## ⚙️ Configurazione dei Preset

L'applicazione utilizza un file `settings.json` per memorizzare la cartella di download predefinita e i preset di comando. Puoi modificarli direttamente dall'interfaccia web nella sezione **Impostazioni**.

Esempio di preset inclusi:

* **best**: Scarica la massima qualità video+audio.
* **mp4_720**: Forza il formato MP4 con risoluzione massima 720p.
* **mp3**: Estrae solo l'audio in formato MP3.

---

## 📂 Struttura del Progetto

```text
.
├── app.py              # Logica Flask e gestione processi yt-dlp
├── Dockerfile          # Configurazione ambiente Alpine/Python/FFmpeg
├── settings.json       # Persistenza preset e impostazioni
├── static/
│   ├── styles.css      # Design moderno e responsive
│   └── script.js       # Gestione AJAX, modal e polling log
├── templates/
│   └── index.html      # Struttura della Single Page Application
└── README.md           # Questa documentazione

```

---

## 🤝 Contribuire

Le pull request sono benvenute! Per modifiche importanti, apri prima un'issue per discutere di cosa vorresti cambiare.

## 📝 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per dettagli.

---

*Creato con ❤️ per semplificare il download di contenuti multimediali.*