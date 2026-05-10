from flask import Flask, render_template, request, jsonify
import subprocess
import threading
import json
import shlex
from uuid import uuid4

app = Flask(__name__)

# Carica le impostazioni dal file
with open('settings.json') as f:
    settings = json.load(f)

presets = settings.get('presets', {})
download_folder = settings.get('download_folder', '/downloads')

downloads = {}
download_history = []

class Download:
    def __init__(self, url, preset=None, path='/downloads', options=None):
        self.id = str(uuid4())
        self.status = 'waiting'
        self.url = url
        self.preset = preset
        self.path = path
        self.options = options or []
        self.error = None
        self.log = ''
        self.process = None
        self.title = None
        self.filename = None
        self.type = 'Video'

    def start(self):
        self.status = 'in-progress'
        cmd = ['yt-dlp'] + (self.options if self.options else presets.get(self.preset, [])) + ['-P', self.path, self.url]
        try:
            self.process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
            for line in self.process.stdout:
                self.log += line
                # Estrai il titolo dal log
                if '[download] Downloading video' in line or 'Destination:' in line:
                    if 'Destination:' in line:
                        # Estrai il nome del file
                        parts = line.split('Destination: ')
                        if len(parts) > 1:
                            self.filename = parts[1].strip().split('\n')[0]
            self.process.wait()
            if self.process.returncode == 0:
                self.status = 'success'
                # Aggiungi alla cronologia
                self._add_to_history()
            else:
                if self.status != 'failed':
                    self.status = 'failed'
        except Exception as e:
            self.status = 'failed'
            self.error = str(e)

    def _add_to_history(self):
        global download_history
        # Determina il tipo basato sulle opzioni
        options_str = ' '.join(self.options).lower()
        is_audio = 'bestaudio' in options_str or 'audio' in options_str
        self.type = 'Audio' if is_audio else 'Video'
        
        # Estrai il titolo da yt-dlp
        try:
            info_cmd = ['yt-dlp', '--dump-json', '-q', self.url]
            result = subprocess.run(info_cmd, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                import json as json_module
                info = json_module.loads(result.stdout)
                self.title = info.get('title', 'Sconosciuto')
        except:
            self.title = 'Sconosciuto'
        
        download_history.append({
            'title': self.title,
            'filename': self.filename or 'File sconosciuto',
            'type': self.type,
            'url': self.url
        })

    def stop(self):
        if self.process and self.status == 'in-progress':
            try:
                self.process.kill()
                self.log += '[STOPPED by user]\n'
                self.status = 'failed'
                return True
            except Exception as e:
                self.error = str(e)
        return False

@app.route('/')
def index():
    return render_template('index.html', presets=presets, download_folder=download_folder)

@app.route('/download', methods=['POST'])
def download():
    url = request.form.get('url')
    preset = request.form.get('preset')
    path = request.form.get('path', download_folder)
    
    download_obj = Download(url, preset, path)
    downloads[download_obj.id] = download_obj
    threading.Thread(target=download_obj.start).start()
    
    return jsonify({'id': download_obj.id})

@app.route('/status/<download_id>')
def status(download_id):
    download_obj = downloads.get(download_id)
    if download_obj:
        return jsonify({'status': download_obj.status, 'error': download_obj.error})
    return jsonify({'status': 'not_found'}), 404

@app.route('/add_preset', methods=['POST'])
def add_preset():
    name = request.form.get('name')
    options_str = request.form.get('options')
    if name and options_str:
        try:
            options = shlex.split(options_str)
            presets[name] = options
            settings['presets'] = presets
            with open('settings.json', 'w') as f:
                json.dump(settings, f, indent=2)
            return jsonify({'success': True})
        except ValueError:
            return jsonify({'success': False, 'error': 'Opzioni non valide'}), 400
    return jsonify({'success': False}), 400

@app.route('/update_preset', methods=['POST'])
def update_preset():
    old_name = request.form.get('old_name')
    new_name = request.form.get('new_name')
    options_str = request.form.get('options')
    if old_name in presets and options_str:
        try:
            options = shlex.split(options_str)
            if new_name != old_name:
                del presets[old_name]
            presets[new_name] = options
            settings['presets'] = presets
            with open('settings.json', 'w') as f:
                json.dump(settings, f, indent=2)
            return jsonify({'success': True})
        except ValueError:
            return jsonify({'success': False, 'error': 'Opzioni non valide'}), 400
    return jsonify({'success': False}), 400

@app.route('/remove_preset', methods=['POST'])
def remove_preset():
    name = request.form.get('name')
    if name in presets:
        del presets[name]
        settings['presets'] = presets
        with open('settings.json', 'w') as f:
            json.dump(settings, f, indent=2)
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'preset_not_found'}), 400

@app.route('/run_command', methods=['POST'])
def run_command():
    url = request.form.get('url')
    options_str = request.form.get('options', '')
    path = request.form.get('path', download_folder)
    if not url:
        return jsonify({'success': False, 'error': 'URL mancante'}), 400
    try:
        options = shlex.split(options_str) if options_str else []
    except ValueError:
        return jsonify({'success': False, 'error': 'Opzioni non valide'}), 400
    download_obj = Download(url, preset=None, path=path, options=options)
    downloads[download_obj.id] = download_obj
    threading.Thread(target=download_obj.start).start()
    return jsonify({'id': download_obj.id})

@app.route('/list_formats', methods=['POST'])
def list_formats():
    url = request.form.get('url')
    if not url:
        return jsonify({'error': 'URL mancante'}), 400
    try:
        result = subprocess.run(['yt-dlp', '--list-formats', url], capture_output=True, text=True, timeout=30)
        return jsonify({'output': result.stdout})
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Timeout'}), 408
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/stop/<download_id>', methods=['POST'])
def stop_download(download_id):
    download_obj = downloads.get(download_id)
    if not download_obj:
        return jsonify({'success': False, 'error': 'not_found'}), 404
    if download_obj.stop():
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'already_stopped'}), 400

@app.route('/update_settings', methods=['POST'])
def update_settings():
    global download_folder
    folder = request.form.get('download_folder')
    if folder:
        download_folder = folder
        settings['download_folder'] = folder
        with open('settings.json', 'w') as f:
            json.dump(settings, f, indent=2)
        return jsonify({'success': True})
    return jsonify({'success': False}), 400

@app.route('/get_history', methods=['GET'])
def get_history():
    return jsonify(download_history)

@app.route('/get_log/<download_id>')
def get_log(download_id):
    download_obj = downloads.get(download_id)
    if download_obj:
        return jsonify({'log': download_obj.log})
    return jsonify({'log': ''}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)