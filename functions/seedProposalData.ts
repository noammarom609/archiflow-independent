import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const CLAUSES = [
    // Opening & Planning
    {
        title: "פתיחת כרטיס פרויקט",
        description: "פתיחת כרטיס פרוייקט הכולל איסוף מידע רלוונטי מהלקוח: תוכניות מצב קיים / תוכנית מדידה, פרטי הפרויקט, פרטי אנשי קשר רלוונטיים וכל מידע חיוני לצורך התחלת הפרויקט",
        category: "opening_planning"
    },
    {
        title: "הכנת פרוגרמה",
        description: "הכנת פרוגרמה בפגישה פרונטלית/זום במידת הצורך לצורך הבנת צרכי הלקוח מהפרויקט כגון: מספר נפשות במשפחה, גיל ומין, דרישות מיוחדות (חייב, כדאי, הלוואי) על מנת להתאים את התכנון באופן אופטימלי לצרכי הלקוח",
        category: "opening_planning"
    },
    {
        title: "הכנת לוח השראה",
        description: "הכנת לוח השראה, בחירת פלטת גוונים וחומרים מתאימים לאופי הבית בהתאם לאופי המשפחה",
        category: "opening_planning"
    },
    {
        title: "הכנת סקיצות ראשונות",
        description: "הכנת סקיצות ראשונות בהתאם לפרוגרמה - הסקיצה מתייחסת לחלוקת חללים וסוגי השימוש בהם",
        category: "opening_planning"
    },
    {
        title: "אישור סקיצה",
        description: "אישור סקיצה נבחרת ע\"י הלקוח ותחילת תהליך התכנון",
        category: "opening_planning"
    },
    // Visuals
    {
        title: "הכנת הדמיות",
        description: "הכנת הדמיות ע\"ב הסקיצה שנבחרה בשילוב הגוונים והחומרים שנבחרו בלוח ההשראה",
        category: "visuals"
    },
    {
        title: "אישור הדמיות",
        description: "אישור ההדמיות כבסיס לתכנון המפורט - יצוין כי ההדמיה מהווה קו מנחה לצורך התכנון המלא אך יש לקחת בחשבון כי ייתכן ויהיה צורך באישור של יועץ קונסטרוקציה לפני הריסת קירות ו/או אלמנטים נדרשים בתכנון שישפיעו על התוצאה הסופית",
        category: "visuals"
    },
    // Plans
    {
        title: "סט תוכניות עבודה מפורט",
        description: "הכנת סט תוכניות עבודה מפורט לטובת מכרז קבלנים (סט תוכניות העבודה אינו כולל כתב כמויות של חומרי גלם ודרישות יועצים, במידה ותהיה דרישה כזו, יש לקחת בחשבון עלות כמאי חיצוני ע\"פ הצורך)",
        category: "plans"
    },
    {
        title: "תוכנית אפיון",
        description: "תוכנית חלוקה כללית כולל העמדה של ריהוט ורשימת סוגי החומרים",
        category: "plans"
    },
    {
        title: "תוכנית אדריכלות",
        description: "תוכנית הכוללת מידות של קירות ופתחים",
        category: "plans"
    },
    {
        title: "תוכנית בניה והריסה",
        description: "תוכנית המראה איזה קירות ואלמנטים יש להרוס ואיזה לבנות ע\"ג אותה התוכנית על מנת להבין בקלות את היקף העבודה (חשוב לקחת בחשבון כי ייתכן ויהיה צורך באישור של יועץ קונסטרוקציה לפני הריסת קירות)",
        category: "plans"
    },
    {
        title: "תוכנית פרישה ראשונית",
        description: "תוכנית זו תאפשר לנו לתת כמויות של ריצופים וחיפויים וסוגי יחידות סניטריות לספק הריצוף והסניטריים בהתאם לבחירות שיבוצעו מולו לצורך קבלת הצעת מחיר רלוונטית",
        category: "plans"
    },
    {
        title: "תוכנית פרישה סופית",
        description: "תוכנית זו מפרטת לרצף את כל סוגי הריצופים והחיפויים שנבחרו לבית כולל מיקום ואופן ביצוע ההתקנה על מנת לקבל את התוצאה הרצויה",
        category: "plans"
    },
    {
        title: "תוכנית חשמל",
        description: "תוכנית הכוללת מיקום נקודות חשמל, תאורה, שקעים ומפסקים",
        category: "plans"
    },
    {
        title: "תוכנית תקשורת ומולטימדיה",
        description: "תוכנית הכוללת מיקום נקודות רשת, טלוויזיה ומערכות חכמות",
        category: "plans"
    },
    {
        title: "תוכנית אינסטלציה",
        description: "תוכנית הכוללת מיקום נקודות מים וביוב",
        category: "plans"
    },
    {
        title: "תוכנית מיזוג אוויר",
        description: "תוכנית הכוללת מיקום יחידות מיזוג פנימיות וחיצוניות",
        category: "plans"
    },
    // Selections
    {
        title: "ליווי לבחירות ריצוף וכלים סניטריים",
        description: "ליווי לבחירות ריצוף וכלים סניטריים עד 3 שעות X2",
        category: "selections"
    },
    {
        title: "ליווי לספק מטבחים ונגרים",
        description: "ליווי לספק מטבחים ונגרים עד 3 שעות X3",
        category: "selections"
    },
    {
        title: "ליווי לבחירת מוצרי חשמל למטבח",
        description: "ליווי לבחירת מוצרי חשמל למטבח - חשוב לבצע הזמנה לפני פגישת הורדה לביצוע של המטבח",
        category: "selections"
    },
    {
        title: "ליווי לבחירות ריהוט",
        description: "ליווי לבחירות ריהוט עד 3 שעות X2",
        category: "selections"
    },
    {
        title: "ליווי לבחירת תאורה",
        description: "ליווי לבחירת תאורה עד 2 שעות X2",
        category: "selections"
    },
    {
        title: "ליווי לבחירת דלתות",
        description: "ליווי לבחירת דלתות במידת הצורך עד שעתיים",
        category: "selections"
    },
    {
        title: "ליווי לבחירת חומרים להלבשת הבית",
        description: "ליווי לבחירת חומרים להלבשת הבית הכולל וילונות, מקלחונים, חיפויי קירות ואלמנטים נוספים במידת הצורך עד 3 שעות X2",
        category: "selections"
    },
    // Supervision
    {
        title: "פיקוח עליון",
        description: "פיקוח עליון הכולל הגעה פיזית לפרויקט ב-6 שלבים:\n- תחילת פרויקט למעבר על התוכניות מול הקבלן\n- סימון מחיצות\n- סימון נקודות חשמל ואינסטלציה\n- פעמיים ע\"פ צורך במהלך הפרויקט\n- סיום פרויקט\n\nיובהר כי הפיקוח העליון אינו מהווה בדיקת איכות ביצוע עבודה ע\"י הקבלן אלא בדיקת ביצוע עבודה ע\"פ תוכנית בלבד. כמו כן, באחריות הקבלן המבצע לדאוג למנהל עבודה בשטח מתחילת הפרויקט ועד סופו שיהיה אחראי לביצוע העבודות ע\"פ תוכניות והוראות המתכנן ובאחריותו הבלעדית להעביר הנחיות לקבלני המשנה מטעמו.\nבכל מקרה של צורך בביקורים נוספים באתר לבקשת הלקוח, הנ\"ל יהיה כרוך בתשלום נוסף ע\"פ מחירון המשרד.",
        category: "supervision"
    },
    {
        title: "פיקוח צמוד",
        description: "פיקוח צמוד הכולל נוכחות קבועה באתר הפרויקט, ניהול קבלנים ובקרת איכות שוטפת",
        category: "supervision"
    },
    // Exclusions
    {
        title: "אי-כלולים סטנדרטי",
        description: "הצעה זו אינה כוללת:\n1. בחירת אבזור ואקססוריז לבית כגון צמחים, אגרטלים, תמונות וכד'\n2. תוכנית גינה/מרפסת גדולה המצריכה תוכנית גינון מיוחדת\n3. תוכניות יועצים במידת הצורך\n4. הגשת היתרים ו/או בקשות עירייה ו/או גופים חיצוניים במידת הצורך\n5. תוכנית מדידה\n6. הדפסות",
        category: "exclusions"
    }
];

