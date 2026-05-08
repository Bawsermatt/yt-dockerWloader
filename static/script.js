$(document).ready(function () {
  $("#downloadForm").on("submit", function (e) {
    e.preventDefault();
    var formData = $(this).serialize();
    $.post("/download", formData, function (data) {
      pollStatus(data.id);
    }).fail(function () {
      showStatus("failed", "Errore nell'avvio del download.");
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
