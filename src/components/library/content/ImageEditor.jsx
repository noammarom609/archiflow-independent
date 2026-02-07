import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Sun,
  Contrast,
  Palette,
  Droplets,
  Thermometer,
  Crop,
  ZoomIn,
  ZoomOut,
  Undo,
  Download,
  Check,
  X,
  Maximize,
  Square,
  RectangleHorizontal,
  RectangleVertical,
} from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

const FILTERS = [
  { id: 'none', name: 'ללא', filter: '' },
  { id: 'grayscale', name: 'שחור לבן', filter: 'grayscale(100%)' },
  { id: 'sepia', name: 'ספיה', filter: 'sepia(100%)' },
  { id: 'vintage', name: 'וינטג׳', filter: 'sepia(50%) contrast(90%) brightness(90%)' },
  { id: 'cold', name: 'קר', filter: 'saturate(80%) hue-rotate(180deg) brightness(105%)' },
  { id: 'warm', name: 'חם', filter: 'saturate(120%) hue-rotate(-10deg) brightness(105%)' },
  { id: 'dramatic', name: 'דרמטי', filter: 'contrast(130%) saturate(110%) brightness(90%)' },
  { id: 'fade', name: 'דהוי', filter: 'contrast(90%) brightness(110%) saturate(80%)' },
  { id: 'vivid', name: 'חי', filter: 'saturate(150%) contrast(110%)' },
  { id: 'noir', name: 'נואר', filter: 'grayscale(100%) contrast(120%) brightness(90%)' },
];

const CROP_RATIOS = [
  { id: 'free', name: 'חופשי', icon: Maximize, ratio: null },
  { id: '1:1', name: '1:1', icon: Square, ratio: 1 },
  { id: '4:3', name: '4:3', icon: RectangleHorizontal, ratio: 4/3 },
  { id: '16:9', name: '16:9', icon: RectangleHorizontal, ratio: 16/9 },
  { id: '3:4', name: '3:4', icon: RectangleVertical, ratio: 3/4 },
  { id: '9:16', name: '9:16', icon: RectangleVertical, ratio: 9/16 },
];

