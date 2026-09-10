import { useState, useEffect, useCallback, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import * as vosk from 'react-native-vosk';

export interface UseVoskReturn {
  isLoaded: boolean;
  isRecognizing: boolean;
  result: string | null;
  partialResult: string | null;
  error: any | null;
  loadModel: (modelPath: string) => Promise<boolean>;
  start: (options?: any) => Promise<boolean>;
  stop: () => Promise<void>;
  unload: () => Promise<void>;
  requestMicrophonePermission: () => Promise<boolean>;
}

/**
 * Requests microphone record audio permission at runtime on Android.
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'ShikshaSetu needs access to your microphone for speech recognition.',
        buttonNeutral: 'Ask Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('[useVosk] Error requesting mic permission:', err);
    return false;
  }
}

/**
 * Custom hook wrapping react-native-vosk for offline speech recognition.
 */
export function useVosk(): UseVoskReturn {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [partialResult, setPartialResult] = useState<string | null>(null);
  const [error, setError] = useState<any | null>(null);

  const isMountedRef = useRef<boolean>(true);

  const loadModel = useCallback(async (modelPath: string): Promise<boolean> => {
    try {
      console.log(`[useVosk] Loading model from path: ${modelPath}`);
      await vosk.loadModel(modelPath);
      if (isMountedRef.current) {
        setIsLoaded(true);
        setError(null);
      }
      return true;
    } catch (err) {
      console.warn('[useVosk] Failed to load model:', err);
      if (isMountedRef.current) {
        setError(err);
      }
      return false;
    }
  }, []);

  const start = useCallback(async (options?: any): Promise<boolean> => {
    try {
      setError(null);
      // Reset previous results for new recognition session
      setResult(null);
      setPartialResult(null);

      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        const permErr = new Error('Microphone permission denied');
        console.warn('[useVosk] Cannot start recognition: permission denied');
        if (isMountedRef.current) setError(permErr);
        return false;
      }

      await vosk.start(options);
      if (isMountedRef.current) {
        setIsRecognizing(true);
      }
      return true;
    } catch (err) {
      console.warn('[useVosk] Failed to start recognition:', err);
      if (isMountedRef.current) {
        setError(err);
        setIsRecognizing(false);
      }
      return false;
    }
  }, []);

  const stop = useCallback(async (): Promise<void> => {
    try {
      vosk.stop();
      if (isMountedRef.current) {
        setIsRecognizing(false);
      }
    } catch (err) {
      console.warn('[useVosk] Failed to stop recognition:', err);
      if (isMountedRef.current) {
        setError(err);
      }
    }
  }, []);

  const unload = useCallback(async (): Promise<void> => {
    try {
      vosk.unload();
      if (isMountedRef.current) {
        setIsLoaded(false);
        setIsRecognizing(false);
      }
    } catch (err) {
      console.warn('[useVosk] Failed to unload model:', err);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const resultSub = vosk.onResult((res: string) => {
      console.log('[useVosk] onResult:', res);
      if (isMountedRef.current && res) {
        setResult(res);
      }
    });

    const finalResultSub = vosk.onFinalResult((res: string) => {
      console.log('[useVosk] onFinalResult:', res);
      if (isMountedRef.current && res) {
        setResult(res);
      }
    });

    const partialSub = vosk.onPartialResult((res: string) => {
      if (isMountedRef.current) {
        setPartialResult(res);
      }
    });

    const errorSub = vosk.onError((err: any) => {
      console.warn('[useVosk] onError:', err);
      if (isMountedRef.current) {
        setError(err);
        setIsRecognizing(false);
      }
    });

    const timeoutSub = vosk.onTimeout(() => {
      console.log('[useVosk] onTimeout');
      if (isMountedRef.current) {
        setIsRecognizing(false);
      }
    });

    return () => {
      isMountedRef.current = false;
      resultSub?.remove();
      finalResultSub?.remove();
      partialSub?.remove();
      errorSub?.remove();
      timeoutSub?.remove();
      try {
        vosk.stop();
      } catch (_) {}
    };
  }, []);

  return {
    isLoaded,
    isRecognizing,
    result,
    partialResult,
    error,
    loadModel,
    start,
    stop,
    unload,
    requestMicrophonePermission,
  };
}
