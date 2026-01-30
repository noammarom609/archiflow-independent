import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/utils/authHelpers';
import ProposalTemplatesPage from './ProposalTemplates';
import {
  Palette,
  Image,
  Box,
  Sofa,
  FolderOpen,
  Upload,
  Download,
  Trash2,
  Grid3x3,
  List,
  Search,
  ArrowRight,
  Home,
  File,
  FileImage,
  FileText,
  Plus,
  MoreVertical,
  Eye,
  Share2,
  Video,
  Type,
  FileImage as PostIcon,
  Layers,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { showSuccess, showError } from '../components/utils/notifications';
import FileUploadDialog from '../components/library/FileUploadDialog';
import FilePreviewDialog from '../components/library/FilePreviewDialog';
import MoodboardEditor from '../components/library/moodboard_new/MoodboardEditor';
import ContentLibraryComponent from '../components/library/ContentLibrary';
// Toaster moved to App.jsx for global fixed positioning
import PageHeader from '../components/layout/PageHeader';
import { FURNITURE_DATA, REFERENCE_DATA } from '../data/mockDesignAssets';

const getCategoryCount = (categoryId, files, proposalTemplatesCount, contentItemsCount) => {
  if (categoryId === 'proposal_templates') {
    return proposalTemplatesCount || 0;
  }
  if (categoryId === 'content') {
    return contentItemsCount || 0;
  }
  return files[categoryId]?.length || 0;
};

const rootCategories = [
  { id: 'content', name: 'תוכן', icon: Layers, color: 'bg-primary/20 text-primary' },
  { id: 'moodboards', name: 'לוחות השראה', icon: Palette, color: 'bg-archiflow-terracotta/20 text-archiflow-terracotta' },
  { id: 'furniture', name: 'רהיטים', icon: Sofa, color: 'bg-archiflow-forest-green/20 text-archiflow-forest-green' },
  { id: 'references', name: 'תמונות רפרנס', icon: Image, color: 'bg-archiflow-taupe/20 text-archiflow-taupe' },
  { id: 'proposal_templates', name: 'תבניות הצעת מחיר', icon: FileText, color: 'bg-secondary/20 text-secondary' },
];

// Rich Mock Data - Real World Examples
const mockFiles = {
  moodboards: [
    {
      id: 1,
      name: 'לוח השראה - פנטהאוז תל אביבי',
      type: 'moodboard',
      size: '12.8 MB',
      date: '2025-01-08',
      url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80',
      tags: ['מודרני', 'יוקרתי', 'אורבני', 'ניו יורק'],
      details: {
        projectName: 'פרויקט רוטשילד 42',
        client: 'משפחת כהן',
        rooms: ['סלון', 'פינת אוכל', 'מטבח', 'חדר שינה ראשי'],
        furnitureIds: [101, 102, 103],
        items: [
          { name: 'ספה מודולרית B&B Italia', qty: 1, price: '₪38,000' },
          { name: 'שולחן אוכל Cattelan', qty: 1, price: '₪24,000' },
          { name: 'כסאות Kartell Ghost', qty: 6, price: '₪12,000' },
          { name: 'מנורת תקרה Flos', qty: 3, price: '₪8,500' },
        ],
        colors: ['#FFFFFF', '#F8F9FA', '#D4A574', '#2C2C2C', '#8B7355'],
        materials: ['עץ אלון', 'שיש קררה', 'זכוכית', 'פליז מוברש'],
        style: 'מודרני יוקרתי',
        totalBudget: '₪285,000',
        estimatedBudget: '₪180,000',
        notes: 'דגש על תאורה טבעית, חללי פתוחים, שימוש בחומרים איכותיים',
      },
    },
    {
      id: 2,
      name: 'וילה כפרית - סגנון טוסקני',
      type: 'moodboard',
      size: '15.2 MB',
      date: '2025-01-07',
      url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80',
      tags: ['כפרי', 'טוסקני', 'חם', 'משפחתי'],
      details: {
        projectName: 'וילה בכפר ורדים',
        client: 'משפחת לוי',
        rooms: ['סלון משפחתי', 'מטבח כפרי', '5 חדרי שינה', 'חצר פנימית'],
        furnitureIds: [102, 105],
        items: [
          { name: 'שולחן עץ מלא בעבודת יד', qty: 1, price: '₪18,000' },
          { name: 'כורסאות רטרו מרופדות', qty: 4, price: '₪28,000' },
          { name: 'ספריית עץ עתיקה', qty: 2, price: '₪32,000' },
          { name: 'נברשת ברזל מחושל', qty: 2, price: '₪12,000' },
        ],
        colors: ['#D4A373', '#8B7355', '#E8C5A5', '#654321', '#F4E8D8'],
        materials: ['עץ אגוז עתיק', 'אבן טבעית', 'ברזל מחושל', 'עור וינטג׳'],
        style: 'כפרי טוסקני',
        totalBudget: '₪420,000',
        estimatedBudget: '₪320,000',
        notes: 'שימור אלמנטים מקוריים, שילוב עתיק וחדש, חימום תת רצפתי',
      },
    },
    {
      id: 3,
      name: 'דירה יפנית - מינימליזם Zen',
      type: 'moodboard',
      size: '9.4 MB',
      date: '2025-01-06',
      url: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&q=80',
      tags: ['יפני', 'זן', 'מינימליזם', 'טבע'],
      details: {
        projectName: 'דירת סטודיו - נווה צדק',
        client: 'דנה אברהם',
        rooms: ['חלל פתוח', 'פינת שינה', 'מטבח מוסתר'],
        furnitureIds: [104],
        items: [
          { name: 'מזרן פוטון יפני', qty: 1, price: '₪8,000' },
          { name: 'שולחן נמוך במבוק', qty: 1, price: '₪4,500' },
          { name: 'מסך שוג׳י', qty: 3, price: '₪15,000' },
          { name: 'כלי קרמיקה בעבודת יד', qty: 5, price: '₪3,200' },
        ],
        colors: ['#F5F5F5', '#E8E8E8', '#8B7355', '#2C2C2C'],
        materials: ['במבוק', 'נייר אורז', 'אבן בזלת', 'עץ אשי'],
        style: 'יפני מודרני',
        totalBudget: '₪95,000',
        estimatedBudget: '₪75,000',
        notes: 'דגש על מרחב ריק, אור טבעי, צמחייה מינימלית',
      },
    },
    {
      id: 4,
      name: 'לופט תעשייתי - שכונת התקווה',
      type: 'moodboard',
      size: '18.6 MB',
      date: '2025-01-05',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
      tags: ['תעשייתי', 'לופט', 'אורבני', 'אמנות'],
      details: {
        projectName: 'לופט תעשייתי 180 מ״ר',
        client: 'סטודיו 5',
        rooms: ['גלרי מרכזי', 'סטודיו עבודה', 'חדר שינה', 'גג פתוח'],
        furnitureIds: [101, 102, 104],
        items: [
          { name: 'ספסלי קורות פלדה', qty: 2, price: '₪22,000' },
          { name: 'מערכת תאורה תעשייתית', qty: 8, price: '₪18,000' },
          { name: 'שולחן בטון ופלדה', qty: 1, price: '₪16,000' },
          { name: 'מדפי ברזל מרחפים', qty: 6, price: '₪24,000' },
        ],
        colors: ['#2C2C2C', '#4A4A4A', '#8B4513', '#C0C0C0', '#A0522D'],
        materials: ['בטון מוחלק', 'פלדה שחורה', 'לבנים חשופות', 'עור מיושן'],
        style: 'תעשייתי מודרני',
        totalBudget: '₪380,000',
        estimatedBudget: '₪280,000',
        notes: 'שימור אלמנטים מקוריים, תקרות גבוהות, צנרת חשופה',
      },
    },
    {
      id: 5,
      name: 'דירת יוקרה - הרצליה פיתוח',
      type: 'moodboard',
      size: '16.8 MB',
      date: '2025-01-04',
      url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&q=80',
      tags: ['יוקרה', 'חוף', 'נוף', 'מודרני'],
      details: {
        projectName: 'מגדל ים התיכון - קומה 22',
        client: 'משפחת דוד',
        rooms: ['סלון פנורמי', 'מטבח שף', '4 חדרי שינה', 'מרפסת 40 מ״ר'],
        furnitureIds: [101, 103],
        items: [
          { name: 'ספה פינתית Minotti', qty: 1, price: '₪68,000' },
          { name: 'שולחן שיש Calacatta', qty: 1, price: '₪42,000' },
          { name: 'מערכת קולנוע בית', qty: 1, price: '₪85,000' },
          { name: 'מיטה מרחפת מעוצבת', qty: 1, price: '₪35,000' },
        ],
        colors: ['#FFFFFF', '#E6F3FF', '#4682B4', '#D4A574', '#2C2C2C'],
        materials: ['שיש קררה', 'זכוכית חכמה', 'עץ טיק', 'אלומיניום מבוקע'],
        style: 'יוקרה מודרנית',
        totalBudget: '₪850,000',
        estimatedBudget: '₪650,000',
        notes: 'מערכת חכמה מלאה, בית נגיש, דגש על נוף הים',
      },
    },
    {
      id: 6,
      name: 'בית משפחתי - קיבוץ גזר',
      type: 'moodboard',
      size: '13.2 MB',
      date: '2025-01-03',
      url: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80',
      tags: ['משפחתי', 'ירוק', 'קיימות', 'טבע'],
      details: {
        projectName: 'בית פסיבי אקולוגי',
        client: 'משפחת גרין',
        rooms: ['סלון משפחתי', 'מטבח פתוח', '5 חדרי שינה', 'חדר משחקים', 'חצר'],
        furnitureIds: [102, 105],
        items: [
          { name: 'ספה ממוחזר sustainable', qty: 2, price: '₪24,000' },
          { name: 'שולחן עץ מקומי', qty: 1, price: '₪12,000' },
          { name: 'כסאות במבוק', qty: 8, price: '₪8,000' },
          { name: 'מדפים ממשטחי גרניט', qty: 4, price: '₪6,000' },
        ],
        colors: ['#8B7355', '#D4A574', '#90EE90', '#F4E8D8', '#654321'],
        materials: ['עץ ממוחזר', 'במבוק', 'צמר טבעי', 'חימר'],
        style: 'אקולוגי מודרני',
        totalBudget: '₪240,000',
        estimatedBudget: '₪180,000',
        notes: 'בניה ירוקה, פאנלים סולריים, איסוף מי גשם, גן אורגני',
      },
    },
    {
      id: 2,
      name: 'לוח השראה - בוהו שיק',
      type: 'moodboard',
      size: '12.1 MB',
      date: '2025-01-07',
      url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80',
      tags: ['בוהו', 'צבעוני', 'חם'],
      details: {
        items: ['כורסא ראטן', 'כריות צבעוניות', 'צמחייה', 'מקרמה'],
        colors: ['#D4A373', '#E8C5A5', '#8B7355', '#F4E8D8'],
        style: 'בוהו שיק',
        budget: '₪120,000',
      },
    },
    {
      id: 3,
      name: 'סקנדינבי חם - פלטת חורף',
      type: 'moodboard',
      size: '6.8 MB',
      date: '2025-01-06',
      url: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&q=80',
      tags: ['סקנדינבי', 'חורף', 'עץ'],
      details: {
        items: ['עץ אלון', 'טקסטיל צמר', 'נרות', 'פרוות סינטטיות'],
        colors: ['#8B7355', '#D4A574', '#FFFFFF', '#2C2C2C'],
        style: 'סקנדינבי מודרני',
        budget: '₪150,000',
      },
    },
    {
      id: 4,
      name: 'תעשייתי אורבני',
      type: 'moodboard',
      size: '9.2 MB',
      date: '2025-01-05',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
      tags: ['תעשייתי', 'אורבני', 'מתכת'],
      details: {
        items: ['צנרת גלויה', 'לבנים חשופות', 'מתכת שחורה', 'עור'],
        colors: ['#2C2C2C', '#4A4A4A', '#8B4513', '#A0522D'],
        style: 'תעשייתי מודרני',
        budget: '₪200,000',
      },
    },
    {
      id: 5,
      name: 'יפני מינימליסטי - Zen',
      type: 'moodboard',
      size: '5.4 MB',
      date: '2025-01-04',
      url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&q=80',
      tags: ['יפני', 'זן', 'מינימליסטי'],
      details: {
        items: ['טאטמי', 'שולחן נמוך', 'פנסי נייר', 'במבוק'],
        colors: ['#F5F5F5', '#8B7355', '#2C2C2C', '#D4A574'],
        style: 'יפני מודרני',
        budget: '₪160,000',
      },
    },
    {
      id: 6,
      name: 'ים תיכוני - סנטוריני',
      type: 'moodboard',
      size: '10.3 MB',
      date: '2025-01-03',
      url: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80',
      tags: ['ים תיכוני', 'לבן', 'כחול'],
      details: {
        items: ['אריחים כחולים', 'קירות לבנים', 'עץ ישן', 'טרקוטה'],
        colors: ['#4682B4', '#FFFFFF', '#D4A574', '#8B7355'],
        style: 'ים תיכוני',
        budget: '₪140,000',
      },
    },
    {
      id: 7,
      name: 'חדר ילדים - עולם הדינוזאורים',
      type: 'moodboard',
      size: '11.4 MB',
      date: '2025-01-02',
      url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&q=80',
      tags: ['ילדים', 'צבעוני', 'דינוזאורים'],
      details: {
        projectName: 'חדר יהונתן - גיל 6',
        client: 'משפחת רוזנברג',
        rooms: ['חדר שינה ומשחק'],
        furnitureIds: [],
        items: [
          { name: 'מיטת דינוזאור מעוצבת', qty: 1, price: '₪8,500' },
          { name: 'קיר טיפוס ביתי', qty: 1, price: '₪12,000' },
          { name: 'שטיח ג׳ונגל', qty: 1, price: '₪2,800' },
          { name: 'ארון אחסון משחקים', qty: 2, price: '₪6,000' },
        ],
        colors: ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#795548'],
        materials: ['עץ צבוע בצבעי מים', 'בד כותנה', 'פוליאסטר ממוחזר'],
        style: 'ילדים הרפתקני',
        totalBudget: '₪65,000',
        estimatedBudget: '₪45,000',
        notes: 'בטיחות מקסימלית, צבעים לא רעילים, התאמה לגיל',
      },
    },
    {
      id: 8,
      name: 'משרד ביתי - Tech Startup',
      type: 'moodboard',
      size: '10.8 MB',
      date: '2025-01-01',
      url: 'https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?w=600&q=80',
      tags: ['משרד', 'טכנולוגי', 'מודרני'],
      details: {
        projectName: 'Home Office - CEO',
        client: 'רועי בן דוד',
        rooms: ['חדר עבודה', 'פינת ישיבות'],
        furnitureIds: [102],
        items: [
          { name: 'שולחן עמידה חשמלי', qty: 1, price: '₪5,500' },
          { name: 'כסא ארגונומי Herman Miller', qty: 1, price: '₪6,800' },
          { name: 'מערכת תאורה חכמה', qty: 1, price: '₪4,200' },
          { name: 'מדפי מתכת תעשייתי', qty: 3, price: '₪8,500' },
        ],
        colors: ['#2C2C2C', '#FFFFFF', '#0066FF', '#FFD700'],
        materials: ['מתכת שחורה', 'עץ מלא', 'זכוכית מחוסמת'],
        style: 'טכנולוגי עכשווי',
        totalBudget: '₪85,000',
        estimatedBudget: '₪65,000',
        notes: 'בידוד אקוסטי, מערכות AV, חיבור סיבים אופטיים',
      },
    },
    {
      id: 9,
      name: 'מטבח חלומי - שף ביתי',
      type: 'moodboard',
      size: '20.2 MB',
      date: '2024-12-28',
      url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=600&q=80',
      tags: ['מטבח', 'שף', 'מקצועי'],
      details: {
        projectName: 'מטבח גורמה - רמת אביב',
        client: 'משפחת שפירא',
        rooms: ['מטבח', 'פינת אוכל', 'פנטרי'],
        furnitureIds: [102],
        items: [
          { name: 'אי מטבח 3 מטר', qty: 1, price: '₪45,000' },
          { name: 'כיריים גז 6 להבות', qty: 1, price: '₪12,000' },
          { name: 'מקרר זוגי Sub Zero', qty: 1, price: '₪38,000' },
          { name: 'משטח שיש Calacatta', qty: 8, price: '₪52,000' },
        ],
        colors: ['#FFFFFF', '#2C2C2C', '#C0C0C0', '#D4AF37'],
        materials: ['שיש קלקטה', 'נירוסטה מקצועית', 'עץ אלון'],
        style: 'מקצועי מודרני',
        totalBudget: '₪420,000',
        estimatedBudget: '₪350,000',
        notes: 'תנור פיצה, מערכת אוורור מתקדמת, יחידת יינות',
      },
    },
    {
      id: 10,
      name: 'חדר אמבטיה ספא',
      type: 'moodboard',
      size: '14.6 MB',
      date: '2024-12-25',
      url: 'https://images.unsplash.com/photo-1600566752229-250ed79470e1?w=600&q=80',
      tags: ['אמבטיה', 'ספא', 'יוקרה'],
      details: {
        projectName: 'Master Bath - וילה כנרת',
        client: 'משפחת כהן',
        rooms: ['אמבטיה ראשית', 'שירותי אורחים'],
        furnitureIds: [103],
        items: [
          { name: 'אמבט עצמאי Agape', qty: 1, price: '₪42,000' },
          { name: 'מקלחת גשם + סאונה', qty: 1, price: '₪68,000' },
          { name: 'כיור כפול שיש', qty: 1, price: '₪18,000' },
          { name: 'תאורה מוטמעת חכמה', qty: 12, price: '₪24,000' },
        ],
        colors: ['#F5F5F5', '#8B7355', '#D4A574', '#C0C0C0'],
        materials: ['שיש קררה', 'טראוורטין', 'ברונזה', 'זכוכית מחוסמת'],
        style: 'ספא יוקרתי',
        totalBudget: '₪520,000',
        estimatedBudget: '₪420,000',
        notes: 'חימום תת רצפתי, מערכת מוזיקה, מראות מחוממות',
      },
    },
  ],

  furniture: [
    {
      id: 101,
      name: 'ספה מודולרית - COMO L-Shape',
      type: 'furniture',
      size: '15.2 MB',
      date: '2025-01-10',
      url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',
      mainImage: 0,
      tags: ['ספה', 'מודרני', 'מודולרי', 'איטליה'],
      furniture: {
        category: 'סלון',
        manufacturer: 'BoConcept',
        sku: 'BC-COMO-L-2025',
        price: '₪18,500',
        onSale: false,
        dimensions: '320x180x85 ס״מ',
        weight: '95 ק״ג',
        colors: [
          { name: 'אפור בהיר', hex: '#C0C0C0', available: true },
          { name: 'כחול נייבי', hex: '#000080', available: true },
          { name: 'ורוד עתיק', hex: '#D4A5A5', available: false },
          { name: 'ירוק זית', hex: '#556B2F', available: true },
        ],
        materials: ['בד איכותי', 'עץ אלון מלא', 'מתכת מבריקה', 'קצף HR'],
        warranty: '5 שנים',
        delivery: '4-6 שבועות',
        assembly: 'נדרש הרכבה מקצועית',
        features: ['מודולרי - ניתן להרכבה מחדש', 'כריות נשלפות לכביסה', 'רגליים מתכוונות'],
        images: [
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
          'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600&q=80',
          'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80',
        ],
      },
    },
    {
      id: 102,
      name: 'שולחן אוכל - Nordic Oak Extendable',
      type: 'furniture',
      size: '12.8 MB',
      date: '2025-01-09',
      url: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=600&q=80',
      mainImage: 0,
      tags: ['שולחן', 'אוכל', 'עץ', 'נפתח'],
      furniture: {
        category: 'פינת אוכל',
        manufacturer: 'Ethnicraft Belgium',
        sku: 'ETH-OAK-EXT-240',
        price: '₪12,800',
        onSale: true,
        salePrice: '₪10,900',
        dimensions: '240x100x75 ס״מ (נפתח ל-340 ס״מ)',
        weight: '68 ק״ג',
        colors: [
          { name: 'אלון טבעי', hex: '#D4A574', available: true },
          { name: 'אלון מעושן', hex: '#654321', available: true },
          { name: 'אגוז כהה', hex: '#3E2723', available: true },
        ],
        materials: ['עץ אלון מלא FSC', 'שעווה טבעית דנית', 'מנגנון הרחבה גרמני'],
        warranty: '10 שנים',
        delivery: '2-3 שבועות',
        assembly: 'מורכב מראש',
        features: ['נפתח ל-8-12 סועדים', 'עמיד במים וכתמים', 'מעץ בר קיימא'],
        images: [
          'https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=600&q=80',
          'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80',
          'https://images.unsplash.com/photo-1617098900591-3f90928e8c54?w=600&q=80',
          'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=600&q=80',
        ],
      },
    },
    {
      id: 103,
      name: 'מיטה מרופדת - Luna Cloud Queen',
      type: 'furniture',
      size: '18.4 MB',
      date: '2025-01-08',
      url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80',
      mainImage: 0,
      tags: ['מיטה', 'חדר שינה', 'מרופדת', 'יוקרה'],
      furniture: {
        category: 'חדר שינה',
        manufacturer: 'Meridiani Italia',
        sku: 'MER-LUNA-Q-VEL',
        price: '₪22,000',
        onSale: false,
        dimensions: '180x200 ס״מ (גם 160, 200 זמין)',
        weight: '85 ק״ג',
        colors: [
          { name: 'אפור בהיר', hex: '#D3D3D3', available: true },
          { name: 'בז׳ חמים', hex: '#D4A574', available: true },
          { name: 'כחול פטרול', hex: '#2C5F6F', available: true },
          { name: 'ורוד אבקתי', hex: '#FFB6C1', available: true },
          { name: 'ירוק מנטה', hex: '#98FF98', available: false },
        ],
        materials: ['קטיפה איטלקית פרימיום', 'עץ מלא מחוזק', 'ספוג HR גמיש', 'מתכת מצופה'],
        warranty: '7 שנים',
        delivery: '6-8 שבועות',
        assembly: 'כולל הרכבה ופינוי אריזות',
        features: [
          'ראש מיטה מרופד בקפיטונז׳',
          'תא אחסון תחתון אופציונלי',
          'מנגנון הרמה הידראולי',
          'ניתן להזמין עם שידות תואמות',
        ],
        images: [
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80',
          'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600&q=80',
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80',
          'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&q=80',
          'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80',
          'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=600&q=80',
        ],
      },
    },
    {
      id: 104,
      name: 'כורסת טלוויזיה - Relax Pro',
      type: 'furniture',
      size: '9.6 MB',
      date: '2025-01-07',
      url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80',
      tags: ['כורסא', 'נוחות', 'סלון'],
      furniture: {
        category: 'סלון',
        manufacturer: 'Natuzzi',
        price: '₪8,900',
        dimensions: '90x95x102 ס״מ',
        colors: ['עור שחור', 'עור חום', 'בד אפור'],
        materials: ['עור איטלקי', 'מנגנון ריקליינר'],
        images: [
          'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
        ],
      },
    },
    {
      id: 105,
      name: 'ארון הזזה - Minimalist',
      type: 'furniture',
      size: '14.2 MB',
      date: '2025-01-06',
      url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80',
      tags: ['ארון', 'חדר שינה', 'הזזה'],
      furniture: {
        category: 'חדר שינה',
        manufacturer: 'IKEA Premium',
        price: '₪15,500',
        dimensions: '250x60x220 ס״מ',
        colors: ['לבן מט', 'אפור אנתרציט', 'אלון טבעי'],
        materials: ['MDF', 'זכוכית', 'אלומיניום'],
        images: [
          'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80',
        ],
      },
    },
    {
      id: 106,
      name: 'כורסת טלוויזיה - Relax Pro Recliner',
      type: 'furniture',
      size: '9.6 MB',
      date: '2025-01-07',
      url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80',
      mainImage: 0,
      tags: ['כורסא', 'נוחות', 'ריקליינר', 'סלון'],
      furniture: {
        category: 'סלון',
        manufacturer: 'Natuzzi Editions',
        sku: 'NAT-RELAX-PRO',
        price: '₪8,900',
        onSale: false,
        dimensions: '90x95x102 ס״מ',
        weight: '45 ק״ג',
        colors: [
          { name: 'עור שחור', hex: '#000000', available: true },
          { name: 'עור חום', hex: '#8B4513', available: true },
          { name: 'בד אפור', hex: '#808080', available: true },
        ],
        materials: ['עור איטלקי אמיתי', 'מנגנון ריקליינר אלקטרוני', 'עץ מלא בבסיס'],
        warranty: '5 שנים',
        delivery: '3-4 שבועות',
        assembly: 'מגיע מורכב',
        features: ['ריקליינר חשמלי', 'תומך ראש מתכוונן', 'פונקציית עיסוי', 'USB טעינה מובנה'],
        images: [
          'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
        ],
      },
    },
    {
      id: 107,
      name: 'ארון הזזה 3 דלתות - Minimalist Pro',
      type: 'furniture',
      size: '14.2 MB',
      date: '2025-01-06',
      url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80',
      mainImage: 0,
      tags: ['ארון', 'חדר שינה', 'הזזה', 'מודרני'],
      furniture: {
        category: 'חדר שינה',
        manufacturer: 'Rauch Germany',
        sku: 'RAU-MIN-250-3D',
        price: '₪15,500',
        onSale: true,
        salePrice: '₪13,200',
        dimensions: '250x60x220 ס״מ',
        weight: '185 ק״ג',
        colors: [
          { name: 'לבן מט', hex: '#F5F5F5', available: true },
          { name: 'אפור אנתרציט', hex: '#2F4F4F', available: true },
          { name: 'אלון טבעי', hex: '#D4A574', available: true },
        ],
        materials: ['MDF איכותי', 'זכוכית מחוסמת', 'אלומיניום', 'מסילות שקטות'],
        warranty: '5 שנים',
        delivery: '4-5 שבועות',
        assembly: 'כולל הרכבה מקצועית',
        features: ['דלתות הזזה שקטות', 'תאורת LED פנימית', 'מגירות Soft Close', 'מדפים מתכווננים'],
        images: [
          'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80',
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
        ],
      },
    },
    {
      id: 108,
      name: 'כסא אוכל מרופד - Oslo',
      type: 'furniture',
      size: '6.2 MB',
      date: '2025-01-05',
      url: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&q=80',
      mainImage: 0,
      tags: ['כסא', 'אוכל', 'מרופד', 'סקנדינבי'],
      furniture: {
        category: 'פינת אוכל',
        manufacturer: 'Muuto Denmark',
        sku: 'MUT-OSLO-CH',
        price: '₪1,850',
        onSale: false,
        dimensions: '52x58x82 ס״מ',
        weight: '6.5 ק״ג',
        colors: [
          { name: 'אפור בהיר', hex: '#D3D3D3', available: true },
          { name: 'כחול נייבי', hex: '#000080', available: true },
          { name: 'ירוק חאקי', hex: '#8B8B00', available: true },
          { name: 'וורוד ישן', hex: '#D4A5A5', available: false },
        ],
        materials: ['בד איכותי', 'עץ אלון', 'קצף HR'],
        warranty: '3 שנים',
        delivery: '2 שבועות',
        assembly: 'דורש הרכבה פשוטה',
        features: ['ריפוד נשלף', 'רגליים מעץ מלא', 'ארגונומי'],
        images: [
          'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&q=80',
          'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=600&q=80',
        ],
      },
    },
    {
      id: 109,
      name: 'ספה 2 מושבים - Copenhagen',
      type: 'furniture',
      size: '11.4 MB',
      date: '2025-01-04',
      url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
      mainImage: 0,
      tags: ['ספה', 'קטנה', 'סקנדינבי'],
      furniture: {
        category: 'סלון',
        manufacturer: 'Hay Denmark',
        sku: 'HAY-CPH-2S',
        price: '₪9,800',
        onSale: false,
        dimensions: '155x85x82 ס״מ',
        weight: '42 ק״ג',
        colors: [
          { name: 'אפור פחם', hex: '#36454F', available: true },
          { name: 'בז׳ חול', hex: '#D2B48C', available: true },
          { name: 'טורקיז', hex: '#40E0D0', available: true },
        ],
        materials: ['בד כותנה', 'עץ אלון', 'קצף רך'],
        warranty: '5 שנים',
        delivery: '3 שבועות',
        assembly: 'מגיע מורכב',
        features: ['מושבים עמוקים', 'רגליים עץ מעוצבות', 'כריות נוספות כלולות'],
        images: [
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
        ],
      },
    },
    {
      id: 110,
      name: 'שולחן קפה מתכת וזכוכית',
      type: 'furniture',
      size: '8.8 MB',
      date: '2025-01-03',
      url: 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=600&q=80',
      mainImage: 0,
      tags: ['שולחן', 'סלון', 'מודרני', 'זכוכית'],
      furniture: {
        category: 'סלון',
        manufacturer: 'Roche Bobois',
        sku: 'RB-GLASS-CT',
        price: '₪5,600',
        onSale: true,
        salePrice: '₪4,200',
        dimensions: '120x60x40 ס״מ',
        weight: '28 ק״ג',
        colors: [
          { name: 'זכוכית שקופה', hex: '#FFFFFF', available: true },
          { name: 'זכוכית מעושנת', hex: '#696969', available: true },
        ],
        materials: ['זכוכית מחוסמת 12 מ״מ', 'מתכת מוברשת', 'גומי למניעת שריטות'],
        warranty: '2 שנים',
        delivery: '10 ימים',
        assembly: 'הרכבה פשוטה',
        features: ['זכוכית מחוסמת לבטיחות', 'מדף תחתון לאחסון', 'רגליים מתכת יציבות'],
        images: [
          'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=600&q=80',
        ],
      },
    },
  ],

  textures: [
    { 
      id: 201, 
      name: 'עץ אלון טבעי - דקור אירופאי', 
      type: 'texture', 
      size: '4.2 MB', 
      date: '2025-01-10', 
      url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=80', 
      tags: ['עץ', 'טבעי', 'אלון', 'חם'], 
      texture: { 
        type: 'עץ טבעי', 
        finish: 'מט / שעווה', 
        usage: 'ריצוף, קירות, נגרות',
        thickness: '12-15 מ״מ',
        installation: 'דבק / צף',
        maintenance: 'נמוך - שעווה שנתית',
      } 
    },
    { 
      id: 202, 
      name: 'שיש קררה - איטליה', 
      type: 'texture', 
      size: '5.8 MB', 
      date: '2025-01-09', 
      url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80', 
      tags: ['שיש', 'לבן', 'יוקרתי', 'איטליה'], 
      texture: { 
        type: 'שיש טבעי', 
        finish: 'מבריק / הונינג', 
        usage: 'משטחים, ריצוף, חיפוי קירות',
        thickness: '20-30 מ״מ',
        installation: 'דבק + סיום',
        maintenance: 'בינוני - איטום תקופתי',
      } 
    },
    { 
      id: 203, 
      name: 'בטון אפור מוחלק - תעשייתי', 
      type: 'texture', 
      size: '3.9 MB', 
      date: '2025-01-08', 
      url: 'https://images.unsplash.com/photo-1565183928294-7d22f2d62a60?w=600&q=80', 
      tags: ['בטון', 'אפור', 'תעשייתי', 'מודרני'], 
      texture: { 
        type: 'בטון מוחלק', 
        finish: 'מט / מבריק', 
        usage: 'קירות, רצפות, משטחים',
        thickness: 'משתנה - 5-10 ס״מ',
        installation: 'יציקה באתר',
        maintenance: 'נמוך - איטום ראשוני',
      } 
    },
    { 
      id: 204, 
      name: 'לבנים אדומות - אנטי בריטי', 
      type: 'texture', 
      size: '6.1 MB', 
      date: '2025-01-07', 
      url: 'https://images.unsplash.com/photo-1604480133435-25b9184a4394?w=600&q=80', 
      tags: ['לבנים', 'אדום', 'וינטג׳', 'תעשייתי'], 
      texture: { 
        type: 'לבנים חשופות', 
        finish: 'טבעי / מחוספס', 
        usage: 'קירות נוי, חיפוי',
        thickness: '8-10 ס״מ',
        installation: 'בניה + פוגות',
        maintenance: 'נמוך - ניקוי יבש',
      } 
    },
    { 
      id: 205, 
      name: 'גרניט שחור מנומר - אפריקה', 
      type: 'texture', 
      size: '7.3 MB', 
      date: '2025-01-06', 
      url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80', 
      tags: ['גרניט', 'שחור', 'יוקרתי', 'עמיד'], 
      texture: { 
        type: 'גרניט טבעי', 
        finish: 'מבריק / מלוטש', 
        usage: 'משטחי מטבח, אמבטיה',
        thickness: '20-30 מ״מ',
        installation: 'דבק מיוחד',
        maintenance: 'נמוך מאוד - עמיד',
      } 
    },
    { 
      id: 206, 
      name: 'אריחי פורצלן - דמוי בטון', 
      type: 'texture', 
      size: '5.4 MB', 
      date: '2025-01-05', 
      url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&q=80', 
      tags: ['פורצלן', 'בטון', 'מודרני'], 
      texture: { 
        type: 'פורצלן', 
        finish: 'מט', 
        usage: 'ריצוף, חיפוי',
        thickness: '9-12 מ״מ',
        installation: 'דבק',
        maintenance: 'נמוך מאוד',
      } 
    },
    { 
      id: 207, 
      name: 'טרוורטין בז׳ - רומא', 
      type: 'texture', 
      size: '6.8 MB', 
      date: '2025-01-04', 
      url: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80', 
      tags: ['אבן', 'בז׳', 'קלאסי'], 
      texture: { 
        type: 'טרוורטין', 
        finish: 'הונינג', 
        usage: 'חיפוי קירות, רצפות',
        thickness: '15-20 מ״מ',
        installation: 'דבק',
        maintenance: 'בינוני - איטום',
      } 
    },
    { 
      id: 208, 
      name: 'טפט טקסטורה - בד פשתן', 
      type: 'texture', 
      size: '2.1 MB', 
      date: '2025-01-03', 
      url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80', 
      tags: ['טפט', 'בד', 'טקסטורה'], 
      texture: { 
        type: 'טפט טקסטורי', 
        finish: 'מט / בד', 
        usage: 'קירות פנימיים',
        thickness: '1-2 מ״מ',
        installation: 'דבק טפט',
        maintenance: 'בינוני - ניקוי עדין',
      } 
    },
  ],

  references: [
    { 
      id: 301, 
      name: 'מטבח יוקרתי פתוח - חלומי', 
      type: 'reference', 
      size: '8.4 MB', 
      date: '2025-01-10', 
      url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=600&q=80', 
      tags: ['מטבח', 'מודרני', 'פתוח', 'יוקרה'], 
      reference: { 
        room: 'מטבח', 
        style: 'מודרני יוקרתי', 
        area: '25 מ״ר',
        colors: ['לבן', 'אפור', 'זהב'],
        notes: 'אי מרכזי 4 מטר, ארונות עליון ללא ידיות, משטח קוריאן לבן, כיריים אינדוקציה, מקרר Sub Zero',
        budget: '₪280,000',
      } 
    },
    { 
      id: 302, 
      name: 'סלון מינימליסטי יפני', 
      type: 'reference', 
      size: '6.2 MB', 
      date: '2025-01-09', 
      url: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=600&q=80', 
      tags: ['סלון', 'מינימליסטי', 'יפני', 'זן'], 
      reference: { 
        room: 'סלון', 
        style: 'מינימליסטי יפני', 
        area: '35 מ״ר',
        colors: ['לבן', 'בז׳', 'שחור'],
        notes: 'קווים נקיים, אחסון מוסתר, צמחייה ירוקה בודדת, שולחן נמוך, ללא טלוויזיה',
        budget: '₪120,000',
      } 
    },
    { 
      id: 303, 
      name: 'חדר שינה בוטיק רומנטי', 
      type: 'reference', 
      size: '5.8 MB', 
      date: '2025-01-08', 
      url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80', 
      tags: ['חדר שינה', 'רומנטי', 'בוטיק'], 
      reference: { 
        room: 'חדר שינה', 
        style: 'רומנטי מודרני', 
        area: '18 מ״ר',
        colors: ['ורוד אבקתי', 'זהב', 'שמנת'],
        notes: 'מיטה מרופדת קטיפה, תאורה עמומה, וילונות שכבתיים, תליית זהב בקיר',
        budget: '₪85,000',
      } 
    },
    { 
      id: 304, 
      name: 'אמבטיה ספא מפנקת', 
      type: 'reference', 
      size: '9.1 MB', 
      date: '2025-01-07', 
      url: 'https://images.unsplash.com/photo-1600566752229-250ed79470e1?w=600&q=80', 
      tags: ['אמבטיה', 'ספא', 'יוקרה', 'מפנק'], 
      reference: { 
        room: 'אמבטיה ראשית', 
        style: 'יוקרתי ספא', 
        area: '15 מ״ר',
        colors: ['שיש קררה', 'זהב', 'לבן'],
        notes: 'אמבטיה עצמאית מרכזית, מקלחת זכוכית גשם + סאונה, כיור כפול, חימום תת רצפתי',
        budget: '₪320,000',
      } 
    },
    { 
      id: 305, 
      name: 'חדר ילדים הרפתקני', 
      type: 'reference', 
      size: '7.3 MB', 
      date: '2025-01-06', 
      url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&q=80', 
      tags: ['ילדים', 'הרפתקה', 'צבעוני'], 
      reference: { 
        room: 'חדר ילדים', 
        style: 'הרפתקני מודרני', 
        area: '16 מ״ר',
        colors: ['כחול', 'ירוק', 'צהוב'],
        notes: 'מיטת קומותיים עם מגלשה, קיר טיפוס, אחסון חכם משחקים, פינת קריאה נעימה',
        budget: '₪45,000',
      } 
    },
    {
      id: 306,
      name: 'משרד ביתי מקצועי',
      type: 'reference',
      size: '6.9 MB',
      date: '2025-01-05',
      url: 'https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?w=600&q=80',
      tags: ['משרד', 'עבודה', 'מקצועי'],
      reference: {
        room: 'משרד ביתי',
        style: 'מקצועי מודרני',
        area: '12 מ״ר',
        colors: ['אפור כהה', 'עץ', 'לבן'],
        notes: 'שולחן עמידה חשמלי, כסא ארגונומי, תאורה מקצועית, בידוד אקוסטי',
        budget: '₪68,000',
      },
    },
    {
      id: 307,
      name: 'פינת אוכל משפחתית',
      type: 'reference',
      size: '7.8 MB',
      date: '2025-01-04',
      url: 'https://images.unsplash.com/photo-1617098900591-3f90928e8c54?w=600&q=80',
      tags: ['פינת אוכל', 'משפחתי', 'חם'],
      reference: {
        room: 'פינת אוכל',
        style: 'משפחתי חם',
        area: '14 מ״ר',
        colors: ['עץ', 'בז׳', 'ירוק'],
        notes: 'שולחן עץ גדול 8 מקומות, כסאות מרופדים, נברשת מעוצבת, ארון כלים וינטג׳',
        budget: '₪52,000',
      },
    },
    {
      id: 308,
      name: 'מרפסת נופש - Chill',
      type: 'reference',
      size: '8.6 MB',
      date: '2025-01-03',
      url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&q=80',
      tags: ['מרפסת', 'חוץ', 'נופש'],
      reference: {
        room: 'מרפסת',
        style: 'ריזורט מודרני',
        area: '20 מ״ר',
        colors: ['לבן', 'כחול', 'עץ טיק'],
        notes: 'ריהוט חוץ איכותי, פרגולה חשמלית, ג׳קוזי מובנה, תאורה אווירה',
        budget: '₪95,000',
      },
    },
  ],
};

export default function DesignLibrary() {
  const [currentFolder, setCurrentFolder] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showProposalTemplates, setShowProposalTemplates] = useState(false);
  const [editingMoodboard, setEditingMoodboard] = useState(null); // ID or 'new'
  const [showContentLibrary, setShowContentLibrary] = useState(false);

  const queryClient = useQueryClient();

  // Get current user to check role (with bypass support)
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(archiflow),
  });

  // Fetch design assets from DB
  // Multi-tenant logic: We want global assets (furniture/refs) AND private assets (my uploads)
  // Since list typically returns everything readable, we will filter in client for now
  // unless we use specific filters.
  const { data: dbAssets = [], isLoading } = useQuery({
    queryKey: ['designAssets', user?.email],
    queryFn: async () => {
      // Fetch all available assets
      const allAssets = await archiflow.entities.DesignAsset.list('-created_date', 500);
      
      // Filter logic:
      // 1. If I am super_admin, show everything.
      // 2. If I am architect, show my assets OR global assets.
      if (user?.app_role === 'super_admin') return allAssets;
      
      return allAssets.filter(asset => 
        asset.created_by === user?.email || asset.is_global === true
      );
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  // Fetch proposal templates - Show only system templates for new architects, or their own
  const { data: proposalTemplates = [] } = useQuery({
    queryKey: ['proposalTemplatesCount', user?.email],
    queryFn: async () => {
      const all = await archiflow.entities.ProposalTemplate.list('-created_date');
      
      if (user?.app_role === 'super_admin') return all;
      
      // Show system templates (is_system=true) + own templates
      return all.filter(t => t.is_system === true || t.created_by === user?.email);
    },
    enabled: !!user,
  });

  // Fetch Moodboards - PRIVATE per architect
  const { data: dbMoodboards = [] } = useQuery({
    queryKey: ['moodboards', user?.email],
    queryFn: async () => {
      const all = await archiflow.entities.Moodboard.list('-updated_date');
      
      if (user?.app_role === 'super_admin') return all;
      return all.filter(mb => mb.created_by === user?.email);
    },
    enabled: !!user,
  });

  // Fetch Content Items - Multi-tenant filtered
  const { data: contentItems = [] } = useQuery({
    queryKey: ['contentItems', user?.email],
    queryFn: async () => {
      const all = await archiflow.entities.ContentItem.list('-created_date');
      if (user?.app_role === 'super_admin') return all;
      return all.filter(item => item.created_by === user?.email);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!user,
  });

  // Merge mock data with DB data
  const files = {
    moodboards: [
      ...dbMoodboards.map(m => ({
        id: m.id,
        name: m.name,
        type: 'moodboard',
        size: 'KB', 
        date: new Date(m.updated_date || m.created_date).toLocaleDateString('he-IL'),
        url: m.thumbnail_url || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80', 
        tags: [],
        details: m.settings || {},
      }))
    ],
    furniture: [...FURNITURE_DATA, ...dbAssets.filter(a => a.category === 'furniture').map(a => ({
      id: a.id,
      name: a.name,
      type: 'furniture',
      size: a.file_size,
      date: new Date(a.created_date).toLocaleDateString('he-IL'),
      url: a.file_url,
      tags: a.tags || [],
      furniture: a.metadata || {},
    }))],

    references: [...REFERENCE_DATA, ...dbAssets.filter(a => a.category === 'references').map(a => ({
      id: a.id,
      name: a.name,
      type: 'reference',
      size: a.file_size,
      date: new Date(a.created_date).toLocaleDateString('he-IL'),
      url: a.file_url,
      tags: a.tags || [],
      reference: a.metadata || {},
    }))],
    proposal_templates: dbAssets.filter(a => a.category === 'proposal_templates').map(a => ({
      id: a.id,
      name: a.name,
      type: 'proposal_template',
      size: a.file_size,
      date: new Date(a.created_date).toLocaleDateString('he-IL'),
      url: a.file_url,
      tags: a.tags || [],
      details: a.metadata || {},
    })),
  };

  const deleteAssetMutation = useMutation({
    mutationFn: (id) => archiflow.entities.DesignAsset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designAssets'] });
    },
  });

  const deleteMoodboardMutation = useMutation({
    mutationFn: (id) => archiflow.entities.Moodboard.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moodboards'] });
    },
  });

  const currentFiles = currentFolder ? files[currentFolder.id] || [] : [];
  const filteredFiles = currentFiles.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.tags?.some(tag => tag.includes(searchQuery))
  );



  const handleFolderClick = (category) => {
    // If clicking on proposal_templates, show the ProposalTemplates page
    if (category.id === 'proposal_templates') {
      setShowProposalTemplates(true);
      return;
    }
    // If clicking on content, show ContentLibrary
    if (category.id === 'content') {
      setShowContentLibrary(true);
      return;
    }
    setCurrentFolder(category);
    setSearchQuery('');
  };

  const handleBackToRoot = () => {
    setCurrentFolder(null);
    setSelectedFiles([]);
    setShowProposalTemplates(false);
    setShowContentLibrary(false);
  };

  const handleFileSelect = (fileId) => {
    setSelectedFiles(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const handleDeleteFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      // Delete selected files
      for (const fileId of selectedFiles) {
        const file = currentFiles.find(f => f.id === fileId);
        if (file && typeof file.id === 'string' && file.id.length > 10) {
          // Only delete if it's from DB (has long string ID)
          if (file.type === 'moodboard') {
             await deleteMoodboardMutation.mutateAsync(file.id);
          } else {
             await deleteAssetMutation.mutateAsync(file.id);
          }
        }
      }
      
      showSuccess(`${selectedFiles.length} פריטים נמחקו בהצלחה`);
      setSelectedFiles([]);
    } catch (error) {
      showError('שגיאה במחיקת פריטים');
    }
  };

  const handleDownloadFiles = () => {
    if (selectedFiles.length === 0) return;
    
    currentFiles.filter(f => selectedFiles.includes(f.id)).forEach(file => {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    
    showSuccess(`${selectedFiles.length} קבצים הורדו בהצלחה`);
  };

  // Show Moodboard Editor
  if (editingMoodboard) {
    return (
      <MoodboardEditor 
        moodboardId={editingMoodboard === 'new' ? null : editingMoodboard}
        initialData={editingMoodboard === 'new' ? null : files.moodboards.find(m => m.id === editingMoodboard)}
        onClose={() => setEditingMoodboard(null)}
      />
    );
  }

  // Show Proposal Templates Page
  if (showProposalTemplates) {
    return <ProposalTemplatesPage onBack={() => setShowProposalTemplates(false)} />;
  }

  // Show Content Library
  if (showContentLibrary) {
    return <ContentLibraryComponent onBack={() => setShowContentLibrary(false)} />;
  }

  // Root View - Categories
  if (!currentFolder) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <PageHeader 
            title="ספריית תוכן" 
            subtitle="כל חומרי התוכן והעיצוב במקום אחד"
          >
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full md:w-auto shadow-soft-organic hover:shadow-soft-organic-hover">
              <Upload className="w-4 h-4 ml-2" />
              העלאה מהירה
            </Button>
          </PageHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {rootCategories.map((category, index) => {
              const Icon = category.icon;
              const count = getCategoryCount(category.id, files, proposalTemplates.length, contentItems.length);
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleFolderClick(category)}
                >
                  <Card className="border-border hover:shadow-soft-organic-hover transition-all cursor-pointer group">
                    <CardContent className="p-6 md:p-8 text-center">
                      <div className={`w-16 h-16 md:w-20 md:h-20 ${category.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">{category.name}</h3>
                      <p className="text-2xl md:text-3xl font-bold text-primary">{count}</p>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">פריטים</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    );
  }

  // Folder View - Files
  const Icon = currentFolder.icon;
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <FileUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        folderName={currentFolder.name}
        category={currentFolder.id}
      />
      <FilePreviewDialog
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Back Button & Breadcrumb */}
        <Button 
          variant="ghost" 
          onClick={handleBackToRoot}
          className="mb-4 -mr-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="w-4 h-4 ml-1 rotate-180" />
          חזרה לספריית תוכן
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span className="cursor-pointer hover:text-primary transition-colors" onClick={handleBackToRoot}>ספריית תוכן</span>
          <ArrowRight className="w-4 h-4" />
          <div className={`flex items-center gap-2 px-3 py-1 ${currentFolder.color} rounded-lg`}>
            <Icon className="w-4 h-4" />
            <span className="font-medium">{currentFolder.name}</span>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-light text-foreground tracking-tight">{currentFolder.name}</h1>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="חיפוש קבצים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
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

            {currentFolder.id === 'moodboards' ? (
              <Button
                onClick={() => setEditingMoodboard('new')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft-organic hover:shadow-soft-organic-hover"
              >
                <Plus className="w-4 h-4 ml-2" />
                לוח השראה חדש
              </Button>
            ) : (
              <Button
                onClick={() => setShowUploadDialog(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft-organic hover:shadow-soft-organic-hover"
              >
                <Plus className="w-4 h-4 ml-2" />
                העלה קובץ
              </Button>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        <AnimatePresence>
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-3"
            >
              <span className="text-sm font-medium text-foreground">
                {selectedFiles.length} קבצים נבחרו
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleDownloadFiles}>
                  <Download className="w-4 h-4 ml-2" />
                  הורד
                </Button>
                <Button size="sm" variant="outline">
                  <Share2 className="w-4 h-4 ml-2" />
                  שתף
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDeleteFiles}>
                  <Trash2 className="w-4 h-4 ml-2" />
                  מחק
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Files Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`group cursor-pointer border-2 transition-all hover:shadow-soft-organic-hover ${
                  selectedFiles.includes(file.id) ? 'border-primary bg-primary/10' : 'border-border'
                }`}>
                  <CardContent className="p-0">
                    {/* Image */}
                    <div
                      className="relative h-40 md:h-48 overflow-hidden bg-muted rounded-t-lg"
                      onClick={() => {
                        if (file.type === 'moodboard') {
                          setEditingMoodboard(file.id);
                        } else {
                          setPreviewFile(file);
                        }
                      }}
                    >
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => handleFileSelect(file.id)}
                          className="w-5 h-5 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-foreground text-sm truncate flex-1">
                          {file.name}
                        </h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {file.type === 'moodboard' ? (
                              <DropdownMenuItem onClick={() => setEditingMoodboard(file.id)}>
                                <Palette className="w-4 h-4 ml-2" />
                                ערוך לוח
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                                <Eye className="w-4 h-4 ml-2" />
                                תצוגה מקדימה
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => {
                              const link = document.createElement('a');
                              link.href = file.url;
                              link.download = file.name;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              showSuccess('קובץ הורד בהצלחה');
                            }}>
                              <Download className="w-4 h-4 ml-2" />
                              הורד
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="w-4 h-4 ml-2" />
                              שתף
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                handleFileSelect(file.id);
                                setTimeout(() => handleDeleteFiles(), 100);
                              }}
                            >
                              <Trash2 className="w-4 h-4 ml-2" />
                              מחק
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>{file.size}</span>
                        <span>{file.date}</span>
                      </div>

                      {file.tags && file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {file.tags.slice(0, 3).map(tag => (
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
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFiles.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className={`border-2 transition-all hover:shadow-soft-organic-hover ${
                  selectedFiles.includes(file.id) ? 'border-primary bg-primary/10' : 'border-border'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => handleFileSelect(file.id)}
                        className="w-5 h-5 cursor-pointer"
                      />
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{file.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{file.size}</span>
                          <span>•</span>
                          <span>{file.date}</span>
                          {file.tags && file.tags.length > 0 && (
                            <>
                              <span>•</span>
                              {file.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                            <Eye className="w-4 h-4 ml-2" />
                            תצוגה מקדימה
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            const link = document.createElement('a');
                            link.href = file.url;
                            link.download = file.name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            showSuccess('קובץ הורד בהצלחה');
                          }}>
                            <Download className="w-4 h-4 ml-2" />
                            הורד
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(file.url);
                            showSuccess('קישור הועתק ללוח');
                          }}>
                            <Share2 className="w-4 h-4 ml-2" />
                            שתף
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => {
                              handleFileSelect(file.id);
                              setTimeout(() => handleDeleteFiles(), 100);
                            }}
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            מחק
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {filteredFiles.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'לא נמצאו קבצים תואמים' : 'התיקייה ריקה'}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}