const TEMPLATES = [
    {
        code: "new_construction_office",
        name: "תכנון מלא - משרד/מעטפת (בנייה חדשה)",
        description: "הצעת מחיר לתכנון אדריכלי ועיצוב פנים מלא למשרד או מבנה מסחרי חדש",
        items: [
            "פתיחת כרטיס פרויקט",
            "הכנת פרוגרמה", // needs override
            "הכנת לוח השראה", // needs override
            "הכנת סקיצות ראשונות",
            "אישור סקיצה",
            "הכנת הדמיות",
            "אישור הדמיות",
            "סט תוכניות עבודה מפורט",
            "תוכנית אפיון",
            "תוכנית אדריכלות",
            "תוכנית בניה והריסה",
            "תוכנית חשמל",
            "תוכנית תקשורת ומולטימדיה",
            "תוכנית מיזוג אוויר",
            "ליווי לספק מטבחים ונגרים", // needs override
            "ליווי לבחירות ריהוט", // override to Office Furniture
            "ליווי לבחירת תאורה",
            "פיקוח עליון",
            "אי-כלולים סטנדרטי"
        ],
        overrides: {
            "הכנת פרוגרמה": "הכנת פרוגרמה (צרכי העסק, מספר עובדים, אזורי עבודה, חדרי ישיבות)",
            "הכנת לוח השראה": "הכנת לוח השראה (לאופי המשרד והמותג)",
            "ליווי לספק מטבחים ונגרים": "ליווי לספק מטבחים ונגרים (מטבחון משרדי + נגרות מובנית)",
            "ליווי לבחירות ריהוט": "ליווי לבחירות ריהוט משרדי"
        }
    },
    {
        code: "new_construction_apartment",
        name: "תכנון מלא - דירה/בית (בנייה חדשה)",
        description: "הצעת מחיר לתכנון אדריכלי ועיצוב פנים מלא לדירה או בית פרטי חדש",
        items: [
            "פתיחת כרטיס פרויקט",
            "הכנת פרוגרמה",
            "הכנת לוח השראה",
            "הכנת סקיצות ראשונות",
            "אישור סקיצה",
            "הכנת הדמיות",
            "אישור הדמיות",
            "סט תוכניות עבודה מפורט",
            "תוכנית אפיון",
            "תוכנית אדריכלות",
            "תוכנית פרישה ראשונית",
            "תוכנית פרישה סופית",
            "תוכנית חשמל",
            "תוכנית תקשורת ומולטימדיה",
            "תוכנית אינסטלציה",
            "תוכנית מיזוג אוויר",
            "ליווי לבחירות ריצוף וכלים סניטריים",
            "ליווי לספק מטבחים ונגרים",
            "ליווי לבחירת מוצרי חשמל למטבח",
            "ליווי לבחירות ריהוט",
            "ליווי לבחירת תאורה",
            "ליווי לבחירת דלתות",
            "ליווי לבחירת חומרים להלבשת הבית",
            "פיקוח עליון",
            "אי-כלולים סטנדרטי"
        ]
    },
    {
        code: "renovation_office",
        name: "תכנון מלא - משרד/מעטפת (שיפוץ)",
        description: "הצעת מחיר לתכנון ועיצוב פנים מלא לשיפוץ משרד או מבנה מסחרי קיים",
        items: [
            "פתיחת כרטיס פרויקט",
            "הכנת פרוגרמה", // override
            "הכנת לוח השראה", // override
            "הכנת סקיצות ראשונות",
            "אישור סקיצה",
            "הכנת הדמיות",
            "אישור הדמיות",
            "סט תוכניות עבודה מפורט",
            "תוכנית אפיון",
            "תוכנית אדריכלות",
            "תוכנית בניה והריסה",
            "תוכנית חשמל",
            "תוכנית תקשורת ומולטימדיה",
            "תוכנית מיזוג אוויר",
            "ליווי לספק מטבחים ונגרים", // override
            "ליווי לבחירות ריהוט", // override
            "ליווי לבחירת תאורה",
            "פיקוח עליון",
            "אי-כלולים סטנדרטי"
        ],
        overrides: {
            "הכנת פרוגרמה": "הכנת פרוגרמה (צרכי העסק, מספר עובדים, אזורי עבודה, חדרי ישיבות)",
            "הכנת לוח השראה": "הכנת לוח השראה (לאופי המשרד והמותג)",
            "ליווי לספק מטבחים ונגרים": "ליווי לספק מטבחים ונגרים (מטבחון משרדי + נגרות מובנית)",
            "ליווי לבחירות ריהוט": "ליווי לבחירות ריהוט משרדי"
        }
    },
    {
        code: "renovation_apartment",
        name: "תכנון מלא - דירה/בית (שיפוץ)",
        description: "הצעת מחיר לתכנון ועיצוב פנים מלא לשיפוץ דירה או בית פרטי קיים",
        items: [
            "פתיחת כרטיס פרויקט",
            "הכנת פרוגרמה",
            "הכנת לוח השראה",
            "הכנת סקיצות ראשונות",
            "אישור סקיצה",
            "הכנת הדמיות",
            "אישור הדמיות",
            "סט תוכניות עבודה מפורט",
            "תוכנית אפיון",
            "תוכנית אדריכלות",
            "תוכנית בניה והריסה",
            "תוכנית פרישה ראשונית",
            "תוכנית פרישה סופית",
            "תוכנית חשמל",
            "תוכנית תקשורת ומולטימדיה",
            "תוכנית אינסטלציה",
            "תוכנית מיזוג אוויר",
            "ליווי לבחירות ריצוף וכלים סניטריים",
            "ליווי לספק מטבחים ונגרים",
            "ליווי לבחירת מוצרי חשמל למטבח",
            "ליווי לבחירות ריהוט",
            "ליווי לבחירת תאורה",
            "ליווי לבחירת דלתות",
            "ליווי לבחירת חומרים להלבשת הבית",
            "פיקוח עליון",
            "אי-כלולים סטנדרטי"
        ]
    }
];

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        // Since we are running as a seeded script, we can skip auth if triggered internally, 
        // but robustly we should check user. 
        // For development purpose/testing, we'll assume the caller has rights or we use service role if needed.
        // But here we use standard user role.
        
        // 1. Upsert Clauses
        const clausesMap = new Map(); // title -> clause object
        
        // Fetch existing clauses to minimize duplicates
        const existingClauses = await base44.entities.ProposalClause.list(undefined, 100);
        
        for (const clauseData of CLAUSES) {
            let clause = existingClauses.find(c => c.title === clauseData.title);
            
            if (clause) {
                // Update existing
                clause = await base44.entities.ProposalClause.update(clause.id, {
                    ...clauseData,
                    default_quantity: 1,
                    default_price: 0
                });
            } else {
                // Create new
                clause = await base44.entities.ProposalClause.create({
                    ...clauseData,
                    default_quantity: 1,
                    default_price: 0
                });
            }
            clausesMap.set(clause.title, clause);
        }
        
        // 2. Upsert Templates
        // First, clean up ANY existing system templates to ensure we only have the 4 we want
        const existingSystemTemplates = await base44.entities.ProposalTemplate.filter({ is_system: true }, undefined, 100);
        for (const t of existingSystemTemplates) {
             await base44.entities.ProposalTemplate.delete(t.id);
        }
        
        const results = [];
        
        for (const tmpl of TEMPLATES) {
            // Always create fresh to ensure clean state
            let template = null; 
            // let template = existingTemplates.find(t => t.code === tmpl.code || t.name === tmpl.name);
            
            // Construct items array
            const items = tmpl.items.map((title, index) => {
                const clause = clausesMap.get(title);
                if (!clause) {
                    // Fallback if title not found (shouldn't happen with our logic)
                    return null;
                }
                
                // Check for overrides (title/description)
                let displayTitle = clause.title;
                let displayDesc = clause.description;
                
                if (tmpl.overrides && tmpl.overrides[title]) {
                    // Check if override is just a title string or object? 
                    // User said: "להתאים: 'צרכי העסק...'" which implies changing description or title.
                    // The prompt example shows "הכנת פרוגרמה (צרכי העסק...)" which looks like a title change.
                    // But maybe description too? I'll assume it changes the description context mostly, 
                    // or appends to title. 
                    // Let's interpret the user prompt: "הכנת פרוגרמה (להתאים: ...)"
                    // I'll update the title to match the requested format in the prompt
                    // e.g. "הכנת פרוגרמה (צרכי העסק...)"
                    // Actually, looking at prompt: 
                    // "הכנת פרוגרמה (להתאים: 'צרכי העסק...')" -> I will append to title or description.
                    // The prompt example "2. הכנת פרוגרמה (להתאים: ...)" usually means title change in the list, or just instructions.
                    // I will change the Description to be more specific if provided, or Title.
                    // Let's use the override text as the description suffix or title.
                    // I'll stick to the exact string provided in overrides for the TITLE if it matches.
                    // Wait, the overrides I put in `overrides` object are full strings. I will use them as titles.
                     displayTitle = tmpl.overrides[title];
                }
                
                return {
                    clause_id: clause.id,
                    title: displayTitle,
                    description: displayDesc,
                    quantity: 1,
                    price: 0,
                    category: clause.category,
                    order: index + 1
                };
            }).filter(Boolean);
            
            const templateData = {
                name: tmpl.name,
                code: tmpl.code,
                description: tmpl.description,
                type: 'standard',
                status: 'active',
                is_system: true,
                items: items
            };
            
            if (template) {
                await base44.entities.ProposalTemplate.update(template.id, templateData);
                results.push(`Updated template: ${tmpl.name}`);
            } else {
                await base44.entities.ProposalTemplate.create(templateData);
                results.push(`Created template: ${tmpl.name}`);
            }
        }
        
        return Response.json({ 
            success: true, 
            clauses_count: clausesMap.size,
            templates_processed: results 
        });
        
    } catch (error) {
        return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
});