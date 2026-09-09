/**
 * BotShield SDK v1.2
 * Enterprise-grade bot detection for the modern web
 * Privacy-preserving behavioral analysis
 */
(function (window) {
  'use strict';

  // Derive API origin from script URL to support custom domains
  function getAPIBase() {
    const scripts = document.querySelectorAll('script[src*="bot-shield"]');
    if (scripts.length > 0) {
      const src = scripts[scripts.length - 1].src;
      const url = new URL(src);
      return url.origin;
    }
    return "https://bo-tshield.vercel.app";
  }

  const API_BASE = getAPIBase();

  // Premium styling
  const style = document.createElement('style');
  style.innerHTML = `
    .bs-overlay { 
      position: fixed; inset: 0; background: rgba(0,0,0,0.6); 
      backdrop-filter: blur(4px); display: flex; align-items: center; 
      justify-content: center; z-index: 999999; opacity: 0; 
      transition: opacity 0.3s ease; pointer-events: none;
    }
    .bs-overlay.active { opacity: 1; pointer-events: auto; }
    .bs-card { 
      background: #0B0F19; border: 1px solid #1E293B; 
      border-radius: 12px; padding: 24px; width: 90%; max-width: 380px; 
      text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); 
      transform: translateY(10px); transition: transform 0.3s ease;
    }
    .bs-overlay.active .bs-card { transform: translateY(0); }
    .bs-title { 
      color: #F8FAFC; font-family: system-ui, -apple-system, sans-serif; 
      font-size: 18px; font-weight: 600; margin: 0 0 8px 0;
    }
    .bs-text { 
      color: #94A3B8; font-family: system-ui, sans-serif; 
      font-size: 14px; margin: 0 0 20px 0; line-height: 1.5;
    }
    .bs-btn { 
      background: #2563EB; color: white; border: none; 
      border-radius: 8px; padding: 10px 20px; font-family: system-ui, sans-serif; 
      font-size: 14px; font-weight: 500; cursor: pointer; 
      transition: background 0.2s ease;
    }
    .bs-btn:hover { background: #1D4ED8; }
    .bs-btn:disabled { background: #1E293B; color: #64748B; cursor: not-allowed; }
    .bs-spinner { 
      width: 24px; height: 24px; border: 2px solid #1E293B; 
      border-top-color: #3B82F6; border-radius: 50%; 
      animation: bs-spin 0.8s linear infinite; margin: 0 auto 16px auto;
    }
    .bs-footer { 
      margin-top: 16px; font-size: 11px; color: #475569; 
      font-family: system-ui, sans-serif;
    }
    .bs-footer a { color: #475569; text-decoration: none; }
    @keyframes bs-spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);

  const BotShield = {
    config: null,
    mouseTracker: null,
    keyboardTracker: null,

    /**
     * Initialize BotShield with configuration
     * Starts behavioral telemetry collection immediately
     */
    init: function (userConfig) {
      this.config = Object.assign({
        apiKey: '',
        mode: 'invisible', // invisible | modal | challenge
        onSuccess: function () {},
        onBotDetected: function () {},
        onError: function () {},
        sensitivity: 'medium' // strict | medium | loose
      }, userConfig);

      if (!this.config.apiKey) {
        console.error("[BotShield] Missing apiKey");
        return;
      }

      // Start collecting behavioral data
      this.startTracking();

      // Trigger verification after short delay to collect data
      setTimeout(() => this.verify(), 1000);
    },

    /**
     * Start tracking mouse and keyboard behavior
     */
    startTracking: function () {
      this.mouseTracker = { distance: 0, time: 0, curves: 0, lastX: 0, lastY: 0, startTime: Date.now() };
      this.keyboardTracker = { totalChars: 0, totalTime: 0, backspaces: 0, startTime: Date.now() };

      // Mouse tracking: collect movement distance, time, and curvature
      document.addEventListener('mousemove', (e) => {
        if (!this.mouseTracker) return;
        const dx = e.clientX - this.mouseTracker.lastX;
        const dy = e.clientY - this.mouseTracker.lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.mouseTracker.distance += distance;
        this.mouseTracker.time = Date.now() - this.mouseTracker.startTime;
        
        // Estimate curves: if movement isn't purely linear
        if (dx !== 0 && dy !== 0) {
          this.mouseTracker.curves++;
        }
        
        this.mouseTracker.lastX = e.clientX;
        this.mouseTracker.lastY = e.clientY;
      });

      // Keyboard tracking: collect typing speed and corrections
      document.addEventListener('keydown', (e) => {
        if (!this.keyboardTracker) return;
        
        if (e.key === 'Backspace') {
          this.keyboardTracker.backspaces++;
        } else if (e.key.length === 1) {
          this.keyboardTracker.totalChars++;
          this.keyboardTracker.totalTime = Date.now() - this.keyboardTracker.startTime;
        }
      });
    },

    /**
     * Generate fingerprint using available browser signals
     */
    getFingerprint: function () {
      const parts = [
        navigator.userAgent,
        navigator.language,
        new Date().getTimezoneOffset(),
        window.screen.width + 'x' + window.screen.height,
      ];
      
      // Simple hash of concatenated signals
      const str = parts.join('|');
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit int
      }
      return 'fp_' + Math.abs(hash).toString(36);
    },

    /**
     * Send challenge request with collected behavioral data
     */
    verify: async function () {
      const payload = {
        apiKey: this.config.apiKey,
        mouseData: {
          distance: Math.round(this.mouseTracker.distance || 0),
          time: Math.round(this.mouseTracker.time || 0),
          curves: Math.round(this.mouseTracker.curves || 0),
        },
        typingData: {
          totalChars: this.keyboardTracker.totalChars || 0,
          totalTime: Math.round(this.keyboardTracker.totalTime || 0),
          backspaces: this.keyboardTracker.backspaces || 0,
        },
        fingerprint: this.getFingerprint(),
      };

      if (this.config.mode === 'modal') this.showModal('loading');

      try {
        const res = await fetch(`${API_BASE}/api/challenge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.status === 200 && data.token) {
          if (this.config.mode === 'modal') this.showModal('success');
          setTimeout(() => {
            this.hideModal();
            this.config.onSuccess(data.token);
            window.BS_TOKEN = data.token; // Store for form submission
          }, 1200);
        } else if (res.status === 403) {
          this.hideModal();
          if (this.config.mode === 'challenge') this.showChallenge();
          else this.config.onBotDetected();
        } else {
          this.hideModal();
          this.config.onError(data.error || 'Verification failed');
        }
      } catch (e) {
        this.hideModal();
        this.config.onError("Network error: " + e.message);
      }
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
            <div class="bs-footer">Protected by <strong>BotShield</strong></div>
          </div>
        `;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('active'));
      }

      const content = document.getElementById('bs-content');
      if (state === 'loading') {
        content.innerHTML = `
          <div class="bs-spinner"></div>
          <h3 class="bs-title">Verifying</h3>
          <p class="bs-text">Analyzing your behavior...</p>
        `;
      } else if (state === 'success') {
        content.innerHTML = `
          <div style="color:#10B981;font-size:32px;margin-bottom:12px;">✓</div>
          <h3 class="bs-title">Verified</h3>
          <p class="bs-text">You're human. Proceeding...</p>
        `;
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
            <p class="bs-text" style="font-size:12px;margin-bottom:12px;">Please verify to continue.</p>
            <button class="bs-btn" id="bs-verify-btn" style="width:100%;">Retry Verification</button>
          </div>
        `;
        document.body.appendChild(el);
        document.getElementById('bs-verify-btn').onclick = () => {
          const btn = document.getElementById('bs-verify-btn');
          btn.disabled = true;
          btn.innerText = "Verifying...";
          this.verify();
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
