import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Clock, Calendar } from 'lucide-react';
import LandingLayout from '../components/landing/LandingLayout';
import LandingCTA from '../components/landing/LandingCTA';
import { useLandingLanguage } from '../components/landing/LandingLanguageContext';

// Animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

// Hero Section
function BlogHero() {
  const { t } = useLandingLanguage();
  const blogT = t('blog');

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F7F5F2] via-white to-white pt-8 sm:pt-12 pb-8 sm:pb-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[800px] h-[300px] sm:h-[600px] bg-gradient-radial from-[#984E39]/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <motion.p 
          className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider mb-3 sm:mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {blogT.hero?.label}
        </motion.p>
        
        <motion.h1 
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-3 sm:mb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {blogT.hero?.title}
        </motion.h1>

        <motion.p 
          className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-2"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {blogT.hero?.subtitle}
        </motion.p>
      </div>
    </section>
  );
}

// Featured Post
function FeaturedPost({ post }) {
  const { t, isRTL } = useLandingLanguage();
  const blogT = t('blog');

  return (
    <motion.article
      className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-gray-100 shadow-lg mb-8 sm:mb-12 md:mb-16"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="grid md:grid-cols-2">
        <div className="relative h-48 sm:h-64 md:h-auto overflow-hidden">
          <img 
            src={post.image} 
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <Badge className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-primary text-white text-xs sm:text-sm">
            {blogT.featured}
          </Badge>
        </div>
        <div className="p-5 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-center">
          <Badge variant="outline" className="w-fit mb-3 sm:mb-4 text-xs sm:text-sm text-primary border-primary/30">
            {post.category}
          </Badge>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {post.readTime}
            </span>
          </div>
          <button className="flex items-center gap-2 text-sm sm:text-base text-primary font-semibold group-hover:gap-3 transition-all">
            {blogT.readArticle}
            {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

// Blog Card
function BlogCard({ post }) {
  const { t, isRTL } = useLandingLanguage();
  const blogT = t('blog');

  return (
    <motion.article
      variants={fadeInUp}
      className="group bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <img 
          src={post.image} 
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 sm:p-6">
        <Badge variant="outline" className="mb-2 sm:mb-3 text-[10px] sm:text-xs text-primary border-primary/30">
          {post.category}
        </Badge>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            {post.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            {post.readTime}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

// Blog Grid
function BlogGrid() {
  const { t } = useLandingLanguage();
  const blogT = t('blog');

  const posts = blogT.posts || [];
  const featuredPost = posts.find(p => p.featured);
  const otherPosts = posts.filter(p => !p.featured);

  return (
    <section className="py-8 sm:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Featured Post */}
        {featuredPost && <FeaturedPost post={featuredPost} />}

        {/* Posts Grid */}
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {otherPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Newsletter Section
function NewsletterSection() {
  const { t } = useLandingLanguage();
  const blogT = t('blog');

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.h2 
          className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {blogT.newsletter?.title}
        </motion.h2>
        <motion.p 
          className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {blogT.newsletter?.subtitle}
        </motion.p>
        <motion.form 
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            placeholder={blogT.newsletter?.placeholder}
            className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm sm:text-base"
          />
          <button
            type="submit"
            className="px-5 sm:px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition-colors text-sm sm:text-base"
          >
            {blogT.newsletter?.button}
          </button>
        </motion.form>
      </div>
    </section>
  );
}

// Main Component
export default function LandingBlog() {
  return (
    <LandingLayout>
      <BlogHero />
      <BlogGrid />
      <NewsletterSection />
      <LandingCTA />
    </LandingLayout>
  );
}