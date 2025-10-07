import { gsap } from 'gsap';

/**
 * AI Bot Modal - Interactive voice assistant for onboarding
 * Similar to ElevenLabs demo on their website
 */
export class AIBotModal {
  constructor(elevenLabsService) {
    this.elevenLabsService = elevenLabsService;
    this.modalElement = null;
    this.isVisible = false;
    this.currentAudio = null;
    this.onboardingStep = 0;

    this.onboardingMessages = [
      {
        text: "Welcome to Pig Rider! I'm your AI guide.",
        duration: 3000
      },
      {
        text: "Your goal is to collect 500 coins while riding a pig through obstacles.",
        duration: 4000
      },
      {
        text: "Tap or click to make your pig jump. Timing is everything!",
        duration: 4000
      },
      {
        text: "Look out for special Mellow boosters - they'll give you a speed boost!",
        duration: 4000
      },
      {
        text: "Ready to ride? Let's go!",
        duration: 3000
      }
    ];

    this.createModal();
  }

  /**
   * Create modal HTML structure
   */
  createModal() {
    const modal = document.createElement('div');
    modal.id = 'ai-bot-modal';
    modal.className = 'ai-bot-modal hidden';
    modal.innerHTML = `
      <div class="ai-bot-overlay"></div>
      <div class="ai-bot-content">
        <div class="ai-bot-header">
          <div class="ai-bot-avatar">
            <div class="ai-bot-avatar-circle">
              <svg class="ai-bot-waveform" viewBox="0 0 100 40" preserveAspectRatio="none">
                <path class="waveform-path" d="M0,20 L100,20" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </div>
          </div>
          <h2 class="ai-bot-title">AI Guide</h2>
          <button class="ai-bot-close" aria-label="Close">×</button>
        </div>

        <div class="ai-bot-body">
          <div class="ai-bot-message-container">
            <p class="ai-bot-message"></p>
            <div class="ai-bot-typing hidden">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          <!-- Demo/Test Voice Section (like ElevenLabs website) -->
          <div class="ai-bot-demo-section">
            <h3>Try the AI Voice</h3>
            <div class="ai-bot-demo-controls">
              <textarea
                class="ai-bot-demo-input"
                placeholder="Type something for the AI to say..."
                maxlength="500"
              >Hello! Welcome to the game.</textarea>
              <div class="ai-bot-demo-actions">
                <select class="ai-bot-voice-select">
                  <option value="">Loading voices...</option>
                </select>
                <button class="ai-bot-demo-play">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6 4l10 6-10 6z"/>
                  </svg>
                  Generate Speech
                </button>
              </div>
            </div>
          </div>

          <!-- Voice Settings -->
          <div class="ai-bot-settings">
            <details class="ai-bot-settings-details">
              <summary>Voice Settings</summary>
              <div class="ai-bot-settings-content">
                <div class="ai-bot-setting">
                  <label>
                    <span>Stability</span>
                    <input type="range" class="ai-bot-stability" min="0" max="100" value="50">
                    <span class="ai-bot-setting-value">0.5</span>
                  </label>
                </div>
                <div class="ai-bot-setting">
                  <label>
                    <span>Similarity</span>
                    <input type="range" class="ai-bot-similarity" min="0" max="100" value="75">
                    <span class="ai-bot-setting-value">0.75</span>
                  </label>
                </div>
              </div>
            </details>
          </div>
        </div>

        <div class="ai-bot-footer">
          <div class="ai-bot-progress">
            <div class="ai-bot-progress-bar"></div>
          </div>
          <div class="ai-bot-actions">
            <button class="ai-bot-skip">Skip Intro</button>
            <button class="ai-bot-next">Next</button>
            <button class="ai-bot-start hidden">Start Game</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalElement = modal;

    this.bindEvents();
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Close button
    const closeBtn = this.modalElement.querySelector('.ai-bot-close');
    closeBtn.addEventListener('click', () => this.hide());

    // Skip button
    const skipBtn = this.modalElement.querySelector('.ai-bot-skip');
    skipBtn.addEventListener('click', () => this.skipOnboarding());

    // Next button
    const nextBtn = this.modalElement.querySelector('.ai-bot-next');
    nextBtn.addEventListener('click', () => this.nextStep());

    // Start button
    const startBtn = this.modalElement.querySelector('.ai-bot-start');
    startBtn.addEventListener('click', () => this.startGame());

    // Demo play button
    const playBtn = this.modalElement.querySelector('.ai-bot-demo-play');
    playBtn.addEventListener('click', () => this.playDemoText());

    // Voice select
    const voiceSelect = this.modalElement.querySelector('.ai-bot-voice-select');
    voiceSelect.addEventListener('change', (e) => {
      this.elevenLabsService.setVoice(e.target.value);
    });

    // Settings sliders
    const stabilitySlider = this.modalElement.querySelector('.ai-bot-stability');
    stabilitySlider.addEventListener('input', (e) => {
      const value = e.target.value / 100;
      e.target.parentElement.querySelector('.ai-bot-setting-value').textContent = value.toFixed(2);
    });

    const similaritySlider = this.modalElement.querySelector('.ai-bot-similarity');
    similaritySlider.addEventListener('input', (e) => {
      const value = e.target.value / 100;
      e.target.parentElement.querySelector('.ai-bot-setting-value').textContent = value.toFixed(2);
    });
  }

  /**
   * Initialize modal with voices
   */
  async init() {
    await this.loadVoices();
  }

  /**
   * Load available voices into select
   */
  async loadVoices() {
    const voiceSelect = this.modalElement.querySelector('.ai-bot-voice-select');
    const voices = this.elevenLabsService.getVoices();

    if (voices.length === 0) {
      voiceSelect.innerHTML = '<option value="">No voices available</option>';
      return;
    }

    voiceSelect.innerHTML = voices.map(voice =>
      `<option value="${voice.voice_id}">${voice.name}</option>`
    ).join('');

    // Select current voice
    if (this.elevenLabsService.currentVoiceId) {
      voiceSelect.value = this.elevenLabsService.currentVoiceId;
    }
  }

  /**
   * Show modal with animation
   */
  show() {
    this.isVisible = true;
    this.onboardingStep = 0;
    this.modalElement.classList.remove('hidden');

    // Animate in
    gsap.fromTo(
      this.modalElement.querySelector('.ai-bot-overlay'),
      { opacity: 0 },
      { opacity: 1, duration: 0.3 }
    );

    gsap.fromTo(
      this.modalElement.querySelector('.ai-bot-content'),
      { opacity: 0, y: 50, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.2)' }
    );

    // Start onboarding
    this.startOnboarding();
  }

  /**
   * Hide modal with animation
   */
  hide() {
    this.isVisible = false;

    // Stop any playing audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    gsap.to(this.modalElement.querySelector('.ai-bot-overlay'), {
      opacity: 0,
      duration: 0.2
    });

    gsap.to(this.modalElement.querySelector('.ai-bot-content'), {
      opacity: 0,
      y: 30,
      scale: 0.95,
      duration: 0.3,
      onComplete: () => {
        this.modalElement.classList.add('hidden');
      }
    });
  }

  /**
   * Start onboarding sequence
   */
  async startOnboarding() {
    await this.showMessage(this.onboardingMessages[0]);
  }

  /**
   * Show next onboarding step
   */
  async nextStep() {
    this.onboardingStep++;

    if (this.onboardingStep >= this.onboardingMessages.length) {
      this.completeOnboarding();
      return;
    }

    this.updateProgress();
    await this.showMessage(this.onboardingMessages[this.onboardingStep]);
  }

  /**
   * Show message with voice
   */
  async showMessage(message) {
    const messageEl = this.modalElement.querySelector('.ai-bot-message');
    const typingEl = this.modalElement.querySelector('.ai-bot-typing');

    // Show typing indicator
    typingEl.classList.remove('hidden');
    messageEl.textContent = '';

    // Animate waveform
    this.animateWaveform(true);

    try {
      // Generate and play speech
      this.currentAudio = await this.elevenLabsService.playText(message.text);

      // Hide typing, show message
      setTimeout(() => {
        typingEl.classList.add('hidden');
        this.typeMessage(messageEl, message.text);
      }, 500);

      // Listen for audio end
      this.currentAudio.addEventListener('ended', () => {
        this.animateWaveform(false);
      });
    } catch (error) {
      console.error('Failed to play message:', error);
      // Show message anyway
      typingEl.classList.add('hidden');
      this.typeMessage(messageEl, message.text);
      this.animateWaveform(false);
    }
  }

  /**
   * Type message with animation
   */
  typeMessage(element, text, speed = 30) {
    let index = 0;

    const type = () => {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
        setTimeout(type, speed);
      }
    };

    type();
  }

  /**
   * Animate waveform
   */
  animateWaveform(animate = true) {
    const waveformPath = this.modalElement.querySelector('.waveform-path');

    if (animate) {
      // Create animated waveform
      gsap.to(waveformPath, {
        attr: {
          d: 'M0,20 Q25,5 50,20 T100,20'
        },
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    } else {
      // Reset to flat line
      gsap.to(waveformPath, {
        attr: {
          d: 'M0,20 L100,20'
        },
        duration: 0.3
      });
    }
  }

  /**
   * Update progress bar
   */
  updateProgress() {
    const progressBar = this.modalElement.querySelector('.ai-bot-progress-bar');
    const progress = ((this.onboardingStep + 1) / this.onboardingMessages.length) * 100;

    gsap.to(progressBar, {
      width: `${progress}%`,
      duration: 0.3,
      ease: 'power2.out'
    });
  }

  /**
   * Complete onboarding
   */
  completeOnboarding() {
    const nextBtn = this.modalElement.querySelector('.ai-bot-next');
    const startBtn = this.modalElement.querySelector('.ai-bot-start');

    nextBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');

    this.updateProgress();
  }

  /**
   * Skip onboarding
   */
  skipOnboarding() {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }

    this.hide();
    this.onComplete?.();
  }

  /**
   * Start game
   */
  startGame() {
    this.hide();
    this.onComplete?.();
  }

  /**
   * Play demo text
   */
  async playDemoText() {
    const demoInput = this.modalElement.querySelector('.ai-bot-demo-input');
    const playBtn = this.modalElement.querySelector('.ai-bot-demo-play');
    const stabilitySlider = this.modalElement.querySelector('.ai-bot-stability');
    const similaritySlider = this.modalElement.querySelector('.ai-bot-similarity');

    const text = demoInput.value.trim();

    if (!text) {
      return;
    }

    // Disable button
    playBtn.disabled = true;
    playBtn.innerHTML = `
      <svg class="spinning" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
        <circle cx="10" cy="10" r="8" stroke-width="2" stroke-dasharray="50 50" />
      </svg>
      Generating...
    `;

    this.animateWaveform(true);

    try {
      const options = {
        stability: parseFloat(stabilitySlider.value) / 100,
        similarityBoost: parseFloat(similaritySlider.value) / 100
      };

      const audio = await this.elevenLabsService.playText(text, options);

      audio.addEventListener('ended', () => {
        this.animateWaveform(false);
      });
    } catch (error) {
      console.error('Failed to play demo:', error);
      alert('Failed to generate speech. Please check your API key.');
      this.animateWaveform(false);
    } finally {
      // Re-enable button
      playBtn.disabled = false;
      playBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6 4l10 6-10 6z"/>
        </svg>
        Generate Speech
      `;
    }
  }

  /**
   * Set completion callback
   */
  onComplete(callback) {
    this.onComplete = callback;
  }

  /**
   * Destroy modal
   */
  destroy() {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }

    if (this.modalElement) {
      this.modalElement.remove();
    }
  }
}
