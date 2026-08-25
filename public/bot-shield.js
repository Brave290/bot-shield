(function () {
  "use strict";
  var script = document.currentScript;
  if (!script) return;
  var apiKey = script.getAttribute("data-api-key") || "";
  var origin;
  try { origin = new URL(script.src, window.location.href).origin; } catch (e) { origin = window.location.origin; }

  var start = Date.now();
  var mouse = { distance: 0, curves: 0, pauses: 0, lastX: null, lastY: null, lastT: null, dir: null };
  var typing = { chars: 0, backspaces: 0, first: null, last: null };
  var token = "";

  document.addEventListener("mousemove", function (e) {
    var now = Date.now();
    if (mouse.lastX !== null) {
      var dx = e.clientX - mouse.lastX, dy = e.clientY - mouse.lastY;
      mouse.distance += Math.round(Math.sqrt(dx * dx + dy * dy));
      var dir = (dx > 0 ? "r" : dx < 0 ? "l" : "") + (dy > 0 ? "d" : dy < 0 ? "u" : "");
      if (mouse.dir && dir && dir !== mouse.dir) mouse.curves += 1;
      mouse.dir = dir || mouse.dir;
      if (mouse.lastT && now - mouse.lastT > 700) mouse.pauses += 1;
    }
    mouse.lastX = e.clientX; mouse.lastY = e.clientY; mouse.lastT = now;
  }, { passive: true });

  document.addEventListener("keydown", function (e) {
    var now = Date.now();
    if (!typing.first) typing.first = now;
    typing.last = now;
    if (e.key === "Backspace") typing.backspaces += 1; else typing.chars += 1;
  }, { passive: true });

  function fingerprint() {
    return [navigator.language, navigator.hardwareConcurrency || 0, screen.width + "x" + screen.height, new Date().getTimezoneOffset()].join("|");
  }

  function submit() {
    var payload = {
      apiKey: apiKey,
      mouseData: { distance: mouse.distance, time: Date.now() - start, curves: mouse.curves, pauses: mouse.pauses },
      typingData: { totalChars: typing.chars, totalTime: (typing.last && typing.first) ? typing.last - typing.first : 0, backspaces: typing.backspaces },
      fingerprint: fingerprint()
    };
    fetch(origin + "/api/challenge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.token) {
          token = d.token;
          document.querySelectorAll("form").forEach(function (f) {
            if (!f.querySelector("input[name=bot_shield_token]")) {
              var i = document.createElement("input");
              i.type = "hidden"; i.name = "bot_shield_token"; i.value = token;
              f.appendChild(i);
            }
          });
        }
      })
      .catch(function () { /* fail open: never block real users */ });
  }

  setTimeout(submit, 4000);
  window.botShield = { getToken: function () { return token; }, refresh: submit };
})();
