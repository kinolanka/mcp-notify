export interface NotifyParams {
  title: string;
  message: string;
  sound_type?: 'success' | 'error' | 'info';
}

export interface TaskCompletedParams {
  message: string;
  sound_type?: 'success' | 'error' | 'info';
}

export interface AudioConfig {
  customAudioPath?: string | undefined;
  enableAudio: boolean;
  enableDesktopNotification: boolean;
}

export interface AudioResult {
  success: boolean;
  method: 'paplay' | 'bundled-audio' | 'none';
  error?: string;
}

export type SoundType = 'success' | 'error' | 'info';
