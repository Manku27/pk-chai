import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByPhone } from '@/db/queries/users';
import { hashPassword } from '@/utils/auth';
import { generateUUID } from '@/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, password, hostelDetails } = body;

    // Validate required fields
    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, phone, and password are required' },
        { status: 400 }
      );
    }

    // Validate phone format (10 digits)
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByPhone(phone);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Phone number is already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await createUser({
      id: generateUUID(),
      name: name.trim(),
      phone,
      passwordHash,
      defaultHostelBlock: hostelDetails?.block || null,
      hostelFloor: hostelDetails?.floor || null,
      hostelRoom: hostelDetails?.room || null,
      hostelYear: hostelDetails?.year || null,
      hostelDepartment: hostelDetails?.department || null,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        createdAt: newUser.createdAt.getTime(),
        updatedAt: newUser.updatedAt.getTime(),
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
