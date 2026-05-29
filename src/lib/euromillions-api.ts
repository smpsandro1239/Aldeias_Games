import { zonedTimeToUtc } from 'date-fns-tz';

// Interface for EuroMillions draw data
export interface EuromillionsDraw {
  drawDate: string; // ISO date string
  mainNumbers: number[]; // 5 numbers from 1-50
  luckyStars: number[]; // 2 numbers from 1-12
  jackpot?: string;
  // Add other fields as needed
}

/**
 * Service to fetch latest EuroMillions draw results from a free API
 */
class EuromillionsApiService {
  private static instance: EuromillionsApiService;
  private readonly API_URL = 'https://api.lotterytools.com/v1/euromillions/results';
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache
  private lastFetch: number = 0;
  private cachedDraw: EuromillionsDraw | null = null;

  private constructor() {}

  public static getInstance(): EuromillionsApiService {
    if (!EuromillionsApiService.instance) {
      EuromillionsApiService.instance = new EuromillionsApiService();
    }
    return EuromillionsApiService.instance;
  }

  /**
   * Fetches the latest EuroMillions draw
   * Uses caching to avoid excessive API calls
   */
  public async fetchLatestDraw(): Promise<EuromillionsDraw> {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (this.cachedDraw && (now - this.lastFetch) < this.CACHE_DURATION_MS) {
      return this.cachedDraw;
    }

    try {
      const response = await fetch(`${this.API_URL}?drawCount=1`, {
        timeout: 8000,
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`EuroMillions API returned ${response.status}`);
      }

      const data = await response.json();
      
      // Parse the API response format (adjust based on actual API response)
      // Assuming format: { data: [{ drawDate: string, mainNumbers: [n1,n2,n3,n4,n5], luckyStars: [s1,s2] }] }
      const drawData = Array.isArray(data) ? data[0] : 
                      (data.data && Array.isArray(data.data) ? data.data[0] : data);

      if (!drawData || !drawData.mainNumbers || drawData.mainNumbers.length < 1) {
        throw new Error('Invalid EuroMillions data received');
      }

      const draw: EuromillionsDraw = {
        drawDate: drawData.drawDate || new Date().toISOString(),
        mainNumbers: drawData.mainNumbers.slice(0, 5).map(n => Number(n)),
        luckyStars: drawData.luckyStars ? drawData.luckyStars.slice(0, 2).map(n => Number(n)) : [],
        jackpot: drawData.jackpot || undefined,
      };

      // Validate numbers are in expected ranges
      if (draw.mainNumbers.some(n => n < 1 || n > 50)) {
        throw new Error('EuroMillions main numbers out of range (1-50)');
      }
      if (draw.luckyStars.some(n => n < 1 || n > 12)) {
        throw new Error('EuroMillions lucky stars out of range (1-12)');
      }

      // Update cache
      this.cachedDraw = draw;
      this.lastFetch = now;

      console.log('[EuromillionsAPI] Fetched latest draw:', draw);
      return draw;

    } catch (error) {
      console.error('[EuromillionsAPI] Failed to fetch EuroMillions draw:', error);
      
      // If we have cached data (even if stale), return it rather than failing completely
      if (this.cachedDraw) {
        console.warn('[EuromillionsAPI] Returning stale cached data due to fetch error');
        return this.cachedDraw;
      }
      
      // If no cached data, throw the error
      throw error;
    }
  }

  /**
   * Gets the first main number from the latest EuroMillions draw
   * This is the number we'll use for Tombola winning number
   */
  public async getFirstMainNumber(): Promise<number> {
    const draw = await this.fetchLatestDraw();
    return draw.mainNumbers[0];
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  public void clearCache() {
    this.cachedDraw = null;
    this.lastFetch = 0;
  }

  /**
   * Get cache info for monitoring
   */
  public getCacheInfo() {
    const now = Date.now();
    return {
      hasCachedData: !!this.cachedDraw,
      cacheAgeMs: this.lastFetch > 0 ? now - this.lastFetch : Infinity,
      isCacheFresh: this.lastFetch > 0 && (now - this.lastFetch) < this.CACHE_DURATION_MS,
      lastFetch: this.lastFetch > 0 ? new Date(this.lastFetch) : null,
    };
  }
}

// Export singleton instance
export const euromillionsApiService = EuromillionsApiService.getInstance();