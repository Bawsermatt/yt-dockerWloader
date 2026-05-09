$(document).ready(function () {
  $("#downloadForm").on("submit", function (e) {
    e.preventDefault();
    var formData = $(this).serialize();
    $.post("/download", formData, function (data) {
      $("#logContainer").show();
      $("#downloadLog").text("Avvio download...\n");
      pollStatus(data.id);
      pollLog(data.id);
    }).fail(function () {
      showStatus("failed", "Errore nell'avvio del download.");
    });
  });

  $("#togglePresetForm").on("click", function () {
    $("#presetForm").toggle();
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

  $("#toggleUpdateForm").on("click", function () {
    $("#updateForm").toggle();
    // Popola i campi al primo toggle
    populateUpdateFields();
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

  $("#toggleFormatsForm").on("click", function () {
    $("#formatsForm").toggle();
  });

  $("#listFormatsForm").on("submit", function (e) {
    e.preventDefault();
    var formData = $(this).serialize();
    $("#formatsOutput").text("Caricamento...");
    $.post("/list_formats", formData, function (data) {
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
      setTimeout(function () {
        pollStatus(id);
      }, 1000);
    }
  }).fail(function () {
    showStatus("failed", "Errore nel controllo dello stato.");
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
