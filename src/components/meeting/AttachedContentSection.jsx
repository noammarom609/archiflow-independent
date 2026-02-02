import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { archiflow } from '@/api/archiflow';
import { useQuery } from '@tanstack/react-query';
import {
  Image,
  Video,
  Type,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Download,
  ZoomIn,
  Maximize,
  Paperclip,
  Loader2
} from 'lucide-react';

const contentTypeConfig = {
  image: { icon: Image, label: 'תמונה', color: 'bg-blue-100 text-blue-700' },
  video: { icon: Video, label: 'סרטון', color: 'bg-purple-100 text-purple-700' },
  text: { icon: Type, label: 'טקסט', color: 'bg-green-100 text-green-700' },
  post: { icon: FileText, label: 'פוסט', color: 'bg-orange-100 text-orange-700' }
};

// Single Content Modal for single item or when clicking on carousel item
function ContentViewerModal({ item, isOpen, onClose }) {
  if (!item) return null;

  const TypeConfig = contentTypeConfig[item.type] || contentTypeConfig.post;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0" dir="rtl">
        <div className="relative">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Content Display */}
          <div className="bg-slate-900">
            {item.type === 'image' && item.file_url && (
              <div className="flex items-center justify-center min-h-[400px] p-4">
                <img 
                  src={item.file_url} 
                  alt={item.title}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            )}

            {item.type === 'video' && item.file_url && (
              <div className="min-h-[400px] flex items-center justify-center">
                <video 
                  src={item.file_url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[70vh]"
                />
              </div>
            )}

            {(item.type === 'text' || item.type === 'post') && (
              <div className="bg-white p-8 min-h-[300px] max-h-[70vh] overflow-y-auto">
                {item.post_media_url && item.type === 'post' && (
                  <div className="mb-6">
                    {item.post_media_type === 'video' ? (
                      <video src={item.post_media_url} controls className="max-w-full rounded-lg" />
                    ) : (
                      <img src={item.post_media_url} alt="" className="max-w-full rounded-lg" />
                    )}
                  </div>
                )}
                {item.rich_text_content ? (
                  <div 
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.rich_text_content }}
                  />
                ) : (
                  <div className="prose prose-lg max-w-none whitespace-pre-wrap">
                    {item.text_content}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Bar */}
          <div className="p-4 bg-white border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${TypeConfig.color}`}>
                  <TypeConfig.icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                </div>
              </div>
              {item.file_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={item.file_url} download={item.title}>
                    <Download className="w-4 h-4 ml-2" />
                    הורדה
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export default function AttachedContentSection({ contentIds }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItem, setViewerItem] = useState(null);

  // Ensure contentIds is always an array
  const safeContentIds = Array.isArray(contentIds) ? contentIds : [];
  const hasContentIds = safeContentIds.length > 0;

  // Fetch content items by IDs
  const { data: contentItems = [], isLoading } = useQuery({
    queryKey: ['attachedContent', safeContentIds],
    queryFn: async () => {
      if (safeContentIds.length === 0) return [];
      const allItems = await archiflow.entities.ContentItem.list();
      return allItems.filter(item => safeContentIds.includes(item.id));
    },
    enabled: hasContentIds,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent excessive refetching
    refetchOnWindowFocus: false,
  });

  if (!hasContentIds) return null;

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (contentItems.length === 0) return null;

  const isSingleItem = contentItems.length === 1;
  const currentItem = contentItems[currentIndex];

  const openViewer = (item) => {
    setViewerItem(item);
    setViewerOpen(true);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % contentItems.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + contentItems.length) % contentItems.length);
  };

  const getContentPreview = (item, large = false) => {
    const height = large ? 'h-64' : 'h-32';
    
    if (item.type === 'image' && item.file_url) {
      return (
        <img 
          src={item.thumbnail_url || item.file_url} 
          alt={item.title}
          className={`w-full ${height} object-cover`}
        />
      );
    }
    if (item.type === 'video' && item.file_url) {
      return (
        <div className={`w-full ${height} bg-slate-800 flex items-center justify-center relative`}>
          {item.thumbnail_url ? (
            <img src={item.thumbnail_url} alt={item.title} className={`w-full ${height} object-cover opacity-70`} />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-slate-800 mr-[-2px]" />
            </div>
          </div>
        </div>
      );
    }
    if (item.type === 'text' || item.type === 'post') {
      return (
        <div className={`w-full ${height} bg-gradient-to-br from-slate-50 to-slate-100 p-4 overflow-hidden`}>
          {item.post_media_url && item.type === 'post' ? (
            <img src={item.post_media_url} alt="" className="w-full h-full object-cover rounded" />
          ) : (
            <p className="text-sm text-slate-600 line-clamp-5">
              {item.text_content?.substring(0, 200)}...
            </p>
          )}
        </div>
      );
    }
    return (
      <div className={`w-full ${height} bg-slate-100 flex items-center justify-center`}>
        <FileText className="w-10 h-10 text-slate-400" />
      </div>
    );
  };

  return (
    <>
      <Card className="mt-6 overflow-hidden">
        <div className="bg-gradient-to-l from-primary/5 to-transparent px-4 py-3 border-b flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">חומרים מצורפים</span>
          <Badge variant="secondary" className="text-xs">{contentItems?.length || 0}</Badge>
        </div>

        <CardContent className="p-4">
          {/* Single Item View */}
          {isSingleItem ? (
            <div 
              className="cursor-pointer group relative rounded-lg overflow-hidden"
              onClick={() => openViewer(currentItem)}
            >
              {getContentPreview(currentItem, true)}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                    <Maximize className="w-5 h-5 text-slate-800" />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="text-white font-medium">{currentItem.title}</p>
                {currentItem.description && (
                  <p className="text-white/80 text-sm line-clamp-1">{currentItem.description}</p>
                )}
              </div>
            </div>
          ) : (
            /* Carousel View */
            <div className="relative">
              {/* Main Carousel Item */}
              <div 
                className="relative rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => openViewer(currentItem)}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {getContentPreview(currentItem, true)}
                  </motion.div>
                </AnimatePresence>
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                      <ZoomIn className="w-5 h-5 text-slate-800" />
                    </div>
                  </div>
                </div>

                {/* Title Overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white font-medium">{currentItem.title}</p>
                </div>
              </div>

              {/* Navigation Arrows */}
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-1/2 -translate-y-1/2 right-2 w-8 h-8 rounded-full shadow-lg"
                onClick={(e) => { e.stopPropagation(); prevSlide(); }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-1/2 -translate-y-1/2 left-2 w-8 h-8 rounded-full shadow-lg"
                onClick={(e) => { e.stopPropagation(); nextSlide(); }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {/* Thumbnails */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {contentItems.map((item, idx) => {
                  const TypeConfig = contentTypeConfig[item.type] || contentTypeConfig.post;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`
                        flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
                        ${idx === currentIndex ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-primary/50'}
                      `}
                    >
                      {item.type === 'image' && item.file_url ? (
                        <img src={item.thumbnail_url || item.file_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${TypeConfig.color}`}>
                          <TypeConfig.icon className="w-5 h-5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Dots Indicator */}
              <div className="flex justify-center gap-1.5 mt-2">
                {contentItems.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex ? 'bg-primary w-4' : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Viewer Modal */}
      <ContentViewerModal 
        item={viewerItem} 
        isOpen={viewerOpen} 
        onClose={() => setViewerOpen(false)} 
      />
    </>
  );
}