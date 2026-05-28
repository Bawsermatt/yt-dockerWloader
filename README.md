<div align="center">
  <h1>🎬 yt-dockerWloader</h1>
  <p>
    <strong>Un'interfaccia web potente, self-hosted e containerizzata per yt-dlp.</strong>
  </p>
  <p>
    <img alt="Python" src="https://img.shields.io/badge/Python-3.10+-blue.svg" />
    <img alt="Framework" src="https://img.shields.io/badge/Framework-Flask-lightgrey.svg" />
    <img alt="Docker" src="https://img.shields.io/badge/Docker-Ready-2496ED.svg" />
    <img alt="License" src="https://img.shields.io/badge/License-MIT-green.svg" />
  </p>
</div>

---

**yt-dockerWloader** è un'interfaccia grafica moderna (Web UI) basata su Flask per gestire i tuoi download tramite `yt-dlp`. Essendo completamente containerizzata con Docker, offre un ambiente isolato e pulito per scaricare contenuti multimediali da YouTube e da migliaia di altri siti web, senza la necessità di installare FFmpeg o Python sulla tua macchina host.

---

## ✨ Funzionalità Principali

- 🖥️ **Interfaccia Web Moderna & Intuitiva:** Gestisci i tuoi download comodamente dal browser con un'UI responsiva, pulita e minimale.
- 🌍 **Download Multilingua con Fallback Combinatorio:** Seleziona fino a 5 tracce audio differenti. L'applicativo genera dinamicamente combinazioni decrescenti dei flussi richiesti per evitare fallimenti: se un video in una playlist non ha tutte le lingue selezionate, il download non fallisce, ma scarica automaticamente il massimo subset disponibile!
- 🛡️ **Tolleranza agli Errori dei Sottotitoli:** Gestione dei sottotitoli ottimizzata con tolleranza d'errore integrata. Se un sottotitolo non è disponibile o fallisce (ad esempio a causa del rate limiting `HTTP 429`), il sistema salta l'errore e completa comunque con successo il download del video e di tutti i flussi audio.
- ⚙️ **Visualizzatore Comando CLI (`ℹ️ Info Comando`):** Un comodo pannello informativo ti consente di ispezionare in tempo reale l'esatto comando `yt-dlp` CLI eseguito in background e di copiarlo negli appunti con un clic.
- 📊 **Log Unbuffered in Tempo Reale:** Ottimizzazione dello streaming dei log. Il server inoltra istantaneamente ogni riga di progresso di `yt-dlp` senza alcun buffering interno in Python, garantendo aggiornamenti istantanei nella UI.
- 📦 **Pronto per Docker & Unicode-Safe:** Tutte le comunicazioni di sistema integrano la codifica UTF-8 con gestione degli errori tollerante. Questo previene qualsiasi crash dovuto a caratteri speciali o emoji nei titoli quando si esegue l'app in container con locale minima (es. ASCII).
- ⚙️ **Preset Personalizzabili:** Salva e gestisci i tuoi parametri di download preferiti (es. `Solo MP3`, `MP4 1080p`, ecc.) per utilizzi rapidi.
- 🕒 **Cronologia Visiva:** Tieni traccia di tutto ciò che hai scaricato con miniature integrate e tipologia di download (Audio/Video).

---

## 🏗️ Come Funziona (Architettura)

L'applicativo si basa su un'architettura client-server semplice ed efficace:
1. **Frontend (Client):** Una Single-Page Application (SPA) in HTML, CSS moderno e jQuery, che comunica col server tramite richieste AJAX in background.
2. **Backend (Server):** Un server web Python/Flask che funge da intermediario. Riceve le tue configurazioni (URL, risoluzione, lingue) e orchestra i processi di `yt-dlp`.
3. **Core (yt-dlp + FFmpeg):** I comandi vengono eseguiti in background (thread separati). FFmpeg interviene alla fine del download per unire video, tracce audio multiple e incorporare i sottotitoli (convertiti dinamicamente in `.srt` per la massima compatibilità).

---

## 🚀 Installazione e Avvio

Puoi installare `yt-dockerWloader` tramite un semplice comando `docker run` oppure tramite `docker-compose`.

### Prerequisiti
- **Docker** installato sul sistema.
- (Opzionale ma consigliato) **Docker Compose**.

### Metodo 1: Docker Compose (Consigliato)
Crea un file `docker-compose.yml` nella cartella in cui vuoi ospitare il progetto:

```yaml
version: '3.8'

services:
  yt-downloader:
    build: .
    # Oppure usa l'immagine caricata nel tuo registro Gitea:
    # image: git.matterver.dpdns.org/mattia/yt-dockerwloader:latest
    container_name: yt-downloader
    ports:
      - "5000:5000"
    volumes:
      - /percorso/sul/tuo/nas/download:/downloads
      - ./settings.json:/app/settings.json # Opzionale: per salvare i preset al riavvio
    restart: unless-stopped
```
Avvia il servizio con:
```bash
docker-compose up -d
```

### Metodo 2: Docker Run (Manuale)
Clona la repository e avvia il build:

```bash
git clone https://git.matterver.dpdns.org/Mattia/yt-dockerwloader.git
cd yt-dockerwloader
docker build -t yt-dockerwloader .

docker run -d \
  -p 5000:5000 \
  -v /path/to/folder:/downloads \
  --name yt-downloader \
  --restart unless-stopped \
  yt-dockerwloader
```
*(Ricorda di sostituire `/path/to/folder` con la directory reale dove desideri archiviare i tuoi file).*

---

## 📖 Guida all'Uso Rapida

1. **Accesso all'App:** Apri il tuo browser e visita `http://IP_DEL_TUO_SERVER:5000`.
2. **Configurazione Iniziale:** Clicca su **Impostazioni** (in alto a destra) per verificare che la cartella di destinazione corrisponda al mount point di Docker (solitamente `/downloads`).
3. **Avviare un Download:**
   - Incolla l'URL di un video o di una playlist.
   - Scegli un **Preset** oppure clicca su **⚙️ Mostra Avanzate**.
   - (Se usi la modalità avanzata): Clicca sul tasto 🔄 per caricare le tracce audio e i sottotitoli disponibili sul server di YouTube. Seleziona quelli desiderati.
   - Clicca **Scarica**.
4. **Tracciamento:** Si aprirà automaticamente il pannello dei Log.
   - Puoi fare clic sul tasto `ℹ️ Info Comando` a destra dell'intestazione per visualizzare l'esatta riga di comando `yt-dlp` in esecuzione sul server.
   - Al termine, il file multimediale finale unito in MKV (o nel formato scelto) sarà pronto nella tua cartella!

---

## 🛠️ Stack Tecnologico

- **Linguaggio Backend:** Python 3.10+
- **Framework Web:** Flask
- **Motore Download:** [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- **Motore Multimediale:** FFmpeg (per merge MKV, embed sottotitoli e metadata)
- **Frontend:** HTML5, CSS3 (Inter font), jQuery

---

## 🤝 Contribuire
Ogni contributo è il benvenuto! Sentiti libero di aprire una **Issue** se riscontri bug o desideri proporre nuove funzionalità, oppure di inviare una **Pull Request** con i tuoi miglioramenti.

## 📝 Licenza
Questo progetto è open-source ed è distribuito sotto i termini della Licenza **MIT**. Consulta il file `LICENSE` per ulteriori dettagli.

<div align="center">
  <p><i>Realizzato per semplificare la gestione multimediale self-hosted.</i></p>
</div>