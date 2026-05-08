from flask import Flask, render_template, request, jsonify
import subprocess
import threading

app = Flask(__name__)

# Lista globale per monitorare i download (molto semplificata)
downloads = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/download', methods=['POST'])
def download():
    url = request.form.get('url')
    preset = request.form.get('preset')
    path = request.form.get('path', '/downloads')

    # Mappa dei tuoi preset personalizzati
    presets = {
        'mp4_720': ['-f', 'best[ext=mp4]/best', '-S', 'res:720'],
        'mp3': ['-x', '--audio-format', 'mp3'],
        'best': ['-f', 'bestvideo+bestaudio/best']
    }

    cmd = ['yt-dlp'] + presets.get(preset, []) + ['-P', path, url]
    
    # Lanciamo il download in un thread separato per non bloccare il sito
    thread = threading.Thread(target=lambda: subprocess.run(cmd))
    thread.start()
    
    return f"Download avviato per: {url} con preset {preset}"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)