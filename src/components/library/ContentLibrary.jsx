import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/utils/authHelpers';
import {
  Image,
  Video,
  Type,
  FileText,
  Plus,
  Search,
  ArrowRight,
  Grid3x3,
  List,
  MoreVertical,
  Eye,
  Share2,
  Trash2,
  Download,
  Edit,
  Send,
  FolderOpen,
  Star,
  Filter,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { showSuccess, showError } from '../utils/notifications';
import PageHeader from '../layout/PageHeader';
import ContentUploadDialog from './content/ContentUploadDialog';
import ContentEditorDialog from './content/ContentEditorDialog';
import ContentShareDialog from './content/ContentShareDialog';

const contentTypes = [
  { id: 'all', name: 'הכל', icon: FolderOpen },
  { id: 'image', name: 'תמונות', icon: Image },
  { id: 'video', name: 'סרטונים', icon: Video },
  { id: 'text', name: 'טקסטים', icon: Type },
  { id: 'post', name: 'פוסטים', icon: FileText },
];

export default function ContentLibrary({ onBack }) {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [sharingItem, setSharingItem] = useState(null);
  const [uploadType, setUploadType] = useState('image');

  const queryClient = useQueryClient();

  // Fetch current user for multi-tenant filtering (with bypass support)
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(archiflow),
  });

  const isSuperAdmin = user?.app_role === 'super_admin';

  // Fetch content items
  const { data: allContentItems = [], isLoading } = useQuery({
    queryKey: ['contentItems'],
    queryFn: () => archiflow.entities.ContentItem.list('-created_date'),
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent excessive refetching
    refetchOnWindowFocus: false,
  });

  // Multi-tenant filtering
  const contentItems = isSuperAdmin 
    ? allContentItems 
    : allContentItems.filter(item => item.created_by === user?.email);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => archiflow.entities.ContentItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentItems'] });
      showSuccess('תוכן נמחק בהצלחה');
    },
    onError: () => showError('שגיאה במחיקה'),
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, is_favorite }) => 
      archiflow.entities.ContentItem.update(id, { is_favorite: !is_favorite }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contentItems'] }),
  });

  // Filter items
  const filteredItems = contentItems.filter(item => {
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleItemSelect = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    for (const id of selectedItems) {
      await deleteMutation.mutateAsync(id);
    }
    setSelectedItems([]);
  };

  const handleOpenUpload = (type) => {
    setUploadType(type);
    setShowUploadDialog(true);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'image': return Image;
      case 'video': return Video;
      case 'text': return Type;
      case 'post': return FileText;
      default: return FileText;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'image': return 'bg-blue-100 text-blue-600';
      case 'video': return 'bg-purple-100 text-purple-600';
      case 'text': return 'bg-green-100 text-green-600';
      case 'post': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'image': return 'תמונה';
      case 'video': return 'סרטון';
      case 'text': return 'טקסט';
      case 'post': return 'פוסט';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" dir="rtl">
      {/* Upload Dialog */}
      <ContentUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        contentType={uploadType}
      />

      {/* Editor Dialog */}
      {editingItem && (
        <ContentEditorDialog
          item={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* Share Dialog */}
      {sharingItem && (
        <ContentShareDialog
          item={sharingItem}
          onClose={() => setSharingItem(null)}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-4 -mr-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="w-4 h-4 ml-1 rotate-180" />
          חזרה לספריית תוכן
        </Button>

        {/* Header */}
        <PageHeader 
          title="ספריית תוכן" 
          subtitle="תמונות, סרטונים, טקסטים ופוסטים"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 ml-2" />
                הוסף תוכן
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenUpload('image')}>
                <Image className="w-4 h-4 ml-2" />
                תמונה
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenUpload('video')}>
                <Video className="w-4 h-4 ml-2" />
                סרטון
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenUpload('text')}>
                <Type className="w-4 h-4 ml-2" />
                טקסט
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenUpload('post')}>
                <FileText className="w-4 h-4 ml-2" />
                פוסט
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PageHeader>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Type Tabs */}
          <Tabs value={selectedType} onValueChange={setSelectedType} className="flex-1">
            <TabsList className="bg-muted/50 p-1">
              {contentTypes.map(type => {
                const Icon = type.icon;
                const count = type.id === 'all' 
                  ? contentItems.length 
                  : contentItems.filter(i => i.type === type.id).length;
                return (
                  <TabsTrigger 
                    key={type.id} 
                    value={type.id}
                    className="data-[state=active]:bg-background"
                  >
                    <Icon className="w-4 h-4 ml-1" />
                    {type.name}
                    <Badge variant="secondary" className="mr-2 text-xs">
                      {count}
                    </Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {/* Search & View Toggle */}
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש תוכן..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        <AnimatePresence>
          {selectedItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6 flex items-center justify-between"
            >
              <span className="text-sm font-medium">
                {selectedItems.length} פריטים נבחרו
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSharingItem({ multiple: selectedItems })}>
                  <Send className="w-4 h-4 ml-2" />
                  שלח
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDeleteSelected}>
                  <Trash2 className="w-4 h-4 ml-2" />
                  מחק
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'לא נמצא תוכן תואם' : 'אין תוכן עדיין'}
            </p>
            <Button onClick={() => handleOpenUpload('image')}>
              <Plus className="w-4 h-4 ml-2" />
              הוסף תוכן ראשון
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item, index) => {
              const TypeIcon = getTypeIcon(item.type);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`group cursor-pointer border-2 transition-all hover:shadow-lg ${
                    selectedItems.includes(item.id) ? 'border-primary bg-primary/5' : 'border-border'
                  }`}>
                    <CardContent className="p-0">
                      {/* Preview */}
                      <div 
                        className="relative h-40 overflow-hidden bg-muted rounded-t-lg"
                        onClick={() => setEditingItem(item)}
                      >
                        {item.type === 'image' || item.type === 'post' ? (
                          <img
                            src={item.file_url || item.post_media_url || 'https://via.placeholder.com/400x300?text=תמונה'}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : item.type === 'video' ? (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                            <Video className="w-12 h-12 text-purple-500" />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center p-4">
                            <p className="text-sm text-center line-clamp-4">{item.text_content?.slice(0, 100)}...</p>
                          </div>
                        )}

                        {/* Checkbox */}
                        <div className="absolute top-2 right-2">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleItemSelect(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-5 h-5 cursor-pointer"
                          />
                        </div>

                        {/* Type Badge */}
                        <div className="absolute top-2 left-2">
                          <Badge className={getTypeColor(item.type)}>
                            <TypeIcon className="w-3 h-3 ml-1" />
                            {getTypeName(item.type)}
                          </Badge>
                        </div>

                        {/* Favorite */}
                        <button
                          className="absolute bottom-2 left-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteMutation.mutate({ id: item.id, is_favorite: item.is_favorite });
                          }}
                        >
                          <Star className={`w-4 h-4 ${item.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-foreground text-sm truncate flex-1">
                            {item.title}
                          </h3>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingItem(item)}>
                                <Edit className="w-4 h-4 ml-2" />
                                עריכה
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSharingItem(item)}>
                                <Send className="w-4 h-4 ml-2" />
                                שליחה
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSharingItem(item)}>
                                <Share2 className="w-4 h-4 ml-2" />
                                שיתוף קישור
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => deleteMutation.mutate(item.id)}
                              >
                                <Trash2 className="w-4 h-4 ml-2" />
                                מחק
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {item.description}
                          </p>
                        )}

                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filteredItems.map((item, index) => {
              const TypeIcon = getTypeIcon(item.type);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className={`border-2 transition-all hover:shadow-md ${
                    selectedItems.includes(item.id) ? 'border-primary bg-primary/5' : 'border-border'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleItemSelect(item.id)}
                          className="w-5 h-5 cursor-pointer"
                        />
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(item.type)}`}>
                          <TypeIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                          <p className="text-xs text-muted-foreground">{getTypeName(item.type)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setSharingItem(item)}>
                            <Send className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSharingItem(item)}>
                                <Share2 className="w-4 h-4 ml-2" />
                                שיתוף קישור
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => deleteMutation.mutate(item.id)}
                              >
                                <Trash2 className="w-4 h-4 ml-2" />
                                מחק
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}