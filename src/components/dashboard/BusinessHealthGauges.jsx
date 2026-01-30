import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Clock, TrendingUp, Sparkles } from 'lucide-react';

// Ultra advanced animated counter with spring physics
const AnimatedNumber = ({ value, duration = 2 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (!isInView) return;
    
    setIsAnimating(true);
    const startTime = Date.now();
    const startValue = 0;
    const endValue = value;
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      // Custom spring-like easing
      const easeProgress = 1 - Math.pow(1 - progress, 4) + Math.sin(progress * Math.PI) * 0.1;
      const current = Math.round(startValue + (endValue - startValue) * Math.min(easeProgress, 1));
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, isInView]);
  
  return (
    <span ref={ref} className="relative">
      <motion.span
        initial={{ scale: 1 }}
        animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {displayValue}%
      </motion.span>
      {isAnimating && (
        <motion.span
          className="absolute -top-1 -right-1"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles className="w-3 h-3 text-primary" />
        </motion.span>
      )}
    </span>
  );
};

// Ultra Advanced 3D tilt card effect with particles
const GaugeIndicator = ({ label, value, icon: Icon, colorClass, strokeColor, maxValue = 100, index }) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState([]);
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: "-50px" });
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-50, 50], [12, -12]);
  const rotateY = useTransform(x, [-50, 50], [-12, 12]);
  const brightness = useTransform(y, [-50, 50], [1.1, 0.9]);
  
  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 25 });
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 25 });
  const springBrightness = useSpring(brightness, { stiffness: 200, damping: 25 });
  
  // Generate particles on hover
  useEffect(() => {
    if (isHovered) {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [isHovered]);
  
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };
  
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60, rotateX: -25, scale: 0.8 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0, scale: 1 } : {}}
      transition={{ 
        type: "spring", 
        stiffness: 60, 
        damping: 15,
        delay: index * 0.2 
      }}
      style={{ 
        rotateX: springRotateX, 
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
        perspective: 1200,
        filter: `brightness(${springBrightness})`
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.05, z: 30 }}
      whileTap={{ scale: 0.97 }}
      className="relative cursor-pointer"
    >
      <Card className="card-hover overflow-hidden backdrop-blur-sm relative">
        {/* Animated gradient background on hover */}
        <motion.div
          className="absolute inset-0 opacity-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Floating particles on hover */}
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-1 h-1 bg-primary/40 rounded-full pointer-events-none"
              style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                y: [0, -30],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          ))}
        </AnimatePresence>
        
        {/* Shine sweep effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
          initial={{ x: '-100%' }}
          animate={isHovered ? { x: '200%' } : { x: '-100%' }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
        
        <CardContent className="p-4 md:p-6 relative z-10">
          <div className="flex flex-col items-center">
            {/* Animated Icon with pulse effect */}
            <motion.div 
              className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${colorClass} flex items-center justify-center mb-4 md:mb-6 shadow-organic relative`}
              animate={isHovered ? { 
                boxShadow: "0 0 20px rgba(152, 78, 57, 0.4)",
              } : {}}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                animate={isHovered ? { rotate: [0, -10, 10, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
              </motion.div>
              
              {/* Ripple effect on hover */}
              {isHovered && (
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-white/30"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}
            </motion.div>

            {/* Circular Progress with enhanced animation */}
            <div className="relative w-20 h-20 md:w-28 md:h-28 mb-4 md:mb-6">
              <svg className="w-20 h-20 md:w-28 md:h-28 transform -rotate-90" viewBox="0 0 112 112">
                {/* Animated background circle */}
                <motion.circle
                  cx="56"
                  cy="56"
                  r="52"
                  stroke="hsl(28 12% 90%)"
                  strokeWidth="4"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                />
                {/* Progress Circle with spring animation */}
                <motion.circle
                  cx="56"
                  cy="56"
                  r="52"
                  stroke={strokeColor}
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - percentage / 100) }}
                  transition={{ 
                    duration: 2, 
                    ease: [0.34, 1.56, 0.64, 1], // Custom spring-like easing
                    delay: 0.3 + index * 0.15 
                  }}
                />
                
                {/* Glow effect on progress */}
                <motion.circle
                  cx="56"
                  cy="56"
                  r="52"
                  stroke={strokeColor}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - percentage / 100)}
                  opacity={0.2}
                  filter="blur(4px)"
                />

                {/* Animated dot at end of progress */}
                <motion.circle
                  cx="56"
                  cy="4"
                  r="4"
                  fill={strokeColor}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: isHovered ? 1 : 0.7,
                    scale: isHovered ? [1, 1.3, 1] : 1
                  }}
                  transition={{ duration: 0.5, repeat: isHovered ? Infinity : 0 }}
                  style={{
                    transformOrigin: "56px 56px",
                    rotate: `${(percentage / 100) * 360 - 90}deg`
                  }}
                />
                </svg>
              
              {/* Center Text with animated counter */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.5 + index * 0.1 }}
              >
                <span className="text-lg md:text-2xl font-semibold text-foreground tracking-tight">
                  <AnimatedNumber value={Math.round(percentage)} duration={1.5 + index * 0.2} />
                </span>
              </motion.div>
            </div>

            {/* Label with stagger animation */}
            <motion.h3 
              className="text-base md:text-lg font-semibold text-foreground text-center mb-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              {label}
            </motion.h3>
            <motion.p 
              className="text-sm text-muted-foreground text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              {typeof value === 'number' && value > 1000 
                ? value.toLocaleString() 
                : value} מתוך {typeof maxValue === 'number' && maxValue > 1000 
                  ? maxValue.toLocaleString() 
                  : maxValue}
            </motion.p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function BusinessHealthGauges({ onGaugeClick, projects = [], invoices = [], proposals = [] }) {
  // Real data - מדדי בריאות עסקית
  
  // גבייה: כמה כסף נגבה מתוך החשבוניות שנשלחו
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);
  
  // עמידה בלו"ז: כמה פרויקטים פעילים (לא בעיכוב)
  const activeProjects = projects.filter(p => 
    p.status !== 'completion' && p.status !== 'cancelled'
  ).length;
  const projectsOnSchedule = projects.filter(p => {
    const daysInStage = Math.floor((Date.now() - new Date(p.updated_date).getTime()) / (1000 * 60 * 60 * 24));
    return daysInStage <= 30;
  }).length;
  
  // המרות: כמה הצעות מחיר אושרו מתוך הנשלחות
  const sentProposals = proposals.filter(p => p.status === 'sent' || p.status === 'approved').length;
  const approvedProposals = proposals.filter(p => p.status === 'approved').length;

  // Organic Modernism color palette
  const gauges = [
    {
      label: 'המרות',
      value: approvedProposals,
      maxValue: Math.max(sentProposals, 1),
      icon: TrendingUp,
      colorClass: 'bg-taupe-500',
      strokeColor: '#8C7D70', // Taupe
    },
    {
      label: 'עמידה בלו״ז',
      value: projectsOnSchedule,
      maxValue: Math.max(activeProjects, 1),
      icon: Clock,
      colorClass: 'bg-forest-700',
      strokeColor: '#354231', // Forest Green
    },
    {
      label: 'גבייה',
      value: totalPaid,
      maxValue: Math.max(totalInvoiced, 1),
      icon: DollarSign,
      colorClass: 'bg-primary',
      strokeColor: '#984E39', // Terracotta
    },
  ];

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      }
    }
  };

  return (
    <motion.div 
      className="mb-4 sm:mb-6 md:mb-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.h2 
        className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 tracking-tight"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        מדדי ביצוע
      </motion.h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-6" style={{ perspective: 1000 }}>
        {gauges.map((gauge, index) => (
          <div
            key={gauge.label}
            onClick={() => onGaugeClick && onGaugeClick(gauge.label)}
          >
            <GaugeIndicator {...gauge} index={index} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}