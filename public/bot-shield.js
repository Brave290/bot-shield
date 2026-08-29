/**
 * BotShield SDK v1.0
 * The open-source, privacy-first bot protection widget.
 */
(function (window) {
  'use strict';

  const API_BASE = "https://bo-tshield.vercel.app"; // Your production API URL

  const BotShield = {
    config: null,
    isVerified: false,

    // 1. Initialize the widget
    init: function (userConfig) {
      this.config = Object.assign({
        apiKey: '',
        mode: 'invisible', // 'invisible', 'modal', 'challenge'
        onSuccess: function () {},
        onBotDetected: function () {},
        onError: function () {}
      }, userConfig);

      if (!this.config.apiKey) {
        console.error("[BotShield] Missing apiKey in config.");
        return;
      }

      // Start collecting signals and verifying
      this.collectAndVerify();
    },

    // 2. Collect basic signals and call the API
    collectAndVerify: async function () {
      const payload = {
        apiKey: this.config.apiKey,
        mouseData: { distance: 0, time: 0, curves: 0 }, // MVP: placeholder signals
        typingData: { totalChars: 0, totalTime: 0, backspaces: 0 },
        fingerprint: navigator.userAgent + window.screen.width
      };

      try {
        const response = await fetch(`${API_BASE}/api/challenge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.status === 200 && data.token) {
          this.handleSuccess(data.token);
        } else if (response.status === 403) {
          this.handleBotDetected();
        } else {
          this.config.onError && this.config.onError(data.error || "Verification failed");
        }
      } catch (error) {
        console.error("[BotShield] Network error:", error);
        this.config.onError && this.config.onError("Network error");
      }
    },

    // 3. Handle the 3 Modes
    handleSuccess: function (token) {
      this.isVerified = true;
      
      if (this.config.mode === 'invisible') {
        // Mode A: Do nothing, just fire callback
        this.config.onSuccess && this.config.onSuccess(token);
      } 
      else if (this.config.mode === 'modal') {
        // Mode B: Show success modal briefly, then close
        this.showModal("Verifying...", "Verified! Redirecting...");
        setTimeout(() => {
          this.hideModal();
          this.config.onSuccess && this.config.onSuccess(token);
        }, 1500);
      } 
      else if (this.config.mode === 'challenge') {
        // Mode C: If it passed silently, just fire callback (challenge only shows if suspicious)
        this.config.onSuccess && this.config.onSuccess(token);
      }
    },

    handleBotDetected: function () {
      if (this.config.mode === 'challenge') {
        // Show a "Click to verify" button for suspicious users
        this.showChallengeButton();
      } else {
        // Invisible and Modal modes just block
        this.config.onBotDetected && this.config.onBotDetected();
      }
    },

    // 4. Basic UI Helpers (We will style these beautifully in the next step)
    showModal: function (title, message) {
      let modal = document.getElementById('botshield-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'botshield-modal';
        modal.innerHTML = `
          <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:99999;">
            <div style="background:#0f172a;border:1px solid #334155;padding:2rem;border-radius:1rem;text-align:center;color:white;max-width:400px;width:90%;">
              <h3 style="margin:0 0 1rem 0;font-size:1.25rem;">️ ${title}</h3>
              <p style="margin:0;color:#94a3b8;">${message}</p>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
    },

    hideModal: function () {
      const modal = document.getElementById('botshield-modal');
      if (modal) modal.remove();
    },

    showChallengeButton: function () {
      // We will build the interactive challenge UI in the next step
      console.log("[BotShield] Challenge mode triggered. UI coming next.");
    }
  };

  // Expose to global window
  window.BotShield = BotShield;

})(window);
