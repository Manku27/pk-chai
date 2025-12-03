'use client';

import { useState, useEffect, useRef } from 'react';
import { debounce } from '@/utils/debounce';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ 
  onSearchChange, 
  placeholder = "Search menu items..." 
}: SearchBarProps) {
  const [searchText, setSearchText] = useState('');
  const debouncedSearchRef = useRef(debounce(onSearchChange, 300));

  // Update debounced function if callback changes
  useEffect(() => {
    debouncedSearchRef.current = debounce(onSearchChange, 300);
  }, [onSearchChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSearchRef.current.flush();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    debouncedSearchRef.current(value);
  };

  const handleClear = () => {
    setSearchText('');
    debouncedSearchRef.current.cancel();
    onSearchChange('');
  };

  return (
    <div className={styles.searchBar}>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          value={searchText}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={styles.input}
          aria-label="Search menu items"
        />
        {searchText && (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearButton}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
