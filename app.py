from flask import Flask, render_template, request, jsonify
import subprocess
import threading
from uuid import uuid4

app = Flask(__name__)

downloads = {}

class Download:
    def __init__(self, url, preset, path):
        self.id = str(uuid4())
        self.status = 'waiting'
        self.url = url
        self.preset = preset
        self.path = path

    def start(self):
        self.status = 'in-progress'
        presets = {
            'mp4_720': ['-f', 'best[ext=mp4]/best', '-S', 'res:720'],
            'mp3': ['-x', '--audio-format', 'mp3'],
            'best': ['-f', 'bestvideo+bestaudio/best']
        }
        cmd = ['yt-dlp'] + presets.get(self.preset, []) + ['-P', self.path, self.url]
        try:
            subprocess.run(cmd, check=True)
            self.status = 'success'
        except subprocess.CalledProcessError:
            self.status = 'failed'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/download', methods=['POST'])
def download():
    url = request.form.get('url')
    preset = request.form.get('preset')
    path = request.form.get('path', '/downloads')
    
    download_obj = Download(url, preset, path)
    downloads[download_obj.id] = download_obj
    threading.Thread(target=download_obj.start).start()
    
    return jsonify({'id': download_obj.id})

@app.route('/status/<download_id>')
def status(download_id):
    download_obj = downloads.get(download_id)
    if download_obj:
        return jsonify({'status': download_obj.status})
    return jsonify({'status': 'not_found'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)