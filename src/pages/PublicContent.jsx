import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { archiflow } from '@/api/archiflow';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Image,
  Video,
  Type,
  FileText,
  Download,
  Share2,
  Loader2,
  AlertCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Eye,
  Calendar,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

export default function PublicContent() {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const contentRef = useRef(null);
  const videoRef = useRef(null);

  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  // Fetch content by share token
  const { data: contentItems = [], isLoading, error } = useQuery({
    queryKey: ['publicContent', token],
    queryFn: async () => {
      const items = await archiflow.entities.ContentItem.filter({
        'share_settings.share_token': token
      });
      return items;
    },
    enabled: !!token,
  });

  const item = contentItems[0];
  const displayStyle = item?.share_settings?.display_style || {};

  // Update view count
  useEffect(() => {
    if (item) {
      const currentCount = item.share_settings?.view_count || 0;
      archiflow.entities.ContentItem.update(item.id, {
        share_settings: {
          ...item.share_settings,
          view_count: currentCount + 1,
        }
      }).catch(() => {});
    }
  }, [item?.id]);

  // Fullscreen handling
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      contentRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        document.exitFullscreen();
      }
      if (e.key === '+' || e.key === '=') {
        setImageZoom(z => Math.min(z + 0.25, 3));
      }
      if (e.key === '-') {
        setImageZoom(z => Math.max(z - 0.25, 0.5));
      }
      if (e.key === 'r') {
        setImageRotation(r => (r + 90) % 360);
      }
      if (e.key === ' ' && item?.type === 'video' && videoRef.current) {
        e.preventDefault();
        if (videoRef.current.paused) {
          videoRef.current.play();
          setVideoPlaying(true);
        } else {
          videoRef.current.pause();
          setVideoPlaying(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, item?.type]);

  const resetImageView = () => {
    setImageZoom(1);
    setImageRotation(0);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">קישור לא תקין</h1>
            <p className="text-muted-foreground">הקישור שניסית לגשת אליו אינו תקין או שפג תוקפו.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">טוען תוכן...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">תוכן לא נמצא</h1>
            <p className="text-muted-foreground">התוכן שחיפשת אינו זמין או שפג תוקף הקישור.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bgColor = displayStyle.background_color || '#f8fafc';
  const accentColor = displayStyle.accent_color || '#4338ca';

  const getTypeIcon = () => {
    switch (item.type) {
      case 'image': return Image;
      case 'video': return Video;
      case 'text': return Type;
      case 'post': return FileText;
      default: return FileText;
    }
  };

  const TypeIcon = getTypeIcon();

  return (
    <div 
      className="min-h-screen py-8 px-4" 
      dir="rtl"
      style={{ backgroundColor: bgColor }}
    >
      {/* Header with Logo */}
      {displayStyle.show_logo !== false && (
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {displayStyle.logo_url ? (
            <img 
              src={displayStyle.logo_url} 
              alt="Logo" 
              className="h-12 mx-auto mb-4"
            />
          ) : (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg bg-white">
                <img 
                  src="/archiflow-logoV2.png" 
                  alt="ArchiFlow" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold">ArchiFlow</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Content Card */}
      <motion.div
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        ref={contentRef}
      >
        <Card className={`overflow-hidden shadow-2xl ${isFullscreen ? 'rounded-none h-screen flex flex-col' : ''}`}>
          {/* Content Display */}
          <div className={`bg-gray-900 relative ${isFullscreen ? 'flex-1 flex items-center justify-center' : ''}`}>
            {/* Image Content */}
            {item.type === 'image' && item.file_url && (
              <div className={`flex items-center justify-center p-4 ${isFullscreen ? 'h-full' : 'min-h-[400px]'} relative group`}>
                <motion.img 
                  src={item.file_url} 
                  alt={item.title}
                  className={`${isFullscreen ? 'max-h-[90vh]' : 'max-h-[70vh]'} object-contain rounded-lg shadow-lg cursor-zoom-in transition-all`}
                  style={{
                    transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                  }}
                  onClick={() => setImageZoom(z => z === 1 ? 1.5 : 1)}
                />
                
                {/* Image Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => setImageZoom(z => Math.max(z - 0.25, 0.5))}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-white text-sm min-w-[50px] text-center">{Math.round(imageZoom * 100)}%</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => setImageZoom(z => Math.min(z + 0.25, 3))}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <div className="w-px h-4 bg-white/30" />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => setImageRotation(r => (r + 90) % 360)}
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                  <div className="w-px h-4 bg-white/30" />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Video Content */}
            {item.type === 'video' && item.file_url && (
              <div className={`relative bg-black group ${isFullscreen ? 'h-full flex items-center justify-center' : ''}`}>
                <video 
                  ref={videoRef}
                  src={item.file_url}
                  className={`w-full ${isFullscreen ? 'max-h-[90vh]' : 'max-h-[70vh]'}`}
                  controls
                  autoPlay={false}
                  muted={videoMuted}
                  onPlay={() => setVideoPlaying(true)}
                  onPause={() => setVideoPlaying(false)}
                />
                
                {/* Fullscreen button for video */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-4 right-4 h-10 w-10 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </Button>
              </div>
            )}

            {/* Text Content */}
            {item.type === 'text' && (
              <div className={`bg-white ${isFullscreen ? 'h-full overflow-auto' : ''}`}>
                <div className={`p-8 ${isFullscreen ? 'max-w-4xl mx-auto' : 'min-h-[300px]'}`}>
                  {item.rich_text_content ? (
                    <div 
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: item.rich_text_content }}
                    />
                  ) : (
                    <div 
                      className="prose prose-lg max-w-none"
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {item.text_content}
                    </div>
                  )}
                </div>
                {!isFullscreen && (
                  <div className="flex justify-center pb-4">
                    <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                      <Maximize className="w-4 h-4 ml-2" />
                      קריאה במסך מלא
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Post Content */}
            {item.type === 'post' && (
              <div>
                {/* Post Media */}
                {item.post_media_url && (
                  <div className="flex items-center justify-center p-4 bg-gray-100">
                    {item.post_media_type === 'video' ? (
                      <video 
                        src={item.post_media_url}
                        className="max-w-full max-h-[50vh]"
                        controls
                      />
                    ) : (
                      <img 
                        src={item.post_media_url} 
                        alt={item.title}
                        className="max-w-full max-h-[50vh] object-contain rounded-lg"
                      />
                    )}
                  </div>
                )}
                {/* Post Text */}
                {item.text_content && (
                  <div className="p-6 bg-white">
                    <p className="text-lg leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
                      {item.text_content}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Section */}
          {!isFullscreen && (
            <CardContent className="p-6 bg-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                    >
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">{item.title}</h1>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {item.share_settings?.view_count || 0} צפיות
                        </span>
                        {item.created_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(item.created_date).toLocaleDateString('he-IL')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {item.description && (
                    <p className="text-muted-foreground mt-3 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {item.tags.map(tag => (
                        <Badge 
                          key={tag}
                          variant="secondary"
                          className="rounded-full"
                          style={{ backgroundColor: `${accentColor}10`, color: accentColor }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {item.file_url && (
                    <Button 
                      variant="outline"
                      className="hover-lift"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = item.file_url;
                        link.download = item.title;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Download className="w-4 h-4 ml-2" />
                      הורדה
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="hover-lift"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                    }}
                  >
                    <Share2 className="w-4 h-4 ml-2" />
                    שיתוף
                  </Button>
                </div>
              </div>
            </CardContent>
          )}

          {/* Fullscreen Exit Button */}
          {isFullscreen && (
            <Button
              className="fixed top-4 right-4 z-50 bg-black/70 hover:bg-black/90 text-white"
              onClick={() => document.exitFullscreen()}
            >
              <X className="w-4 h-4 ml-2" />
              יציאה ממסך מלא
            </Button>
          )}
        </Card>

        {/* Footer */}
        <motion.div 
          className="text-center mt-8 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p>נוצר באמצעות ArchiFlow</p>
        </motion.div>
      </motion.div>
    </div>
  );
}