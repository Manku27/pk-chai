import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/db/queries/orders';
import { validateAdminAuth } from '@/utils/adminAuth';

/**
 * PATCH /api/admin/orders/[orderId]/status
 * Update order status to DELIVERED or REJECTED
 * Request body: { status: 'DELIVERED' | 'REJECTED' }
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    // Validate admin authorization
    const authResult = await validateAdminAuth(request);
    if (authResult.error) {
        return authResult.error;
    }

    try {
        const { orderId } = await params;

        // Validate orderId format (UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(orderId)) {
            return NextResponse.json(
                { error: 'Invalid order ID format' },
                { status: 400 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { status } = body;

        // Validate status value
        if (!status || !['DELIVERED', 'REJECTED'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be DELIVERED or REJECTED' },
                { status: 400 }
            );
        }

        // Fetch current order
        const { order: currentOrder } = await getOrderById(orderId);

        if (!currentOrder) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Validate current order status
        if (!['ACCEPTED', 'ACKNOWLEDGED'].includes(currentOrder.status)) {
            return NextResponse.json(
                {
                    error: 'Cannot update order status',
                    message: `Order status cannot be changed from ${currentOrder.status}`
                },
                { status: 400 }
            );
        }

        // Update order status
        const updatedOrder = await updateOrderStatus(orderId, status);

        if (!updatedOrder) {
            return NextResponse.json(
                { error: 'Failed to update order status' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            order: updatedOrder,
            message: `Order status successfully updated to ${status}`
        });

    } catch (error) {
        console.error('Order status update error:', error);
        return NextResponse.json(
            { error: 'An error occurred while updating the order' },
            { status: 500 }
        );
    }
}