export default function ImageEditor({ imageUrl, onSave, onCancel }) {
  const { t } = useLanguage();
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  
  // Adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [temperature, setTemperature] = useState(0);
  
  // Transform
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [scale, setScale] = useState(100);
  
  // Filter
  const [selectedFilter, setSelectedFilter] = useState('none');
  
  // Crop
  const [isCropping, setIsCropping] = useState(false);
  const [cropRatio, setCropRatio] = useState('free');
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  
  // History
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const currentFilter = FILTERS.find(f => f.id === selectedFilter)?.filter || '';
  
  const combinedFilter = `
    brightness(${brightness}%)
    contrast(${contrast}%)
    saturate(${saturation}%)
    blur(${blur}px)
    hue-rotate(${temperature}deg)
    ${currentFilter}
  `.trim();

  const transformStyle = {
    transform: `
      rotate(${rotation}deg)
      scaleX(${flipH ? -1 : 1})
      scaleY(${flipV ? -1 : 1})
      scale(${scale / 100})
    `.trim(),
    filter: combinedFilter,
  };

  const handleRotateRight = () => setRotation(r => (r + 90) % 360);
  const handleRotateLeft = () => setRotation(r => (r - 90 + 360) % 360);
  const handleFlipH = () => setFlipH(f => !f);
  const handleFlipV = () => setFlipV(f => !f);

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setTemperature(0);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setScale(100);
    setSelectedFilter('none');
  };

  const handleSave = () => {
    onSave({
      brightness,
      contrast,
      saturation,
      blur,
      temperature,
      rotation,
      flipH,
      flipV,
      scale,
      filter: selectedFilter,
    });
  };

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleRotateLeft} title="סובב שמאלה" aria-label={t('a11y.rotateLeft')}>
            <RotateCcw className="w-4 h-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRotateRight} title={t('a11y.rotateRight')} aria-label={t('a11y.rotateRight')}>
            <RotateCw className="w-4 h-4" aria-hidden />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="icon" onClick={handleFlipH} title={t('a11y.flipH')} aria-label={t('a11y.flipH')}>
            <FlipHorizontal className="w-4 h-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleFlipV} title={t('a11y.flipV')} aria-label={t('a11y.flipV')}>
            <FlipVertical className="w-4 h-4" aria-hidden />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <Undo className="w-4 h-4 ml-1" />
            איפוס
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 ml-1" />
            ביטול
          </Button>
          <Button onClick={handleSave}>
            <Check className="w-4 h-4 ml-1" />
            שמור
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Preview */}
        <div className="flex-1 flex items-center justify-center p-4 bg-[#1a1a1a] overflow-hidden">
          <div className="relative max-w-full max-h-full">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Editor preview"
              className="max-w-full max-h-[60vh] object-contain transition-all duration-200"
              style={transformStyle}
            />
          </div>
        </div>

        {/* Controls Panel */}
        <div className="w-72 border-r bg-background overflow-y-auto">
          <Tabs defaultValue="adjust" className="w-full">
            <TabsList className="w-full grid grid-cols-3 p-1">
              <TabsTrigger value="adjust">התאמות</TabsTrigger>
              <TabsTrigger value="filters">פילטרים</TabsTrigger>
              <TabsTrigger value="crop">חיתוך</TabsTrigger>
            </TabsList>

            {/* Adjustments */}
            <TabsContent value="adjust" className="p-4 space-y-5">
              {/* Brightness */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-1">
                    <Sun className="w-4 h-4" />
                    בהירות
                  </span>
                  <span className="text-muted-foreground">{brightness}%</span>
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
                  <span className="text-muted-foreground">{contrast}%</span>
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
                  <span className="text-muted-foreground">{saturation}%</span>
                </div>
                <Slider
                  value={[saturation]}
                  onValueChange={([v]) => setSaturation(v)}
                  min={0}
                  max={200}
                  step={1}
                />
              </div>

              {/* Temperature */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-1">
                    <Thermometer className="w-4 h-4" />
                    טמפרטורה
                  </span>
                  <span className="text-muted-foreground">{temperature}°</span>
                </div>
                <Slider
                  value={[temperature]}
                  onValueChange={([v]) => setTemperature(v)}
                  min={-180}
                  max={180}
                  step={1}
                />
              </div>

              {/* Blur */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-1">
                    <Droplets className="w-4 h-4" />
                    טשטוש
                  </span>
                  <span className="text-muted-foreground">{blur}px</span>
                </div>
                <Slider
                  value={[blur]}
                  onValueChange={([v]) => setBlur(v)}
                  min={0}
                  max={20}
                  step={0.5}
                />
              </div>

              {/* Zoom */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-1">
                    <ZoomIn className="w-4 h-4" />
                    גודל
                  </span>
                  <span className="text-muted-foreground">{scale}%</span>
                </div>
                <Slider
                  value={[scale]}
                  onValueChange={([v]) => setScale(v)}
                  min={10}
                  max={200}
                  step={1}
                />
              </div>
            </TabsContent>

            {/* Filters */}
            <TabsContent value="filters" className="p-4">
              <div className="grid grid-cols-2 gap-2">
                {FILTERS.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      selectedFilter === filter.id
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-transparent hover:border-border'
                    }`}
                  >
                    <div className="aspect-square bg-muted">
                      <img
                        src={imageUrl}
                        alt={filter.name}
                        className="w-full h-full object-cover"
                        style={{ filter: filter.filter || 'none' }}
                      />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs py-1 text-center">
                      {filter.name}
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>

            {/* Crop */}
            <TabsContent value="crop" className="p-4">
              <p className="text-sm text-muted-foreground mb-4">
                בחר יחס גובה-רוחב לחיתוך
              </p>
              <div className="grid grid-cols-3 gap-2">
                {CROP_RATIOS.map(ratio => {
                  const Icon = ratio.icon;
                  return (
                    <button
                      key={ratio.id}
                      onClick={() => setCropRatio(ratio.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                        cropRatio === ratio.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{ratio.name}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800 text-center">
                  חיתוך אינטראקטיבי יהיה זמין בקרוב
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}