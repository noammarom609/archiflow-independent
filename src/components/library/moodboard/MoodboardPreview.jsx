import React, { useRef, useEffect, useState } from 'react';
import MoodboardItem from './MoodboardItem';

export default function MoodboardPreview({ moodboard }) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(0.5);
    
    // Auto-scale effect
    useEffect(() => {
        if (!moodboard?.items?.length || !containerRef.current) return;
        
        const xs = moodboard.items.map(i => i.position.x);
        const ys = moodboard.items.map(i => i.position.y);
        const ws = moodboard.items.map(i => i.size.width);
        const hs = moodboard.items.map(i => i.size.height);
        
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...moodboard.items.map((i, idx) => i.position.x + ws[idx]));
        const maxY = Math.max(...moodboard.items.map((i, idx) => i.position.y + hs[idx]));
        
        const contentWidth = maxX - minX + 200; // padding
        const contentHeight = maxY - minY + 200;
        
        const { clientWidth, clientHeight } = containerRef.current;
        const scaleX = clientWidth / contentWidth;
        const scaleY = clientHeight / contentHeight;
        
        // Use the smaller scale to fit both dimensions, cap at 1
        setScale(Math.min(scaleX, scaleY, 1) * 0.9);
    }, [moodboard]);
    
    if (!moodboard?.items?.length) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                <div className="text-center">
                    <p>הלוח ריק</p>
                </div>
            </div>
        );
    }
    
    // Calculate center to pan to
    const xs = moodboard.items.map(i => i.position.x);
    const ys = moodboard.items.map(i => i.position.y);
    const ws = moodboard.items.map(i => i.size.width);
    const hs = moodboard.items.map(i => i.size.height);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...moodboard.items.map((i, idx) => i.position.x + ws[idx]));
    const maxY = Math.max(...moodboard.items.map((i, idx) => i.position.y + hs[idx]));
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const bgStyle = {
        backgroundColor: moodboard.settings?.backgroundColor || '#f1f5f9',
        backgroundImage: moodboard.settings?.backgroundImage ? `url(${moodboard.settings.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    return (
        <div ref={containerRef} className="w-full h-full overflow-hidden relative rounded-lg border border-slate-200 shadow-inner" style={bgStyle}>
             <div 
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) scale(${scale}) translate(${-centerX}px, ${-centerY}px)`,
                    transformOrigin: 'center center',
                    width: 0, 
                    height: 0,
                }}
             >
                {moodboard.items.map(item => (
                    <MoodboardItem 
                        key={item.id} 
                        item={item} 
                        isSelected={false} 
                        readOnly={true} 
                        zoom={scale}
                        onSelect={() => {}} 
                        onUpdate={() => {}}
                        snapEnabled={false}
                    />
                ))}
             </div>
        </div>
    );
}