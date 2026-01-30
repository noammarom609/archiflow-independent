import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function BlurText({ children, delay = 0, duration = 0.6, className = '' }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
      transition={{
        delay,
        duration,
        ease: [0.4, 0, 0.2, 1],
      }}
      style={{
        // Use CSS transition for blur to avoid Framer Motion spring overshoot
        filter: isVisible ? 'blur(0px)' : 'blur(10px)',
        transition: `filter ${duration}s ease-out ${delay}s`,
      }}
    >
      {children}
    </motion.span>
  );
}

export default BlurText;

