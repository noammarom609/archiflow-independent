import { useEffect, useState, useCallback } from 'react';

// Global event name for opening search
const OPEN_SEARCH_EVENT = 'openGlobalSearch';

export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K or Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    // Listen for custom event to open search (from any component)
    const handleOpenSearch = () => {
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener(OPEN_SEARCH_EVENT, handleOpenSearch);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener(OPEN_SEARCH_EVENT, handleOpenSearch);
    };
  }, []);

  // Function to open search - dispatches global event
  const openSearch = useCallback(() => {
    window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT));
  }, []);

  return { isOpen, setIsOpen, openSearch };
}