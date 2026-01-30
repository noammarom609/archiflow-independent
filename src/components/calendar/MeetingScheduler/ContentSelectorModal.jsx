import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { archiflow } from '@/api/archiflow';
import { useQuery } from '@tanstack/react-query';
import {
  Image,
  Video,
  Type,
  FileText,
  Search,
  Loader2,
  Check,
  X,
  Library
} from 'lucide-react';

const contentTypeConfig = {
  image: { icon: Image, label: 'תמונה', color: 'bg-blue-100 text-blue-700' },
  video: { icon: Video, label: 'סרטון', color: 'bg-purple-100 text-purple-700' },
  text: { icon: Type, label: 'טקסט', color: 'bg-green-100 text-green-700' },
  post: { icon: FileText, label: 'פוסט', color: 'bg-orange-100 text-orange-700' }
};

export default function ContentSelectorModal({ isOpen, onClose, onSelect, selectedIds = [] }) {
  const [search, setSearch] = useState('');
  const [localSelected, setLocalSelected] = useState(selectedIds);
  const [filterType, setFilterType] = useState('all');

  const { data: contentItems = [], isLoading } = useQuery({
    queryKey: ['contentItems'],
    queryFn: () => archiflow.entities.ContentItem.filter({ status: 'ready' }, '-created_date', 50),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent excessive refetching
    refetchOnWindowFocus: false,
  });

  const filteredItems = contentItems.filter(item => {
    const matchesSearch = !search || 
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const toggleItem = (itemId) => {
    setLocalSelected(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleConfirm = () => {
    onSelect(localSelected);
    onClose();
  };

  const getContentPreview = (item) => {
    if (item.type === 'image' && item.file_url) {
      return (
        <img 
          src={item.thumbnail_url || item.file_url} 
          alt={item.title}
          className="w-full h-24 object-cover rounded"
        />
      );
    }
    if (item.type === 'video' && item.file_url) {
      return (
        <div className="w-full h-24 bg-slate-800 rounded flex items-center justify-center">
          <Video className="w-8 h-8 text-white/70" />
        </div>
      );
    }
    if (item.type === 'text' || item.type === 'post') {
      return (
        <div className="w-full h-24 bg-slate-100 rounded p-2 overflow-hidden">
          <p className="text-xs text-slate-600 line-clamp-4">
            {item.text_content?.substring(0, 100)}...
          </p>
        </div>
      );
    }
    return (
      <div className="w-full h-24 bg-slate-100 rounded flex items-center justify-center">
        <FileText className="w-8 h-8 text-slate-400" />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="w-5 h-5 text-primary" />
            בחירת תכנים מהספרייה
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search & Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש תוכן..."
                className="pr-10"
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                הכל
              </Button>
              {Object.entries(contentTypeConfig).map(([type, config]) => (
                <Button
                  key={type}
                  variant={filterType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(type)}
                  className="gap-1"
                >
                  <config.icon className="w-3 h-3" />
                </Button>
              ))}
            </div>
          </div>

          {/* Selected Count */}
          {localSelected.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">{localSelected.length} נבחרו</Badge>
              <Button variant="ghost" size="sm" onClick={() => setLocalSelected([])}>
                <X className="w-3 h-3 ml-1" />
                נקה בחירה
              </Button>
            </div>
          )}

          {/* Content Grid */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Library className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>לא נמצאו תכנים</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredItems.map(item => {
                  const isSelected = localSelected.includes(item.id);
                  const TypeConfig = contentTypeConfig[item.type] || contentTypeConfig.post;
                  const TypeIcon = TypeConfig.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`
                        relative border rounded-lg overflow-hidden cursor-pointer transition-all
                        ${isSelected ? 'ring-2 ring-primary border-primary' : 'border-border hover:border-primary/50'}
                      `}
                    >
                      {/* Preview */}
                      {getContentPreview(item)}

                      {/* Info */}
                      <div className="p-2">
                        <div className="flex items-start gap-2">
                          <div className={`w-6 h-6 rounded flex items-center justify-center ${TypeConfig.color}`}>
                            <TypeIcon className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                          </div>
                        </div>
                      </div>

                      {/* Selected Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button onClick={handleConfirm} className="gap-2">
              <Check className="w-4 h-4" />
              אישור ({localSelected.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}