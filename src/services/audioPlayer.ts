import { Audio, AVPlaybackStatus } from 'expo-av';

// Map of bundled audio assets
const STATIC_AUDIO_ASSETS: Record<string, any> = {
  'scenario_1.mp3': require('../../assets/audio/scenario_1.mp3'),
  'scenario_2.mp3': require('../../assets/audio/scenario_2.mp3'),
  'scenario_3.mp3': require('../../assets/audio/scenario_3.mp3'),
  'assets/audio/scenario_1.mp3': require('../../assets/audio/scenario_1.mp3'),
  'assets/audio/scenario_2.mp3': require('../../assets/audio/scenario_2.mp3'),
  'assets/audio/scenario_3.mp3': require('../../assets/audio/scenario_3.mp3'),
};

let currentSound: Audio.Sound | null = null;
let currentSoundId: string | null = null;

/**
 * Initializes the audio subsystem for classroom playback.
 */
export async function setupAudioMode(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (err) {
    console.warn('[AudioPlayer] Failed to set audio mode:', err);
  }
}

/**
 * Plays an audio asset or remote URI using expo-av.
 * Stops any existing playback before starting a new track.
 */
export async function playAudio(
  source: string,
  onPlaybackFinished?: () => void,
  onError?: (err: any) => void
): Promise<Audio.Sound | null> {
  try {
    // 1. Stop and unload any previous sound
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
    } else if (cleanSource.startsWith('http://') || cleanSource.startsWith('https://') || cleanSource.startsWith('file://')) {
      soundSource = { uri: cleanSource };
    } else {
      // Fallback default
      soundSource = STATIC_AUDIO_ASSETS['scenario_1.mp3'];
    }

    const { sound } = await Audio.Sound.createAsync(
      soundSource,
      { shouldPlay: true },
      (status: AVPlaybackStatus) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            currentSound = null;
            currentSoundId = null;
            sound.unloadAsync().catch(() => {});
            if (onPlaybackFinished) {
              onPlaybackFinished();
            }
          }
        } else if (status.error) {
          console.warn('[AudioPlayer] Playback error:', status.error);
          if (onError) onError(status.error);
        }
      }
    );

    currentSound = sound;
    currentSoundId = source;
    return sound;
  } catch (err) {
    console.warn('[AudioPlayer] Failed to play audio:', err);
    if (onError) onError(err);
    return null;
  }
}

/**
 * Stops and unloads the current playing sound.
 */
export async function stopAudio(): Promise<void> {
  try {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    }
  } catch (err) {
    // Ignored if already stopped or unloaded
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
