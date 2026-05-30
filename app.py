from flask import Flask, render_template, request, jsonify
import subprocess
import threading
import json
import shlex
import os
import glob
from datetime import datetime
from uuid import uuid4

app = Flask(__name__)

# Carica le impostazioni dal file
with open('settings.json') as f:
    settings = json.load(f)

presets = settings.get('presets', {})
download_folder = settings.get('download_folder', '/downloads')

downloads = {}
download_history = []

# Assicura che la directory logs/ esista
LOGS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(LOGS_DIR, exist_ok=True)

def load_history_from_logs():
    global download_history
    download_history = []
    log_files = glob.glob(os.path.join(LOGS_DIR, '*.json'))
    loaded_items = []
    for file_path in log_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                loaded_items.append(data)
        except Exception as e:
            print(f"Errore caricamento log {file_path}: {e}")
    
    # Ordina per timestamp decrescente
    loaded_items.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    
    for item in loaded_items:
        if item.get('status') == 'success':
            download_history.append({
                'id': item.get('id'),
                'title': item.get('title', 'Sconosciuto'),
                'filename': item.get('filename', 'File sconosciuto'),
                'type': item.get('type', 'Video'),
                'url': item.get('url', '')
            })

load_history_from_logs()

# Carica il change log da changelog.json
changelog_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'changelog.json')
changelog = []
if os.path.exists(changelog_path):
    try:
        with open(changelog_path, 'r', encoding='utf-8') as f:
            changelog = json.load(f)
    except Exception as e:
        print(f"Errore lettura changelog: {e}")

