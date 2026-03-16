
const SOUNDS = {
  solve: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  fail: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  tick: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  door: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3',
  hint: 'https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3',
  clear: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
  gameover: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3',
};

class SoundManager {
  private audios: Record<string, HTMLAudioElement> = {};
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      Object.entries(SOUNDS).forEach(([key, url]) => {
        const audio = new Audio(url);
        audio.preload = 'auto';
        this.audios[key] = audio;
      });
    }
  }

  play(key: keyof typeof SOUNDS) {
    if (!this.enabled || !this.audios[key]) return;
    
    const audio = this.audios[key];
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Autoplay might be blocked until user interaction
    });
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const soundManager = new SoundManager();
