import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Page transition variants
const pageTransitionVariants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.98,
    filter: "blur(8px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "tween",
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
      damping: 20,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    filter: "blur(8px)",
    transition: {
      duration: 0.3,
    },
  },
};

// Slide transitions
const slideVariants = {
  left: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 80, damping: 20 } },
    exit: { x: 100, opacity: 0 },
  },
  right: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 80, damping: 20 } },
    exit: { x: -100, opacity: 0 },
  },
  up: {
    initial: { y: 100, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 80, damping: 20 } },
    exit: { y: -100, opacity: 0 },
  },
  down: {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 80, damping: 20 } },
    exit: { y: 100, opacity: 0 },
  },
};

// Zoom transition
const zoomVariants = {
  initial: { scale: 0.8, opacity: 0, rotateY: -10 },
  animate: { 
    scale: 1, 
    opacity: 1, 
    rotateY: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 } 
  },
  exit: { scale: 1.1, opacity: 0, rotateY: 10 },
};

// Fade with scale
const fadeScaleVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 20,
      staggerChildren: 0.08 
    } 
  },
  exit: { opacity: 0, scale: 1.02 },
};

// Page wrapper component
export function PageTransition({ children, variant = 'default', className = '' }) {
  const variants = {
    default: pageTransitionVariants,
    slide: slideVariants.up,
    slideLeft: slideVariants.left,
    slideRight: slideVariants.right,
    zoom: zoomVariants,
    fadeScale: fadeScaleVariants,
  };

  return (
    <motion.div
      className={className}
      variants={variants[variant]}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

// Section reveal on scroll
export function SectionReveal({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ 
        type: "spring", 
        stiffness: 80, 
        damping: 20, 
        delay 
      }}
    >
      {children}
    </motion.div>
  );
}

// Staggered children container
export function StaggerContainer({ children, className = '', staggerDelay = 0.1 }) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={{
        initial: { opacity: 0 },
        animate: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Child item for stagger
export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={{
        initial: { opacity: 0, y: 30, scale: 0.95 },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            type: "spring",
            stiffness: 100,
            damping: 15,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Parallax scroll effect
export function ParallaxSection({ children, className = '', speed = 0.5 }) {
  return (
    <motion.div
      className={className}
      initial={{ y: 0 }}
      whileInView={{ y: 0 }}
      viewport={{ once: false }}
      style={{
        y: 0,
      }}
      transition={{ type: "spring", stiffness: 50 }}
    >
      {children}
    </motion.div>
  );
}

// Animated list item
export function AnimatedListItem({ children, index = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: index * 0.05,
      }}
      layout
    >
      {children}
    </motion.div>
  );
}

// Hover card effect
export function HoverCard({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

// Animated modal backdrop
export function ModalBackdrop({ children, isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative z-10"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default {
  PageTransition,
  SectionReveal,
  StaggerContainer,
  StaggerItem,
  ParallaxSection,
  AnimatedListItem,
  HoverCard,
  ModalBackdrop,
};