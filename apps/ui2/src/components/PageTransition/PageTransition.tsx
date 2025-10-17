import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
  animationType?: 'fade' | 'slide' | 'scale' | 'slideUp';
  duration?: number;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  animationType = 'slideUp',
  duration = 300 
}) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [currentPath, setCurrentPath] = useState(location.pathname);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip animation on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setShouldAnimate(true); // Enable animations after initial mount
      return;
    }

    // Only animate on route changes, not initial load
    if (shouldAnimate && currentPath !== location.pathname) {
      // Start exit animation
      setIsVisible(false);
      
      // After exit animation completes, update path and start enter animation
      const timer = setTimeout(() => {
        setCurrentPath(location.pathname);
        setIsVisible(true);
      }, duration / 2);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, duration, currentPath, shouldAnimate]);

  const getAnimationStyles = () => {
    const baseTransition = `opacity ${duration}ms ease-in-out, transform ${duration}ms ease-in-out`;
    const noTransition = 'none';
    
    // Don't apply transitions on initial mount
    const transition = shouldAnimate ? baseTransition : noTransition;
    const fadeTransition = shouldAnimate ? `opacity ${duration}ms ease-in-out` : noTransition;
    
    switch (animationType) {
      case 'fade':
        return {
          opacity: isVisible ? 1 : 0,
          transform: 'none',
          transition: fadeTransition,
        };
      
      case 'slide':
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
          transition: transition,
        };
      
      case 'scale':
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          transition: transition,
        };
      
      case 'slideUp':
      default:
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: transition,
        };
    }
  };

  return (
    <div
      style={{
        ...getAnimationStyles(),
        width: '100%',
        height: '100%',
      }}
      key={currentPath} // Force re-render for new pages
    >
      {children}
    </div>
  );
};
