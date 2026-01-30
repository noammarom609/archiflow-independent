import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Ruler, 
  Map, 
  Camera,
  Download,
  Trash2,
  Loader2,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  ImageIcon,
  FolderOpen,
  AlertCircle
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiflow } from '@/api/archiflow';
import { showSuccess, showError } from '@/components/utils/notifications';

export default function SurveyStage({ project, onUpdate, onSubStageChange }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('upload_survey'); // upload_survey, as_made, site_photos
  const [notes, setNotes] = useState(project.notes || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid, list

  // File Upload Handlers
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await archiflow.integrations.Core.UploadFile({ file });
      
      const newFile = {
        url: file_url,
        name: file.name,
        date: new Date().toISOString(),
        type: type
      };

      const currentFiles = project.survey_files || [];
      const updatedFiles = [...currentFiles, newFile];

      // Also create a Document entity for better management in the new FileManager
      await archiflow.entities.Document.create({
        title: file.name,
        description: `הועלה בשלב מדידה - ${type}`,
        file_url: file_url,
        file_type: type === 'images' ? 'image' : type === 'dwg' ? 'dwg' : 'pdf',
        file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        category: 'plan',
        folder_name: 'Survey', // Put in Survey folder automatically
        project_id: String(project.id),
        project_name: project.name,
        tags: ['survey', type]
      });

      onUpdate({ survey_files: updatedFiles });
      showSuccess('קובץ הועלה בהצלחה');
    } catch (error) {
      console.error('Upload error:', error);
      showError('שגיאה בהעלאת הקובץ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = (fileIndex) => {
      const currentFiles = project.survey_files || [];
      const updatedFiles = currentFiles.filter((_, i) => i !== fileIndex);
      onUpdate({ survey_files: updatedFiles });
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Process the first file
      const file = files[0];
      const fileType = activeTab === 'site_photos' ? 'images' : activeTab === 'upload_survey' ? 'dwg' : 'pdf';
      handleFileUploadDirect(file, fileType);
    }
  }, [activeTab]);

  const handleFileUploadDirect = async (file, type) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await archiflow.integrations.Core.UploadFile({ file });
      
      const newFile = {
        url: file_url,
        name: file.name,
        date: new Date().toISOString(),
        type: type,
        size: file.size
      };

      const currentFiles = project.survey_files || [];
      const updatedFiles = [...currentFiles, newFile];

      // Also create a Document entity for better management in the new FileManager
      await archiflow.entities.Document.create({
        title: file.name,
        description: `הועלה בשלב מדידה - ${type}`,
        file_url: file_url,
        file_type: type === 'images' ? 'image' : type === 'dwg' ? 'dwg' : 'pdf',
        file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        category: 'plan',
        folder_name: 'Survey', // Put in Survey folder automatically
        project_id: String(project.id),
        project_name: project.name,
        tags: ['survey', type]
      });

      onUpdate({ survey_files: updatedFiles });
      showSuccess('קובץ הועלה בהצלחה');
    } catch (error) {
      console.error('Upload error:', error);
      showError('שגיאה בהעלאת הקובץ');
    } finally {
      setIsUploading(false);
    }
  };

  const surveyFiles = project.survey_files || [];
  const dwgFiles = surveyFiles.filter(f => f.type === 'dwg');
  const pdfFiles = surveyFiles.filter(f => f.type === 'pdf');
  const imageFiles = surveyFiles.filter(f => f.type === 'images');
  
  // Get current tab files for gallery navigation
  const currentTabFiles = activeTab === 'site_photos' ? imageFiles : 
                          activeTab === 'upload_survey' ? dwgFiles : pdfFiles;
  
  // Navigate gallery
  const nextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < imageFiles.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };
  
  const prevImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };
  
  // Calculate stats
  const totalFiles = surveyFiles.length;
  const totalSize = surveyFiles.reduce((acc, f) => acc + (f.size || 0), 0);
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Ruler className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">קבצי DWG</p>
              <p className="text-lg font-bold text-slate-900">{dwgFiles.length}</p>
            </div>
          </div>
        </Card>
        <Card className="border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">קבצי PDF</p>
              <p className="text-lg font-bold text-slate-900">{pdfFiles.length}</p>
            </div>
          </div>
        </Card>
        <Card className="border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">תמונות</p>
              <p className="text-lg font-bold text-slate-900">{imageFiles.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start h-12 bg-transparent border-b rounded-none px-0">
              <TabsTrigger 
                value="upload_survey" 
                className="data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 border-b-2 border-transparent rounded-none px-4 md:px-6 h-12 gap-2"
              >
                <Ruler className="w-4 h-4" />
                <span className="hidden sm:inline">מדידה</span> (DWG)
                {dwgFiles.length > 0 && <Badge variant="secondary" className="ml-1">{dwgFiles.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger 
                value="as_made" 
                className="data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 border-b-2 border-transparent rounded-none px-4 md:px-6 h-12 gap-2"
              >
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">מצב קיים</span> (PDF)
                {pdfFiles.length > 0 && <Badge variant="secondary" className="ml-1">{pdfFiles.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger 
                value="site_photos" 
                className="data-[state=active]:border-green-500 data-[state=active]:text-green-600 border-b-2 border-transparent rounded-none px-4 md:px-6 h-12 gap-2"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">תמונות</span>
                {imageFiles.length > 0 && <Badge variant="secondary" className="ml-1">{imageFiles.length}</Badge>}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-6">
           <div className="space-y-6">
               {/* Drag & Drop Upload Area */}
               <div 
                 className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                   isDragging 
                     ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' 
                     : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                 }`}
                 onDragEnter={handleDragEnter}
                 onDragLeave={handleDragLeave}
                 onDragOver={handleDragOver}
                 onDrop={handleDrop}
               >
                   {isUploading ? (
                     <div className="flex flex-col items-center gap-3">
                       <div className="relative">
                         <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                           <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                         </div>
                       </div>
                       <div>
                         <p className="text-sm font-medium text-slate-700">מעלה קובץ...</p>
                         <p className="text-xs text-slate-500">אנא המתן</p>
                       </div>
                     </div>
                   ) : isDragging ? (
                     <div className="flex flex-col items-center gap-3">
                       <motion.div
                         animate={{ scale: [1, 1.1, 1] }}
                         transition={{ repeat: Infinity, duration: 1 }}
                         className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center"
                       >
                         <Upload className="w-8 h-8 text-white" />
                       </motion.div>
                       <p className="text-lg font-semibold text-indigo-600">שחרר כאן להעלאה</p>
                     </div>
                   ) : (
                     <>
                       <input 
                            type="file" 
                            id="file-upload" 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(e, activeTab === 'site_photos' ? 'images' : activeTab === 'upload_survey' ? 'dwg' : 'pdf')}
                            accept={activeTab === 'site_photos' ? "image/*" : ".pdf,.dwg,.dxf"}
                            multiple={activeTab === 'site_photos'}
                       />
                       <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4 w-full h-full">
                           <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                             activeTab === 'upload_survey' ? 'bg-amber-100' : 
                             activeTab === 'as_made' ? 'bg-blue-100' : 'bg-green-100'
                           }`}>
                               {activeTab === 'upload_survey' && <Ruler className="w-8 h-8 text-amber-600" />}
                               {activeTab === 'as_made' && <Map className="w-8 h-8 text-blue-600" />}
                               {activeTab === 'site_photos' && <Camera className="w-8 h-8 text-green-600" />}
                           </div>
                           <div>
                               <p className="text-lg font-medium text-slate-900">
                                 {activeTab === 'upload_survey' && 'העלה קבצי מדידה'}
                                 {activeTab === 'as_made' && 'העלה תוכניות מצב קיים'}
                                 {activeTab === 'site_photos' && 'העלה תמונות מהשטח'}
                               </p>
                               <p className="text-sm text-slate-500 mt-1">
                                 גרור ושחרר או לחץ לבחירת קבצים
                               </p>
                               <p className="text-xs text-slate-400 mt-2">
                                   {activeTab === 'site_photos' ? 'JPG, PNG, HEIC (עד 50MB)' : 'DWG, DXF, PDF (עד 100MB)'}
                               </p>
                           </div>
                       </label>
                     </>
                   )}
               </div>

               {/* View Mode Toggle for Photos */}
               {activeTab === 'site_photos' && imageFiles.length > 0 && (
                 <div className="flex items-center justify-between">
                   <p className="text-sm text-slate-500">{imageFiles.length} תמונות</p>
                   <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                     <Button 
                       variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                       size="sm" 
                       className="h-7 w-7 p-0"
                       onClick={() => setViewMode('grid')}
                     >
                       <Grid3X3 className="w-4 h-4" />
                     </Button>
                     <Button 
                       variant={viewMode === 'list' ? 'default' : 'ghost'} 
                       size="sm" 
                       className="h-7 w-7 p-0"
                       onClick={() => setViewMode('list')}
                     >
                       <FolderOpen className="w-4 h-4" />
                     </Button>
                   </div>
                 </div>
               )}

               {/* Files Grid/List */}
               <AnimatePresence mode="wait">
                 <motion.div
                   key={activeTab + viewMode}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className={`${
                     activeTab === 'site_photos' && viewMode === 'grid'
                       ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'
                       : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                   }`}
                 >
                   {activeTab === 'upload_survey' && dwgFiles.map((file, idx) => (
                       <FileCard key={idx} file={file} onDelete={() => handleDeleteFile(surveyFiles.indexOf(file))} />
                   ))}
                   {activeTab === 'as_made' && pdfFiles.map((file, idx) => (
                       <FileCard key={idx} file={file} onDelete={() => handleDeleteFile(surveyFiles.indexOf(file))} />
                   ))}
                   {activeTab === 'site_photos' && imageFiles.map((file, idx) => (
                       viewMode === 'grid' ? (
                         <ImageGridCard 
                           key={idx} 
                           file={file} 
                           onClick={() => setSelectedImageIndex(idx)}
                           onDelete={() => handleDeleteFile(surveyFiles.indexOf(file))} 
                         />
                       ) : (
                         <FileCard key={idx} file={file} onDelete={() => handleDeleteFile(surveyFiles.indexOf(file))} isImage />
                       )
                   ))}
                 </motion.div>
               </AnimatePresence>

               {/* Empty State */}
               {((activeTab === 'upload_survey' && dwgFiles.length === 0) ||
                 (activeTab === 'as_made' && pdfFiles.length === 0) ||
                 (activeTab === 'site_photos' && imageFiles.length === 0)) && (
                 <div className="text-center py-8">
                   <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <FolderOpen className="w-8 h-8 text-slate-400" />
                   </div>
                   <p className="text-slate-500">אין קבצים עדיין</p>
                   <p className="text-sm text-slate-400">העלה קבצים באמצעות הגרירה או הכפתור למעלה</p>
                 </div>
               )}

               {/* Notes */}
               <div className="pt-4 border-t border-slate-100">
                   <Label className="flex items-center gap-2">
                     <AlertCircle className="w-4 h-4 text-amber-500" />
                     הערות למדידה / מצב קיים
                   </Label>
                   <Textarea 
                        placeholder="רשום הערות חשובות, מידות חריגות או דגשים..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        onBlur={() => onUpdate({ notes })}
                        className="mt-2 min-h-[100px]"
                   />
               </div>
           </div>
        </CardContent>
      </Card>

      {/* Image Gallery Dialog */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={() => setSelectedImageIndex(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>תצוגת תמונה</DialogTitle>
          </DialogHeader>
          {selectedImageIndex !== null && imageFiles[selectedImageIndex] && (
            <div className="relative bg-black">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
                onClick={() => setSelectedImageIndex(null)}
              >
                <X className="w-5 h-5" />
              </Button>
              
              {/* Navigation */}
              <div className="absolute inset-y-0 left-0 flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full m-4"
                  onClick={nextImage}
                  disabled={selectedImageIndex === imageFiles.length - 1}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full m-4"
                  onClick={prevImage}
                  disabled={selectedImageIndex === 0}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>

              {/* Image */}
              <motion.img 
                key={selectedImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={imageFiles[selectedImageIndex].url} 
                alt={imageFiles[selectedImageIndex].name}
                className="w-full max-h-[80vh] object-contain"
              />
              
              {/* Info Bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <p className="font-medium truncate">{imageFiles[selectedImageIndex].name}</p>
                    <p className="text-sm text-white/70">{new Date(imageFiles[selectedImageIndex].date).toLocaleDateString('he-IL')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {selectedImageIndex + 1} / {imageFiles.length}
                    </Badge>
                    <a 
                      href={imageFiles[selectedImageIndex].url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <div className="flex justify-end">
          <Button onClick={() => onUpdate({ status: 'concept' })} className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6">
              <CheckCircle2 className="w-5 h-5 ml-2" />
              סיום שלב מדידה ומעבר לפרוגרמה
          </Button>
      </div>
    </div>
  );
}

function FileCard({ file, onDelete, isImage }) {
    return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl group hover:shadow-md hover:border-slate-300 transition-all"
        >
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {isImage ? (
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                ) : file.type === 'dwg' ? (
                    <Ruler className="w-5 h-5 text-amber-600" />
                ) : (
                    <FileText className="w-5 h-5 text-blue-600" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-500">{new Date(file.date).toLocaleDateString('he-IL')}</p>
                  {file.size && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </Badge>
                  )}
                </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <a 
                   href={file.url} 
                   target="_blank" 
                   rel="noreferrer" 
                   className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                 >
                     <Download className="w-4 h-4" />
                 </a>
                 <button 
                   onClick={onDelete} 
                   className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                 >
                     <Trash2 className="w-4 h-4" />
                 </button>
            </div>
        </motion.div>
    );
}

function ImageGridCard({ file, onClick, onDelete }) {
    return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all"
          onClick={onClick}
        >
            <img 
              src={file.url} 
              alt={file.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            />
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  <ZoomIn className="w-5 h-5 text-slate-700" />
                </div>
              </div>
              
              {/* Bottom Info */}
              <div className="absolute bottom-0 inset-x-0 p-2">
                <p className="text-xs text-white font-medium truncate">{file.name}</p>
              </div>
            </div>
            
            {/* Delete Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="absolute top-2 left-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-lg"
            >
              <Trash2 className="w-3 h-3" />
            </button>
        </motion.div>
    );
}