import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { archiflow } from '@/api/archiflow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Image,
  Video,
  Type,
  FileText,
  X,
  Plus,
  Loader2,
} from 'lucide-react';
import { showSuccess, showError } from '../../utils/notifications';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function ContentUploadDialog({ isOpen, onClose, contentType }) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [postMediaType, setPostMediaType] = useState('image');
  const [isUploading, setIsUploading] = useState(false);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => archiflow.entities.ContentItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentItems'] });
      showSuccess('תוכן נוסף בהצלחה!');
      handleClose();
    },
    onError: () => showError('שגיאה בהוספת התוכן'),
  });

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setTags([]);
    setTagInput('');
    setFile(null);
    setFilePreview(null);
    setTextContent('');
    setIsUploading(false);
    onClose();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result);
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type.startsWith('video/')) {
        setFilePreview(URL.createObjectURL(selectedFile));
      }
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showError('יש להזין כותרת');
      return;
    }

    setIsUploading(true);

    try {
      let fileUrl = null;
      let thumbnailUrl = null;

      // Upload file if exists
      if (file) {
        const { file_url } = await archiflow.integrations.Core.UploadFile({ file });
        fileUrl = file_url;
        
        // For images, use the same URL as thumbnail
        if (contentType === 'image') {
          thumbnailUrl = file_url;
        }
      }

      const contentData = {
        title: title.trim(),
        type: contentType,
        description: description.trim(),
        tags,
        file_url: fileUrl,
        thumbnail_url: thumbnailUrl,
        text_content: contentType === 'text' || contentType === 'post' ? textContent : null,
        post_media_type: contentType === 'post' ? postMediaType : null,
        post_media_url: contentType === 'post' && file ? fileUrl : null,
        status: 'ready',
      };

      await createMutation.mutateAsync(contentData);
    } catch (error) {
      console.error('Upload error:', error);
      showError('שגיאה בהעלאה');
      setIsUploading(false);
    }
  };

  const getTypeIcon = () => {
    switch (contentType) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'text': return <Type className="w-5 h-5" />;
      case 'post': return <FileText className="w-5 h-5" />;
      default: return <Upload className="w-5 h-5" />;
    }
  };

  const getTypeName = () => {
    switch (contentType) {
      case 'image': return 'תמונה';
      case 'video': return 'סרטון';
      case 'text': return 'טקסט';
      case 'post': return 'פוסט';
      default: return 'תוכן';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon()}
            הוספת {getTypeName()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label>כותרת *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`כותרת ה${getTypeName()}`}
            />
          </div>

          {/* Description */}
          <div>
            <Label>תיאור</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור קצר"
              rows={2}
            />
          </div>

          {/* File Upload - for image/video */}
          {(contentType === 'image' || contentType === 'video') && (
            <div>
              <Label>קובץ {contentType === 'image' ? 'תמונה' : 'סרטון'}</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                {filePreview ? (
                  <div className="relative">
                    {contentType === 'image' ? (
                      <img src={filePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    ) : (
                      <video src={filePreview} controls className="max-h-48 mx-auto rounded-lg" />
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => { setFile(null); setFilePreview(null); }}
                      aria-label={t('a11y.removeFile')}
                    >
                      <X className="w-4 h-4" aria-hidden />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept={contentType === 'image' ? 'image/*' : 'video/*'}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="py-8">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        גרור קובץ או לחץ לבחירה
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Text Content - for text type */}
          {contentType === 'text' && (
            <div>
              <Label>תוכן הטקסט</Label>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="הזן את הטקסט..."
                rows={6}
              />
            </div>
          )}

          {/* Post Content - text + optional media */}
          {contentType === 'post' && (
            <>
              <div>
                <Label>תוכן הפוסט</Label>
                <Textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="כתוב את תוכן הפוסט..."
                  rows={4}
                />
              </div>
              <div>
                <Label>מדיה מצורפת (אופציונלי)</Label>
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant={postMediaType === 'image' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPostMediaType('image')}
                  >
                    <Image className="w-4 h-4 ml-1" />
                    תמונה
                  </Button>
                  <Button
                    type="button"
                    variant={postMediaType === 'video' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPostMediaType('video')}
                  >
                    <Video className="w-4 h-4 ml-1" />
                    סרטון
                  </Button>
                  <Button
                    type="button"
                    variant={postMediaType === 'none' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setPostMediaType('none'); setFile(null); setFilePreview(null); }}
                  >
                    ללא
                  </Button>
                </div>
                {postMediaType !== 'none' && (
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    {filePreview ? (
                      <div className="relative">
                        {postMediaType === 'image' ? (
                          <img src={filePreview} alt="Preview" className="max-h-32 mx-auto rounded-lg" />
                        ) : (
                          <video src={filePreview} controls className="max-h-32 mx-auto rounded-lg" />
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => { setFile(null); setFilePreview(null); }}
                          aria-label={t('a11y.removeFile')}
                        >
                          <X className="w-4 h-4" aria-hidden />
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept={postMediaType === 'image' ? 'image/*' : 'video/*'}
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="py-4">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">העלה קובץ</p>
                        </div>
                      </label>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

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
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              ביטול
            </Button>
            <Button onClick={handleSubmit} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מעלה...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף {getTypeName()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}