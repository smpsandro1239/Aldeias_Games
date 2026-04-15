/**
 * Motor de Som Processual - Web Audio API
 * Gera efeitos sonoros em tempo real sem dependências externas
 */

// Tipos de sons disponíveis
export type SoundType = 
  | 'click' 
  | 'success' 
  | 'error' 
  | 'win' 
  | 'scratch' 
  | 'notification' 
  | 'hover';

// Configurações de som
interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType | 'noise';
  volume: number;
  fadeOut?: boolean;
}

// Configurações para cada tipo de som
const soundConfigs: Record<SoundType, SoundConfig> = {
  click: {
    frequency: 800,
    duration: 0.05,
    type: 'sine',
    volume: 0.3,
  },
  success: {
    frequency: 600,
    duration: 0.15,
    type: 'sine',
    volume: 0.4,
    fadeOut: true,
  },
  error: {
    frequency: 200,
    duration: 0.2,
    type: 'sawtooth',
    volume: 0.3,
    fadeOut: true,
  },
  win: {
    frequency: 880,
    duration: 0.5,
    type: 'sine',
    volume: 0.5,
    fadeOut: true,
  },
  scratch: {
    frequency: 100,
    duration: 0.02,
    type: 'noise',
    volume: 0.2,
  },
  notification: {
    frequency: 500,
    duration: 0.1,
    type: 'sine',
    volume: 0.3,
  },
  hover: {
    frequency: 400,
    duration: 0.03,
    type: 'sine',
    volume: 0.1,
  },
};

// Estado global
let audioContext: AudioContext | null = null;
let soundsEnabled = true;

/**
 * Inicializar AudioContext (deve ser chamado após interação do utilizador)
 */
export function initAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Verificar se áudio está habilitado
 */
export function isAudioEnabled(): boolean {
  return soundsEnabled;
}

/**
 * Ativar/desativar sons
 */
export function toggleSounds(enabled?: boolean): boolean {
  soundsEnabled = enabled !== undefined ? enabled : !soundsEnabled;
  return soundsEnabled;
}

/**
 * Criar oscilador de ruído branco (para efeito de raspadinha)
 */
function createNoiseBuffer(context: AudioContext): AudioBuffer {
  const bufferSize = context.sampleRate * 2; // 2 segundos de ruído
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const output = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

/**
 * Tocar som processual
 */
export function playSound(type: SoundType): void {
  if (!soundsEnabled) return;

  try {
    const context = initAudioContext();
    const config = soundConfigs[type];

    // Criar nós de áudio
    const gainNode = context.createGain();
    gainNode.connect(context.destination);

    // Configurar volume
    gainNode.gain.setValueAtTime(config.volume, context.currentTime);

    if (config.type === 'noise') {
      // Ruído branco para efeito de raspadinha
      const buffer = createNoiseBuffer(context);
      const noise = context.createBufferSource();
      noise.buffer = buffer;
      
      // Filtro para suavizar o ruído
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = config.frequency;
      
      noise.connect(filter);
      filter.connect(gainNode);
      
      noise.start();
      noise.stop(context.currentTime + config.duration);
    } else {
      // Oscilador para tons musicais
      const oscillator = context.createOscillator();
      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, context.currentTime);
      
      oscillator.connect(gainNode);
      
      oscillator.start();
      oscillator.stop(context.currentTime + config.duration);
    }

    // Fade out suave
    if (config.fadeOut) {
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        context.currentTime + config.duration
      );
    } else {
      gainNode.gain.setValueAtTime(0, context.currentTime + config.duration);
    }
  } catch (error) {
    console.warn('Erro ao tocar som:', error);
  }
}

/**
 * Tocar sequência de sons (melodia)
 */
export function playSequence(notes: { frequency: number; duration: number }[]): void {
  if (!soundsEnabled) return;

  try {
    const context = initAudioContext();
    let currentTime = context.currentTime;

    notes.forEach((note) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(note.frequency, currentTime);

      gainNode.gain.setValueAtTime(0.3, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + note.duration);

      currentTime += note.duration;
    });
  } catch (error) {
    console.warn('Erro ao tocar sequência:', error);
  }
}

/**
 * Tocar som de vitória (fanfarra)
 */
export function playWinSound(): void {
  if (!soundsEnabled) return;

  const winNotes = [
    { frequency: 523.25, duration: 0.1 }, // C5
    { frequency: 659.25, duration: 0.1 }, // E5
    { frequency: 783.99, duration: 0.1 }, // G5
    { frequency: 1046.50, duration: 0.3 }, // C6
  ];

  playSequence(winNotes);
}

/**
 * Tocar som de erro
 */
export function playErrorSound(): void {
  playSound('error');
}

/**
 * Tocar som de sucesso
 */
export function playSuccessSound(): void {
  playSound('success');
}

/**
 * Tocar som de raspadinha
 */
export function playScratchSound(): void {
  playSound('scratch');
}

/**
 * Pré-carregar contexto de áudio (chamar após interação do utilizador)
 */
export function preloadAudio(): void {
  initAudioContext();
}
