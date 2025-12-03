import { NextRequest, NextResponse } from 'next/server';
import { getUserByPhone } from '@/db/queries/users';
import { verifyPassword } from '@/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    // Validate required fields
    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Phone and password are required' },
        { status: 400 }
      );
    }

    // Validate phone format
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Get user by phone
    const user = await getUserByPhone(phone);
    if (!user) {
      return NextResponse.json(
        { error: 'Phone number or password is incorrect' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Phone number or password is incorrect' },
        { status: 401 }
      );
    }

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        createdAt: user.createdAt.getTime(),
        updatedAt: user.updatedAt.getTime(),
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
