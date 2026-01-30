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
      initial={{ filter: 'blur(10px)', opacity: 0 }}
      animate={isVisible ? { filter: 'blur(0px)', opacity: 1 } : { filter: 'blur(10px)', opacity: 0 }}
      transition={{
        delay,
        duration,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      {children}
    </motion.span>
  );
}

export default BlurText;

