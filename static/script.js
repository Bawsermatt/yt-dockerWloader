var currentDownloadId = null;
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

  // Pulsante Fetch Info Video
  $("#fetchVideoInfoButton").on("click", function (e) {
    e.preventDefault();
    var url = $('#downloadForm input[name="url"]').val();
    if (!url) {
      alert("Per favore, inserisci un URL");
      return;
    }

    $(this).text("⏳ Caricamento...");
    $(this).prop("disabled", true);

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

      $("#fetchVideoInfoButton").text("✅ Audio e Sottotitoli Caricati");
      setTimeout(function () {
        $("#fetchVideoInfoButton").text(
          "🔍 Carica Audio e Sottotitoli Disponibili",
        );
        $("#fetchVideoInfoButton").prop("disabled", false);
      }, 2000);
    }).fail(function (xhr) {
      var error = "Errore nel caricamento";
      if (xhr.responseJSON && xhr.responseJSON.error) {
        error = xhr.responseJSON.error;
      }
      alert(error);
      $("#fetchVideoInfoButton").text(
        "🔍 Carica Audio e Sottotitoli Disponibili",
      );
      $("#fetchVideoInfoButton").prop("disabled", false);
    });
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
      currentLogSelector = "#downloadLog";
      currentStatusSelector = "#status";
      currentStopButtonSelector = "#stopDownloadButton";
      $("#logContainer").show();
      $(currentLogSelector).text("Avvio download...\n");
      $(currentStopButtonSelector).show();
      pollStatus(currentDownloadId);
      pollLog(currentDownloadId);
    }).fail(function () {
      showStatus("failed", "Errore nell'avvio del download.");
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
});

function pollStatus(id) {
  $.get("/status/" + id, function (data) {
    var status = data.status;
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
      setTimeout(function () {
        pollStatus(id);
      }, 1000);
    } else {
      $(currentStopButtonSelector).hide();
    }
  }).fail(function () {
    showStatus("failed", "Errore nel controllo dello stato.");
    $(currentStopButtonSelector).hide();
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

    // Continua il polling se il download è in corso
    var status = $(currentStatusSelector).attr("class");
    if (status.includes("waiting") || status.includes("in-progress")) {
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
