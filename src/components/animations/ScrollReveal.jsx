import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function ScrollReveal({ 
  children, 
  delay = 0, 
  direction = 'up', 
  distance = 30,
  className = '',
  once = true 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [once]);

  const variants = {
    up: { y: distance, opacity: 0 },
    down: { y: -distance, opacity: 0 },
    left: { x: distance, opacity: 0 },
    right: { x: -distance, opacity: 0 },
    scale: { scale: 0.9, opacity: 0 },
  };

  const animate = {
    y: direction === 'up' || direction === 'down' ? 0 : undefined,
    x: direction === 'left' || direction === 'right' ? 0 : undefined,
    scale: direction === 'scale' ? 1 : undefined,
    opacity: 1,
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={variants[direction] || variants.up}
      animate={isVisible ? animate : variants[direction] || variants.up}
      transition={{
        delay,
        type: "spring",
        stiffness: 100,
        damping: 20,
      }}
    >
      {children}
    </motion.div>
  );
}

export default ScrollReveal;

