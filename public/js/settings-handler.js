// Global Settings Handler
const SettingsManager = {
    init() {
        this.loadSettings();
        this.applySettings();
        this.setupEventListeners();
    },

    // Load all saved settings
    loadSettings() {
        this.settings = {
            darkMode: localStorage.getItem('darkMode') === 'true',
            brightness: localStorage.getItem('brightness') || '100',
            volume: localStorage.getItem('volume') || '50'
        };
    },

    // Apply settings to current page
    applySettings() {
        // Apply Dark Mode
        if (this.settings.darkMode) {
            document.body.classList.add('dark-mode');
        }

        // Apply Brightness
        document.body.style.filter = `brightness(${this.settings.brightness}%)`;

        // Apply Volume (if audio context exists)
        this.setupAudioContext();
    },

    // Setup Audio Context for volume control
    setupAudioContext() {
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            if (!window.audioContext) {
                window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                window.gainNode = audioContext.createGain();
                window.gainNode.connect(audioContext.destination);
            }
            window.gainNode.gain.value = this.settings.volume / 100;
        }
    },

    // Update a specific setting
    updateSetting(key, value) {
        this.settings[key] = value;
        localStorage.setItem(key, value);
        this.applySettings();
        this.notifyChange(key, value);
    },

    // Setup event listeners for settings changes
    setupEventListeners() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'darkMode' || e.key === 'brightness' || e.key === 'volume') {
                this.loadSettings();
                this.applySettings();
            }
        });

        // Listen for custom settings change events
        window.addEventListener('settingsChanged', (e) => {
            const { key, value } = e.detail;
            this.updateSetting(key, value);
        });
    },

    // Notify other tabs/windows about settings changes
    notifyChange(key, value) {
        const event = new CustomEvent('settingsChanged', {
            detail: { key, value }
        });
        window.dispatchEvent(event);
    },

    // Toggle dark mode
    toggleDarkMode() {
        this.updateSetting('darkMode', !this.settings.darkMode);
        return this.settings.darkMode;
    },

    // Update brightness
    setBrightness(value) {
        this.updateSetting('brightness', value);
    },

    // Update volume
    setVolume(value) {
        this.updateSetting('volume', value);
    }
};

// Initialize settings when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    SettingsManager.init();

    // Update UI elements if they exist
    const darkModeToggle = document.getElementById('darkModeToggle');
    const brightnessSlider = document.getElementById('brightnessSlider');
    const volumeSlider = document.getElementById('volumeSlider');

    if (darkModeToggle) {
        darkModeToggle.checked = SettingsManager.settings.darkMode;
        darkModeToggle.addEventListener('change', () => {
            SettingsManager.toggleDarkMode();
        });
    }

    if (brightnessSlider) {
        brightnessSlider.value = SettingsManager.settings.brightness;
        brightnessSlider.addEventListener('input', (e) => {
            SettingsManager.setBrightness(e.target.value);
        });
    }

    if (volumeSlider) {
        volumeSlider.value = SettingsManager.settings.volume;
        volumeSlider.addEventListener('input', (e) => {
            SettingsManager.setVolume(e.target.value);
        });
    }
}); 