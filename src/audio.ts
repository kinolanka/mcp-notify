import { spawn } from 'node:child_process';
import { access, constants } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import notifier from 'node-notifier';

import type { AudioConfig, AudioResult } from './types.js';

export class AudioHandler {
  private config: AudioConfig;

  private bundledAudioPath: string;

  constructor(config: AudioConfig) {
    this.config = config;

    // Get the path to the bundled audio file
    const __filename = fileURLToPath(import.meta.url);

    const __dirname = dirname(__filename);

    this.bundledAudioPath = join(__dirname, '..', 'assets', 'notification.wav');
  }

  async playSound(): Promise<AudioResult> {
    if (!this.config.enableAudio) {
      return {
        success: true,
        method: 'none',
      };
    }

    // Try custom audio file first if provided
    if (this.config.customAudioPath) {
      const customResult = await this.tryCustomAudio();

      if (customResult.success) {
        return customResult;
      }
    }

    // Fallback to bundled audio
    const bundledResult = await this.tryBundledAudio();

    if (bundledResult.success) {
      return bundledResult;
    }

    // All audio methods failed
    return {
      success: false,
      method: 'none',
      error: 'All audio playback methods failed',
    };
  }

  async showNotification(title: string, message: string): Promise<void> {
    if (!this.config.enableDesktopNotification) {
      return;
    }

    // Play sound first
    await this.playSound();

    // Show desktop notification
    return new Promise((resolve) => {
      notifier.notify(
        {
          title,
          message,
          sound: false, // We handle sound ourselves
          wait: false,
        },
        (error) => {
          if (error) {
            // Log the error but don't reject, to avoid hanging
            console.error('Notification error:', error);
          }

          // Always resolve to prevent the tool call from hanging
          resolve();
        }
      );
    });
  }

  private async tryCustomAudio(): Promise<AudioResult> {
    if (!this.config.customAudioPath) {
      return { success: false, method: 'paplay', error: 'No custom audio path provided' };
    }

    try {
      // Check if file exists
      await access(this.config.customAudioPath, constants.R_OK);

      // Try to play with paplay (WSL/Linux)
      return await this.playWithPaplay(this.config.customAudioPath, 'paplay');
    } catch (error) {
      return {
        success: false,
        method: 'paplay',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async tryBundledAudio(): Promise<AudioResult> {
    try {
      // Check if bundled file exists
      await access(this.bundledAudioPath, constants.R_OK);

      // Try to play with paplay (WSL/Linux)
      return await this.playWithPaplay(this.bundledAudioPath, 'bundled-audio');
    } catch (error) {
      return {
        success: false,
        method: 'bundled-audio',
        error: error instanceof Error ? error.message : 'Bundled audio not found or accessible',
      };
    }
  }

  private playWithPaplay(
    audioPath: string,
    method: 'paplay' | 'bundled-audio'
  ): Promise<AudioResult> {
    return new Promise((resolve) => {
      const paplay = spawn('paplay', [audioPath], {
        stdio: 'ignore',
      });

      const timeout = setTimeout(() => {
        paplay.kill();

        resolve({
          success: false,
          method,
          error: 'Timeout - paplay took too long',
        });
      }, 5000); // 5 second timeout

      paplay.on('close', (code) => {
        clearTimeout(timeout);

        if (code === 0) {
          resolve({ success: true, method });
        } else {
          resolve({
            success: false,
            method,
            error: `paplay exited with code ${code}`,
          });
        }
      });

      paplay.on('error', (error) => {
        clearTimeout(timeout);

        resolve({
          success: false,
          method,
          error: error.message,
        });
      });
    });
  }
}
