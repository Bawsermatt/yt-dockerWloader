var currentDownloadId = null;
var currentDownloadStatus = null;
var currentLogSelector = "#downloadLog";
var currentStatusSelector = "#status";
var currentStopButtonSelector = "#stopDownloadButton";

if (typeof currentLang === "undefined" || !currentLang) {
  currentLang = "it";
}

var translations = {
  it: {
    history_title: "Cronologia",
    settings: "Impostazioni",
    download: "Download",
    placeholder_url: "Incolla URL YouTube (video o playlist)",
    preset_optional: "-- Scegli un preset (opzionale) --",
    destination_folder: "Cartella di destinazione",
    show_advanced: "⚙️ Mostra Avanzate",
    hide_advanced: "⚙️ Nascondi Avanzate",
    advanced_disabled: "Le impostazioni avanzate non sono disponibili quando è selezionato un preset.",
    advanced_options: "Opzioni Avanzate",
    playlist_range: "Range della Playlist",
    all_videos: "Tutti i video",
    specific_video: "Un video specifico:",
    custom_range: "Range personalizzato:",
    audio_section: "Sezione Audio",
    audio_only: "Solo audio",
    audio_only_hint: "Scarica solo la traccia audio ignorando il video",
    audio_languages: "Lingua(e) audio da scaricare",
    paste_link_languages: "Incolla un link o usa il tasto 🔄 per caricare le lingue",
    no_audio_found: "Nessuna traccia audio trovata",
    audio_quality: "Qualità audio",
    best: "Migliore",
    video_section: "Sezione Video",
    hide_auto_tracks: "Nascondi tracce automatiche",
    hide_auto_tracks_hint: "Mostra solo tracce native del video",
    subtitles: "Sottotitoli da scaricare",
    paste_link_subtitles: "Incolla un link o usa il tasto 🔄 per caricare i sottotitoli",
    no_subtitles_found: "Nessun sottotitolo trovato",
    resolution: "Risoluzione video",
    merge_mkv: "Unire in MKV",
    merge_mkv_hint: "Unisce video, audio e sottotitoli in un unico file MKV",
    download_btn: "Scarica",
    refresh_info_title: "Aggiorna informazioni (Audio/Sottotitoli)",
    stop: "Stop",
    download_log: "Log Download",
    show_command_title: "Mostra comando completo",
    info_command_btn: "ℹ️ Info Comando",
    history_modal_title: "Cronologia Download",
    delete_all_btn: "🗑️ Cancella tutto",
    no_history: "Nessun download nella cronologia.",
    view_log: "📋 Vedi Log",
    command_modal_title: "Comando Eseguito",
    command_modal_desc: "Questo è il comando esatto eseguito nel sistema per avviare il download:",
    copy_btn: "Copia negli appunti",
    copied: "Copiato! ✅",
    settings_modal_title: "Impostazioni",
    download_folder: "Cartella Download",
    download_folder_placeholder: "Cartella di destinazione per i download",
    interface_language: "Lingua Interfaccia",
    save_btn: "Salva",
    presets_title: "Preset",
    add_preset_btn: "Aggiungi Preset",
    modify_preset_btn: "Modifica Preset",
    add_preset_title: "Aggiungi Preset",
    preset_name_placeholder: "Nome del preset",
    preset_options_placeholder: "Opzioni yt-dlp (es: -f 'bestaudio/best')",
    add_btn: "Aggiungi",
    preset_new_name_placeholder: "Nuovo nome del preset",
    preset_new_options_placeholder: "Nuove opzioni yt-dlp",
    modify_btn: "Modifica",
    remove_btn: "Rimuovi",
    info_software_btn: "ℹ️ Info Software",
    history_log_title: "Dettaglio Download",
    command_executed: "Comando Eseguito",
    remove_log_btn: "🗑️ Rimuovi questo log",
    about_title: "Informazioni su yt-dockerWloader",
    version_label: "Versione",
    developer_title: "Sviluppatore",
    developed_by: "Sviluppato con ❤️ da",
    github_btn: "🐙 Repository GitHub",
    changelog_title: "Change Log",
    changelog_added: "Aggiunto",
    changelog_removed: "Rimosso",
    changelog_fixed: "Corretto",
    no_changelog: "Nessun change log disponibile.",
    searching_info: "Ricerca info video...",
    
    // Messaggi e dialoghi dinamici
    url_error: "Per favore, inserisci un URL",
    loading_error: "Errore nel caricamento delle informazioni",
    start_download_msg: "Avvio download...\n",
    download_started_err: "Errore nell'avvio del download.",
    download_stopped_user: "Download interrotto dall'utente.",
    download_stop_err_not_possible: "Non è stato possibile interrompere il download.",
    download_stop_err: "Errore durante l'arresto del download.",
    confirm_delete_preset: "Rimuovere il preset '{name}' ?",
    delete_preset_err: "Errore nella rimozione del preset.",
    add_preset_err: "Errore nell'aggiunta del preset.",
    modify_preset_err: "Errore nella modifica del preset.",
    settings_update_err: "Errore nell'aggiornamento delle impostazioni.",
    confirm_delete_log: "⚠️ ATTENZIONE: Azione IRREVERSIBILE!\n\nStai per eliminare definitivamente il log di \"{title}\" dallo storico.\n\nNota: i file audio/video scaricati NON verranno rimossi dal disco.\n\nVuoi procedere?",
    delete_log_success: "Log rimosso con successo!",
    delete_log_err: "Errore durante la rimozione del log.",
    confirm_delete_all_history: "⚠️ ATTENZIONE: Azione IRREVERSIBILE!\n\nStai per cancellare l'INTERO storico della cronologia.\n\nNota: tutti i file audio/video scaricati su disco verranno PRESERVATI e non subiranno modifiche.\n\nVuoi procedere con la rimozione di tutti i log?",
    delete_all_history_err: "Errore durante la rimozione di tutti i log dallo storico.",
    yes: "Sì",
    no: "No",
    history_no_params: "Nessun parametro registrato.",
    history_cmd_not_available: "Comando non disponibile",
    history_log_not_available: "Nessun log registrato",
    history_log_load_err: "Errore nel caricamento del log.",
    status_waiting: "In attesa di avvio...",
    status_in_progress: "Download in corso...",
    status_success: "Download completato!",
    status_failed: "Download fallito. Riprova.",
    status_not_found: "Download non trovato.",
    status_check_err: "Errore nel controllo dello stato.",
    
    // Tipi di download per la cronologia
    video: "Video",
    audio: "Audio",
    playlist: "Playlist",
    
    // Label parametri cronologia
    history_type_label: "Tipo",
    history_audio_only_label: "Solo Audio",
    history_resolution_label: "Risoluzione",
    history_merge_mkv_label: "Merge MKV",
    history_audio_quality_label: "Qualità Audio",
    history_preset_label: "Preset",
    history_audio_languages_label: "Lingue Audio",
    history_subtitles_label: "Sottotitoli",
    history_destination_label: "Destinazione",

    // Cartelle Preferite
    favorite_folders_title: "Cartelle Preferite",
    add_folder_btn: "Aggiungi Cartella",
    modify_folder_btn: "Modifica Cartella",
    add_folder_title: "Aggiungi Cartella",
    folder_name_placeholder: "Nome cartella preferita (es. Musica)",
    folder_path_placeholder: "Percorso cartella (es. /downloads/musica)",
    modify_folder_title: "Modifica Cartella",
    folder_new_name_placeholder: "Nuovo nome della cartella",
    folder_new_path_placeholder: "Nuovo percorso",
    confirm_delete_folder: "Rimuovere la cartella '{name}' ?",
    delete_folder_err: "Errore nella rimozione della cartella.",
    add_folder_err: "Errore nell'aggiunta della cartella.",
    modify_folder_err: "Errore nella modifica della cartella.",
    cannot_remove_last_folder: "Non puoi rimuovere l'unica cartella rimasta. Deve esserci almeno una cartella preferita.",
    theme_title: "Cambia Tema"
  },
  en: {
    history_title: "History",
    settings: "Settings",
    download: "Download",
    placeholder_url: "Paste YouTube URL (video or playlist)",
    preset_optional: "-- Choose a preset (optional) --",
    destination_folder: "Destination folder",
    show_advanced: "⚙️ Show Advanced",
    hide_advanced: "⚙️ Hide Advanced",
    advanced_disabled: "Advanced settings are not available when a preset is selected.",
    advanced_options: "Advanced Options",
    playlist_range: "Playlist Range",
    all_videos: "All videos",
    specific_video: "A specific video:",
    custom_range: "Custom range:",
    audio_section: "Audio Section",
    audio_only: "Audio only",
    audio_only_hint: "Download audio track only, ignoring video",
    audio_languages: "Audio language(s) to download",
    paste_link_languages: "Paste a link or use the 🔄 button to load languages",
    no_audio_found: "No audio tracks found",
    audio_quality: "Audio quality",
    best: "Best",
    video_section: "Video Section",
    hide_auto_tracks: "Hide automatic tracks",
    hide_auto_tracks_hint: "Show only native tracks of the video",
    subtitles: "Subtitles to download",
    paste_link_subtitles: "Paste a link or use the 🔄 button to load subtitles",
    no_subtitles_found: "No subtitles found",
    resolution: "Video resolution",
    merge_mkv: "Merge to MKV",
    merge_mkv_hint: "Merges video, audio, and subtitles into a single MKV file",
    download_btn: "Download",
    refresh_info_title: "Refresh information (Audio/Subtitles)",
    stop: "Stop",
    download_log: "Download Log",
    show_command_title: "Show full command",
    info_command_btn: "ℹ️ Command Info",
    history_modal_title: "Download History",
    delete_all_btn: "🗑️ Delete all",
    no_history: "No downloads in history.",
    view_log: "📋 View Log",
    command_modal_title: "Executed Command",
    command_modal_desc: "This is the exact command executed in the system to start the download:",
    copy_btn: "Copy to clipboard",
    copied: "Copied! ✅",
    settings_modal_title: "Settings",
    download_folder: "Download Folder",
    download_folder_placeholder: "Destination folder for downloads",
    interface_language: "Interface Language",
    save_btn: "Save",
    presets_title: "Presets",
    add_preset_btn: "Add Preset",
    modify_preset_btn: "Modify Preset",
    add_preset_title: "Add Preset",
    preset_name_placeholder: "Preset name",
    preset_options_placeholder: "yt-dlp options (e.g.: -f 'bestaudio/best')",
    add_btn: "Add",
    preset_new_name_placeholder: "New preset name",
    preset_new_options_placeholder: "New yt-dlp options",
    modify_btn: "Modify",
    remove_btn: "Remove",
    info_software_btn: "ℹ️ Software Info",
    history_log_title: "Download Details",
    command_executed: "Command Executed",
    remove_log_btn: "🗑️ Remove this log",
    about_title: "About yt-dockerWloader",
    version_label: "Version",
    developer_title: "Developer",
    developed_by: "Developed with ❤️ by",
    github_btn: "🐙 GitHub Repository",
    changelog_title: "Change Log",
    changelog_added: "Added",
    changelog_removed: "Removed",
    changelog_fixed: "Fixed",
    no_changelog: "No change log available.",
    searching_info: "Searching video info...",
    
    // Dynamic alerts and messages
    url_error: "Please enter a URL",
    loading_error: "Error loading info",
    start_download_msg: "Starting download...\n",
    download_started_err: "Error starting download.",
    download_stopped_user: "Download stopped by user.",
    download_stop_err_not_possible: "Could not stop the download.",
    download_stop_err: "Error during download stop.",
    confirm_delete_preset: "Remove preset '{name}' ?",
    delete_preset_err: "Error removing preset.",
    add_preset_err: "Error adding preset.",
    modify_preset_err: "Error modifying preset.",
    settings_update_err: "Error updating settings.",
    confirm_delete_log: "⚠️ WARNING: IRREVERSIBLE ACTION!\n\nYou are about to permanently delete the log for \"{title}\" from the history.\n\nNote: the downloaded audio/video files will NOT be removed from disk.\n\nDo you want to proceed?",
    delete_log_success: "Log removed successfully!",
    delete_log_err: "Error during log removal.",
    confirm_delete_all_history: "⚠️ WARNING: IRREVERSIBLE ACTION!\n\nYou are about to delete the ENTIRE history.\n\nNote: all downloaded audio/video files on disk will be PRESERVED and will not be modified.\n\nDo you want to proceed with removing all logs?",
    delete_all_history_err: "Error during removing all logs from history.",
    yes: "Yes",
    no: "No",
    history_no_params: "No parameters recorded.",
    history_cmd_not_available: "Command not available",
    history_log_not_available: "No log recorded",
    history_log_load_err: "Error loading log.",
    status_waiting: "Waiting to start...",
    status_in_progress: "Download in progress...",
    status_success: "Download completed!",
    status_failed: "Download failed. Please try again.",
    status_not_found: "Download not found.",
    status_check_err: "Error checking status.",
    
    // Download types for history
    video: "Video",
    audio: "Audio",
    playlist: "Playlist",
    
    // History parameter labels
    history_type_label: "Type",
    history_audio_only_label: "Audio Only",
    history_resolution_label: "Resolution",
    history_merge_mkv_label: "Merge MKV",
    history_audio_quality_label: "Audio Quality",
    history_preset_label: "Preset",
    history_audio_languages_label: "Audio Languages",
    history_subtitles_label: "Subtitles",
    history_destination_label: "Destination",

    // Favorite Folders
    favorite_folders_title: "Favorite Folders",
    add_folder_btn: "Add Folder",
    modify_folder_btn: "Modify Folder",
    add_folder_title: "Add Folder",
    folder_name_placeholder: "Favorite folder name (e.g. Music)",
    folder_path_placeholder: "Folder path (e.g. /downloads/music)",
    modify_folder_title: "Modify Folder",
    folder_new_name_placeholder: "New folder name",
    folder_new_path_placeholder: "New path",
    confirm_delete_folder: "Remove folder '{name}' ?",
    delete_folder_err: "Error removing folder.",
    add_folder_err: "Error adding folder.",
    modify_folder_err: "Error modifying folder.",
    cannot_remove_last_folder: "You cannot remove the last remaining folder. There must be at least one favorite folder.",
    theme_title: "Toggle Theme"
  }
};

