/**
 * ElevenLabs Text-to-Speech Service
 * Handles all interactions with ElevenLabs API for voice generation
 */

export class ElevenLabsService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    this.voices = [];
    this.currentVoiceId = null;
    this.audioCache = new Map();
  }

  /**
   * Initialize service and fetch available voices
   */
  async init() {
    try {
      await this.fetchVoices();

      // Set default voice (Rachel - friendly female voice)
      const defaultVoice = this.voices.find(v => v.name === 'Rachel') || this.voices[0];
      if (defaultVoice) {
        this.currentVoiceId = defaultVoice.voice_id;
      }

      console.log('✅ ElevenLabs service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize ElevenLabs:', error);
      return false;
    }
  }

  /**
   * Fetch available voices from ElevenLabs
   */
  async fetchVoices() {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      this.voices = data.voices || [];
      return this.voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  /**
   * Generate speech from text
   * @param {string} text - The text to convert to speech
   * @param {Object} options - Voice settings
   * @returns {Promise<Blob>} Audio blob
   */
  async generateSpeech(text, options = {}) {
    const voiceId = options.voiceId || this.currentVoiceId;

    if (!voiceId) {
      throw new Error('No voice selected');
    }

    // Check cache
    const cacheKey = `${voiceId}:${text}`;
    if (this.audioCache.has(cacheKey)) {
      console.log('🔊 Using cached audio');
      return this.audioCache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          body: JSON.stringify({
            text: text,
            model_id: options.modelId || 'eleven_multilingual_v2',
            voice_settings: {
              stability: options.stability ?? 0.5,
              similarity_boost: options.similarityBoost ?? 0.75,
              style: options.style ?? 0,
              use_speaker_boost: options.useSpeakerBoost ?? true
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.message || 'Failed to generate speech');
      }

      const audioBlob = await response.blob();

      // Cache the result
      this.audioCache.set(cacheKey, audioBlob);

      return audioBlob;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }

  /**
   * Stream speech from text (real-time)
   * @param {string} text - The text to convert to speech
   * @param {Function} onChunk - Callback for each audio chunk
   * @param {Object} options - Voice settings
   */
  async streamSpeech(text, onChunk, options = {}) {
    const voiceId = options.voiceId || this.currentVoiceId;

    if (!voiceId) {
      throw new Error('No voice selected');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          body: JSON.stringify({
            text: text,
            model_id: options.modelId || 'eleven_multilingual_v2',
            voice_settings: {
              stability: options.stability ?? 0.5,
              similarity_boost: options.similarityBoost ?? 0.75,
              style: options.style ?? 0,
              use_speaker_boost: options.useSpeakerBoost ?? true
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to stream speech: ${response.status}`);
      }

      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        if (onChunk) {
          onChunk(value);
        }
      }
    } catch (error) {
      console.error('Error streaming speech:', error);
      throw error;
    }
  }

  /**
   * Play text as speech
   * @param {string} text - The text to play
   * @param {Object} options - Voice settings
   * @returns {Promise<HTMLAudioElement>} Audio element
   */
  async playText(text, options = {}) {
    try {
      const audioBlob = await this.generateSpeech(text, options);
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);

      // Cleanup URL when audio ends
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });

      await audio.play();

      return audio;
    } catch (error) {
      console.error('Error playing text:', error);
      throw error;
    }
  }

  /**
   * Set current voice by ID or name
   */
  setVoice(voiceIdOrName) {
    const voice = this.voices.find(
      v => v.voice_id === voiceIdOrName || v.name === voiceIdOrName
    );

    if (voice) {
      this.currentVoiceId = voice.voice_id;
      return true;
    }

    return false;
  }

  /**
   * Get available voices
   */
  getVoices() {
    return this.voices;
  }

  /**
   * Clear audio cache
   */
  clearCache() {
    this.audioCache.clear();
  }
}
