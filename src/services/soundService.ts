export class SoundService {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    this.loadSounds();
    this.loadSettings();
  }

  private loadSounds() {
    const soundFiles = {
      flip: '/sounds/coin-flip.wav',
      win: '/sounds/win.wav', 
      lose: '/sounds/lose.wav',
      click: '/sounds/click.wav'
    };

    Object.entries(soundFiles).forEach(([name, path]) => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = this.volume;
      
      // Create a simple beep sound programmatically since we don't have actual files
      this.createBeepSound(name, audio);
      this.sounds.set(name, audio);
    });
  }

  private createBeepSound(type: string, audio: HTMLAudioElement) {
    // Create different frequency beeps for different sound types
    const frequencies: { [key: string]: number } = {
      flip: 440,
      win: 523.25, // C5
      lose: 220,   // A3
      click: 880   // A5
    };

    const frequency = frequencies[type] || 440;
    
    // Create AudioContext for programmatic sound generation
    if (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined') {
      try {
        const audioContext = new (AudioContext || (window as any).webkitAudioContext)();
        
        audio.addEventListener('play', () => {
          if (!this.enabled) return;
          
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = frequency;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        });
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }
  }

  private loadSettings() {
    const savedEnabled = localStorage.getItem('sound-enabled');
    const savedVolume = localStorage.getItem('sound-volume');
    
    if (savedEnabled !== null) {
      this.enabled = JSON.parse(savedEnabled);
    }
    
    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume);
    }
  }

  private saveSettings() {
    localStorage.setItem('sound-enabled', JSON.stringify(this.enabled));
    localStorage.setItem('sound-volume', this.volume.toString());
  }

  play(soundName: string) {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.currentTime = 0;
      sound.volume = this.volume;
      sound.play().catch(console.warn);
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.saveSettings();
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.volume = this.volume;
    });
    this.saveSettings();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getVolume(): number {
    return this.volume;
  }
}

export const soundService = new SoundService();