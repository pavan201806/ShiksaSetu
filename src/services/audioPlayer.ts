import {
  createAudioPlayer,
  setAudioModeAsync,
  AudioPlayer,
  AudioStatus,
} from 'expo-audio';

// Map of bundled audio assets
const STATIC_AUDIO_ASSETS: Record<string, any> = {
  'scenario_1.mp3': require('../../assets/audio/scenario_1.mp3'),
  'scenario_2.mp3': require('../../assets/audio/scenario_2.mp3'),
  'scenario_3.mp3': require('../../assets/audio/scenario_3.mp3'),
  'assets/audio/scenario_1.mp3': require('../../assets/audio/scenario_1.mp3'),
  'assets/audio/scenario_2.mp3': require('../../assets/audio/scenario_2.mp3'),
  'assets/audio/scenario_3.mp3': require('../../assets/audio/scenario_3.mp3'),
};

let currentSound: AudioPlayer | null = null;
let currentSoundId: string | null = null;
let currentSubscription: { remove: () => void } | null = null;

/**
 * Initializes the audio subsystem for classroom playback.
 */
export async function setupAudioMode(): Promise<void> {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
      allowsRecording: false,
      shouldPlayInBackground: false,
    });
  } catch (err) {
    console.warn('[AudioPlayer] Failed to set audio mode:', err);
  }
}

/**
 * Plays an audio asset or remote URI using expo-audio.
 * Stops any existing playback before starting a new track.
 */
export async function playAudio(
  source: string,
  onPlaybackFinished?: () => void,
  onError?: (err: any) => void
): Promise<AudioPlayer | null> {
  try {
    // 1. Stop and release any previous sound
    await stopAudio();

    await setupAudioMode();

    // 2. Resolve source
    let soundSource: any;
    const cleanSource = source.replace(/\\/g, '/');
    const filename = cleanSource.split('/').pop() || '';

    if (STATIC_AUDIO_ASSETS[cleanSource]) {
      soundSource = STATIC_AUDIO_ASSETS[cleanSource];
    } else if (STATIC_AUDIO_ASSETS[filename]) {
      soundSource = STATIC_AUDIO_ASSETS[filename];
    } else if (
      cleanSource.startsWith('http://') ||
      cleanSource.startsWith('https://') ||
      cleanSource.startsWith('file://')
    ) {
      soundSource = cleanSource;
    } else {
      // Fallback default
      soundSource = STATIC_AUDIO_ASSETS['scenario_1.mp3'];
    }

    const player = createAudioPlayer(soundSource);

    const subscription = player.addListener(
      'playbackStatusUpdate',
      (status: AudioStatus) => {
        if (status.didJustFinish) {
          if (currentSound === player) {
            currentSound = null;
            currentSoundId = null;
          }
          subscription.remove();
          try {
            player.remove();
          } catch {
            // Ignored
          }
          if (onPlaybackFinished) {
            onPlaybackFinished();
          }
        } else if (status.error) {
          console.warn('[AudioPlayer] Playback error:', status.error);
          if (onError) onError(status.error);
        }
      }
    );

    currentSubscription = subscription;
    currentSound = player;
    currentSoundId = source;

    player.play();
    return player;
  } catch (err) {
    console.warn('[AudioPlayer] Failed to play audio:', err);
    if (onError) onError(err);
    return null;
  }
}

/**
 * Stops and releases the current playing sound.
 */
export async function stopAudio(): Promise<void> {
  try {
    if (currentSubscription) {
      currentSubscription.remove();
      currentSubscription = null;
    }
    if (currentSound) {
      currentSound.pause();
      currentSound.remove();
    }
  } catch (err) {
    // Ignored if already stopped or removed
  } finally {
    currentSound = null;
    currentSoundId = null;
  }
}

/**
 * Checks if a specific track is currently playing.
 */
export function isTrackPlaying(source: string): boolean {
  if (!currentSound || !currentSoundId) return false;
  return currentSoundId === source || currentSoundId.endsWith(source);
}
