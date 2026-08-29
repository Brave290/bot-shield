/**
 * BotShield SDK v1.1
 * Open-source, privacy-first bot protection.
 */
(function (window) {
  'use strict';

  const API_BASE = "https://bo-tshield.vercel.app"; 

  // 1. Inject Premium Styles (Dark mode, clean typography, smooth animations)
  const style = document.createElement('style');
  style.innerHTML = `
    .bs-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999999; opacity: 0; transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .bs-overlay.active { opacity: 1; }
    .bs-card { background: #0B0F19; border: 1px solid #1E293B; border-radius: 12px; padding: 24px; width: 90%; max-width: 380px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); transform: translateY(10px); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .bs-overlay.active .bs-card { transform: translateY(0); }
    .bs-title { color: #F8FAFC; font-family: system-ui, -apple-system, sans-serif; font-size: 18px; font-weight: 600; margin: 0 0 8px 0; }
    .bs-text { color: #94A3B8; font-family: system-ui, sans-serif; font-size: 14px; margin: 0 0 20px 0; line-height: 1.5; }
    .bs-btn { background: #2563EB; color: white; border: none; border-radius: 8px; padding: 10px 20px; font-family: system-ui, sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.2s; width: 100%; }
    .bs-btn:hover { background: #1D4ED8; }
    .bs-btn:disabled { background: #1E293B; color: #64748B; cursor: not-allowed; }
    .bs-spinner { width: 24px; height: 24px; border: 2px solid #1E293B; border-top-color: #3B82F6; border-radius: 50%; animation: bs-spin 0.8s linear infinite; margin: 0 auto 16px auto; }
    .bs-footer { margin-top: 16px; font-size: 11px; color: #475569; font-family: system-ui, sans-serif; }
    .bs-footer a { color: #475569; text-decoration: none; }
    @keyframes bs-spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);

  const BotShield = {
    config: null,

    init: function (userConfig) {
      this.config = Object.assign({
        apiKey: '',
        mode: 'invisible', 
        onSuccess: function () {},
        onBotDetected: function () {},
        onError: function () {}
      }, userConfig);

      if (!this.config.apiKey) { console.error("[BotShield] Missing apiKey"); return; }
      this.verify();
    },

    verify: async function () {
      // MVP Payload (We will add real mouse/typing tracking in v1.2)
      const payload = {
        apiKey: this.config.apiKey,
        mouseData: { distance: 0, time: 0, curves: 0 },
        typingData: { totalChars: 0, totalTime: 0, backspaces: 0 },
        fingerprint: navigator.userAgent
      };

      if (this.config.mode === 'modal') this.showModal('loading');

      try {
        const res = await fetch(`${API_BASE}/api/challenge`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.status === 200 && data.token) {
          if (this.config.mode === 'modal') this.showModal('success');
          setTimeout(() => { this.hideModal(); this.config.onSuccess(data.token); }, 1200);
        } else if (res.status === 403) {
          this.hideModal();
          if (this.config.mode === 'challenge') this.showChallenge();
          else this.config.onBotDetected();
        } else {
          this.hideModal(); this.config.onError(data.error);
        }
      } catch (e) { this.hideModal(); this.config.onError("Network error"); }
    },

    showModal: function (state) {
      let el = document.getElementById('bs-modal');
      if (!el) {
        el = document.createElement('div');
        el.id = 'bs-modal';
        el.className = 'bs-overlay';
        el.innerHTML = `
          <div class="bs-card">
            <div id="bs-content"></div>
            <div class="bs-footer">Protected by <strong>BotShield</strong> • <a href="#">Privacy</a></div>
          </div>
        `;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('active'));
      }
      
      const content = document.getElementById('bs-content');
      if (state === 'loading') {
        content.innerHTML = `<div class="bs-spinner"></div><h3 class="bs-title">Verifying you are human</h3><p class="bs-text">Please wait a moment...</p>`;
      } else if (state === 'success') {
        content.innerHTML = `<div style="color:#10B981;font-size:32px;margin-bottom:12px;">✓</div><h3 class="bs-title">Verification Successful</h3><p class="bs-text">Redirecting you now...</p>`;
      }
    },

    showChallenge: function () {
      let el = document.getElementById('bs-challenge');
      if (!el) {
        el = document.createElement('div');
        el.id = 'bs-challenge';
        el.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;';
        el.innerHTML = `
          <div class="bs-card" style="padding:16px;max-width:280px;text-align:left;">
            <h3 class="bs-title" style="font-size:14px;">Security Check</h3>
            <p class="bs-text" style="font-size:12px;margin-bottom:12px;">Please verify you are human to continue.</p>
            <button class="bs-btn" id="bs-verify-btn">Verify</button>
          </div>
        `;
        document.body.appendChild(el);
        document.getElementById('bs-verify-btn').onclick = () => {
          const btn = document.getElementById('bs-verify-btn');
          btn.disabled = true; btn.innerText = "Verifying...";
          this.verify(); // Re-run verification
        };
      }
    },

    hideModal: function () {
      const el = document.getElementById('bs-modal');
      if (el) {
        el.classList.remove('active');
        setTimeout(() => el.remove(), 300);
      }
    }
  };

  window.BotShield = BotShield;
})(window);
