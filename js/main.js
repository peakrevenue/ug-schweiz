// Kopfzeile: Schatten, sobald die Seite gescrollt ist
(function () {
  var header = document.querySelector("[data-header]");
  if (!header) return;

  function update() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  update();
  window.addEventListener("scroll", update, { passive: true });
})();

// Formular: Versand an Netlify Forms ohne Seitenwechsel
(function () {
  var form = document.querySelector("[data-lead-form]");
  if (!form || !window.fetch) return;

  var success = document.querySelector("[data-form-success]");
  var error = form.querySelector("[data-form-error]");
  var button = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    error.hidden = true;
    button.disabled = true;

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(new FormData(form)).toString(),
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Status " + response.status);
        form.hidden = true;
        success.hidden = false;
        success.focus();
      })
      .catch(function () {
        error.hidden = false;
        button.disabled = false;
      });
  });
})();
