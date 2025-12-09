/**
 * API route for updating individual order status
 * PATCH /api/admin/orders/[orderId] - Update order status with validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/db/queries/orders';

type OrderStatus = 'ACCEPTED' | 'ACKNOWLEDGED' | 'DELIVERED' | 'REJECTED';

/**
 * Valid status transitions based on requirements 3.2, 3.3, 3.4
 * ACCEPTED → ACKNOWLEDGED or REJECTED
 * ACKNOWLEDGED → DELIVERED or REJECTED
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  ACCEPTED: ['ACKNOWLEDGED', 'REJECTED'],
  ACKNOWLEDGED: ['DELIVERED', 'REJECTED'],
  DELIVERED: [], // Terminal state
  REJECTED: [], // Terminal state
};

/**
 * Validate if a status transition is allowed
 */
function isValidTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // Parse request body
    const body = await request.json();
    const { status: newStatus } = body;

    // Validate new status is provided
    if (!newStatus) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate new status is a valid order status
    const validStatuses: OrderStatus[] = ['ACCEPTED', 'ACKNOWLEDGED', 'DELIVERED', 'REJECTED'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { 
          error: 'Invalid status. Must be one of: ACCEPTED, ACKNOWLEDGED, DELIVERED, REJECTED',
          validStatuses 
        },
        { status: 400 }
      );
    }

    // Fetch current order
    const { order: currentOrder } = await getOrderById(orderId);

    // Check if order exists
    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate status transition
    if (!isValidTransition(currentOrder.status as OrderStatus, newStatus)) {
      return NextResponse.json(
        { 
          error: `Invalid status transition from ${currentOrder.status} to ${newStatus}`,
          currentStatus: currentOrder.status,
          requestedStatus: newStatus,
          validTransitions: VALID_TRANSITIONS[currentOrder.status as OrderStatus]
        },
        { status: 400 }
      );
    }

    // Update order status (persists immediately to database)
    const updatedOrder = await updateOrderStatus(orderId, newStatus);

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { order: updatedOrder },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to update order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
