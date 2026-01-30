import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FURNITURE_CATEGORIES = ['סלון', 'פינת אוכל', 'חדר שינה', 'משרד', 'חוץ'];
const REFERENCE_ROOMS = ['סלון', 'מטבח', 'חדר שינה', 'אמבטיה', 'גינה', 'משרד ביתי', 'פינת אוכל'];
const STYLES = ['מודרני', 'כפרי', 'תעשייתי', 'סקנדינבי', 'בוהו', 'קלאסי', 'מינימליסטי', 'יפני'];
const MATERIALS = ['עץ אלון', 'עץ אגוז', 'מתכת שחורה', 'זכוכית', 'בטון', 'שיש', 'קטיפה', 'עור', 'בד ארוג'];
const COLORS = [
    { name: 'לבן', hex: '#FFFFFF' },
    { name: 'שחור', hex: '#000000' },
    { name: 'אפור', hex: '#808080' },
    { name: 'בז׳', hex: '#F5F5DC' },
    { name: 'כחול', hex: '#0000FF' },
    { name: 'ירוק', hex: '#008000' },
    { name: 'חמרה', hex: '#B7410E' }
];
const MANUFACTURERS = ['IKEA', 'Tollmans', 'Habitat', 'Kastiel', 'BoConcept', 'Natuzzi', 'Modulnova'];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateFurniture(index) {
    const category = getRandomItem(FURNITURE_CATEGORIES);
    const style = getRandomItem(STYLES);
    const material = getRandomItem(MATERIALS);
    const manufacturer = getRandomItem(MANUFACTURERS);
    
    return {
        name: `${category} ${style} - ${manufacturer} Collection ${index + 1}`,
        category: 'furniture',
        file_url: `https://loremflickr.com/800/600/furniture,${style.replace(' ', ',')}?lock=${index + 100}`,
        file_size: `${getRandomInt(2, 15)}.${getRandomInt(1, 9)} MB`,
        tags: [category, style, material, 'ריהוט', manufacturer],
        description: `פריט ריהוט איכותי בסגנון ${style} מבית ${manufacturer}. עשוי ${material}, מתאים לחללי ${category}. עיצוב על זמני ונוחות מקסימלית.`,
        metadata: {
            category: category,
            manufacturer: manufacturer,
            sku: `${manufacturer.substring(0,3).toUpperCase()}-${getRandomInt(1000, 9999)}-${new Date().getFullYear()}`,
            price: `₪${getRandomInt(1500, 25000).toLocaleString()}`,
            onSale: Math.random() > 0.7,
            salePrice: `₪${getRandomInt(1000, 14000).toLocaleString()}`,
            dimensions: `${getRandomInt(60, 300)}x${getRandomInt(40, 120)}x${getRandomInt(40, 220)} ס״מ`,
            weight: `${getRandomInt(5, 150)} ק״ג`,
            colors: COLORS.slice(0, getRandomInt(2, 4)).map(c => ({ ...c, available: true })),
            materials: [material, getRandomItem(MATERIALS), getRandomItem(MATERIALS)],
            warranty: `${getRandomInt(1, 10)} שנים`,
            delivery: `${getRandomInt(2, 8)} שבועות`,
            assembly: Math.random() > 0.5 ? 'נדרשת הרכבה' : 'מגיע מורכב',
            features: ['עמיד במים', 'קל לניקוי', 'עיצוב ארגונומי', 'חומרים ירוקים'],
            images: [
                `https://loremflickr.com/800/600/furniture,${style}?lock=${index + 100}`,
                `https://loremflickr.com/800/600/furniture,detail?lock=${index + 200}`
            ]
        }
    };
}

function generateReference(index) {
    const room = getRandomItem(REFERENCE_ROOMS);
    const style = getRandomItem(STYLES);
    
    return {
        name: `${room} בסגנון ${style} - השראה ${index + 1}`,
        category: 'references',
        file_url: `https://loremflickr.com/1200/800/interior,${room.replace(' ', ',')}?lock=${index + 500}`,
        file_size: `${getRandomInt(3, 20)}.${getRandomInt(1, 9)} MB`,
        tags: [room, style, 'השראה', 'עיצוב פנים'],
        description: `תמונת השראה ל${room} בסגנון ${style}. מציגה שילוב צבעים וחומרים ייחודי, פתרונות תאורה והעמדה בחלל.`,
        metadata: {
            room: room,
            style: style,
            area: `${getRandomInt(10, 80)} מ״ר`,
            colors: COLORS.slice(0, 3).map(c => c.name),
            budget: `₪${getRandomInt(20000, 500000).toLocaleString()}`,
            notes: `דגש על תאורה טבעית, חלוקת חלל חכמה, ושילוב חומרים טבעיים. מתאים לפרויקטים של ${room} יוקרתי.`
        }
    };
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Only admin should run this (optional check, but good practice)
        // const user = await base44.auth.me();
        // if (!user || user.role !== 'admin') {
        //    return Response.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const assets = [];

        // Generate 55 furniture items
        for (let i = 0; i < 55; i++) {
            assets.push(generateFurniture(i));
        }

        // Generate 55 reference items
        for (let i = 0; i < 55; i++) {
            assets.push(generateReference(i));
        }

        // Check if we should clean old data first? 
        // User said "fill the folders", usually implies adding to or populating empty ones.
        // I will just create them. If run multiple times it will duplicate, but that's standard seed behavior.
        
        // Bulk create is efficient
        // Note: base44 SDK might not have bulkCreate for all entities exposed in the standard way if not custom?
        // Checking internal docs: "create_entity_records" tool exists for bulk.
        // But backend functions use the SDK. SDK typically has .create.
        // I'll loop .create with Promise.all for speed, or check if bulkCreate exists in SDK.
        // Assuming no bulkCreate in standard entity SDK from docs provided (only .create, .list, .update, .delete).
        // I will use Promise.all with chunks to avoid hitting rate limits if any.
        
        const CHUNK_SIZE = 5;
        for (let i = 0; i < assets.length; i += CHUNK_SIZE) {
            const chunk = assets.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(asset => base44.entities.DesignAsset.create(asset)));
        }

        return Response.json({ 
            success: true, 
            message: `Successfully seeded ${assets.length} design assets`,
            count: assets.length
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});