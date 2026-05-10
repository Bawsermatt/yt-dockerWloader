var currentDownloadId = null;

$(document).ready(function () {
  $("#downloadForm").on("submit", function (e) {
    e.preventDefault();
    var formData = $(this).serialize();
    $.post("/download", formData, function (data) {
      currentDownloadId = data.id;
      $("#logContainer").show();
      $("#downloadLog").text("Avvio download...\n");
      $("#stopDownloadButton").show();
      pollStatus(currentDownloadId);
      pollLog(currentDownloadId);
    }).fail(function () {
      showStatus("failed", "Errore nell'avvio del download.");
    });
  });

  $("#stopDownloadButton").on("click", function () {
    if (!currentDownloadId) {
      return;
    }
    $.post("/stop/" + currentDownloadId, function (data) {
      if (data.success) {
        showStatus("failed", "Download interrotto dall'utente.");
        $("#stopDownloadButton").hide();
      } else {
        showStatus("failed", "Non è stato possibile interrompere il download.");
      }
    }).fail(function () {
      showStatus("failed", "Errore durante l'arresto del download.");
    });
  });

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

  $(".segment").on("click", function () {
    var target = $(this).data("tab");
    $(".segment").removeClass("active");
    $(this).addClass("active");
    $(".tab-pane").removeClass("active");
    $("#" + target).addClass("active");
  });

  $("#togglePresetForm").on("click", function () {
    $("#presetForm").toggle();
    $("#updateForm").hide();
  });

  $("#toggleUpdateForm").on("click", function () {
    $("#updateForm").toggle();
    $("#presetForm").hide();
  });

  $("#updateSettingsForm").on("submit", function (e) {
    e.preventDefault();
    var formData = $(this).serialize();
    $.post("/update_settings", formData, function (data) {
      if (data.success) {
        location.reload(); // Ricarica per aggiornare le impostazioni
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
        location.reload(); // Ricarica per aggiornare i preset
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
        location.reload(); // Ricarica per aggiornare i preset
      } else {
        showStatus("failed", "Errore nella modifica del preset.");
      }
    }).fail(function () {
      showStatus("failed", "Errore nella modifica del preset.");
    });
  });

  $("#removePresetButton").on("click", function () {
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

  $("#runCommandForm").on("submit", function (e) {
    e.preventDefault();
    var url = $("#advancedUrl").val();
    if (!url) {
      showStatus("failed", "Inserisci un URL.");
      return;
    }
    var formData = $(this).serialize() + "&url=" + encodeURIComponent(url);
    $.post("/run_command", formData, function (data) {
      if (data.id) {
        currentDownloadId = data.id;
        $("#logContainer").show();
        $("#downloadLog").text("Avvio comando avanzato...\n");
        $("#stopDownloadButton").show();
        pollStatus(currentDownloadId);
        pollLog(currentDownloadId);
      } else {
        showStatus("failed", "Errore nell'esecuzione del comando.");
      }
    }).fail(function (xhr) {
      var message = "Errore nell'esecuzione del comando.";
      if (xhr.responseJSON && xhr.responseJSON.error) {
        message += " " + xhr.responseJSON.error;
      }
      showStatus("failed", message);
    });
  });

  $("#listFormatsForm").on("submit", function (e) {
    e.preventDefault();
    var url = $("#advancedUrl").val();
    if (!url) {
      $("#formatsOutput").text("Inserisci un URL.");
      return;
    }
    $.post("/list_formats", { url: url }, function (data) {
      if (data.output) {
        $("#formatsOutput").text(data.output);
      } else if (data.error) {
        $("#formatsOutput").text("Errore: " + data.error);
      }
    }).fail(function () {
      $("#formatsOutput").text("Errore nella richiesta.");
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
      $("#stopDownloadButton").show();
      setTimeout(function () {
        pollStatus(id);
      }, 1000);
    } else {
      $("#stopDownloadButton").hide();
    }
  }).fail(function () {
    showStatus("failed", "Errore nel controllo dello stato.");
    $("#stopDownloadButton").hide();
  });
}

function showStatus(type, message) {
  var statusDiv = $("#status");
  statusDiv
    .removeClass("waiting in-progress failed success")
    .addClass(type)
    .text(message)
    .show();
}

function pollLog(id) {
  $.get("/get_log/" + id, function (data) {
    $("#downloadLog").text(data.log);
    $("#downloadLog").scrollTop($("#downloadLog")[0].scrollHeight);

    // Continua il polling se il download è in corso
    var status = $("#status").attr("class");
    if (status === "waiting" || status === "in-progress") {
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
