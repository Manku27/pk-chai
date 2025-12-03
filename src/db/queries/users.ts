import { eq } from 'drizzle-orm';
import { db } from '../index';
import { users } from '../schema';

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

/**
 * Create a new user
 */
export async function createUser(userData: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(userData).returning();
  return user;
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}

/**
 * Get user by phone number
 */
export async function getUserByPhone(phone: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return user;
}

/**
 * Update user information
 */
export async function updateUser(id: string, userData: Partial<NewUser>): Promise<User | undefined> {
  const [user] = await db
    .update(users)
    .set({ ...userData, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user;
}

/**
 * Delete user by ID
 */
export async function deleteUser(id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

/**
 * Get all users with a specific role
 */
export async function getUsersByRole(role: string): Promise<User[]> {
  return db.select().from(users).where(eq(users.role, role));
}
