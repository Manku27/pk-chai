import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/db/queries/users';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user by ID
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
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
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
