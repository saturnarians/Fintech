import axios, { AxiosInstance } from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * ============================================================================
 * LEARNING NOTE: AXIOS HTTP CLIENT FOR EXTERNAL NIBSS API
 * ============================================================================
 * Wraps Axios with automatic authentication header injection, timeout handling,
 * and error interception.
 */

@Injectable()
export class NibssHttpClient {
  private readonly client: AxiosInstance;
  private readonly logger = new Logger(NibssHttpClient.name);
  private token: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('NIBSS_BASE_URL', 'https://nibssbyphoenix.onrender.com');
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  public getRawClient(): AxiosInstance {
    return this.client;
  }

  public async setAuthToken(token: string, expiresInSeconds = 3600) {
    this.token = token;
    this.tokenExpiresAt = Date.now() + (expiresInSeconds - 60) * 1000;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  public async ensureAuthenticated(): Promise<string | null> {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    const apiKey = this.configService.get<string>('NIBSS_API_KEY');
    const apiSecret = this.configService.get<string>('NIBSS_API_SECRET');

    if (!apiKey || !apiSecret) {
      this.logger.warn('NIBSS_API_KEY or NIBSS_API_SECRET not set in environment.');
      return null;
    }

    try {
      const response = await this.client.post('/api/auth/token', {
        apiKey,
        apiSecret,
      });

      if (response.data && response.data.token) {
        await this.setAuthToken(response.data.token, 3600);
        return response.data.token;
      }
    } catch (error: any) {
      this.logger.error(`Failed to authenticate with NIBSS: ${error.message}`);
    }

    return null;
  }
}