class Download:
    def __init__(self, url, preset=None, path='/downloads', options=None, download_type=None, 
                 playlist_range=None, languages=None, subtitles=None, resolution=None, audio_quality=None,
                 merge_to_mkv=False, audio_only=False):
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
        self.audio_only = audio_only
        
        # Se 'audio_only' è attivo, azzera sottotitoli e unione in MKV per evitare parametri indesiderati
        if self.audio_only:
            self.subtitles = None
            self.merge_to_mkv = False
        else:
            self.subtitles = subtitles  # None, 'all', 'auto' o codice lingua
            self.merge_to_mkv = merge_to_mkv  # Unire in MKV
            
        self.resolution = resolution or 'best'  # 'best', '1080', '720', '480', ecc.
        self.audio_quality = audio_quality or 'best'  # 'best', '192', '128', ecc.
        self.cmd_str = ''

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
        
        # Aggiungi sottotitoli se specificati e non siamo in audio only
        if self.subtitles and not getattr(self, 'audio_only', False):
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
            
        # Merge in MKV (solo se non preset/options custom)
        if self.merge_to_mkv or (self.languages and len(self.languages) > 1):
            if '--merge-output-format' not in cmd:
                cmd.extend(['--merge-output-format', 'mkv'])
        
        # Ignora errori per evitare fallimenti catastrofici (es. sui sottotitoli)
        if '--ignore-errors' not in cmd and '-i' not in cmd:
            cmd.append('--ignore-errors')

        cmd.extend(['-P', self.path, self.url])
        
        # Salva la stringa del comando completo per la UI
        self.cmd_str = ' '.join(cmd)
        
        try:
            self.process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, encoding='utf-8', errors='replace')
            while True:
                line = self.process.stdout.readline()
                if not line:
                    break
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
                self._add_to_history()
                self.status = 'success'
            else:
                if self.status != 'failed':
                    self.status = 'failed'
                self._add_to_history(failed=True)
            
            # Salva sempre il file di log su disco
            self._save_log_file()
        except Exception as e:
            self.status = 'failed'
            self.error = str(e)
            try:
                self._add_to_history(failed=True)
                self._save_log_file()
            except:
                pass
    
    def _build_options_from_advanced(self):
        """Costruisci opzioni yt-dlp dalle impostazioni avanzate"""
        options = []
        
        # Formato video base basato sulla risoluzione
        if self.resolution == 'best' or not self.resolution:
            video_format = 'bestvideo'
        else:
            video_format = f'bestvideo[height<={self.resolution}]'
            
        # Costruisci la stringa di formato
        if self.languages and len(self.languages) > 0:
            from itertools import combinations
            
            # Rimuovi duplicati preservando l'ordine
            unique_langs = []
            for lang in self.languages:
                if lang not in unique_langs:
                    unique_langs.append(lang)
            
            fallback_chains = []
            n = len(unique_langs)
            
            # Genera tutte le combinazioni possibili decrescenti per dimensione
            for r in range(n, 0, -1):
                for combo in combinations(unique_langs, r):
                    audio_parts = []
                    for l in combo:
                        if l == 'unknown':
                            audio_parts.append('bestaudio/best')
                        else:
                            # Utilizza ^= per maggiore tolleranza (es. es-ES, it-IT)
                            audio_parts.append(f'(bestaudio[language^={l}]/best[language^={l}])')
                    
                    audio_comb = '+'.join(audio_parts)
                    if self.audio_only:
                        fallback_chains.append(audio_comb)
                    else:
                        fallback_chains.append(f"{video_format}+{audio_comb}")
            
            # Aggiungi fallback finale
            if self.audio_only:
                fallback_chains.append("bestaudio/best")
                fallback_chains.append("best")
            else:
                fallback_chains.append(f"{video_format}+bestaudio/best")
                fallback_chains.append("best")
                
            format_str = '/'.join(fallback_chains)
            
            # Abilitiamo sia il multistream audio che video per evitare che yt-dlp scarti i flussi combinati
            options.append('--audio-multistreams')
            if not self.audio_only:
                options.append('--video-multistreams')
        else:
            # Caso standard senza lingue specifiche selezionate
            if self.audio_only:
                format_str = "bestaudio/best"
            else:
                format_str = f"{video_format}+bestaudio/best/best"
        
        if self.audio_only:
            # Se ci sono più lingue, splitta il multistream in file separati
            if self.languages and len(self.languages) > 1:
                ffmpeg_cmd = "f=%(filepath)q; base=\"${f%.*}\"; ffmpeg -y -i \"$f\" "
                for idx, lang in enumerate(self.languages):
                    lang_code = lang.upper()
                    if lang_code == 'UNKNOWN':
                        lang_code = f'TRACK{idx}'
                    lang_meta = lang[:3].lower() if len(lang) >= 3 else lang
                    ffmpeg_cmd += f"-map 0:a:{idx} -c:a copy -metadata:s:a:0 language={lang_meta} \"${{base}}_{lang_code}.mka\" "
                
                ffmpeg_cmd += "&& rm \"$f\""
                options.extend(['--exec', ffmpeg_cmd])
            else:
                options.append('-x')
                
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

    def _add_to_history(self, failed=False):
        global download_history
        # Determina il tipo basato sulle opzioni effettivamente usate
        is_audio = getattr(self, 'audio_only', False)
        if not is_audio:
            used_options = self.options if self.options else presets.get(self.preset, [])
            options_str = ' '.join(used_options).lower() if used_options else ''
            is_audio = ('bestaudio' in options_str) or ('--extract-audio' in options_str) or ('-x' in options_str) or ('audio' in options_str)
        self.type = 'Audio' if is_audio else 'Video'
        
        # Estrai il titolo da yt-dlp
        try:
            info_cmd = ['yt-dlp', '--dump-json', '--playlist-items', '1', '-q', self.url]
            result = subprocess.run(info_cmd, capture_output=True, text=True, timeout=30, encoding='utf-8', errors='replace')
            if result.returncode == 0:
                import json as json_module
                info = json_module.loads(result.stdout)
                self.title = info.get('title', 'Sconosciuto')
        except:
            self.title = 'Sconosciuto'
        
        if not failed:
            # Inserisce all'inizio per averlo come primo elemento
            download_history.insert(0, {
                'id': self.id,
                'title': self.title,
                'filename': self.filename or 'File sconosciuto',
                'type': self.type,
                'url': self.url
            })

    def _save_log_file(self):
        try:
            params = {
                'preset': self.preset or 'Nessuno',
                'path': self.path,
                'download_type': self.download_type,
                'playlist_range': self.playlist_range or 'Tutti',
                'languages': self.languages or [],
                'subtitles': self.subtitles or [],
                'resolution': self.resolution,
                'audio_quality': self.audio_quality,
                'merge_to_mkv': self.merge_to_mkv,
                'audio_only': self.audio_only
            }
            log_data = {
                'id': self.id,
                'url': self.url,
                'title': self.title or 'Sconosciuto',
                'filename': self.filename or 'File sconosciuto',
                'type': self.type,
                'status': self.status,
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'cmd': self.cmd_str,
                'parameters': params,
                'log': self.log
            }
            file_path = os.path.join(LOGS_DIR, f"{self.id}.json")
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(log_data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Errore nel salvataggio del file di log per {self.id}: {e}")

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
    return render_template('index.html', presets=presets, download_folder=download_folder, changelog=changelog)

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
    audio_only = request.form.get('audioOnly') == 'on'
    
    download_obj = Download(url, preset, path, 
                           download_type=download_type,
                           playlist_range=playlist_range,
                           languages=languages if languages else None,
                           subtitles=subtitles if subtitles else None,
                           resolution=resolution,
                           audio_quality=audio_quality,
                           merge_to_mkv=merge_to_mkv,
                           audio_only=audio_only)
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
        result = subprocess.run(['yt-dlp', '--dump-json', '--playlist-items', '1', '-q', url], capture_output=True, text=True, timeout=30, encoding='utf-8', errors='replace')
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
        result = subprocess.run(['yt-dlp', '--list-formats', '--playlist-items', '1', url], capture_output=True, text=True, timeout=30, encoding='utf-8', errors='replace')
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
    # Cerca prima tra i download attivi
    download_obj = downloads.get(download_id)
    if download_obj:
        params = {
            'preset': download_obj.preset or 'Nessuno',
            'path': download_obj.path,
            'download_type': download_obj.download_type,
            'playlist_range': download_obj.playlist_range or 'Tutti',
            'languages': download_obj.languages or [],
            'subtitles': download_obj.subtitles or [],
            'resolution': download_obj.resolution,
            'audio_quality': download_obj.audio_quality,
            'merge_to_mkv': download_obj.merge_to_mkv,
            'audio_only': download_obj.audio_only
        }
        return jsonify({
            'log': download_obj.log,
            'cmd': getattr(download_obj, 'cmd_str', ''),
            'status': download_obj.status,
            'parameters': params,
            'title': download_obj.title or 'Sconosciuto',
            'filename': download_obj.filename or 'Sconosciuto',
            'url': download_obj.url
        })
    
    # Altrimenti cerca nel file di log su disco
    file_path = os.path.join(LOGS_DIR, f"{download_id}.json")
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return jsonify({
                'log': data.get('log', ''),
                'cmd': data.get('cmd', ''),
                'status': data.get('status', 'success'),
                'parameters': data.get('parameters', {}),
                'title': data.get('title', 'Sconosciuto'),
                'filename': data.get('filename', 'Sconosciuto'),
                'url': data.get('url', '')
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
            
    return jsonify({'log': '', 'cmd': ''}), 404

@app.route('/delete_log/<download_id>', methods=['POST'])
def delete_log(download_id):
    global download_history
    # 1. Rimuovi dalla memoria lo storico del download
    download_history = [item for item in download_history if item.get('id') != download_id]
    if download_id in downloads:
        del downloads[download_id]
        
    # 2. Rimuovi solo il file di log JSON, lasciando intatti i file video/audio scaricati
    file_path = os.path.join(LOGS_DIR, f"{download_id}.json")
    deleted_log = False
    
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            deleted_log = True
        except Exception as e:
            return jsonify({'success': False, 'error': f"Errore durante l'eliminazione del log: {str(e)}"}), 500
            
    if deleted_log:
        return jsonify({
            'success': True, 
            'message': 'Log rimosso con successo dallo storico (i file multimediali scaricati sono stati preservati).'
        })
    return jsonify({'success': False, 'error': 'Log non trovato.'}), 404

@app.route('/delete_all_logs', methods=['POST'])
def delete_all_logs():
    global download_history
    download_history = []
    downloads.clear()
    
    # Rimuovi tutti i file log JSON da LOGS_DIR senza intaccare i file multimediali scaricati
    deleted_count = 0
    try:
        log_files = glob.glob(os.path.join(LOGS_DIR, '*.json'))
        for file_path in log_files:
            os.remove(file_path)
            deleted_count += 1
        return jsonify({
            'success': True,
            'message': f'Tutti i {deleted_count} log sono stati rimossi dallo storico (i file multimediali scaricati sono stati preservati).'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': f"Errore durante l'eliminazione di tutti i log: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)