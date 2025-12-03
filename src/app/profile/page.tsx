/**
 * Profile Page
 * Displays user details, order history, and profile management
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

// Order interface for display
interface OrderDisplay {
  id: string;
  userId: string;
  targetHostelBlock: string;
  slotTime: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    priceAtOrder: number;
  }>;
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading, logout, updateProfile } = useAuth();
  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    block: '',
    floor: '',
    room: '',
    year: '',
    department: ''
  });

  // Initialize currentPage from URL query parameters
  useEffect(() => {
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const pageNumber = parseInt(pageParam, 10);
      if (!isNaN(pageNumber) && pageNumber > 0) {
        setCurrentPage(pageNumber);
      }
    }
  }, [searchParams]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load user data into form when editing starts
  useEffect(() => {
    if (user && isEditing) {
      setEditForm({
        name: user.name,
        phone: user.phone,
        block: user.hostelDetails?.block || '',
        floor: user.hostelDetails?.floor || '',
        room: user.hostelDetails?.room || '',
        year: user.hostelDetails?.year || '',
        department: user.hostelDetails?.department || ''
      });
    }
  }, [user, isEditing]);

  // Load order history
  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;

      try {
        setIsLoadingOrders(true);
        setOrdersError(null);
        
        // Include page and limit query parameters
        const url = new URL(`/api/orders/history/${user.id}`, window.location.origin);
        url.searchParams.set('page', currentPage.toString());
        url.searchParams.set('limit', pageSize.toString());
        
        const response = await fetch(url.toString());
        
        if (!response.ok) {
          if (response.status === 400) {
            throw new Error('Invalid user ID');
          } else if (response.status === 500) {
            throw new Error('Failed to load order history. Please try again later.');
          } else {
            throw new Error('An unexpected error occurred');
          }
        }
        
        const data = await response.json();
        setOrders(data.orders || []);
        
        // Parse and update pagination metadata
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalOrders(data.pagination.totalOrders);
          setHasNextPage(data.pagination.hasNextPage);
          setHasPreviousPage(data.pagination.hasPreviousPage);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
        setOrdersError(
          err instanceof Error 
            ? err.message 
            : 'Unable to load order history. Please check your connection.'
        );
      } finally {
        setIsLoadingOrders(false);
      }
    };

    loadOrders();
  }, [user, currentPage, pageSize]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setError(null);
    setSuccessMessage(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      const updates: any = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim()
      };

      // Only include hostel details if at least one field is filled
      const hasHostelDetails = editForm.block || editForm.floor || editForm.room || 
                               editForm.year || editForm.department;
      
      if (hasHostelDetails) {
        updates.hostelDetails = {
          block: editForm.block.trim() || undefined,
          floor: editForm.floor.trim() || undefined,
          room: editForm.room.trim() || undefined,
          year: editForm.year.trim() || undefined,
          department: editForm.department.trim() || undefined
        };
      }

      await updateProfile(updates);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout');
    }
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  const handlePageChange = (newPage: number) => {
    // Update page state
    setCurrentPage(newPage);
    
    // Update URL query parameters
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/profile?${params.toString()}`, { scroll: false });
  };

  const handleRetryOrders = () => {
    // Trigger a reload by updating a dependency
    // The useEffect will automatically retry with the current page
    setOrdersError(null);
    setIsLoadingOrders(true);
    
    // Force re-fetch by creating a new URL with current pagination state
    const loadOrders = async () => {
      if (!user) return;

      try {
        const url = new URL(`/api/orders/history/${user.id}`, window.location.origin);
        url.searchParams.set('page', currentPage.toString());
        url.searchParams.set('limit', pageSize.toString());
        
        const response = await fetch(url.toString());
        
        if (!response.ok) {
          if (response.status === 400) {
            throw new Error('Invalid user ID');
          } else if (response.status === 500) {
            throw new Error('Failed to load order history. Please try again later.');
          } else {
            throw new Error('An unexpected error occurred');
          }
        }
        
        const data = await response.json();
        setOrders(data.orders || []);
        
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalOrders(data.pagination.totalOrders);
          setHasNextPage(data.pagination.hasNextPage);
          setHasPreviousPage(data.pagination.hasPreviousPage);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
        setOrdersError(
          err instanceof Error 
            ? err.message 
            : 'Unable to load order history. Please check your connection.'
        );
      } finally {
        setIsLoadingOrders(false);
      }
    };

    loadOrders();
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} aria-hidden="true"></div>
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <button 
            onClick={() => router.push('/')} 
            className={styles.backButton}
            aria-label="Back to menu"
            type="button"
          >
            ← Back to Menu
          </button>
          <h1 className={styles.title}>My Profile</h1>
        </header>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        {successMessage && (
          <div className={styles.success} role="status">
            {successMessage}
          </div>
        )}

        {/* User Details Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Personal Information</h2>
            {!isEditing && (
              <button 
                onClick={handleEditToggle} 
                className={styles.editButton}
                aria-label="Edit profile"
                type="button"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={editForm.name}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                  aria-required="true"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                  pattern="[0-9]{10}"
                  aria-required="true"
                />
              </div>

              <h3 className={styles.subsectionTitle}>Hostel Details (Optional)</h3>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="block" className={styles.label}>
                    Block
                  </label>
                  <input
                    type="text"
                    id="block"
                    name="block"
                    value={editForm.block}
                    onChange={handleInputChange}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="floor" className={styles.label}>
                    Floor
                  </label>
                  <input
                    type="text"
                    id="floor"
                    name="floor"
                    value={editForm.floor}
                    onChange={handleInputChange}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="room" className={styles.label}>
                    Room
                  </label>
                  <input
                    type="text"
                    id="room"
                    name="room"
                    value={editForm.room}
                    onChange={handleInputChange}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="year" className={styles.label}>
                    Year
                  </label>
                  <input
                    type="text"
                    id="year"
                    name="year"
                    value={editForm.year}
                    onChange={handleInputChange}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="department" className={styles.label}>
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={editForm.department}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Name:</span>
                <span className={styles.detailValue}>{user.name}</span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Phone:</span>
                <span className={styles.detailValue}>{user.phone}</span>
              </div>

              {user.hostelDetails && (
                <>
                  {user.hostelDetails.block && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Block:</span>
                      <span className={styles.detailValue}>{user.hostelDetails.block}</span>
                    </div>
                  )}

                  {user.hostelDetails.floor && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Floor:</span>
                      <span className={styles.detailValue}>{user.hostelDetails.floor}</span>
                    </div>
                  )}

                  {user.hostelDetails.room && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Room:</span>
                      <span className={styles.detailValue}>{user.hostelDetails.room}</span>
                    </div>
                  )}

                  {user.hostelDetails.year && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Year:</span>
                      <span className={styles.detailValue}>{user.hostelDetails.year}</span>
                    </div>
                  )}

                  {user.hostelDetails.department && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Department:</span>
                      <span className={styles.detailValue}>{user.hostelDetails.department}</span>
                    </div>
                  )}
                </>
              )}

              {!user.hostelDetails && (
                <div className={styles.noDetails}>
                  No hostel details provided
                </div>
              )}
            </div>
          )}
        </section>

        {/* Order History Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Order History</h2>

          {ordersError ? (
            <div className={styles.errorState} role="alert">
              <p className={styles.errorMessage}>{ordersError}</p>
              <button 
                onClick={handleRetryOrders} 
                className={styles.retryButton}
                type="button"
                aria-label="Retry loading orders"
              >
                Retry
              </button>
            </div>
          ) : orders.length === 0 && !isLoadingOrders ? (
            <div className={styles.emptyState}>
              {totalOrders === 0 ? (
                <>
                  <p>No orders yet</p>
                  <button 
                    onClick={() => router.push('/')} 
                    className={styles.browseButton}
                    type="button"
                  >
                    Browse Menu
                  </button>
                </>
              ) : (
                <>
                  <p>No orders found on this page</p>
                  <button 
                    onClick={() => handlePageChange(1)} 
                    className={styles.browseButton}
                    type="button"
                  >
                    Go to First Page
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className={styles.ordersContainer}>
                {isLoadingOrders && (
                  <div className={styles.paginationLoadingOverlay} role="status" aria-live="polite">
                    <div className={styles.spinner} aria-hidden="true"></div>
                    <span className={styles.visuallyHidden}>Loading page {currentPage}...</span>
                  </div>
                )}
                <div className={`${styles.ordersList} ${isLoadingOrders ? styles.ordersListLoading : ''}`}>
                  {orders.map((order) => (
                  <div key={order.id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <div className={styles.orderDate}>
                        {formatDate(order.createdAt)}
                      </div>
                      <div className={styles.orderStatus}>
                        {order.status}
                      </div>
                    </div>

                    <div className={styles.orderDetails}>
                      <div className={styles.orderInfo}>
                        <span className={styles.orderLabel}>Delivery:</span>
                        <span>{order.targetHostelBlock}</span>
                      </div>
                      <div className={styles.orderInfo}>
                        <span className={styles.orderLabel}>Slot:</span>
                        <span>{new Date(order.slotTime).toLocaleTimeString('en-IN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      </div>
                    </div>

                    <div className={styles.orderItems}>
                      {order.items.map((item, index) => (
                        <div key={index} className={styles.orderItem}>
                          <span className={styles.itemName}>
                            {item.name} × {item.quantity}
                          </span>
                          <span className={styles.itemPrice}>
                            {formatCurrency(item.priceAtOrder * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.orderTotal}>
                      <span className={styles.totalLabel}>Total:</span>
                      <span className={styles.totalAmount}>
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                  ))}
                </div>
              </div>

              {/* Pagination Controls - Only show when there are multiple pages */}
              {totalOrders > 0 && totalPages > 1 && (
                <div className={styles.pagination} role="navigation" aria-label="Order history pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoadingOrders}
                    className={styles.paginationButton}
                    type="button"
                    aria-label="Go to previous page"
                    aria-disabled={currentPage === 1 || isLoadingOrders}
                  >
                    Previous
                  </button>
                  <span className={styles.pageIndicator} aria-current="page">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNextPage || currentPage === totalPages || isLoadingOrders}
                    className={styles.paginationButton}
                    type="button"
                    aria-label="Go to next page"
                    aria-disabled={!hasNextPage || currentPage === totalPages || isLoadingOrders}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Logout Section */}
        <section className={styles.section}>
          {!showLogoutConfirm ? (
            <button 
              onClick={() => setShowLogoutConfirm(true)} 
              className={styles.logoutButton}
              type="button"
              aria-label="Logout from account"
            >
              Logout
            </button>
          ) : (
            <div className={styles.logoutConfirm}>
              <p className={styles.confirmText}>Are you sure you want to logout?</p>
              <div className={styles.buttonGroup}>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className={styles.confirmButton}
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} aria-hidden="true"></div>
          <span>Loading profile...</span>
        </div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
