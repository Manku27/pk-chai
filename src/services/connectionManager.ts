/**
 * ConnectionManager for polling-based real-time order updates
 * 
 * This manager handles periodic polling of the orders API endpoint
 * to fetch new and updated orders for the admin dashboard.
 */

import type { OrderWithDetails } from '@/types/admin';

export interface ConnectionManagerConfig {
  pollingUrl: string;
  pollingInterval: number; // milliseconds
  onOrderUpdate: (orders: OrderWithDetails[]) => void;
  onError: (error: Error) => void;
}

export class ConnectionManager {
  private config: ConnectionManagerConfig;
  private pollingTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private lastFetchTime: Date | null = null;
  private operationalCheckTimer: NodeJS.Timeout | null = null;

  constructor(config: ConnectionManagerConfig) {
    this.config = config;
  }

  /**
   * Check if current time is within operational window (10 PM to 5 AM)
   * Requirement 6.6: Pause polling outside operational window
   * 
   * TEMPORARILY DISABLED FOR DEBUGGING - Always returns true
   */
  private isWithinOperationalHours(): boolean {
    const now = new Date();
    const hours = now.getHours();
    
    // Operational window: 22:00 (10 PM) to 05:00 (5 AM)
    // This spans midnight, so we check if hours >= 22 OR hours < 5
    const withinHours = hours >= 22 || hours < 5;
    
    console.log('[ConnectionManager] Current hour:', hours, 'Within operational hours:', withinHours);
    
    // TEMPORARY: Always return true for debugging
    return true;
    
    // Original logic (commented out for debugging):
    // return hours >= 22 || hours < 5;
  }

  /**
   * Start the polling mechanism
   * Requirement 6.6: Only poll during operational hours (10 PM to 5 AM)
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[ConnectionManager] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[ConnectionManager] Started with polling mode');
    console.log('[ConnectionManager] Polling interval:', this.config.pollingInterval, 'ms');
    console.log('[ConnectionManager] Polling URL:', this.config.pollingUrl);
    
    // Check operational hours and fetch if within window
    const withinHours = this.isWithinOperationalHours();
    console.log('[ConnectionManager] Within operational hours:', withinHours);
    
    if (withinHours) {
      console.log('[ConnectionManager] Starting immediate fetch...');
      this.fetchOrders();
      
      // Set up periodic polling
      console.log('[ConnectionManager] Setting up periodic polling...');
      this.pollingTimer = setInterval(() => {
        if (this.isWithinOperationalHours()) {
          this.fetchOrders();
        } else {
          console.log('[ConnectionManager] Outside operational hours (10 PM - 5 AM), skipping poll');
        }
      }, this.config.pollingInterval);
      console.log('[ConnectionManager] Polling timer set');
    } else {
      console.log('[ConnectionManager] Outside operational hours (10 PM - 5 AM), polling paused');
    }
    
    // Set up a timer to check operational hours every minute
    // This ensures polling resumes when operational window begins
    this.operationalCheckTimer = setInterval(() => {
      const withinHours = this.isWithinOperationalHours();
      
      if (withinHours && !this.pollingTimer) {
        // We're now in operational hours and polling isn't active - start it
        console.log('[ConnectionManager] Entering operational hours, resuming polling');
        this.fetchOrders();
        this.pollingTimer = setInterval(() => {
          if (this.isWithinOperationalHours()) {
            this.fetchOrders();
          }
        }, this.config.pollingInterval);
      } else if (!withinHours && this.pollingTimer) {
        // We're outside operational hours but polling is active - stop it
        console.log('[ConnectionManager] Exiting operational hours, pausing polling');
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
      }
    }, 60000); // Check every minute
  }

  /**
   * Stop the polling mechanism
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    
    if (this.operationalCheckTimer) {
      clearInterval(this.operationalCheckTimer);
      this.operationalCheckTimer = null;
    }
    
    console.log('ConnectionManager stopped');
  }

  /**
   * Fetch orders from the API
   */
  private async fetchOrders(): Promise<void> {
    try {
      console.log('[ConnectionManager] Fetching orders from:', this.config.pollingUrl);
      const response = await fetch(this.config.pollingUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[ConnectionManager] Received data:', data);
      const rawOrders = data.orders || [];
      console.log('[ConnectionManager] Number of orders:', rawOrders.length);
      
      // Convert date strings to Date objects
      const orders: OrderWithDetails[] = rawOrders.map((order: any) => ({
        ...order,
        slotTime: new Date(order.slotTime),
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt),
        items: order.items.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        })),
      }));
      
      this.lastFetchTime = new Date();
      console.log('[ConnectionManager] Calling onOrderUpdate with', orders.length, 'orders');
      this.config.onOrderUpdate(orders);
    } catch (error) {
      console.error('[ConnectionManager] Error fetching orders:', error);
      this.config.onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Get the last fetch time
   */
  getLastFetchTime(): Date | null {
    return this.lastFetchTime;
  }

  /**
   * Check if the manager is currently running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Check if currently within operational hours
   * Public method to allow UI to display operational status
   */
  isInOperationalHours(): boolean {
    return this.isWithinOperationalHours();
  }

  /**
   * Check if polling is currently active (running AND within operational hours)
   */
  isPollingActive(): boolean {
    return this.isRunning && this.pollingTimer !== null;
  }

  /**
   * Update the polling interval
   */
  setPollingInterval(interval: number): void {
    this.config.pollingInterval = interval;
    
    // Restart polling with new interval if currently running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Force an immediate poll (useful after status updates)
   */
  async forcePoll(): Promise<void> {
    if (!this.isRunning) {
      console.warn('Cannot force poll: ConnectionManager is not running');
      return;
    }
    
    await this.fetchOrders();
  }
}
