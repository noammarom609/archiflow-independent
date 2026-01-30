import React from 'react';
import { 
  Lock, 
  Unlock, 
  Trash2, 
  Copy, 
  Layers, 
  ArrowUp, 
  ArrowDown, 
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Group,
  Ungroup,
  Bold,
  Italic,
  Underline
  } from 'lucide-react';
  import { Input } from '@/components/ui/input';
          import { Toggle } from '@/components/ui/toggle';
        import { Label } from '@/components/ui/label';
        import { Button } from '@/components/ui/button';
        import { Slider } from '@/components/ui/slider';
        import {
          Select,
          SelectContent,
          SelectItem,
          SelectTrigger,
          SelectValue,
        } from '@/components/ui/select';
        import {
          Popover,
          PopoverContent,
          PopoverTrigger,
        } from "@/components/ui/popover";
        import { archiflow } from '@/api/archiflow';
import { useQuery } from '@tanstack/react-query';

export default function PropertiesPanel({ selectedItems, onUpdate, onUpdateBatch, onDelete, onDuplicate, onGroup, onUngroup, onBringToFront, onSendToBack }) {
  
  // No Selection
  if (!selectedItems || selectedItems.length === 0) {
    return (
      <div className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col items-center justify-center text-center h-full z-20 shadow-lg">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Layers className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">אפשרויות אלמנט</h3>
        <p className="text-sm text-slate-500 mt-2">בחר אלמנט בלוח כדי לערוך את המאפיינים שלו, לשנות שכבות או לקשר אותו לנתונים.</p>
      </div>
    );
  }

  // Fetch Suppliers for linking
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers_list'],
    queryFn: () => archiflow.entities.Contractor.filter({ type: 'supplier' }),
    staleTime: 60000
  });

  // Fetch Materials for linking
  const { data: materials = [] } = useQuery({
    queryKey: ['materials_list'],
    queryFn: () => archiflow.entities.DesignAsset.filter({ category: 'textures' }), // Assuming textures are materials
    staleTime: 60000
  });

  const fontOptions = [
      { name: 'Heebo (ברירת מחדל)', value: 'Heebo' },
      { name: 'Assistant (נקי)', value: 'Assistant' },
      { name: 'Rubik (עגול)', value: 'Rubik' },
      { name: 'Varela Round (עגול מאוד)', value: 'Varela Round' },
      { name: 'Secular One (מודגש)', value: 'Secular One' },
      { name: 'Amatic SC (כתב יד)', value: 'Amatic SC' },
      { name: 'Frank Ruhl Libre (סריף)', value: 'Frank Ruhl Libre' },
      { name: 'Arimo (קלאסי)', value: 'Arimo' },
      { name: 'Tinos (סריף קלאסי)', value: 'Tinos' },
      { name: 'Suez One (כבד)', value: 'Suez One' },
      { name: 'Alef (מסורתי)', value: 'Alef' },
      { name: 'Mali (ילדותי)', value: 'Mali' },
      { name: 'Courier Prime (מכונת כתיבה)', value: 'Courier Prime' },
      { name: 'Playfair Display (יוקרתי)', value: 'Playfair Display' },
      { name: 'Lora (ספרותי)', value: 'Lora' },
      { name: 'Montserrat (מודרני)', value: 'Montserrat' },
      { name: 'Open Sans (קריא)', value: 'Open Sans' },
  ];

  const isMultiple = selectedItems.length > 1;
  const firstItem = selectedItems[0];

  const handleChange = (field, value) => {
    if (isMultiple) {
      onUpdateBatch({ [field]: value });
    } else {
      onUpdate(firstItem.id, { [field]: value });
    }
  };

  const handleStyleChange = (field, value) => {
    if (isMultiple) {
        // For batch style, we need to merge with existing style if we want to be safe, 
        // but here we override specific field.
        // Assuming onUpdateBatch does deep merge or we construct full object.
        // Simplified: passing specific style field update to parent
        // Parent needs to handle style merge.
        // Since onUpdateBatch in Editor does shallow merge of item, 
        // we need to be careful. Editor's handleUpdateSelected implementation currently merges shallowly.
        // Fix: Editor should support nested updates or we pass full style object.
        // Workaround: We'll assume the parent helper handles this or we pass new style object.
        // Actually, let's implement safe update in Editor. 
        // Current implementation: { ...item, ...changes }. 
        // So { ...item, style: { ...item.style, [field]: value } } is needed.
        // BUT we can't do that here easily for multiple items with DIFFERENT styles.
        // We will just update properties that are common.
        // For now, simpler: pass style object patch.
        // Note: This requires Editor support for deep merge or we accept overwrite.
        // Let's rely on Editor doing shallow merge of top level props. 
        // So we can't easily batch update nested 'style.fontSize' without iterating in Editor.
        // Editor's handleUpdateSelected does map. So if we pass { style: { ...oldStyle, fontSize: 20 } } it won't work because we don't have oldStyle here for EACH item.
        // We need to pass a callback or specific structure.
        // Let's assume standard behavior: We only support single item deep editing for now, or simple batch props.
        // For Batch, we'll only support top-level props or assume style is uniform?
        // Let's disable style editing for multi-select for safety, or implement specific batch logic.
    } else {
      onUpdate(firstItem.id, { 
        style: { ...firstItem.style, [field]: value } 
      });
    }
  };

  const handleMetadataChange = (field, value) => {
    if (isMultiple) {
        // Complex to update metadata for multiple
    } else {
        onUpdate(firstItem.id, { 
            metadata: { ...(firstItem.metadata || {}), [field]: value } 
        });
    }
  };

  return (
    <div className="flex flex-col bg-white min-h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 className="font-bold text-slate-900">
            {isMultiple ? `${selectedItems.length} פריטים נבחרו` : 'מאפיינים'}
        </h3>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => {
                if (isMultiple) onUpdateBatch({ locked: !firstItem.locked });
                else onUpdate(firstItem.id, { locked: !firstItem.locked });
            }}
            title={firstItem.locked ? "שחרר נעילה" : "נעל אלמנט"}
          >
            {firstItem.locked ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4 text-slate-400" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDuplicate} title="שכפל">
            <Copy className="w-4 h-4 text-slate-500" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={onDelete} title="מחק">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Layer & Group Controls */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold text-slate-500 uppercase">סידור ושכבות</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={onBringToFront}>
              <ArrowUp className="w-3 h-3 ml-2" /> העבר קדימה
            </Button>
            <Button variant="outline" size="sm" onClick={onSendToBack}>
              <ArrowDown className="w-3 h-3 ml-2" /> העבר אחורה
            </Button>
          </div>
          
          {isMultiple && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button variant="secondary" size="sm" onClick={onGroup}>
                    <Group className="w-3 h-3 ml-2" /> קבץ
                </Button>
                <Button variant="secondary" size="sm" onClick={onUngroup}>
                    <Ungroup className="w-3 h-3 ml-2" /> פרק
                </Button>
              </div>
          )}

          {!isMultiple && (
            <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="space-y-1">
                    <Label className="text-[10px] text-slate-500">X</Label>
                    <Input 
                        type="number" 
                        value={Math.round(firstItem.position.x)} 
                        onChange={(e) => onUpdate(firstItem.id, { position: { ...firstItem.position, x: Number(e.target.value) } })}
                        className="h-7 text-xs px-1 text-center"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] text-slate-500">Y</Label>
                    <Input 
                        type="number" 
                        value={Math.round(firstItem.position.y)} 
                        onChange={(e) => onUpdate(firstItem.id, { position: { ...firstItem.position, y: Number(e.target.value) } })}
                        className="h-7 text-xs px-1 text-center"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] text-slate-500">רוחב</Label>
                    <Input 
                        type="number" 
                        value={Math.round(firstItem.size.width)} 
                        onChange={(e) => onUpdate(firstItem.id, { size: { ...firstItem.size, width: Number(e.target.value) } })}
                        className="h-7 text-xs px-1 text-center"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] text-slate-500">גובה</Label>
                    <Input 
                        type="number" 
                        value={Math.round(firstItem.size.height)} 
                        onChange={(e) => onUpdate(firstItem.id, { size: { ...firstItem.size, height: Number(e.target.value) } })}
                        className="h-7 text-xs px-1 text-center"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] text-slate-500">סיבוב</Label>
                    <div className="relative">
                        <Input 
                            type="number" 
                            value={Math.round(firstItem.rotation || 0)} 
                            onChange={(e) => onUpdate(firstItem.id, { rotation: Number(e.target.value) })}
                            className="h-7 text-xs px-1 text-center pr-4"
                        />
                        <span className="absolute right-1 top-1.5 text-[10px] text-slate-400">°</span>
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* Content Specific Controls - Single Item Only */}
        {!isMultiple && (
            <div className="space-y-3">
            <Label className="text-xs font-semibold text-slate-500 uppercase">תוכן ועיצוב</Label>
            
            {(firstItem.type === 'text' || firstItem.type === 'shape') && (
                <>
                {firstItem.type === 'text' && (
                    <Input 
                        value={firstItem.content} 
                        onChange={(e) => handleChange('content', e.target.value)}
                        placeholder="טקסט..."
                        className="mb-2"
                    />
                )}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                    <span className="text-xs">{firstItem.type === 'text' ? 'גודל טקסט' : 'גודל'}</span>
                    <span className="text-xs text-slate-500">{firstItem.style?.fontSize || 16}px</span>
                    </div>
                    {firstItem.type === 'text' && (
                        <Slider 
                        value={[firstItem.style?.fontSize || 16]} 
                        min={12} 
                        max={120} 
                        step={1}
                        onValueChange={([val]) => handleStyleChange('fontSize', val)}
                        />
                    )}
                    {(firstItem.type === 'shape' || firstItem.type === 'text') && (
                        <div className="pt-2">
                            <Label className="text-xs mb-1 block">צבע</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                  <Button 
                                      variant="outline" 
                                      className="w-full justify-start gap-2 h-10 px-2 border-slate-200"
                                  >
                                      <div 
                                          className="w-6 h-6 rounded-md border border-slate-200 shadow-sm"
                                          style={{ backgroundColor: firstItem.style?.color || '#000000' }}
                                      />
                                      <span className="text-xs font-mono text-slate-600 flex-1 text-left">
                                          {firstItem.style?.color || '#000000'}
                                      </span>
                                  </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-3" align="start">
                                  <div className="space-y-3">
                                      <div>
                                          <Label className="text-xs mb-1.5 block text-slate-500">בחירה מהירה</Label>
                                          <div className="grid grid-cols-8 gap-1.5">
                                              {['#000000', '#FFFFFF', '#808080', '#D3D3D3', 
                                                '#8B4513', '#D2691E', '#CD853F', '#F4A460', 
                                                '#191970', '#000080', '#4169E1', '#87CEEB', 
                                                '#006400', '#228B22', '#32CD32', '#90EE90', 
                                                '#8B0000', '#B22222', '#FF0000', '#FF6347',
                                                '#4B0082', '#800080', '#EE82EE', '#FF1493'
                                              ].map(color => (
                                                  <button 
                                                      key={color}
                                                      className={`w-6 h-6 rounded-md border border-slate-200 transition-transform hover:scale-110 ${firstItem.style?.color === color ? 'ring-2 ring-offset-1 ring-indigo-500' : ''}`}
                                                      style={{ backgroundColor: color }}
                                                      onClick={() => handleStyleChange('color', color)}
                                                      title={color}
                                                  />
                                              ))}
                                          </div>
                                      </div>

                                      <div className="pt-2 border-t border-slate-100">
                                          <Label className="text-xs mb-1.5 block text-slate-500">התאמה אישית</Label>
                                          <div className="flex gap-2">
                                              <div className="flex-1">
                                                  <Input 
                                                      type="color" 
                                                      value={firstItem.style?.color || '#000000'}
                                                      onChange={(e) => handleStyleChange('color', e.target.value)}
                                                      className="h-9 w-full p-0 border-0 cursor-pointer"
                                                  />
                                              </div>
                                              <Input 
                                                  value={firstItem.style?.color || '#000000'}
                                                  onChange={(e) => handleStyleChange('color', e.target.value)}
                                                  className="h-9 w-24 font-mono text-xs"
                                              />
                                          </div>
                                      </div>
                                  </div>
                              </PopoverContent>
                            </Popover>
                        </div>
                    )}
                    </div>

                    {firstItem.type === 'text' && (
                    <>
                      <div className="space-y-2 mt-2">
                          <Label className="text-xs text-slate-500">גופן</Label>
                          <Select 
                              value={firstItem.style?.fontFamily || 'Heebo'} 
                              onValueChange={(val) => handleStyleChange('fontFamily', val)}
                          >
                              <SelectTrigger className="h-9 w-full text-right">
                                  <SelectValue placeholder="בחר גופן" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px]">
                                  {fontOptions.map(font => (
                                      <SelectItem 
                                          key={font.value} 
                                          value={font.value}
                                          style={{ fontFamily: font.value }}
                                      >
                                          {font.name}
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>

                      <div className="space-y-2 mt-2">
                          <Label className="text-xs text-slate-500">עיצוב טקסט</Label>
                          <div className="flex gap-1 bg-slate-50 p-1 rounded-md">
                              <Toggle 
                                  size="sm" 
                                  pressed={firstItem.style?.fontWeight === 'bold'}
                                  onPressedChange={(pressed) => handleStyleChange('fontWeight', pressed ? 'bold' : 'normal')}
                                  className="h-7 w-7"
                              >
                                  <Bold className="w-3.5 h-3.5" />
                              </Toggle>
                              <Toggle 
                                  size="sm" 
                                  pressed={firstItem.style?.fontStyle === 'italic'}
                                  onPressedChange={(pressed) => handleStyleChange('fontStyle', pressed ? 'italic' : 'normal')}
                                  className="h-7 w-7"
                              >
                                  <Italic className="w-3.5 h-3.5" />
                              </Toggle>
                              <Toggle 
                                  size="sm" 
                                  pressed={firstItem.style?.textDecoration === 'underline'}
                                  onPressedChange={(pressed) => handleStyleChange('textDecoration', pressed ? 'underline' : 'none')}
                                  className="h-7 w-7"
                              >
                                  <Underline className="w-3.5 h-3.5" />
                              </Toggle>
                              <div className="w-px h-4 bg-slate-200 mx-1 self-center" />
                              {['right', 'center', 'left'].map(align => (
                                  <Button
                                      key={align}
                                      variant={firstItem.style?.textAlign === align ? 'white' : 'ghost'}
                                      size="icon"
                                      className={`h-7 w-7 ${firstItem.style?.textAlign === align ? 'shadow-sm' : ''}`}
                                      onClick={() => handleStyleChange('textAlign', align)}
                                  >
                                      {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                                      {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                                      {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                                  </Button>
                              ))}
                          </div>
                      </div>
                    </>
                    )}
                    </>
                    )}

            {firstItem.type === 'note' && (
                <textarea 
                className="w-full p-2 border rounded-md text-sm min-h-[100px] bg-yellow-50"
                value={firstItem.content}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="כתוב הערה..."
                />
            )}

            <div className="space-y-2 mt-2">
                <Label className="text-xs">שקיפות</Label>
                <Slider 
                value={[firstItem.style?.opacity !== undefined ? firstItem.style.opacity * 100 : 100]} 
                min={10} 
                max={100} 
                step={1}
                onValueChange={([val]) => handleStyleChange('opacity', val / 100)}
                />
            </div>
            </div>
        )}

        {/* Data Linking - Single Item Only */}
        {!isMultiple && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
            <Label className="text-xs font-semibold text-indigo-600 uppercase flex items-center gap-2">
                <LinkIcon className="w-3 h-3" />
                חיבור לנתוני מערכת
            </Label>
            
            <div className="space-y-2">
                <Label className="text-xs">שיוך לספק / קבלן</Label>
                <Select 
                value={firstItem.metadata?.linked_entity_type === 'contractor' ? firstItem.metadata?.linked_entity_id : "none"}
                onValueChange={(val) => {
                    if (val === "none") {
                    handleMetadataChange('linked_entity_id', null);
                    handleMetadataChange('linked_entity_type', null);
                    } else {
                    handleMetadataChange('linked_entity_id', val);
                    handleMetadataChange('linked_entity_type', 'contractor');
                    }
                }}
                >
                <SelectTrigger className="h-9">
                    <SelectValue placeholder="בחר ספק..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">-- ללא שיוך --</SelectItem>
                    {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.specialty})</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-xs">שיוך לחומר / טקסטורה</Label>
                <Select 
                value={firstItem.metadata?.linked_entity_type === 'material' ? firstItem.metadata?.linked_entity_id : "none"}
                onValueChange={(val) => {
                    if (val === "none") {
                    handleMetadataChange('linked_entity_id', null);
                    handleMetadataChange('linked_entity_type', null);
                    } else {
                    handleMetadataChange('linked_entity_id', val);
                    handleMetadataChange('linked_entity_type', 'material');
                    }
                }}
                >
                <SelectTrigger className="h-9">
                    <SelectValue placeholder="בחר חומר..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">-- ללא שיוך --</SelectItem>
                    {materials.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-xs">סטטוס אישור</Label>
                <Select 
                value={firstItem.metadata?.approval_status || "draft"}
                onValueChange={(val) => handleMetadataChange('approval_status', val)}
                >
                <SelectTrigger className="h-9">
                    <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="draft">טיוטה</SelectItem>
                    <SelectItem value="approved">מאושר</SelectItem>
                    <SelectItem value="rejected">נדחה</SelectItem>
                </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-xs">קטגוריה</Label>
                <Select 
                value={firstItem.metadata?.category || "general"}
                onValueChange={(val) => handleMetadataChange('category', val)}
                >
                <SelectTrigger className="h-9">
                    <SelectValue placeholder="בחר קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="general">כללי</SelectItem>
                    <SelectItem value="kitchen">מטבח</SelectItem>
                    <SelectItem value="bath">חדר רחצה</SelectItem>
                    <SelectItem value="flooring">ריצוף וחיפוי</SelectItem>
                    <SelectItem value="lighting">תאורה</SelectItem>
                    <SelectItem value="furniture">ריהוט</SelectItem>
                    <SelectItem value="textile">טקסטיל</SelectItem>
                </SelectContent>
                </Select>
            </div>
            </div>
        )}

      </div>
    </div>
  );
}