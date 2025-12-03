/**
 * ProfileBadge Component
 * Displays user initials in a circular badge when authenticated
 * Positioned in top-right corner, clickable to navigate to profile page
 */

'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/utils/auth';
import { useRouter } from 'next/navigation';
import styles from './ProfileBadge.module.css';

interface ProfileBadgeProps {
  inline?: boolean;
}

export function ProfileBadge({ inline = false }: ProfileBadgeProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const initials = getInitials(user.name);

  const handleClick = () => {
    router.push('/profile');
  };

  // Generate a consistent color based on user ID
  const getBackgroundColor = (userId: string): string => {
    // Simple hash function to generate a color from user ID
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate HSL color with good saturation and lightness for readability
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 65%, 45%)`;
  };

  const backgroundColor = getBackgroundColor(user.id);

  return (
    <button
      className={`${styles.badge} ${inline ? styles.inline : ''}`}
      onClick={handleClick}
      style={{ backgroundColor }}
      aria-label={`View profile for ${user.name}`}
      title={`View profile for ${user.name}`}
      type="button"
    >
      <span className={styles.initials} aria-hidden="true">{initials}</span>
    </button>
  );
}
