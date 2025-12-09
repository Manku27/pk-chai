import { NextRequest, NextResponse } from 'next/server';
import { getDetailedOrdersForSlotAndBlock } from '@/db/queries/analytics';
import { validateAdminAuth } from '@/utils/adminAuth';

export async function GET(request: NextRequest) {
    // Validate admin authorization
    const authResult = await validateAdminAuth(request);
    if (authResult.error) {
        return authResult.error;
    }

    const searchParams = request.nextUrl.searchParams;
    const slotTime = searchParams.get('slotTime');
    const hostelBlock = searchParams.get('hostelBlock');

    // Parameter validation
    if (!slotTime || !hostelBlock) {
        return NextResponse.json(
            { error: 'slotTime and hostelBlock parameters are required' },
            { status: 400 }
        );
    }

    // Validate slotTime is a valid date
    const slotDate = new Date(slotTime);
    if (isNaN(slotDate.getTime())) {
        return NextResponse.json(
            { error: 'Invalid slotTime parameter. Must be a valid ISO date string' },
            { status: 400 }
        );
    }

    try {
        const orders = await getDetailedOrdersForSlotAndBlock(
            slotDate,
            hostelBlock
        );

        return NextResponse.json({ orders });
    } catch (error) {
        console.error('Failed to fetch detailed orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch detailed orders' },
            { status: 500 }
        );
    }
}
