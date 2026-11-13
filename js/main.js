// Kopfzeile auf dem Handy: Schatten, sobald die Seite gescrollt ist
(function () {
  var header = document.querySelector("[data-header]");
  if (!header) return;

  function update() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  update();
  window.addEventListener("scroll", update, { passive: true });
})();

// Einblenden beim Scrollen: einmalig, Geschwister leicht versetzt
(function () {
  var root = document.documentElement;
  var items = document.querySelectorAll("[data-reveal]");
  window.__ugReady = true;

  if (!("IntersectionObserver" in window)) {
    root.classList.remove("reveal-on");
    return;
  }

  function done(el) {
    el.removeAttribute("data-reveal");
    el.classList.remove("is-visible");
    el.style.removeProperty("--reveal-delay");
  }

  var observer = new IntersectionObserver(
    function (entries) {
      var perParent = new Map();

      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var el = entry.target;
        var index = perParent.get(el.parentElement) || 0;
        perParent.set(el.parentElement, index + 1);

        var delay = Math.min(index, 5) * 70;
        el.style.setProperty("--reveal-delay", delay + "ms");
        el.classList.add("is-visible");
        observer.unobserve(el);

        // Danach gelten wieder die eigenen Übergänge des Elements
        setTimeout(function () {
          done(el);
        }, delay + 700);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );

  items.forEach(function (el) {
    observer.observe(el);
  });
})();

// «Für wen»: Kartensatz verdoppeln, damit die Schleife nahtlos läuft (das CSS steuert, wann sie läuft)
(function () {
  var loop = document.querySelector("[data-loop]");
  if (!loop) return;

  var set = loop.querySelector(".audience__set");
  var clone = set.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  set.parentNode.appendChild(clone);
  loop.classList.add("has-clone");
})();

// Formular: ein Schritt pro Frage, Telefon nur mit Ziffern, Versand an Netlify Forms
(function () {
  var form = document.querySelector("[data-lead-form]");
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll("[data-step]"));
  var bars = form.querySelectorAll("[data-form-bars] span");
  var count = form.querySelector("[data-form-count]");
  var back = form.querySelector("[data-form-back]");
  var next = form.querySelector("[data-form-next]");
  var code = form.querySelector("[data-phone-code]");
  var number = form.querySelector("[data-phone-number]");
  var success = document.querySelector("[data-form-success]");
  var error = form.querySelector("[data-form-error]");
  var submit = form.querySelector('button[type="submit"]');
  var last = steps.length - 1;
  var current = 0;
  var codeTouched = false;

  var byCountry = { Schweiz: "+41", Deutschland: "+49", "Österreich": "+43" };
  var examples = { "+41": "79 123 45 67", "+49": "170 1234567", "+43": "664 1234567" };

  function answered(index) {
    var radios = steps[index].querySelectorAll('input[type="radio"]');
    if (!radios.length) return true;
    return Array.prototype.some.call(radios, function (radio) {
      return radio.checked;
    });
  }

  function show(index, direction) {
    steps[current].classList.remove("is-active");
    current = index;
    form.setAttribute("data-dir", direction);
    steps[current].classList.add("is-active");

    Array.prototype.forEach.call(bars, function (bar, i) {
      bar.classList.toggle("is-done", i <= current);
    });
    count.textContent = "Schritt " + (current + 1) + " von " + steps.length;
    back.hidden = current === 0;
    next.hidden = current === last;
    next.disabled = !answered(current);
  }

  function forward() {
    if (current < last && answered(current)) show(current + 1, "forward");
  }

  form.classList.add("is-stepped");
  show(0, "forward");

  next.addEventListener("click", forward);
  back.addEventListener("click", function () {
    if (current > 0) show(current - 1, "back");
  });

  form.addEventListener("change", function (event) {
    var input = event.target;
    if (input.type !== "radio") return;

    next.disabled = !answered(current);

    // Vorwahl folgt dem Wohnsitz, solange sie nicht selbst gewählt wurde
    if (input.name === "wohnsitz" && !codeTouched && byCountry[input.value]) {
      code.value = byCountry[input.value];
      updateExample();
    }
  });

  // Antippen einer Antwort führt direkt weiter. Mit der Tastatur (detail 0) bleibt der Schritt stehen.
  form.addEventListener("click", function (event) {
    var input = event.target;
    if (input.type !== "radio" || event.detail === 0) return;

    var from = current;
    setTimeout(function () {
      if (current === from) forward();
    }, 220);
  });

  form.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" || current === last) return;
    if (event.target.tagName === "BUTTON") return;
    event.preventDefault();
    forward();
  });

  // Telefon: nur Ziffern und Leerzeichen, eine eingefügte Vorwahl wandert ins Dropdown
  function updateExample() {
    number.placeholder = examples[code.value] || "";
  }

  code.addEventListener("change", function () {
    codeTouched = true;
    updateExample();
  });

  number.addEventListener("input", function () {
    var value = number.value;
    var prefixed = value.replace(/^\s*00/, "+");

    if (prefixed.charAt(0) === "+") {
      var match = Array.prototype.map
        .call(code.options, function (option) {
          return option.value;
        })
        .sort(function (a, b) {
          return b.length - a.length;
        })
        .filter(function (dial) {
          return prefixed.replace(/\s/g, "").indexOf(dial) === 0;
        })[0];

      if (match) {
        code.value = match;
        codeTouched = true;
        updateExample();
        value = prefixed.replace(/\s/g, "").slice(match.length);
      }
    }

    var clean = value.replace(/[^\d ]/g, "").replace(/^ +/, "");
    if (clean !== number.value) number.value = clean;
  });

  updateExample();

  if (!window.fetch) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    error.hidden = true;
    submit.disabled = true;

    var body = new URLSearchParams(new FormData(form));
    body.set("telefon", code.value + " " + number.value.trim().replace(/^0+/, ""));

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Status " + response.status);
        form.hidden = true;
        success.hidden = false;
        success.focus();
      })
      .catch(function () {
        error.hidden = false;
        submit.disabled = false;
      });
  });
})();