function t(key, replacements) {
  var lang = currentLang || 'it';
  var msg = translations[lang][key] || translations['it'][key] || key;
  if (replacements) {
    for (var k in replacements) {
      msg = msg.replace('{"' + k + '"}', replacements[k]);
      msg = msg.replace('{' + k + '}', replacements[k]);
    }
  }
  return msg;
}

function applyTranslations(lang) {
  if (!translations[lang]) lang = 'it';
  
  $('[data-i18n]').each(function () {
    var key = $(this).attr('data-i18n');
    if (translations[lang][key]) {
      $(this).text(translations[lang][key]);
    }
  });

  $('[data-i18n-placeholder]').each(function () {
    var key = $(this).attr('data-i18n-placeholder');
    if (translations[lang][key]) {
      $(this).attr('placeholder', translations[lang][key]);
    }
  });

  $('[data-i18n-title]').each(function () {
    var key = $(this).attr('data-i18n-title');
    if (translations[lang][key]) {
      $(this).attr('title', translations[lang][key]);
    }
  });
}

$(document).ready(function () {
  // Helper per aggiornare le icone/logo in base al tema
  function updateLogos(theme) {
    if (theme === 'dark') {
      $('.theme-logo').attr('src', '/static/IconLight.png');
    } else {
      $('.theme-logo').attr('src', '/static/iconDark.png');
    }
  }

  // Inizializzazione Tema (Dark/Light Mode)
  var savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    $('body').addClass('dark-theme');
    $('#themeToggleButton').text('☀️');
    updateLogos('dark');
  } else {
    $('body').removeClass('dark-theme');
    $('#themeToggleButton').text('🌙');
    updateLogos('light');
  }

  $('#themeToggleButton').on('click', function () {
    var isDark = $('body').hasClass('dark-theme');
    if (isDark) {
      $('body').removeClass('dark-theme');
      $(this).text('🌙');
      localStorage.setItem('theme', 'light');
      updateLogos('light');
    } else {
      $('body').addClass('dark-theme');
      $(this).text('☀️');
      localStorage.setItem('theme', 'dark');
      updateLogos('dark');
    }
  });

  // Applica le traduzioni iniziali
  applyTranslations(currentLang);

  // Toggle sezione avanzate
  $("#toggleAdvancedButton").on("click", function (e) {
    e.preventDefault();
    $("#advancedSection").slideToggle();
    var isVisible = $("#advancedSection").is(":visible");
    $(this).text(isVisible ? t("hide_advanced") : t("show_advanced"));
  });

  function fetchVideoInfo(url, isAuto = false) {
    if (!url) {
      if (!isAuto) alert(t("url_error"));
      return;
    }

    $("#loadingPopup").css("display", "flex");
    $("#fetchVideoInfoButton").text("⏳").prop("disabled", true);

    $.post("/get_video_info", { url: url }, function (data) {
      // Rilevamento automatico tipo playlist
      if (data.is_playlist) {
        $("#downloadTypeInput").val("playlist");
        $("#playlistRangeGroup").slideDown();
      } else {
        $("#downloadTypeInput").val("video");
        $("#playlistRangeGroup").slideUp();
      }

      // Ordina le lingue audio
      var audioLanguages = Array.isArray(data.audio_languages)
        ? data.audio_languages.slice()
        : [];
      audioLanguages.sort();
      var audioHtml = "";
      if (audioLanguages.length > 0) {
        audioLanguages.forEach(function (lang) {
          audioHtml +=
            '<label><input type="checkbox" name="languages[]" value="' +
            escapeHtml(lang) +
            '" /> ' +
            escapeHtml(lang) +
            "</label>";
        });
      } else {
        audioHtml = '<p style="color: #999;">' + t("no_audio_found") + '</p>';
      }
      $("#audioLanguagesContainer").html(audioHtml);

      // Ordina e popola i sottotitoli
      var subtitles = [];
      if (data.subtitles) {
        for (var lang in data.subtitles) {
          if (Object.prototype.hasOwnProperty.call(data.subtitles, lang)) {
            var label = data.subtitles[lang];
            subtitles.push({
              code: lang,
              label: label,
              auto: label.toLowerCase().includes("(auto)"),
            });
          }
        }
      }
      subtitles.sort(function (a, b) {
        return a.label.localeCompare(b.label);
      });
      var subsHtml = "";
      if (subtitles.length > 0) {
        subtitles.forEach(function (sub) {
          subsHtml +=
            '<label class="subtitle-option" data-auto="' +
            (sub.auto ? "true" : "false") +
            '"><input type="checkbox" name="subtitles[]" value="' +
            escapeHtml(sub.code) +
            '" /> ' +
            escapeHtml(sub.label) +
            "</label>";
        });
      } else {
        subsHtml = '<p style="color: #999;">' + t("no_subtitles_found") + '</p>';
      }
      $("#subtitlesContainer").html(subsHtml);
      applyAutoTrackFilter();

      // Popola le risoluzioni video
      var resolutionsHtml = '<option value="best">' + t("best") + '</option>';
      if (data.resolutions && data.resolutions.length > 0) {
        data.resolutions.forEach(function (res) {
          resolutionsHtml += '<option value="' + res + '">' + res + 'p</option>';
        });
      } else {
        resolutionsHtml += '<option value="1080">1080p</option><option value="720">720p</option><option value="480">480p</option><option value="360">360p</option><option value="240">240p</option>';
      }
      $("#resolutionSelect").html(resolutionsHtml);

      $("#loadingPopup").hide();
      $("#fetchVideoInfoButton").text("✅");
      setTimeout(function () {
        $("#fetchVideoInfoButton").text("🔄");
        $("#fetchVideoInfoButton").prop("disabled", false);
      }, 2000);
    }).fail(function (xhr) {
      var error = t("loading_error");
      if (xhr.responseJSON && xhr.responseJSON.error) {
        error = xhr.responseJSON.error;
      }
      if (!isAuto) alert(error);
      else console.error(error);

      $("#loadingPopup").hide();
      $("#fetchVideoInfoButton").text("❌");
      setTimeout(function () {
        $("#fetchVideoInfoButton").text("🔄");
        $("#fetchVideoInfoButton").prop("disabled", false);
      }, 2000);
    });
  }

  // Pulsante Fetch Info Video
  $("#fetchVideoInfoButton").on("click", function (e) {
    e.preventDefault();
    var url = $('#downloadForm input[name="url"]').val();
    fetchVideoInfo(url, false);
  });

  // Fetch automatico quando si incolla un link o si digita un URL valido
  var fetchTimeout;
  $('#downloadForm input[name="url"]').on('input paste', function () {
    var url = $(this).val();
    clearTimeout(fetchTimeout);

    // Rilevamento immediato del tipo di download per aggiornare l'interfaccia prima del completamento di fetchVideoInfo
    if (url && (url.includes('list=') || url.includes('playlist?'))) {
      $("#downloadTypeInput").val("playlist");
      $("#playlistRangeGroup").slideDown();
    } else {
      $("#downloadTypeInput").val("video");
      $("#playlistRangeGroup").slideUp();
    }

    if (url && (url.includes('youtube.com') || url.includes('youtu.be'))) {
      fetchTimeout = setTimeout(function () {
        fetchVideoInfo(url, true);
      }, 500); // Ritardo per evitare chiamate multiple mentre si digita/incolla
    }
  });

  $("#hideAutoTracksCheckbox").on("change", function () {
    applyAutoTrackFilter();
  });

  function applyAutoTrackFilter() {
    var hideAuto = $("#hideAutoTracksCheckbox").is(":checked");
    $("#subtitlesContainer .subtitle-option").each(function () {
      var isAuto = $(this).attr("data-auto") === "true";
      $(this).toggle(!hideAuto || !isAuto);
    });
  }

  // Inizializza lo stato UI all'avvio
  function initUIState() {
    if ($('#downloadTypeInput').val() === "playlist") {
      $("#playlistRangeGroup").show();
    } else {
      $("#playlistRangeGroup").hide();
    }
    var value = $('input[name="playlistRange"]:checked').val();
    $("#singleVideoNumber").prop("disabled", value !== "single");
    $("#customRange").prop("disabled", value !== "range");

    // Inizializza stato preset
    toggleAdvancedBasedOnPreset($('select[name="preset"]').val());

    // Inizializza visibilità Risoluzione Video e altri elementi in base a Solo Audio
    if ($('#audioOnlyCheckbox').is(':checked')) {
      $('#resolutionGroup').hide();
      $('#subtitlesGroup').hide();
      $('#mergeGroup').hide();
      $('#autoTracksGroup').hide();
      $('#videoSectionTitle').hide();
    } else {
      $('#resolutionGroup').show();
      $('#subtitlesGroup').show();
      $('#mergeGroup').show();
      $('#autoTracksGroup').show();
      $('#videoSectionTitle').show();
    }
  }

  $('#audioOnlyCheckbox').on('change', function () {
    if ($(this).is(':checked')) {
      $('#resolutionGroup, #subtitlesGroup, #mergeGroup, #autoTracksGroup, #videoSectionTitle').slideUp();
    } else {
      $('#resolutionGroup, #subtitlesGroup, #mergeGroup, #autoTracksGroup, #videoSectionTitle').slideDown();
    }
  });

  function toggleAdvancedBasedOnPreset(presetValue) {
    if (presetValue !== "") {
      $("#toggleAdvancedButton").hide();
      $("#advancedDisabledMessage").show();
      if ($("#advancedSection").is(":visible")) {
        $("#advancedSection").slideUp();
        $("#toggleAdvancedButton").text(t("show_advanced"));
      }
    } else {
      $("#toggleAdvancedButton").show();
      $("#advancedDisabledMessage").hide();
    }
  }

  $('select[name="preset"]').on("change", function () {
    toggleAdvancedBasedOnPreset($(this).val());
  });

  initUIState();

  // Gestione della selezione del range playlist
  $('input[name="playlistRange"]').on("change", function () {
    var value = $(this).val();
    $("#singleVideoNumber").prop("disabled", value !== "single");
    $("#customRange").prop("disabled", value !== "range");
  });

  // Form di download principale
  $("#downloadForm").on("submit", function (e) {
    e.preventDefault();

    // Raccogli i dati del form
    var formData = new FormData(this);

    // Rilevamento automatico aggiuntivo prima dell'invio se non ancora rilevato
    var url = formData.get("url") || "";
    var isPlaylistUrl = url.includes("list=") || url.includes("playlist?");
    var downloadTypeInput = $("#downloadTypeInput");
    
    if (isPlaylistUrl) {
      downloadTypeInput.val("playlist");
      formData.set("downloadType", "playlist");
    } else {
      downloadTypeInput.val("video");
      formData.set("downloadType", "video");
    }

    // Raccogli il range della playlist se playlist è selezionato
    var downloadType = formData.get("downloadType");
    if (downloadType === "playlist") {
      var playlistRange = $('input[name="playlistRange"]:checked').val();
      if (playlistRange === "single") {
        var singleNumber = $("#singleVideoNumber").val();
        formData.set("playlistRange", singleNumber);
      } else if (playlistRange === "range") {
        var customRange = $("#customRange").val();
        formData.set("playlistRange", customRange);
      } else {
        formData.set("playlistRange", "all");
      }
    }

    // Raccogli le lingue audio selezionate dalle checkbox
    var audioCheckboxes = $('input[name="languages[]"]:checked');
    formData.delete("languages[]");
    audioCheckboxes.each(function () {
      formData.append("languages[]", $(this).val());
    });

    // Raccogli i sottotitoli selezionati dalle checkbox
    var subtitlesCheckboxes = $('input[name="subtitles[]"]:checked');
    formData.delete("subtitles[]");
    subtitlesCheckboxes.each(function () {
      formData.append("subtitles[]", $(this).val());
    });

    // Converti FormData in URLSearchParams
    var params = new URLSearchParams();
    for (var pair of formData.entries()) {
      params.append(pair[0], pair[1]);
    }

    $.post("/download", params.toString(), function (data) {
      currentDownloadId = data.id;
      currentDownloadStatus = "waiting"; // Inizializza subito lo stato per evitare blocchi nel polling del log
      sessionStorage.setItem('currentDownloadId', currentDownloadId);
      currentLogSelector = "#downloadLog";
      currentStatusSelector = "#status";
      currentStopButtonSelector = "#stopDownloadButton";
      $("#logContainer").show();
      $(currentLogSelector).text(t("start_download_msg"));
      $(currentStopButtonSelector).show();
      $("#startDownloadButton").hide();
      $("#fetchVideoInfoButton").hide();
      pollStatus(currentDownloadId);
      pollLog(currentDownloadId);
    }).fail(function () {
      showStatus("failed", t("download_started_err"));
      $("#startDownloadButton").show();
      $("#fetchVideoInfoButton").show();
    });
  });

  // Pulsante Stop
  $("#stopDownloadButton").on("click", function () {
    if (!currentDownloadId) {
      return;
    }
    $.post("/stop/" + currentDownloadId, function (data) {
      if (data.success) {
        showStatus("failed", t("download_stopped_user"));
        $(currentStopButtonSelector).hide();
        $("#startDownloadButton").show();
        $("#fetchVideoInfoButton").show();
      } else {
        showStatus("failed", t("download_stop_err_not_possible"));
      }
    }).fail(function () {
      showStatus("failed", t("download_stop_err"));
    });
  });

  // Pulsante Cronologia
  $("#historyButton").on("click", function () {
    $.get("/get_history", function (data) {
      if (data.length === 0) {
        $("#historyList").html(
          '<p style="color: #999; text-align: center; padding: 20px;">' + t("no_history") + '</p>',
        );
      } else {
        var html = "";
        data.forEach(function (item) {
          var typeClass = item.type === "Playlist" ? "playlist" : (item.type === "Audio" ? "audio" : "");
          var typeLabel = t(item.type.toLowerCase());
          html += '<div class="history-item">';
          html +=
            '<div class="history-thumbnail"><img src="https://img.youtube.com/vi/' +
            getYoutubeId(item.url) +
            '/default.jpg" alt="Thumbnail"></div>';
          html += '<div class="history-content">';
          html += '<p class="history-title">' + escapeHtml(item.title) + "</p>";
          html +=
            '<p class="history-filename">' + escapeHtml(item.filename) + "</p>";
          html += "</div>";
          html += '<div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">';
          html +=
            '<div class="history-type ' +
            typeClass +
            '">' +
            escapeHtml(typeLabel) +
            "</div>";
          if (item.id) {
            html += '<button class="view-history-log-btn" data-id="' + item.id + '" style="padding: 4px 8px; font-size: 11px; margin: 0; background: linear-gradient(135deg, #475569, #334155); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 4px;">' + t("view_log") + '</button>';
          }
          html += "</div>";
          html += "</div>";
        });
        $("#historyList").html(html);
      }
      $("#historyModal").show();
    });
  });

  $("#closeHistoryButton").on("click", function () {
    $("#historyModal").hide();
  });

  $("#historyModal").on("click", function (e) {
    if (e.target === this) {
      $(this).hide();
    }
  });

  // Modali Impostazioni
  $("#settingsButton").on("click", function () {
    $("#settingsModal").show();
  });

  $("#closeSettingsButton").on("click", function () {
    $("#settingsModal").hide();
  });

  $("#settingsModal").on("click", function (e) {
    if (e.target === this) {
      $(this).hide();
    }
  });

  // Gestione Modal Comando
  $("#showCommandButton").on("click", function () {
    var cmd = $(this).attr("data-cmd");
    $("#commandText").text(cmd);
    $("#commandModal").show();
  });

  $("#closeCommandModalButton").on("click", function () {
    $("#commandModal").hide();
  });

  $("#commandModal").on("click", function (e) {
    if (e.target === this) {
      $(this).hide();
    }
  });

  $("#copyCommandButton").on("click", function () {
    var cmdText = $("#commandText").text();
    navigator.clipboard.writeText(cmdText).then(function () {
      var origText = $("#copyCommandButton").text();
      $("#copyCommandButton").text(t("copied")).prop("disabled", true);
      setTimeout(function () {
        $("#copyCommandButton").text(origText).prop("disabled", false);
      }, 2000);
    });
  });

  // Form Impostazioni (Presets)
  $("#togglePresetForm").on("click", function (e) {
    e.preventDefault();
    $("#presetForm").toggle();
    $("#updateForm").hide();
  });

  $("#toggleUpdateForm").on("click", function (e) {
    e.preventDefault();
    $("#updateForm").toggle();
    $("#presetForm").hide();
  });

  $("#updateSettingsForm").on("submit", function (e) {
    e.preventDefault();
    var formData = $(this).serialize();
    $.post("/update_settings", formData, function (data) {
      if (data.success) {
        location.reload();
      } else {
        alert(t("settings_update_err"));
      }
    }).fail(function () {
      alert(t("settings_update_err"));
    });
  });

  $("#addPresetForm").on("submit", function (e) {
    e.preventDefault();
    var formData = $(this).serialize();
    $.post("/add_preset", formData, function (data) {
      if (data.success) {
        location.reload();
      } else {
        showStatus("failed", t("add_preset_err"));
      }
    }).fail(function () {
      showStatus("failed", t("add_preset_err"));
    });
  });

  $("#oldNameSelect").on("change", function () {
    populateUpdateFields();
  });

  function populateUpdateFields() {
    var selected = $("#oldNameSelect").val();
    if (selected && presetsData[selected]) {
      $("#newNameInput").val(selected);
      $("#optionsInput").val(presetsData[selected].join(" "));
    }
  }

  populateUpdateFields();

  $("#updatePresetForm").on("submit", function (e) {
    e.preventDefault();
    var formData = $(this).serialize();
    $.post("/update_preset", formData, function (data) {
      if (data.success) {
        location.reload();
      } else {
        showStatus("failed", t("modify_preset_err"));
      }
    }).fail(function () {
      showStatus("failed", t("modify_preset_err"));
    });
  });

  $("#removePresetButton").on("click", function (e) {
    e.preventDefault();
    var selected = $("#oldNameSelect").val();
    if (!selected || !confirm(t("confirm_delete_preset", { name: selected }))) {
      return;
    }
    $.post("/remove_preset", { name: selected }, function (data) {
      if (data.success) {
        location.reload();
      } else {
        showStatus("failed", t("delete_preset_err"));
      }
    }).fail(function () {
      showStatus("failed", t("delete_preset_err"));
    });
  });

  // Gestione Cartelle Preferite CRUD
  $("#toggleFolderForm").on("click", function (e) {
    e.preventDefault();
    $("#folderForm").toggle();
    $("#updateFolderForm").hide();
  });

  $("#toggleUpdateFolderForm").on("click", function (e) {
    e.preventDefault();
    $("#updateFolderForm").toggle();
    $("#folderForm").hide();
  });

  if (typeof foldersData === "undefined") {
    foldersData = {};
  }

  $("#oldFolderNameSelect").on("change", function () {
    populateUpdateFolderFields();
  });

  function populateUpdateFolderFields() {
    var selected = $("#oldFolderNameSelect").val();
    if (selected && foldersData[selected]) {
      $("#newFolderNameInput").val(selected);
      $("#folderPathInput").val(foldersData[selected]);
    }
  }

  populateUpdateFolderFields();

  $("#addFolderForm").on("submit", function (e) {
    e.preventDefault();
    var formData = $(this).serialize();
    $.post("/add_folder", formData, function (data) {
      if (data.success) {
        location.reload();
      } else {
        showStatus("failed", t("add_folder_err"));
      }
    }).fail(function () {
      showStatus("failed", t("add_folder_err"));
    });
  });

  $("#modifyFolderForm").on("submit", function (e) {
    e.preventDefault();
    var formData = $(this).serialize();
    $.post("/update_folder", formData, function (data) {
      if (data.success) {
        location.reload();
      } else {
        showStatus("failed", t("modify_folder_err"));
      }
    }).fail(function () {
      showStatus("failed", t("modify_folder_err"));
    });
  });

  $("#removeFolderButton").on("click", function (e) {
    e.preventDefault();
    var selected = $("#oldFolderNameSelect").val();
    
    // Controlla che non sia l'unica cartella rimasta
    var folderKeys = Object.keys(foldersData);
    if (folderKeys.length <= 1) {
      alert(t("cannot_remove_last_folder"));
      return;
    }
    
    if (!selected || !confirm(t("confirm_delete_folder", { name: selected }))) {
      return;
    }
    $.post("/remove_folder", { name: selected }, function (data) {
      if (data.success) {
        location.reload();
      } else {
        var errMsg = data.error === "cannot_remove_last_folder" ? t("cannot_remove_last_folder") : t("delete_folder_err");
        showStatus("failed", errMsg);
      }
    }).fail(function (xhr) {
      var errMsg = (xhr.responseJSON && xhr.responseJSON.error === "cannot_remove_last_folder") ? t("cannot_remove_last_folder") : t("delete_folder_err");
      showStatus("failed", errMsg);
    });
  });

  // Ripristina download in corso
  var savedDownloadId = sessionStorage.getItem('currentDownloadId');
  if (savedDownloadId) {
    $.get("/status/" + savedDownloadId, function (data) {
      if (data.status === "in-progress" || data.status === "waiting") {
        currentDownloadId = savedDownloadId;
        currentDownloadStatus = data.status;
        $("#logContainer").show();
        $(currentStopButtonSelector).show();
        pollStatus(currentDownloadId);
        pollLog(currentDownloadId);
      } else {
        sessionStorage.removeItem('currentDownloadId');
      }
    }).fail(function () {
      sessionStorage.removeItem('currentDownloadId');
    });
  }

  // Gestione click su "Vedi Log" nella cronologia
  $(document).on("click", ".view-history-log-btn", function (e) {
    e.stopPropagation();
    var downloadId = $(this).attr("data-id");
    
    $.get("/get_log/" + downloadId, function (data) {
      $("#historyLogTitle").text(t("history_log_title") + ": " + (data.title || "Download"));
      
      // Setta l'ID e il titolo del log corrente sul pulsante di rimozione nel modal
      $("#deleteCurrentLogButton").attr("data-id", downloadId).attr("data-title", data.title || "");
      
      // Costruisci parametri
      var paramsHtml = "";
      if (data.parameters) {
        var p = data.parameters;
        
        // Helper per formattare booleani
        var fmtBool = function(val) {
          return val ? "<span style='color: #20c997; font-weight: bold;'>" + t("yes") + "</span>" : "<span style='color: #ef4444; font-weight: bold;'>" + t("no") + "</span>";
        };
        
        paramsHtml += "<div><strong>" + t("history_type_label") + ":</strong> " + t(p.download_type || 'video') + "</div>";
        paramsHtml += "<div><strong>" + t("history_audio_only_label") + ":</strong> " + fmtBool(p.audio_only) + "</div>";
        if (!p.audio_only) {
          paramsHtml += "<div><strong>" + t("history_resolution_label") + ":</strong> " + escapeHtml(p.resolution || 'best') + (p.resolution !== 'best' && p.resolution !== 'Migliore' && p.resolution !== 'Best' ? 'p' : '') + "</div>";
          paramsHtml += "<div><strong>" + t("history_merge_mkv_label") + ":</strong> " + fmtBool(p.merge_to_mkv) + "</div>";
        } else {
          paramsHtml += "<div><strong>" + t("history_audio_quality_label") + ":</strong> " + (p.audio_quality === 'best' ? t("best") : escapeHtml(p.audio_quality || '')) + "</div>";
        }
        if (p.preset && p.preset !== 'Nessuno' && p.preset !== 'None') {
          paramsHtml += "<div><strong>" + t("history_preset_label") + ":</strong> " + escapeHtml(p.preset) + "</div>";
        }
        if (p.languages && p.languages.length > 0) {
          paramsHtml += "<div><strong>" + t("history_audio_languages_label") + ":</strong> " + escapeHtml(p.languages.join(', ')) + "</div>";
        }
        if (p.subtitles && p.subtitles.length > 0) {
          paramsHtml += "<div><strong>" + t("history_subtitles_label") + ":</strong> " + escapeHtml(p.subtitles.join(', ')) + "</div>";
        }
        paramsHtml += "<div style='grid-column: 1 / -1; word-break: break-all;'><strong>" + t("history_destination_label") + ":</strong> " + escapeHtml(p.path || '') + "</div>";
      } else {
        paramsHtml = "<div style='grid-column: 1 / -1; color: #64748b;'>" + t("history_no_params") + "</div>";
      }
      
      $("#historyLogParams").html(paramsHtml);
      $("#historyLogCommand").text(data.cmd || t("history_cmd_not_available"));
      $("#historyLogText").text(data.log || t("history_log_not_available"));
      
      $("#historyLogModal").show();
    }).fail(function() {
      alert(t("history_log_load_err"));
    });
  });

  $("#closeHistoryLogModalButton").on("click", function () {
    $("#historyLogModal").hide();
  });

  $("#historyLogModal").on("click", function (e) {
    if (e.target === this) {
      $(this).hide();
    }
  });

  // Gestione Modal Info Software
  $("#softwareInfoButton").on("click", function () {
    $("#softwareInfoModal").show();
  });

  $("#closeSoftwareInfoButton").on("click", function () {
    $("#softwareInfoModal").hide();
  });

  $("#softwareInfoModal").on("click", function (e) {
    if (e.target === this) {
      $(this).hide();
    }
  });

  // Gestione click su "Rimuovi questo log" all'interno del dettaglio modal
  $("#deleteCurrentLogButton").on("click", function () {
    var downloadId = $(this).attr("data-id");
    var title = $(this).attr("data-title") || "Download";
    
    var confirmDelete = confirm(t("confirm_delete_log", { title: title }));
    
    if (confirmDelete) {
      $.post("/delete_log/" + downloadId, function (data) {
        if (data.success) {
          alert(t("delete_log_success"));
          $("#historyLogModal").hide();
          // Ricarica lo storico
          $("#historyButton").trigger("click");
        } else {
          alert("Error: " + data.error);
        }
      }).fail(function () {
        alert(t("delete_log_err"));
      });
    }
  });

  // Gestione click su "Cancella tutto" nella cronologia
  $("#deleteAllHistoryButton").on("click", function (e) {
    e.stopPropagation();
    
    var confirmDeleteAll = confirm(t("confirm_delete_all_history"));
    
    if (confirmDeleteAll) {
      $.post("/delete_all_logs", function (data) {
        if (data.success) {
          alert(data.message);
          // Ricarica lo storico
          $("#historyButton").trigger("click");
        } else {
          alert("Error: " + data.error);
        }
      }).fail(function () {
        alert(t("delete_all_history_err"));
      });
    }
  });

  // Ricarica info video in automatico se c'è un URL (es: dopo refresh)
  var initialUrl = $('#downloadForm input[name="url"]').val();
  if (initialUrl && (initialUrl.includes('youtube.com') || initialUrl.includes('youtu.be'))) {
    fetchVideoInfo(initialUrl, true);
  }
});

