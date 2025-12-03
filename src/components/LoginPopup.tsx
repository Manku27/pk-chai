'use client';

/**
 * LoginPopup Component
 * Modal dialog for user authentication (login and registration)
 * Implements two-step signup: basic info → optional hostel details
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Backdrop } from './Backdrop';
import styles from './LoginPopup.module.css';

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthMode = 'login' | 'signup-basic' | 'signup-details';

interface FormData {
  name: string;
  phone: string;
  password: string;
  hostelDetails: {
    block: string;
    floor: string;
    room: string;
    year: string;
    department: string;
  };
}

export function LoginPopup({ isOpen, onClose, onSuccess }: LoginPopupProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    password: '',
    hostelDetails: {
      block: '',
      floor: '',
      room: '',
      year: '',
      department: ''
    }
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode('login');
      setFormData({
        name: '',
        phone: '',
        password: '',
        hostelDetails: {
          block: '',
          floor: '',
          room: '',
          year: '',
          department: ''
        }
      });
      setError('');
      setIsLoading(false);
      
      // Focus first input
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }

      if (e.key === 'Tab') {
        const modal = modalRef.current;
        if (!modal) return;

        const focusableElements = modal.querySelectorAll<HTMLElement>(
          'button, input, textarea, select, a[href]'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleHostelDetailChange = (field: keyof FormData['hostelDetails'], value: string) => {
    setFormData(prev => ({
      ...prev,
      hostelDetails: {
        ...prev.hostelDetails,
        [field]: value
      }
    }));
  };

  const handleLogin = async (e: FormEvent) => {
    console.log('login attempt')
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData.phone, formData.password);
          console.log('login success')

      onClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupBasic = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate basic fields
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!formData.password) {
      setError('Password is required');
      return;
    }

    // Move to hostel details step
    setMode('signup-details');
  };

  const handleSignupComplete = async (skipDetails: boolean) => {
    setError('');
    setIsLoading(true);

    try {
      const hasHostelDetails = !skipDetails && (
        formData.hostelDetails.block ||
        formData.hostelDetails.floor ||
        formData.hostelDetails.room ||
        formData.hostelDetails.year ||
        formData.hostelDetails.department
      );

      await register({
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        hostelDetails: hasHostelDetails ? {
          ...(formData.hostelDetails.block && { block: formData.hostelDetails.block }),
          ...(formData.hostelDetails.floor && { floor: formData.hostelDetails.floor }),
          ...(formData.hostelDetails.room && { room: formData.hostelDetails.room }),
          ...(formData.hostelDetails.year && { year: formData.hostelDetails.year }),
          ...(formData.hostelDetails.department && { department: formData.hostelDetails.department })
        } : undefined
      });
      onClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const switchToSignup = () => {
    setMode('signup-basic');
    setError('');
  };

  const switchToLogin = () => {
    setMode('login');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <>
      <Backdrop isOpen={isOpen} onClick={onClose} />
      <div className={styles.modal} ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-subtitle">
        <div className={styles.modalContent}>
          {/* Login Form */}
          {mode === 'login' && (
            <>
              <h2 id="modal-title" className={styles.title}>Welcome Back</h2>
              <form onSubmit={handleLogin} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="login-phone" className={styles.label}>
                    Phone Number
                  </label>
                  <input
                    ref={firstInputRef}
                    id="login-phone"
                    type="tel"
                    className={styles.input}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    disabled={isLoading}
                    autoComplete="tel"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="login-password" className={styles.label}>
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    className={styles.input}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <div className={styles.error} role="alert">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {isLoading && <span className={styles.spinner} aria-hidden="true"></span>}
                  {isLoading ? 'Logging in...' : 'Log In'}
                </button>

                <div className={styles.switchMode}>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={switchToSignup}
                    disabled={isLoading}
                  >
                    Sign up
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Signup Form - Step 1: Basic Info */}
          {mode === 'signup-basic' && (
            <>
              <h2 id="modal-title" className={styles.title}>Create Account</h2>
              <p id="modal-subtitle" className={styles.subtitle}>Step 1 of 2: Basic Information</p>
              <form onSubmit={handleSignupBasic} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="signup-name" className={styles.label}>
                    Full Name
                  </label>
                  <input
                    ref={firstInputRef}
                    id="signup-name"
                    type="text"
                    className={styles.input}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="signup-phone" className={styles.label}>
                    Phone Number
                  </label>
                  <input
                    id="signup-phone"
                    type="tel"
                    className={styles.input}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    autoComplete="tel"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="signup-password" className={styles.label}>
                    Password
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    className={styles.input}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <div className={styles.error} role="alert">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className={styles.submitButton}
                >
                  Continue
                </button>

                <div className={styles.switchMode}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={switchToLogin}
                  >
                    Log in
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Signup Form - Step 2: Hostel Details */}
          {mode === 'signup-details' && (
            <>
              <h2 id="modal-title" className={styles.title}>Almost Done!</h2>
              <p id="modal-subtitle" className={styles.subtitle}>Step 2 of 2: Hostel Details (Optional)</p>
              <form onSubmit={(e) => { e.preventDefault(); handleSignupComplete(false); }} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="hostel-block" className={styles.label}>
                    Hostel Block
                  </label>
                  <input
                    ref={firstInputRef}
                    id="hostel-block"
                    type="text"
                    className={styles.input}
                    value={formData.hostelDetails.block}
                    onChange={(e) => handleHostelDetailChange('block', e.target.value)}
                    placeholder="e.g., A, B, C"
                    disabled={isLoading}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="hostel-floor" className={styles.label}>
                      Floor
                    </label>
                    <input
                      id="hostel-floor"
                      type="text"
                      className={styles.input}
                      value={formData.hostelDetails.floor}
                      onChange={(e) => handleHostelDetailChange('floor', e.target.value)}
                      placeholder="e.g., 1, 2, 3"
                      disabled={isLoading}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="hostel-room" className={styles.label}>
                      Room
                    </label>
                    <input
                      id="hostel-room"
                      type="text"
                      className={styles.input}
                      value={formData.hostelDetails.room}
                      onChange={(e) => handleHostelDetailChange('room', e.target.value)}
                      placeholder="e.g., 101"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="hostel-year" className={styles.label}>
                      Year
                    </label>
                    <input
                      id="hostel-year"
                      type="text"
                      className={styles.input}
                      value={formData.hostelDetails.year}
                      onChange={(e) => handleHostelDetailChange('year', e.target.value)}
                      placeholder="e.g., 1, 2, 3, 4"
                      disabled={isLoading}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="hostel-department" className={styles.label}>
                      Department
                    </label>
                    <input
                      id="hostel-department"
                      type="text"
                      className={styles.input}
                      value={formData.hostelDetails.department}
                      onChange={(e) => handleHostelDetailChange('department', e.target.value)}
                      placeholder="e.g., CSE, ECE"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {error && (
                  <div className={styles.error} role="alert">
                    {error}
                  </div>
                )}

                <div className={styles.buttonGroup}>
                  <button
                    type="button"
                    className={styles.skipButton}
                    onClick={() => handleSignupComplete(true)}
                    disabled={isLoading}
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isLoading}
                    aria-busy={isLoading}
                  >
                    {isLoading && <span className={styles.spinner} aria-hidden="true"></span>}
                    {isLoading ? 'Creating Account...' : 'Complete Registration'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
