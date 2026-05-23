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
    def __init__(self, url, preset=None, path='/downloads', options=None, download_type=None, 
                 playlist_range=None, languages=None, subtitles=None, resolution=None, audio_quality=None,
                 merge_to_mkv=False):
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
        self.download_type = download_type or 'video'  # 'video' o 'playlist'
        self.playlist_range = playlist_range  # None, 'all', '5', '10-15'
        self.languages = languages or ['en']  # lista di lingue
        self.subtitles = subtitles  # None, 'all', 'auto' o codice lingua
        self.resolution = resolution or 'best'  # 'best', '1080', '720', '480', ecc.
        self.audio_quality = audio_quality or 'best'  # 'best', '192', '128', ecc.
        self.merge_to_mkv = merge_to_mkv  # Unire in MKV

    def start(self):
        self.status = 'in-progress'
        
        # Costruisci gli argomenti basati sui parametri
        cmd = ['yt-dlp']
        
        # Usa preset o opzioni fornite
        if self.preset and self.preset in presets:
            cmd.extend(presets[self.preset])
        elif self.options:
            cmd.extend(self.options)
        else:
            # Costruisci opzioni dalle preferenze avanzate
            cmd.extend(self._build_options_from_advanced())
        
        # Aggiungi il range della playlist se specificato
        if self.download_type == 'playlist' and self.playlist_range and self.playlist_range != 'all':
            if self.playlist_range.isdigit():
                cmd.extend(['--playlist-items', self.playlist_range])
            elif '-' in self.playlist_range:
                cmd.extend(['--playlist-items', self.playlist_range])
        elif self.download_type == 'video':
            # Per video singoli, ignora i risultati della playlist
            cmd.append('--no-playlist')
        
        # Gestione delle lingue passata a _build_options_from_advanced
        
        # Aggiungi sottotitoli se specificati
        if self.subtitles:
            cmd.append('--embed-subs')
            # Converte in srt per evitare problemi di embedding degli vtt in mkv (e preserva i nomi traccia)
            cmd.extend(['--convert-subs', 'srt'])
            
            if isinstance(self.subtitles, list):
                # Se è una lista di lingue specifiche
                if len(self.subtitles) > 0:
                    # Includiamo sia manuali che automatici, poiché i checkbox inviano solo il codice lingua
                    cmd.append('--write-subs')
                    cmd.append('--write-auto-subs')
                    
                    subs_str = ','.join([s for s in self.subtitles if s != ''])
                    if subs_str:
                        cmd.extend(['--sub-langs', subs_str])
            else:
                # Backward compatibility con valore stringa singolo
                if self.subtitles == 'all':
                    cmd.append('--write-subs')
                    cmd.extend(['--sub-langs', 'all'])
                elif self.subtitles == 'auto':
                    cmd.append('--write-auto-subs')
                elif self.subtitles:
                    cmd.append('--write-subs')
        
        # Incorpora i metadati (risolve il problema dei tag lingua audio su VLC)
        if '--embed-metadata' not in cmd:
            cmd.append('--embed-metadata')
            
        # Merge in MKV
        if self.merge_to_mkv or (self.languages and len(self.languages) > 1):
            if '--merge-output-format' not in cmd:
                cmd.extend(['--merge-output-format', 'mkv'])
        
        cmd.extend(['-P', self.path, self.url])
        
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
    
    def _build_options_from_advanced(self):
        """Costruisci opzioni yt-dlp dalle impostazioni avanzate"""
        options = []
        
        # Formato video base basato sulla risoluzione
        if self.resolution == 'best' or not self.resolution:
            video_format = 'bestvideo'
        else:
            video_format = f'bestvideo[height<={self.resolution}]'
            
        # Formati audio basati sulle lingue selezionate
        if self.languages and len(self.languages) > 0:
            audio_formats = []
            for lang in self.languages:
                if lang == 'unknown':
                    audio_formats.append('bestaudio')
                else:
                    audio_formats.append(f'bestaudio[language={lang}]')
            
            audio_format_str = '+'.join(audio_formats)
            
            # Se è richiesta più di una lingua, abilitiamo il multistream audio
            if len(self.languages) > 1:
                options.append('--audio-multistreams')
                
            format_str = f"{video_format}+{audio_format_str}/best"
        else:
            format_str = f"{video_format}+bestaudio/best"
            
        options.extend(['-f', format_str])
        
        # Qualità audio
        if self.audio_quality == 'best':
            options.extend(['--audio-quality', '0'])
        elif self.audio_quality:
            options.extend(['--audio-quality', self.audio_quality])
            
        # Merge in MKV
        # Quando si scaricano più lingue è consigliato/necessario l'uso di MKV
        if self.merge_to_mkv or (self.languages and len(self.languages) > 1):
            options.extend(['--merge-output-format', 'mkv'])
        
        return options

    def _add_to_history(self):
        global download_history
        # Determina il tipo basato sulle opzioni effettivamente usate
        # Se il download è partito da un preset, usa le opzioni del preset
        used_options = self.options if self.options else presets.get(self.preset, [])
        options_str = ' '.join(used_options).lower()
        is_audio = ('bestaudio' in options_str) or ('--extract-audio' in options_str) or ('-x' in options_str) or ('audio' in options_str)
        self.type = 'Audio' if is_audio else 'Video'
        
        # Estrai il titolo da yt-dlp
        try:
            info_cmd = ['yt-dlp', '--dump-json', '--playlist-items', '1', '-q', self.url]
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
    
    # Parametri avanzati
    download_type = request.form.get('downloadType', 'video')  # 'video' o 'playlist'
    playlist_range = request.form.get('playlistRange', 'all')
    languages = request.form.getlist('languages[]')  # Lista di lingue audio
    subtitles = request.form.getlist('subtitles[]')  # Lista di sottotitoli
    resolution = request.form.get('resolution', 'best')
    audio_quality = request.form.get('audioQuality', 'best')
    merge_to_mkv = request.form.get('mergeToMkv') == 'on'  # Checkbox
    
    download_obj = Download(url, preset, path, 
                           download_type=download_type,
                           playlist_range=playlist_range,
                           languages=languages if languages else None,
                           subtitles=subtitles if subtitles else None,
                           resolution=resolution,
                           audio_quality=audio_quality,
                           merge_to_mkv=merge_to_mkv)
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

