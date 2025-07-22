#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { AudioHandler } from './audio.js';

import type { NotifyParams, TaskCompletedParams, AudioConfig } from './types.js';

class NotificationServer {
  private server: Server;

  private audioHandler: AudioHandler;

  constructor() {
    // Parse command line arguments
    const config = this.parseArguments();

    this.audioHandler = new AudioHandler(config);

    this.server = new Server(
      {
        name: 'mcp-notify',
        version: '0.0.1',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    this.setupErrorHandling();
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();

    await this.server.connect(transport);
  }

  private parseArguments(): AudioConfig {
    const args = process.argv.slice(2);

    let customAudioPath: string | undefined;

    let enableAudio = true;

    let enableDesktopNotification = true;

    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '--audio':

        // eslint-disable-next-line no-fallthrough
        case '-a':
          customAudioPath = args[i + 1];

          i++; // Skip next argument as it's the audio path

          break;

        case '--no-audio':
          enableAudio = false;

          break;

        case '--no-notification':
          enableDesktopNotification = false;

          break;
      }
    }

    return {
      customAudioPath,
      enableAudio,
      enableDesktopNotification,
    };
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'notify',
          description: 'Show a notification with custom title and message',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Notification title',
              },
              message: {
                type: 'string',
                description: 'Notification message',
              },
              sound_type: {
                type: 'string',
                enum: ['success', 'error', 'info'],
                description: 'Type of sound to play',
                default: 'info',
              },
            },
            required: ['title', 'message'],
          },
        },
        {
          name: 'task_completed',
          description: 'Notify that a task has been completed',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Completion message',
              },
              sound_type: {
                type: 'string',
                enum: ['success', 'error', 'info'],
                description: 'Type of sound to play',
                default: 'success',
              },
            },
            required: ['message'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'notify':
            return await this.handleNotify(args as unknown as NotifyParams);

          case 'task_completed':
            return await this.handleTaskCompleted(args as unknown as TaskCompletedParams);

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        throw new McpError(ErrorCode.InternalError, errorMessage);
      }
    });
  }

  private async handleNotify(params: NotifyParams) {
    const { title, message, sound_type = 'info' } = params;

    try {
      // Add timeout to prevent hanging
      await Promise.race([
        this.audioHandler.showNotification(title, message),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Notification timeout')), 5000)
        ),
      ]);

      return {
        content: [
          {
            type: 'text',
            text: `Notification sent: "${title}: ${message}" with ${sound_type} sound`,
          },
        ],
      };
    } catch (error) {
      // Return success even if notification fails to avoid hanging
      return {
        content: [
          {
            type: 'text',
            text: `Notification attempted: "${title}: ${message}" (${error instanceof Error ? error.message : 'Unknown error'})`,
          },
        ],
      };
    }
  }

  private async handleTaskCompleted(params: TaskCompletedParams) {
    const { message, sound_type = 'success' } = params;

    try {
      // Add timeout to prevent hanging
      await Promise.race([
        this.audioHandler.showNotification('Task Completed', message),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Notification timeout')), 5000)
        ),
      ]);

      return {
        content: [
          {
            type: 'text',
            text: `Task completion notification sent: "${message}" with ${sound_type} sound`,
          },
        ],
      };
    } catch (error) {
      // Return success even if notification fails to avoid hanging
      return {
        content: [
          {
            type: 'text',
            text: `Task completion attempted: "${message}" (${error instanceof Error ? error.message : 'Unknown error'})`,
          },
        ],
      };
    }
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', () => {
      this.server
        .close()
        .then(() => {
          process.exit(0);
        })
        .catch(() => {
          process.exit(1);
        });
    });
  }
}

// Start the server
const server = new NotificationServer();

server.run().catch((error) => {
  console.error('Failed to start MCP server:', error);

  process.exit(1);
});
