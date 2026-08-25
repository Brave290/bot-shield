/**
 * BotShield Lightweight Widget
 * Layer 11 (Bundle Size): Pure Vanilla JS, zero dependencies, <5KB.
 * Layer 12 (Security): Generates basic fingerprint and securely transmits data.
 */
(function() {
  'use strict';

  // 1. Get configuration from the script tag
  const currentScript = document.currentScript;
  const API_KEY = currentScript.getAttribute('data-api-key');
  const API_URL = currentScript.getAttribute('data-api-url') || window.location.origin;

  if (!API_KEY) {
    console.error('[BotShield] Missing data-api-key attribute.');
    return;
  }

  // 2. State tracking
  const state = {
    mouse: { distance: 0, curves: 0, lastX: 0, lastY: 0, startTime: Date.now(), moved: false },
    typing: { totalChars: 0, backspaces: 0, startTime: 0, isTyping: false },
    token: null
  };

  // 3. Mouse Tracking Logic
  document.addEventListener('mousemove', function(e) {
    if (!state.mouse.moved) {
      state.mouse.moved = true;
      state.mouse.lastX = e.clientX;
      state.mouse.lastY = e.clientY;
      return;
    }

    const dx = e.clientX - state.mouse.lastX;
    const dy = e.clientY - state.mouse.lastY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    state.mouse.distance += distance;
    
    // If the movement is jagged (not a straight line), count it as a curve (Human trait)
    if (Math.abs(dx) > 5 && Math.abs(dy) > 5) {
      state.mouse.curves += 1;
    }

    state.mouse.lastX = e.clientX;
    state.mouse.lastY = e.clientY;
  });

  // 4. Typing Tracking Logic
  document.addEventListener('keydown', function(e) {
    if (!state.typing.isTyping) {
      state.typing.isTyping = true;
      state.typing.startTime = Date.now();
    }
    
    state.typing.totalChars += 1;
    if (e.key === 'Backspace') {
      state.typing.backspaces += 1;
    }
  });

  // 5. Basic Fingerprint (Layer 12)
  function getFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('BotShield-FP', 2, 2);
    return canvas.toDataURL().slice(-50); // Simple hash substitute
  }

  // 6. Send data to API and get token
  async function requestToken() {
    const mouseTime = Date.now() - state.mouse.startTime;
    const typingTime = state.typing.isTyping ? (Date.now() - state.typing.startTime) : 1000;

    const payload = {
      apiKey: API_KEY,
      mouseData: {
        distance: Math.round(state.mouse.distance),
        time: mouseTime,
        curves: state.mouse.curves
      },
      typingData: {
        totalChars: state.typing.totalChars,
        totalTime: typingTime,
        backspaces: state.typing.backspaces
      },
      fingerprint: getFingerprint()
    };

    try {
      const response = await fetch(`${API_URL}/api/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.status === 'passed' && data.token) {
        state.token = data.token;
        // Inject token into any form with the class 'bot-shield-form'
        injectTokenIntoForms();
      } else {
        console.warn('[BotShield] Challenge failed or blocked.', data);
      }
    } catch (err) {
      console.error('[BotShield] Network error:', err);
    }
  }

  // 7. Inject token into forms
  function injectTokenIntoForms() {
    const forms = document.querySelectorAll('form.bot-shield-form');
    forms.forEach(form => {
      let input = form.querySelector('input[name="bot_shield_token"]');
      if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'bot_shield_token';
        form.appendChild(input);
      }
      input.value = state.token;
    });
  }

  // 8. Initialize: Wait 3 seconds for user to interact, then request token
  setTimeout(requestToken, 3000);

})();
