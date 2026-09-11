/**
 * BotShield SDK v2.0
 * Silent, privacy-conscious behavioral scoring. The server remains the security authority.
 */
(function (window, document) {
  "use strict";

  var script = document.currentScript || Array.prototype.slice.call(document.scripts).reverse().find(function (node) {
    return /bot-shield\.js(?:$|\?)/i.test(node.src);
  });
  var apiOrigin = script && script.src ? new URL(script.src, window.location.href).origin : window.location.origin;
  var state = { token: null, initialized: false, startedAt: Date.now(), refreshPromise: null };
  var mouse = { distance: 0, time: 0, curves: 0, lastX: null, lastY: null };
  var typing = { totalChars: 0, totalTime: 0, backspaces: 0, firstAt: null };
  var focusEvents = 0;
  var scrollEvents = 0;

  function configFromScript() {
    return {
      apiKey: script && script.getAttribute("data-api-key"),
      mode: (script && script.getAttribute("data-mode")) || "invisible",
      delay: Math.max(4000, Number((script && script.getAttribute("data-delay")) || 4000)),
      onSuccess: function () {}, onBotDetected: function () {}, onError: function () {}
    };
  }

  function fingerprint() {
    var nav = window.navigator || {};
    var screen = window.screen || {};
    var raw = [nav.userAgent, nav.language, nav.platform, nav.hardwareConcurrency, nav.maxTouchPoints, new Date().getTimezoneOffset(), screen.width + "x" + screen.height, screen.colorDepth].join("|");
    var hash = 0;
    for (var i = 0; i < raw.length; i += 1) hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
    return "fp_" + Math.abs(hash).toString(36);
  }

  function telemetry() {
    var now = Date.now();
    var nav = window.navigator || {};
    var connection = nav.connection || nav.mozConnection || nav.webkitConnection || {};
    return {
      apiKey: state.config.apiKey,
      mouseData: { distance: Math.round(mouse.distance), time: Math.round(mouse.time || (now - state.startedAt)), curves: mouse.curves },
      typingData: { totalChars: typing.totalChars, totalTime: typing.totalTime, backspaces: typing.backspaces },
      fingerprint: fingerprint(),
      deviceData: { webdriver: nav.webdriver === true, touchPoints: nav.maxTouchPoints || 0, hardwareConcurrency: nav.hardwareConcurrency || 0, platform: nav.platform || "", language: nav.language || "", screen: (window.screen && window.screen.width) + "x" + (window.screen && window.screen.height) },
      networkData: { connectionType: connection.effectiveType || connection.type || "", saveData: connection.saveData === true },
      sessionData: { focusEvents: focusEvents, scrollEvents: scrollEvents, visibility: document.visibilityState }
    };
  }

  function inject(token) {
    document.querySelectorAll("form[data-botshield]").forEach(function (form) {
      var input = form.querySelector('input[name="bot_shield_token"]');
      if (!input) { input = document.createElement("input"); input.type = "hidden"; input.name = "bot_shield_token"; form.appendChild(input); }
      input.value = token;
    });
  }

  function showStatus(text, good) {
    if (state.config.mode !== "modal") return;
    var el = document.getElementById("bs-status");
    if (!el) { el = document.createElement("div"); el.id = "bs-status"; el.setAttribute("role", "status"); el.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483647;padding:10px 14px;border-radius:10px;color:#fff;background:" + (good ? "#166534" : "#7f1d1d") + ";font:14px system-ui"; document.body.appendChild(el); }
    el.textContent = text;
    window.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1800);
  }

  function track() {
    document.addEventListener("mousemove", function (event) {
      var now = Date.now();
      if (mouse.lastX !== null) { var dx = event.clientX - mouse.lastX; var dy = event.clientY - mouse.lastY; mouse.distance += Math.sqrt(dx * dx + dy * dy); if (dx !== 0 && dy !== 0) mouse.curves += 1; }
      mouse.lastX = event.clientX; mouse.lastY = event.clientY; mouse.time = now - state.startedAt;
    }, { passive: true });
    document.addEventListener("keydown", function (event) { if (!typing.firstAt) typing.firstAt = Date.now(); if (event.key === "Backspace") typing.backspaces += 1; else if (event.key.length === 1) typing.totalChars += 1; typing.totalTime = Date.now() - typing.firstAt; }, { passive: true });
    window.addEventListener("focus", function () { focusEvents += 1; });
    document.addEventListener("scroll", function () { scrollEvents += 1; }, { passive: true });
  }

  var BotShield = {
    config: null,
    init: function (userConfig) {
      if (state.initialized) return this;
      state.config = Object.assign(configFromScript(), userConfig || {});
      if (!state.config.apiKey) { state.config.onError("Missing data-api-key"); return this; }
      state.initialized = true; this.config = state.config; track();
      window.setTimeout(function () { BotShield.refresh(); }, state.config.delay);
      return this;
    },
    getToken: function () { return state.token; },
    refresh: function () {
      if (!state.initialized) return Promise.reject(new Error("BotShield is not initialized"));
      if (state.refreshPromise) return state.refreshPromise;
      state.refreshPromise = fetch(apiOrigin + "/api/challenge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(telemetry()) })
        .then(function (response) { return response.json().then(function (data) { return { response: response, data: data }; }); })
        .then(function (result) {
          if (!result.response.ok || !result.data.token) throw new Error(result.data.error || "Challenge request failed");
          state.token = result.data.token; window.BS_TOKEN = state.token; inject(state.token); showStatus("BotShield ready", true); state.config.onSuccess(state.token, result.data); return state.token;
        })
        .catch(function (error) { state.config.onError(error.message); throw error; })
        .finally(function () { state.refreshPromise = null; });
      return state.refreshPromise;
    }
  };

  window.BotShield = BotShield;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { BotShield.init(); }); else BotShield.init();
})(window, document);
