import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State for emojis
target_state = """  const [showEffect, setShowEffect] = useState<string | null>(null);"""
replace_state = """  const [showEffect, setShowEffect] = useState<string | null>(null);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string, pid: string, emoji: string }[]>([]);
  
  // Play sounds
  const playSound = (type: 'draw' | 'pair' | 'joker' | 'win') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === 'draw') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'pair') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else if (type === 'joker') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } else if (type === 'win') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch (e) {
      // Ignore audio errors
    }
  };"""

content = content.replace(target_state, replace_state)

# 2. Parse EMOJI from effect
target_effect = """        } else {
          setShowEffect(null);
        }
      } else {
        setShowEffect(effect);
      }"""

replace_effect = """        } else {
          setShowEffect(null);
        }
        if (effect.split('_')[1] === currentUser.uid) playSound('joker');
      } else if (effect.startsWith('EMOJI_')) {
        const parts = effect.split('_');
        const pid = parts[1];
        const emoji = parts[2];
        const id = Date.now() + Math.random().toString();
        setFloatingEmojis(prev => [...prev, { id, pid, emoji }]);
        setTimeout(() => {
          setFloatingEmojis(prev => prev.filter(e => e.id !== id));
        }, 2000);
      } else {
        setShowEffect(effect);
        if (effect === 'PAIR') playSound('pair');
        if (effect === 'ESCAPE') playSound('win');
      }"""
content = content.replace(target_effect, replace_effect)

# 3. Add sound to draw
target_draw = """    setDrawingState({ pid, cardIndex, timestamp: Date.now() });"""
replace_draw = """    playSound('draw');
    setDrawingState({ pid, cardIndex, timestamp: Date.now() });"""
content = content.replace(target_draw, replace_draw)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
