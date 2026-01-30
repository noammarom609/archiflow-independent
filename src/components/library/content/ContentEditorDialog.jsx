import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save,
  X,
  Plus,
  Loader2,
  Image,
  Video,
  Type,
  Crop,
  SlidersHorizontal,
  Scissors,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sun,
  Contrast,
  Palette,
  Bold,
  Italic,
  Underline,
  AlignRight,
  AlignCenter,
  AlignLeft,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Maximize,
} from 'lucide-react';
import { showSuccess, showError } from '../../utils/notifications';
import ImageEditor from './ImageEditor';
import VideoEditor from './VideoEditor';
import RichTextEditor from './RichTextEditor';

export default function ContentEditorDialog({ item, onClose }) {
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [textContent, setTextContent] = useState(item?.text_content || '');
  const [tags, setTags] = useState(item?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showFullEditor, setShowFullEditor] = useState(false);
  
  // Image editing state
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(100);

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.ContentItem.update(item.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentItems'] });
      showSuccess('התוכן עודכן בהצלחה');
      onClose();
    },
    onError: () => showError('שגיאה בעדכון'),
  });

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        title,
        description,
        text_content: textContent,
        tags,
        metadata: {
          ...item.metadata,
          brightness,
          contrast,
          saturation,
          rotation,
          scale,
        }
      });
    } catch (e) {
      setIsSaving(false);
    }
  };

  const handleResetImageEdits = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setScale(100);
  };

  const handleAdvancedImageSave = (edits) => {
    setBrightness(edits.brightness);
    setContrast(edits.contrast);
    setSaturation(edits.saturation);
    setRotation(edits.rotation);
    setScale(edits.scale);
    setShowFullEditor(false);
  };

  const handleAdvancedVideoSave = (edits) => {
    // Save video edits to metadata
    setShowFullEditor(false);
  };

  const handleRichTextSave = (html) => {
    setTextContent(html);
    setShowFullEditor(false);
  };

  const imageStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
    transform: `rotate(${rotation}deg) scale(${scale / 100})`,
  };

  // Full screen editors
  if (showFullEditor) {
    if (item.type === 'image') {
      return (
        <Dialog open={true} onOpenChange={() => setShowFullEditor(false)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
            <ImageEditor 
              imageUrl={item.file_url}
              onSave={handleAdvancedImageSave}
              onCancel={() => setShowFullEditor(false)}
            />
          </DialogContent>
        </Dialog>
      );
    }
    if (item.type === 'video') {
      return (
        <Dialog open={true} onOpenChange={() => setShowFullEditor(false)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
            <VideoEditor 
              videoUrl={item.file_url}
              onSave={handleAdvancedVideoSave}
              onCancel={() => setShowFullEditor(false)}
            />
          </DialogContent>
        </Dialog>
      );
    }
    if (item.type === 'text' || item.type === 'post') {
      return (
        <Dialog open={true} onOpenChange={() => setShowFullEditor(false)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
            <RichTextEditor 
              content={textContent}
              onChange={setTextContent}
              onSave={handleRichTextSave}
              onCancel={() => setShowFullEditor(false)}
            />
          </DialogContent>
        </Dialog>
      );
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {item.type === 'image' && <Image className="w-5 h-5" />}
            {item.type === 'video' && <Video className="w-5 h-5" />}
            {item.type === 'text' && <Type className="w-5 h-5" />}
            עריכת {item.type === 'image' ? 'תמונה' : item.type === 'video' ? 'סרטון' : item.type === 'text' ? 'טקסט' : 'פוסט'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="mb-4">
            <TabsTrigger value="general">כללי</TabsTrigger>
            {item.type === 'image' && <TabsTrigger value="edit">עריכת תמונה</TabsTrigger>}
            {item.type === 'video' && <TabsTrigger value="edit">עריכת סרטון</TabsTrigger>}
            {(item.type === 'text' || item.type === 'post') && <TabsTrigger value="edit">עריכת טקסט</TabsTrigger>}
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Preview */}
            {item.file_url && (item.type === 'image' || item.type === 'post') && (
              <div className="rounded-lg overflow-hidden bg-muted flex items-center justify-center h-48">
                <img 
                  src={item.file_url || item.post_media_url} 
                  alt={item.title}
                  className="max-h-full object-contain"
                />
              </div>
            )}

            <div>
              <Label>כותרת</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <Label>תיאור</Label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Tags */}
            <div>
              <Label>תגיות</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="הוסף תגית"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Image Edit Tab */}
          {item.type === 'image' && (
            <TabsContent value="edit" className="space-y-4">
              {/* Open Full Editor Button */}
              <Button 
                onClick={() => setShowFullEditor(true)}
                className="w-full"
                variant="outline"
              >
                <Maximize className="w-4 h-4 ml-2" />
                פתח עורך מתקדם במסך מלא
              </Button>

              <div className="grid grid-cols-2 gap-4">
                {/* Preview with effects */}
                <div className="bg-muted rounded-lg p-4 flex items-center justify-center min-h-[300px] overflow-hidden">
                  <img 
                    src={item.file_url} 
                    alt={item.title}
                    className="max-w-full max-h-[280px] object-contain transition-all"
                    style={imageStyle}
                  />
                </div>

                {/* Controls */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      התאמות
                    </h3>
                    <Button variant="ghost" size="sm" onClick={handleResetImageEdits}>
                      <RotateCw className="w-4 h-4 ml-1" />
                      איפוס
                    </Button>
                  </div>

                  {/* Brightness */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="flex items-center gap-1">
                        <Sun className="w-4 h-4" />
                        בהירות
                      </span>
                      <span>{brightness}%</span>
                    </div>
                    <Slider
                      value={[brightness]}
                      onValueChange={([v]) => setBrightness(v)}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  {/* Contrast */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="flex items-center gap-1">
                        <Contrast className="w-4 h-4" />
                        ניגודיות
                      </span>
                      <span>{contrast}%</span>
                    </div>
                    <Slider
                      value={[contrast]}
                      onValueChange={([v]) => setContrast(v)}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  {/* Saturation */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="flex items-center gap-1">
                        <Palette className="w-4 h-4" />
                        רוויה
                      </span>
                      <span>{saturation}%</span>
                    </div>
                    <Slider
                      value={[saturation]}
                      onValueChange={([v]) => setSaturation(v)}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  {/* Rotation */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="flex items-center gap-1">
                        <RotateCw className="w-4 h-4" />
                        סיבוב
                      </span>
                      <span>{rotation}°</span>
                    </div>
                    <Slider
                      value={[rotation]}
                      onValueChange={([v]) => setRotation(v)}
                      min={0}
                      max={360}
                      step={1}
                    />
                  </div>

                  {/* Scale */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="flex items-center gap-1">
                        <ZoomIn className="w-4 h-4" />
                        גודל
                      </span>
                      <span>{scale}%</span>
                    </div>
                    <Slider
                      value={[scale]}
                      onValueChange={([v]) => setScale(v)}
                      min={10}
                      max={200}
                      step={1}
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => setRotation(r => (r + 90) % 360)}>
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <Crop className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Video Edit Tab */}
          {item.type === 'video' && (
            <TabsContent value="edit" className="space-y-4">
              {/* Open Full Editor Button */}
              <Button 
                onClick={() => setShowFullEditor(true)}
                className="w-full"
                variant="outline"
              >
                <Maximize className="w-4 h-4 ml-2" />
                פתח עורך סרטון מתקדם
              </Button>

              <div className="bg-muted rounded-lg p-4 flex items-center justify-center min-h-[300px]">
                {item.file_url ? (
                  <video 
                    src={item.file_url} 
                    controls 
                    className="max-w-full max-h-[280px]"
                  />
                ) : (
                  <p className="text-muted-foreground">אין סרטון</p>
                )}
              </div>
            </TabsContent>
          )}

          {/* Text Edit Tab */}
          {(item.type === 'text' || item.type === 'post') && (
            <TabsContent value="edit" className="space-y-4">
              {/* Open Full Editor Button */}
              <Button 
                onClick={() => setShowFullEditor(true)}
                className="w-full"
                variant="outline"
              >
                <Maximize className="w-4 h-4 ml-2" />
                פתח עורך טקסט מתקדם
              </Button>

              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="הזן את הטקסט..."
                rows={12}
                className="font-sans text-base"
              />
            </TabsContent>
          )}
        </Tabs>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                שמור שינויים
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}