@app.route('/get_video_info', methods=['POST'])
def get_video_info():
    """Estrae info video: audio disponibili e sottotitoli"""
    url = request.form.get('url')
    if not url:
        return jsonify({'error': 'URL mancante'}), 400
    try:
        result = subprocess.run(['yt-dlp', '--dump-json', '--playlist-items', '1', '-q', url], capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            return jsonify({'error': 'Impossibile ottenere info dal video'}), 400
        
        import json as json_module
        info = json_module.loads(result.stdout)
        
        # Estrai audio e video disponibili
        audio_languages = set()
        video_resolutions = set()
        if 'formats' in info:
            for fmt in info.get('formats', []):
                if fmt.get('acodec') and fmt.get('acodec') != 'none':
                    lang = fmt.get('language', 'unknown')
                    if lang and lang != 'none':
                        audio_languages.add(lang)
                if fmt.get('vcodec') and fmt.get('vcodec') != 'none':
                    height = fmt.get('height')
                    if height:
                        video_resolutions.add(int(height))
        
        # Estrai sottotitoli disponibili
        subtitles = {}
        if 'subtitles' in info:
            for lang, sub_list in info['subtitles'].items():
                subtitles[lang] = lang
        if 'automatic_captions' in info:
            for lang, sub_list in info['automatic_captions'].items():
                if lang not in subtitles:
                    subtitles[lang] = f"{lang} (auto)"
        
        return jsonify({
            'audio_languages': sorted(list(audio_languages)) if audio_languages else ['unknown'],
            'subtitles': subtitles,
            'resolutions': sorted(list(video_resolutions), reverse=True) if video_resolutions else [],
            'title': info.get('title', 'Sconosciuto')
        })
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Timeout nella lettura del video'}), 408
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/list_formats', methods=['POST'])
def list_formats():
    url = request.form.get('url')
    if not url:
        return jsonify({'error': 'URL mancante'}), 400
    try:
        result = subprocess.run(['yt-dlp', '--list-formats', '--playlist-items', '1', url], capture_output=True, text=True, timeout=30)
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