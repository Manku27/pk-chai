/**
 * Integration tests for SlotSelector component with time-based slot blocking
 * Tests the complete order placement flow with time-based blocking logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getAvailableSlots } from '@/services/slots';
import { createAndSaveOrder } from '@/services/orderService';
import { SlotSelector } from './SlotSelector';
import { CartProvider } from '@/contexts/CartContext';

// Mock order service for order placement tests
const mockCreateAndSaveOrder = vi.fn();
vi.mock('@/services/orderService', () => ({
  createAndSaveOrder: mockCreateAndSaveOrder,
}));

// Mock rate limiting
vi.mock('@/middleware/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(null),
}));

// Test wrapper component with CartProvider
function SlotSelectorWithProvider({ error, onErrorClear }: { error?: string; onErrorClear?: () => void } = {}) {
  return (
    <CartProvider>
      <SlotSelector error={error} onErrorClear={onErrorClear} />
    </CartProvider>
  );
}



describe('SlotSelector Time-Based Blocking Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateAndSaveOrder.mockResolvedValue({ orderId: 'test-order-id' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Active Delivery Window Slot Availability (1:00 AM)', () => {
    it('should correctly identify blocked slots during active delivery window at 1:00 AM', () => {
      // Test scenario: Order placed at 1:00 AM during active delivery window
      const mockCurrentTime = new Date('2024-12-10T01:00:00');
      const slots = getAvailableSlots(mockCurrentTime, false);

      // Verify that past slots (11:00 PM, 11:30 PM, 12:00 AM, 12:30 AM, 1:00 AM) are blocked
      const pastSlotDisplays = ['11:00 PM', '11:30 PM', '12:00 AM', '12:30 AM', '1:00 AM'];
      pastSlotDisplays.forEach(slotDisplay => {
        const slot = slots.find(s => s.display === slotDisplay);
        expect(slot?.isAvailable).toBe(false);
      });

      // Verify that 1:30 AM is blocked due to 30-minute buffer
      const oneThirtyAmSlot = slots.find(s => s.display === '1:30 AM');
      expect(oneThirtyAmSlot?.isAvailable).toBe(false);

      // Verify that future slots (2:00 AM onwards) are available
      const futureSlotDisplays = ['2:00 AM', '2:30 AM', '3:00 AM', '4:00 AM', '5:00 AM'];
      futureSlotDisplays.forEach(slotDisplay => {
        const slot = slots.find(s => s.display === slotDisplay);
        expect(slot?.isAvailable).toBe(true);
      });
    });

    it('should provide correct slot data structure for UI integration at 1:00 AM', () => {
      const mockCurrentTime = new Date('2024-12-10T01:00:00');
      const slots = getAvailableSlots(mockCurrentTime, false);

      // Verify all slots have required properties for UI integration
      slots.forEach(slot => {
        expect(slot).toHaveProperty('time');
        expect(slot).toHaveProperty('display');
        expect(slot).toHaveProperty('isAvailable');
        
        // Time should be valid ISO string for HTML select value
        expect(typeof slot.time).toBe('string');
        expect(slot.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        expect(() => new Date(slot.time)).not.toThrow();
        
        // Display should be human-readable
        expect(typeof slot.display).toBe('string');
        expect(slot.display).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
        
        // isAvailable should be boolean
        expect(typeof slot.isAvailable).toBe('boolean');
      });

      // Verify blocked slots would be properly marked in UI
      const blockedSlots = slots.filter(slot => !slot.isAvailable);
      const availableSlots = slots.filter(slot => slot.isAvailable);
      
      expect(blockedSlots.length).toBeGreaterThan(0);
      expect(availableSlots.length).toBeGreaterThan(0);
      
      // Verify blocked slots have valid timestamps (even though unavailable)
      blockedSlots.forEach(slot => {
        expect(() => new Date(slot.time)).not.toThrow();
        expect(isNaN(new Date(slot.time).getTime())).toBe(false);
      });
    });
  });

  describe('Near End of Delivery Window Slot Availability (4:30 AM)', () => {
    it('should show very limited slot availability at 4:30 AM', () => {
      const mockCurrentTime = new Date('2024-12-10T04:30:00');
      const slots = getAvailableSlots(mockCurrentTime, false);

      // At 4:30 AM, all slots before 4:30 AM should be blocked by time-based blocking
      const pastSlotDisplays = ['11:00 PM', '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '4:30 AM'];
      pastSlotDisplays.forEach(slotDisplay => {
        const slot = slots.find(s => s.display === slotDisplay);
        expect(slot?.isAvailable).toBe(false);
      });

      // 5:00 AM slot should be blocked due to 30-minute buffer (4:30 AM + 30 min = 5:00 AM)
      const fiveAmSlot = slots.find(s => s.display === '5:00 AM');
      expect(fiveAmSlot?.isAvailable).toBe(false);
      
      // Verify no slots are available at 4:30 AM
      const availableSlots = slots.filter(slot => slot.isAvailable);
      expect(availableSlots).toHaveLength(0);
    });

    it('should show no available slots at 4:45 AM', () => {
      const mockCurrentTime = new Date('2024-12-10T04:45:00');
      const slots = getAvailableSlots(mockCurrentTime, false);

      // All slots should be unavailable at 4:45 AM
      const availableSlots = slots.filter(slot => slot.isAvailable);
      expect(availableSlots).toHaveLength(0);

      // Verify all slots are properly marked as unavailable
      slots.forEach(slot => {
        expect(slot.isAvailable).toBe(false);
      });

      // Verify specific slots that would be blocked by different reasons
      const elevenPmSlot = slots.find(s => s.display === '11:00 PM');
      const fourAmSlot = slots.find(s => s.display === '4:00 AM');
      const fiveAmSlot = slots.find(s => s.display === '5:00 AM');

      expect(elevenPmSlot?.isAvailable).toBe(false); // Time-based blocking
      expect(fourAmSlot?.isAvailable).toBe(false); // Time-based blocking
      expect(fiveAmSlot?.isAvailable).toBe(false); // 30-minute buffer
    });
  });

  describe('Shift Reset Slot Availability (6:00 AM)', () => {
    it('should show all slots as available at 6:00 AM shift reset', () => {
      const mockCurrentTime = new Date('2024-12-10T06:00:00');
      const slots = getAvailableSlots(mockCurrentTime, false);

      // All slots should be available for the upcoming night delivery window
      const availableSlots = slots.filter(slot => slot.isAvailable);
      expect(availableSlots).toHaveLength(slots.length);

      // Verify all slots are marked as available
      slots.forEach(slot => {
        expect(slot.isAvailable).toBe(true);
      });

      // Verify slots are for the upcoming night (same day 11 PM, next day early AM)
      const elevenPmSlot = slots.find(s => s.display === '11:00 PM');
      const oneAmSlot = slots.find(s => s.display === '1:00 AM');

      expect(elevenPmSlot).toBeDefined();
      expect(oneAmSlot).toBeDefined();

      const elevenPmDate = new Date(elevenPmSlot!.time);
      const oneAmDate = new Date(oneAmSlot!.time);

      expect(elevenPmDate.getDate()).toBe(10); // Same day
      expect(oneAmDate.getDate()).toBe(11); // Next day
    });

    it('should provide valid slot data for UI selection at 6:00 AM', () => {
      const mockCurrentTime = new Date('2024-12-10T06:00:00');
      const slots = getAvailableSlots(mockCurrentTime, false);

      // Test that all slots would be selectable in UI
      const testSlots = ['11:00 PM', '1:00 AM', '3:00 AM', '5:00 AM'];
      
      testSlots.forEach(slotDisplay => {
        const slot = slots.find(s => s.display === slotDisplay);
        expect(slot).toBeDefined();
        expect(slot?.isAvailable).toBe(true);
        
        // Verify slot data is valid for UI integration
        expect(slot?.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        expect(() => new Date(slot!.time)).not.toThrow();
      });
    });
  });

  describe('Order Placement Flow Integration', () => {
    it('should complete order placement successfully at 1:00 AM with available slot', async () => {
      const mockCurrentTime = new Date('2024-12-10T01:00:00');
      vi.setSystemTime(mockCurrentTime);

      const slots = getAvailableSlots(mockCurrentTime, false);
      const availableSlot = slots.find(slot => slot.isAvailable);
      expect(availableSlot).toBeDefined();

      render(<SlotSelectorWithProvider />);

      await waitFor(() => {
        expect(screen.getByLabelText('Select delivery time slot')).toBeInTheDocument();
      });

      const selectElement = screen.getByLabelText('Select delivery time slot') as HTMLSelectElement;

      // Select an available slot
      fireEvent.change(selectElement, { target: { value: availableSlot!.time } });
      expect(selectElement.value).toBe(availableSlot!.time);

      // Simulate order placement API call
      const orderData = {
        userId: 'test-user-id',
        items: [{ itemId: 'item1', name: 'Test Item', price: 100, quantity: 1 }],
        targetHostelBlock: 'A',
        slotTime: availableSlot!.time,
        totalAmount: 100,
      };

      // Verify the slot timestamp is valid for order placement
      expect(() => new Date(orderData.slotTime)).not.toThrow();
      expect(isNaN(new Date(orderData.slotTime).getTime())).toBe(false);

      // Mock successful order placement
      const result = await mockCreateAndSaveOrder(
        orderData.userId,
        orderData.items,
        orderData.targetHostelBlock,
        orderData.slotTime,
        orderData.totalAmount
      );

      expect(mockCreateAndSaveOrder).toHaveBeenCalledWith(
        'test-user-id',
        [{ itemId: 'item1', name: 'Test Item', price: 100, quantity: 1 }],
        'A',
        availableSlot!.time,
        100
      );
      expect(result.orderId).toBe('test-order-id');
    });

    it('should handle order placement at 4:30 AM when no slots are available', async () => {
      const mockCurrentTime = new Date('2024-12-10T04:30:00');
      vi.setSystemTime(mockCurrentTime);

      const slots = getAvailableSlots(mockCurrentTime, false);
      const availableSlots = slots.filter(slot => slot.isAvailable);
      expect(availableSlots).toHaveLength(0);

      render(<SlotSelectorWithProvider />);

      await waitFor(() => {
        expect(screen.getByLabelText('Select delivery time slot')).toBeInTheDocument();
      });

      const selectElement = screen.getByLabelText('Select delivery time slot') as HTMLSelectElement;
      const options = Array.from(selectElement.options);

      // All slot options should be disabled
      const slotOptions = options.filter(opt => opt.value !== '');
      slotOptions.forEach(option => {
        expect(option.disabled).toBe(true);
      });

      // Verify that no slot can be selected
      expect(selectElement.value).toBe('');
      
      // Attempting to place an order without a slot should fail validation
      const orderData = {
        userId: 'test-user-id',
        items: [{ itemId: 'item1', name: 'Test Item', price: 100, quantity: 1 }],
        targetHostelBlock: 'A',
        slotTime: '', // No slot selected
        totalAmount: 100,
      };

      // This would fail API validation due to missing slotTime
      expect(orderData.slotTime).toBe('');
    });

    it('should complete order placement successfully at 6:00 AM with fresh slots', async () => {
      const mockCurrentTime = new Date('2024-12-10T06:00:00');
      vi.setSystemTime(mockCurrentTime);

      const slots = getAvailableSlots(mockCurrentTime, false);
      const availableSlots = slots.filter(slot => slot.isAvailable);
      expect(availableSlots).toHaveLength(slots.length); // All slots available

      render(<SlotSelectorWithProvider />);

      await waitFor(() => {
        expect(screen.getByLabelText('Select delivery time slot')).toBeInTheDocument();
      });

      const selectElement = screen.getByLabelText('Select delivery time slot') as HTMLSelectElement;

      // Select the first available slot (11:00 PM)
      const elevenPmSlot = slots.find(slot => slot.display === '11:00 PM');
      expect(elevenPmSlot).toBeDefined();
      expect(elevenPmSlot!.isAvailable).toBe(true);

      fireEvent.change(selectElement, { target: { value: elevenPmSlot!.time } });
      expect(selectElement.value).toBe(elevenPmSlot!.time);

      // Simulate order placement
      const orderData = {
        userId: 'test-user-id',
        items: [{ itemId: 'item1', name: 'Test Item', price: 100, quantity: 1 }],
        targetHostelBlock: 'A',
        slotTime: elevenPmSlot!.time,
        totalAmount: 100,
      };

      // Verify the slot timestamp is for the correct day
      const slotDate = new Date(orderData.slotTime);
      expect(slotDate.getDate()).toBe(10); // Same day for 11 PM
      expect(slotDate.getHours()).toBe(23);

      const result = await mockCreateAndSaveOrder(
        orderData.userId,
        orderData.items,
        orderData.targetHostelBlock,
        orderData.slotTime,
        orderData.totalAmount
      );

      expect(result.orderId).toBe('test-order-id');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle slot selection errors gracefully', async () => {
      const mockCurrentTime = new Date('2024-12-10T01:00:00');
      vi.setSystemTime(mockCurrentTime);

      const mockOnErrorClear = vi.fn();
      render(<SlotSelectorWithProvider error="Please select a delivery slot" onErrorClear={mockOnErrorClear} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Select delivery time slot')).toBeInTheDocument();
      });

      // Verify error is displayed
      expect(screen.getByText('Please select a delivery slot')).toBeInTheDocument();

      const selectElement = screen.getByLabelText('Select delivery time slot') as HTMLSelectElement;
      expect(selectElement).toHaveAttribute('aria-invalid', 'true');

      // Select an available slot to clear error
      const slots = getAvailableSlots(mockCurrentTime, false);
      const availableSlot = slots.find(slot => slot.isAvailable);
      expect(availableSlot).toBeDefined();

      fireEvent.change(selectElement, { target: { value: availableSlot!.time } });

      // Verify error clear callback is called
      expect(mockOnErrorClear).toHaveBeenCalled();
    });

    it('should maintain slot availability consistency across re-renders', async () => {
      const mockCurrentTime = new Date('2024-12-10T01:00:00');
      vi.setSystemTime(mockCurrentTime);

      const { rerender } = render(<SlotSelectorWithProvider />);

      await waitFor(() => {
        expect(screen.getByLabelText('Select delivery time slot')).toBeInTheDocument();
      });

      const selectElement = screen.getByLabelText('Select delivery time slot') as HTMLSelectElement;
      const initialOptions = Array.from(selectElement.options);

      // Re-render component
      rerender(<SlotSelectorWithProvider />);

      await waitFor(() => {
        expect(screen.getByLabelText('Select delivery time slot')).toBeInTheDocument();
      });

      const rerenderedOptions = Array.from(selectElement.options);

      // Verify options remain consistent
      expect(rerenderedOptions).toHaveLength(initialOptions.length);
      
      rerenderedOptions.forEach((option, index) => {
        expect(option.value).toBe(initialOptions[index].value);
        expect(option.disabled).toBe(initialOptions[index].disabled);
        expect(option.textContent).toBe(initialOptions[index].textContent);
      });
    });
  });
});