function pollStatus(id) {
  $.get("/status/" + id, function (data) {
    var status = data.status;
    currentDownloadStatus = status;
    var message =
      {
        waiting: t("status_waiting"),
        "in-progress": t("status_in_progress"),
        success: t("status_success"),
        failed: t("status_failed"),
        not_found: t("status_not_found"),
      }[status] || "Stato sconosciuto";
    if (data.error) {
      message += " Error: " + data.error;
    }
    showStatus(status, message);
    if (status === "waiting" || status === "in-progress") {
      $(currentStopButtonSelector).show();
      $("#startDownloadButton").hide();
      $("#fetchVideoInfoButton").hide();
      setTimeout(function () {
        pollStatus(id);
      }, 1000);
    } else {
      $(currentStopButtonSelector).hide();
      $("#startDownloadButton").show();
      $("#fetchVideoInfoButton").show();
    }
  }).fail(function () {
    currentDownloadStatus = "failed";
    showStatus("failed", t("status_check_err"));
    $(currentStopButtonSelector).hide();
    $("#startDownloadButton").show();
    $("#fetchVideoInfoButton").show();
  });
}

function showStatus(type, message) {
  var statusDiv = $(currentStatusSelector);
  statusDiv
    .removeClass("waiting in-progress failed success")
    .addClass(type)
    .text(message)
    .show();
}

function pollLog(id) {
  $.get("/get_log/" + id, function (data) {
    $(currentLogSelector).text(data.log);
    $(currentLogSelector).scrollTop($(currentLogSelector)[0].scrollHeight);

    if (data.cmd) {
      $("#showCommandButton").attr("data-cmd", data.cmd).show();
    } else {
      $("#showCommandButton").hide();
    }

    // Continua il polling se il download è in corso
    if (currentDownloadStatus === "waiting" || currentDownloadStatus === "in-progress") {
      setTimeout(function () {
        pollLog(id);
      }, 500);
    }
  });
}

function escapeHtml(text) {
  var map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

function getYoutubeId(url) {
  var match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : "";
}
