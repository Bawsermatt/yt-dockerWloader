var currentDownloadId = null;
var currentDownloadStatus = null;
var currentLogSelector = "#downloadLog";
var currentStatusSelector = "#status";
var currentStopButtonSelector = "#stopDownloadButton";

$(document).ready(function () {
  // Toggle sezione avanzate
  $("#toggleAdvancedButton").on("click", function (e) {
    e.preventDefault();
    $("#advancedSection").slideToggle();
    var isVisible = $("#advancedSection").is(":visible");
    $(this).text(isVisible ? "⚙️ Nascondi Avanzate" : "⚙️ Mostra Avanzate");
  });

  function fetchVideoInfo(url, isAuto = false) {
    if (!url) {
      if (!isAuto) alert("Per favore, inserisci un URL");
      return;
    }

    $("#loadingPopup").css("display", "flex");
    $("#fetchVideoInfoButton").text("⏳").prop("disabled", true);

    $.post("/get_video_info", { url: url }, function (data) {
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
        audioHtml = '<p style="color: #999;">Nessuna traccia audio trovata</p>';
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
        subsHtml = '<p style="color: #999;">Nessun sottotitolo trovato</p>';
      }
      $("#subtitlesContainer").html(subsHtml);
      applyAutoTrackFilter();

      // Popola le risoluzioni video
      var resolutionsHtml = '<option value="best">Migliore</option>';
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
      var error = "Errore nel caricamento";
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
    if ($('input[name="downloadType"]:checked').val() === "playlist") {
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
        $("#toggleAdvancedButton").text("⚙️ Mostra Avanzate");
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

  // Toggle visibilità del range playlist in base al tipo di download
  $('input[name="downloadType"]').on("change", function () {
    if ($(this).val() === "playlist") {
      $("#playlistRangeGroup").slideDown();
    } else {
      $("#playlistRangeGroup").slideUp();
    }
  });

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
      sessionStorage.setItem('currentDownloadId', currentDownloadId);
      currentLogSelector = "#downloadLog";
      currentStatusSelector = "#status";
      currentStopButtonSelector = "#stopDownloadButton";
      $("#logContainer").show();
      $(currentLogSelector).text("Avvio download...\n");
      $(currentStopButtonSelector).show();
      $("#startDownloadButton").hide();
      $("#fetchVideoInfoButton").hide();
      pollStatus(currentDownloadId);
      pollLog(currentDownloadId);
    }).fail(function () {
      showStatus("failed", "Errore nell'avvio del download.");
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
        showStatus("failed", "Download interrotto dall'utente.");
        $(currentStopButtonSelector).hide();
        $("#startDownloadButton").show();
        $("#fetchVideoInfoButton").show();
      } else {
        showStatus("failed", "Non è stato possibile interrompere il download.");
      }
    }).fail(function () {
      showStatus("failed", "Errore durante l'arresto del download.");
    });
  });

  // Pulsante Cronologia
  $("#historyButton").on("click", function () {
    $.get("/get_history", function (data) {
      if (data.length === 0) {
        $("#historyList").html(
          '<p style="color: #999; text-align: center; padding: 20px;">Nessun download nella cronologia.</p>',
        );
      } else {
        var html = "";
        data.forEach(function (item) {
          var typeClass = item.type === "Audio" ? "audio" : "";
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
          html +=
            '<div class="history-type ' +
            typeClass +
            '">' +
            item.type +
            "</div>";
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
      $("#copyCommandButton").text("Copiato! ✅").prop("disabled", true);
      setTimeout(function () {
        $("#copyCommandButton").text(origText).prop("disabled", false);
      }, 2000);
    });
  });

  // Form Impostazioni
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
        alert("Errore nell'aggiornamento delle impostazioni.");
      }
    }).fail(function () {
      alert("Errore nell'aggiornamento delle impostazioni.");
    });
  });

  $("#addPresetForm").on("submit", function (e) {
    e.preventDefault();
    var formData = $(this).serialize();
    $.post("/add_preset", formData, function (data) {
      if (data.success) {
        location.reload();
      } else {
        showStatus("failed", "Errore nell'aggiunta del preset.");
      }
    }).fail(function () {
      showStatus("failed", "Errore nell'aggiunta del preset.");
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

  $("#updatePresetForm").on("submit", function (e) {
    e.preventDefault();
    var formData = $(this).serialize();
    $.post("/update_preset", formData, function (data) {
      if (data.success) {
        location.reload();
      } else {
        showStatus("failed", "Errore nella modifica del preset.");
      }
    }).fail(function () {
      showStatus("failed", "Errore nella modifica del preset.");
    });
  });

  $("#removePresetButton").on("click", function (e) {
    e.preventDefault();
    var selected = $("#oldNameSelect").val();
    if (!selected || !confirm("Rimuovere il preset '" + selected + "' ?")) {
      return;
    }
    $.post("/remove_preset", { name: selected }, function (data) {
      if (data.success) {
        location.reload();
      } else {
        showStatus("failed", "Errore nella rimozione del preset.");
      }
    }).fail(function () {
      showStatus("failed", "Errore nella rimozione del preset.");
    });
  });
  // Ripristina download in corso
  var savedDownloadId = sessionStorage.getItem('currentDownloadId');
  if (savedDownloadId) {
    $.get("/status/" + savedDownloadId, function (data) {
      if (data.status === "in-progress" || data.status === "waiting") {
        currentDownloadId = savedDownloadId;
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
        waiting: "In attesa di avvio...",
        "in-progress": "Download in corso...",
        success: "Download completato!",
        failed: "Download fallito. Riprova.",
        not_found: "Download non trovato.",
      }[status] || "Stato sconosciuto";
    if (data.error) {
      message += " Errore: " + data.error;
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
    showStatus("failed", "Errore nel controllo dello stato.");
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
