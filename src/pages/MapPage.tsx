import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Train, 
  Navigation, 
  Zap, 
  Search, 
  Layers, 
  Info, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Compass, 
  ShieldCheck, 
  Maximize2, 
  RotateCcw,
  Share2,
  Building2,
  Subway,
  ArrowLeft
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export interface Station {
  id: string;
  nameAr: string;
  nameEn: string;
  x: number;
  y: number;
  zoneAr: string;
  zoneEn: string;
  isInterchange?: boolean;
  interchangeWithAr?: string;
  interchangeWithEn?: string;
  line: 'east' | 'west';
  descriptionAr: string;
  descriptionEn: string;
  facilitiesAr: string[];
  facilitiesEn: string[];
}

const STATIONS: Station[] = [
  {
    id: 'stadium',
    nameAr: 'ستاد القاهرة',
    nameEn: 'Cairo Stadium',
    x: 90,
    y: 160,
    zoneAr: 'مدينة نصر',
    zoneEn: 'Nasr City',
    isInterchange: true,
    interchangeWithAr: 'الخط الثالث للمترو (L3)',
    interchangeWithEn: 'Metro Line 3 (L3)',
    line: 'east',
    descriptionAr: 'المحطة الرئيسية للانطلاق، متصلة مباشرة بمترو الأنفاق ومحيط ستاد القاهرة الدولي.',
    descriptionEn: 'Main starting terminal connected directly to Metro Line 3 and Cairo International Stadium.',
    facilitiesAr: ['مصاعد كهربائية', 'مواقف سيارات', 'صراف آلي', 'تكييف كامل'],
    facilitiesEn: ['Elevators', 'Parking', 'ATM', 'Full AC']
  },
  {
    id: 'hisham_barakat',
    nameAr: 'هشام بركات',
    nameEn: 'Hisham Barakat',
    x: 150,
    y: 128,
    zoneAr: 'مدينة نصر',
    zoneEn: 'Nasr City',
    line: 'east',
    descriptionAr: 'خدمة المنطقة السكنية والتجارية بشارع الطيران ومدينة نصر.',
    descriptionEn: 'Serving residential and commercial areas near El-Tayaran Street.',
    facilitiesAr: ['مصاعد كهربائية', 'شاشات مواعيد', 'واي فاي مجاني'],
    facilitiesEn: ['Elevators', 'Timetable Screens', 'Free Wi-Fi']
  },
  {
    id: 'sadat',
    nameAr: 'جيهان السادات',
    nameEn: 'Gihan El-Sadat',
    x: 220,
    y: 120,
    zoneAr: 'مدينة نصر',
    zoneEn: 'Nasr City',
    line: 'east',
    descriptionAr: 'ربط منطقة محور جيهان السادات والمناطق الحيوية المحيطة.',
    descriptionEn: 'Connecting Gihan El-Sadat axis with surrounding vital districts.',
    facilitiesAr: ['مصاعد', 'دعم ذوي الهمم', 'كاميرات مراقبة'],
    facilitiesEn: ['Elevators', 'Accessibility', 'CCTV']
  },
  {
    id: 'moshir',
    nameAr: 'المشير طنطاوي',
    nameEn: 'Moshir Tantawy',
    x: 280,
    y: 145,
    zoneAr: 'محور المشير',
    zoneEn: 'El-Moshir Axis',
    isInterchange: true,
    interchangeWithAr: 'خط مونوريل غرب النيل (6 أكتوبر)',
    interchangeWithEn: 'West Nile Monorail (6th October)',
    line: 'east',
    descriptionAr: 'محطة محورية هامة تربط بين شرق القاهرة والقطاع التجاري والمعارض.',
    descriptionEn: 'Major hub connecting East Cairo with the exhibition and trade center district.',
    facilitiesAr: ['محطة تبادلية', 'مركز خدمة عملاء', 'استراحة مكيفة'],
    facilitiesEn: ['Transfer Hub', 'Customer Service', 'AC Lounge']
  },
  {
    id: 'one_ninety',
    nameAr: 'وان ناينتي (190)',
    nameEn: 'One Ninety (190)',
    x: 340,
    y: 240,
    zoneAr: 'القاهرة الجديدة',
    zoneEn: 'New Cairo',
    line: 'east',
    descriptionAr: 'تخدم التجمعات الاقتصادية والمركز التجاري الرائد عند المدخل الأول للتجمع الخامس.',
    descriptionEn: 'Serving major business and retail complexes at 5th Settlement entrance.',
    facilitiesAr: ['ربط مباشر بالمول', 'شحن كروت', 'مصاعد هيدروليكية'],
    facilitiesEn: ['Direct Mall Access', 'Card Top-up', 'Hydraulic Elevators']
  },
  {
    id: 'air_hospital',
    nameAr: 'المستشفى الجوي',
    nameEn: 'Air Force Hospital',
    x: 390,
    y: 295,
    zoneAr: 'القاهرة الجديدة',
    zoneEn: 'New Cairo',
    line: 'east',
    descriptionAr: 'محطة تخدم القطاع الطبي والمستشفى الجوي التخصصي وشارع التسعين.',
    descriptionEn: 'Serving the medical center district and El-Tesseen Street.',
    facilitiesAr: ['دخول ميسر للكرسي المتحرك', 'إرشادات صوتية', 'مصاعد'],
    facilitiesEn: ['Wheelchair Access', 'Audio Guides', 'Elevators']
  },
  {
    id: 'central_axis',
    nameAr: 'المحور المركزي',
    nameEn: 'Central Axis',
    x: 450,
    y: 318,
    zoneAr: 'التجمع الخامس',
    zoneEn: '5th Settlement',
    line: 'east',
    descriptionAr: 'تقاطع التسعين الجنوبي والشمالي مع المحور المركزي للتجمع.',
    descriptionEn: 'Intersection of North/South Tesseen with 5th Settlement central axis.',
    facilitiesAr: ['مستويين للركاب', 'ماكينات تذاكر آلي', 'واي فاي'],
    facilitiesEn: ['Two Passenger Levels', 'Ticket Vending', 'Wi-Fi']
  },
  {
    id: 'auc',
    nameAr: 'الجامعة الأمريكية',
    nameEn: 'AUC Campus',
    x: 520,
    y: 280,
    zoneAr: 'القاهرة الجديدة',
    zoneEn: 'New Cairo',
    line: 'east',
    descriptionAr: 'تخدم طلاب وموظفي الجامعة الأمريكية والجامعات المجاورة بالتجمع.',
    descriptionEn: 'Serving students and staff of AUC and surrounding educational hubs.',
    facilitiesAr: ['مواقف دراجات', 'واي فاي فائق السرعة', 'مناطق انتظار مظللة'],
    facilitiesEn: ['Bike Racks', 'High-speed Wi-Fi', 'Shaded Waiting Areas']
  },
  {
    id: 'narges',
    nameAr: 'النرجس والشويفات',
    nameEn: 'Al Narges & Choueifat',
    x: 580,
    y: 230,
    zoneAr: 'القاهرة الجديدة',
    zoneEn: 'New Cairo',
    line: 'east',
    descriptionAr: 'تخدم الأحياء السكنية الهادئة والمجمعات المدرسية الدولية.',
    descriptionEn: 'Serving prime residential communities and international school complexes.',
    facilitiesAr: ['مصاعد', 'شاشات معلومات', 'أمان 24/7'],
    facilitiesEn: ['Elevators', 'Info Displays', '24/7 Security']
  },
  {
    id: 'beit_watan',
    nameAr: 'بيت الوطن',
    nameEn: 'Beit Al Watan',
    x: 640,
    y: 220,
    zoneAr: 'شرق القاهرة الجديدة',
    zoneEn: 'East New Cairo',
    line: 'east',
    descriptionAr: 'بوابة الربط بين التجمع الخامس والامتداد الشرقي باتجاه العاصمة الإدارية.',
    descriptionEn: 'Gateway linking 5th Settlement with eastern extensions to the Administrative Capital.',
    facilitiesAr: ['مصاعد شمسية', 'مواقف سيارات', 'صراف آلي'],
    facilitiesEn: ['Solar-powered Elevators', 'Parking', 'ATM']
  },
  {
    id: 'fattah_aleem',
    nameAr: 'مسجد الفتاح العليم',
    nameEn: 'Al-Fattah Al-Aleem Mosque',
    x: 700,
    y: 255,
    zoneAr: 'مدخل العاصمة الإدارية',
    zoneEn: 'Capital Entrance',
    line: 'east',
    descriptionAr: 'أولى محطات العاصمة الإدارية الجديدة عند الطريق الدائري الأوسطي.',
    descriptionEn: 'First station inside the New Capital at Middle Ring Road.',
    facilitiesAr: ['إضاءة ليلية دائرية', 'مصاعد مكيفة', 'أماكن صلاة'],
    facilitiesEn: ['Night Arc Lighting', 'AC Elevators', 'Prayer Spaces']
  },
  {
    id: 'gov_district',
    nameAr: 'الحي الحكومي',
    nameEn: 'Government District',
    x: 760,
    y: 330,
    zoneAr: 'العاصمة الإدارية',
    zoneEn: 'New Capital',
    line: 'east',
    descriptionAr: 'خدمة الوزارات والهيئات الحكومية ومقر مجلس الوزراء.',
    descriptionEn: 'Serving ministries, government agencies, and Cabinet headquarters.',
    facilitiesAr: ['بوابات بيومترية الذكية', 'قاعات انتظار فخمة', 'اتصال 5G'],
    facilitiesEn: ['Smart Biometric Gates', 'VIP Lounges', '5G Connectivity']
  },
  {
    id: 'financial_district',
    nameAr: 'حي المال والأعمال',
    nameEn: 'Financial District',
    x: 830,
    y: 400,
    zoneAr: 'العاصمة الإدارية',
    zoneEn: 'New Capital',
    line: 'east',
    descriptionAr: 'قلب العاصمة الاقتصادي ومنطقة البرج الأيقوني والبنوك المركزية.',
    descriptionEn: 'The economic heart near Iconic Tower and central banking sector.',
    facilitiesAr: ['أنفاق للمشاة', 'شحن سريع للموبايل', 'مصاعد بانورامية'],
    facilitiesEn: ['Pedestrian Tunnels', 'Fast Mobile Charging', 'Panoramic Lifts']
  },
  {
    id: 'arts_culture',
    nameAr: 'مدينة الفنون والثقافة',
    nameEn: 'Arts & Culture City',
    x: 890,
    y: 430,
    zoneAr: 'العاصمة الإدارية',
    zoneEn: 'New Capital',
    isInterchange: true,
    interchangeWithAr: 'القطار الكهربائي الخفيف (LRT)',
    interchangeWithEn: 'Light Rail Transit (LRT)',
    line: 'east',
    descriptionAr: 'محطة تبادلية كبرى مع القطار الكهربائي الخفيف LRT ودار الأوبرا.',
    descriptionEn: 'Major interchange hub with LRT electric train and Opera House.',
    facilitiesAr: ['تبادلي مع LRT', 'مطاعم وكافيهات', 'جراج متعدد الطوابق'],
    facilitiesEn: ['LRT Interchange', 'Cafes & Dining', 'Multi-story Garage']
  },
  {
    id: 'capital_hub',
    nameAr: 'مركز العاصمة والورش',
    nameEn: 'Capital Depot Hub',
    x: 960,
    y: 460,
    zoneAr: 'شرق العاصمة',
    zoneEn: 'East Capital',
    line: 'east',
    descriptionAr: 'المحطة النهائية لخط شرق النيل ومركز الصيانة والتشغيل الرئيسي.',
    descriptionEn: 'Terminal station of East Nile Monorail line and main depot.',
    facilitiesAr: ['مركز التحكم الرئيسي', 'خدمة عملاء', 'تجهيزات ذوي الهمم'],
    facilitiesEn: ['Control Center', 'Customer Support', 'Full Accessibility']
  }
];

// SVG Curved Path (الخط المايل)
const TRACK_PATH = "M 90,160 C 180,100 280,130 340,240 C 400,340 480,330 540,270 C 600,210 660,210 720,280 C 780,350 830,420 890,430 C 930,435 960,455 980,465";

export default function MapPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [selectedStation, setSelectedStation] = useState<Station | null>(STATIONS[0]);
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'interchange'>('all');
  const [originStation, setOriginStation] = useState<Station | null>(STATIONS[0]);
  const [destStation, setDestStation] = useState<Station | null>(STATIONS[STATIONS.length - 1]);

  const filteredStations = useMemo(() => {
    return STATIONS.filter((st) => {
      const name = isAr ? st.nameAr : st.nameEn;
      const zone = isAr ? st.zoneAr : st.zoneEn;
      const matchesSearch = 
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        zone.toLowerCase().includes(searchQuery.toLowerCase());

      if (filterMode === 'interchange') {
        return matchesSearch && st.isInterchange;
      }
      return matchesSearch;
    });
  }, [searchQuery, filterMode, isAr]);

  const activeStation = hoveredStation || selectedStation;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Header & Controls Panel */}
      <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{isAr ? 'الخريطة التفاعلية المباشرة 2026' : 'Interactive Live Map 2026'}</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Compass className="w-8 h-8 text-cyan-400 animate-spin-slow" />
              {isAr ? 'شبكة مونوريل شرق النيل' : 'East Nile Monorail Network'}
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl">
              {isAr 
                ? 'استكشف مسار الخط المايل الممتد من ستاد القاهرة إلى العاصمة الإدارية الجديدة، والمحطات التبادلية مع المترو وLRT.'
                : 'Explore the curved monorail line connecting Cairo Stadium through New Cairo to the Administrative Capital.'}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-center p-2">
              <div className="text-xs text-slate-400">{isAr ? 'إجمالي المحطات' : 'Total Stations'}</div>
              <div className="text-lg font-bold text-cyan-400">22</div>
            </div>
            <div className="text-center p-2 border-x border-slate-800">
              <div className="text-xs text-slate-400">{isAr ? 'طول المسار' : 'Total Distance'}</div>
              <div className="text-lg font-bold text-blue-400">{isAr ? '56.5 كم' : '56.5 km'}</div>
            </div>
            <div className="text-center p-2">
              <div className="text-xs text-slate-400">{isAr ? 'زمن الرحلة' : 'Travel Time'}</div>
              <div className="text-lg font-bold text-emerald-400">{isAr ? '60 دقيقة' : '60 min'}</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800/80">
          <div className="relative w-full md:w-80">
            <Search className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث عن اسم محطة...' : 'Search station name...'}
              className={`w-full bg-slate-950/90 border border-slate-700/80 rounded-xl ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all`}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterMode === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {isAr ? 'جميع المحطات' : 'All Stations'}
            </button>
            <button
              onClick={() => setFilterMode('interchange')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filterMode === 'interchange'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {isAr ? 'المحطات التبادلية' : 'Interchanges'}
            </button>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterMode('all');
                setSelectedStation(STATIONS[0]);
              }}
              className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 transition-all flex items-center gap-1"
              title={isAr ? 'إعادة الضبط' : 'Reset View'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Interactive Canvas & Info Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Canvas (9 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col justify-between">
          {/* Map Top Header Legend */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#38bdf8]" />
                {isAr ? 'مسار المونوريل (الخط المايل)' : 'Monorail S-Track'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-cyan-400 bg-slate-950" />
                {isAr ? 'محطة تبادلية' : 'Interchange Station'}
              </span>
            </div>
            <span className="hidden sm:inline text-slate-500 font-mono">SVG CANVAS 1000x550</span>
          </div>

          {/* SVG Map Container */}
          <div className="w-full h-full min-h-[420px] relative flex items-center justify-center overflow-x-auto">
            <svg
              viewBox="0 0 1050 550"
              className="w-full h-full min-w-[750px] select-none"
            >
              <defs>
                {/* Neon Background Grid */}
                <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" opacity="0.4" />
                </pattern>

                {/* Neon Glow Filters */}
                <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="intGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Track Line Gradient */}
                <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>

              {/* Background Grid */}
              <rect width="1050" height="550" fill="url(#mapGrid)" rx="16" />

              {/* Regional Zone Visual Boundaries */}
              <g opacity="0.3">
                {/* Nasr City Zone */}
                <rect x="60" y="80" width="220" height="150" rx="16" fill="#0284c7" opacity="0.08" stroke="#0284c7" strokeWidth="1" strokeDasharray="4 4" />
                <text x="80" y="105" fill="#38bdf8" fontSize="12" fontWeight="bold">
                  {isAr ? 'قطاع مدينة نصر' : 'Nasr City Sector'}
                </text>

                {/* New Cairo Zone */}
                <rect x="310" y="190" width="370" height="160" rx="16" fill="#38bdf8" opacity="0.06" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
                <text x="330" y="215" fill="#38bdf8" fontSize="12" fontWeight="bold">
                  {isAr ? 'قطاع القاهرة الجديدة (التجمع)' : 'New Cairo Sector'}
                </text>

                {/* New Capital Zone */}
                <rect x="710" y="210" width="280" height="260" rx="16" fill="#06b6d4" opacity="0.08" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 4" />
                <text x="730" y="235" fill="#06b6d4" fontSize="12" fontWeight="bold">
                  {isAr ? 'قطاع العاصمة الإدارية' : 'New Capital Sector'}
                </text>
              </g>

              {/* Intersecting Dashed Lines (West Nile Monorail Link) */}
              <path
                d="M 280,145 L 280,450"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="6 6"
                opacity="0.4"
              />
              <text x="210" y="440" fill="#94a3b8" fontSize="10" fontWeight="bold">
                {isAr ? '← إلى 6 أكتوبر (خط غرب النيل)' : '← To 6th of Oct (West Line)'}
              </text>

              {/* MAIN S-CURVED TRACK PATH (الخط المايل) */}
              {/* Layer 1: Wide Outer Glow */}
              <path
                d={TRACK_PATH}
                fill="none"
                stroke="#0284c7"
                strokeWidth="18"
                opacity="0.2"
                filter="url(#neonGlow)"
              />

              {/* Layer 2: Medium Glow Line */}
              <path
                d={TRACK_PATH}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="8"
                opacity="0.6"
              />

              {/* Layer 3: Solid Core Path */}
              <path
                d={TRACK_PATH}
                fill="none"
                stroke="url(#trackGradient)"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Layer 4: Pulsing Energy Particles along Track */}
              <path
                d={TRACK_PATH}
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeDasharray="12 180"
                opacity="0.9"
                className="animate-pulse"
              />

              {/* LIVE MOVING MONORAIL TRAIN ICON ON S-CURVE */}
              <g className="filter drop-shadow-[0_0_12px_rgba(56,189,248,1)]">
                <animateMotion
                  path={TRACK_PATH}
                  dur="25s"
                  repeatCount="indefinite"
                  rotate="auto"
                />
                <circle r="16" fill="#0284c7" className="animate-ping opacity-30" />
                <circle r="12" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
                <foreignObject x="-9" y="-9" width="18" height="18">
                  <div className="w-full h-full flex items-center justify-center text-cyan-200">
                    <Train className="w-3.5 h-3.5 transform -rotate-90" />
                  </div>
                </foreignObject>
              </g>

              {/* STATIONS NODES */}
              {STATIONS.map((station) => {
                const isSelected = selectedStation?.id === station.id;
                const isHovered = hoveredStation?.id === station.id;
                const isMatchingFilter = filteredStations.some((s) => s.id === station.id);
                const isOrigin = originStation?.id === station.id;
                const isDest = destStation?.id === station.id;

                const displayName = isAr ? station.nameAr : station.nameEn;

                return (
                  <g
                    key={station.id}
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => setSelectedStation(station)}
                    onMouseEnter={() => setHoveredStation(station)}
                    onMouseLeave={() => setHoveredStation(null)}
                    opacity={isMatchingFilter ? 1 : 0.25}
                  >
                    {/* Station Halo Ripple */}
                    {(isSelected || isHovered) && (
                      <circle
                        cx={station.x}
                        cy={station.y}
                        r={station.isInterchange ? '22' : '18'}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        className="animate-ping opacity-50"
                      />
                    )}

                    {/* Interchange Outer Ring */}
                    {station.isInterchange ? (
                      <>
                        <circle
                          cx={station.x}
                          cy={station.y}
                          r="14"
                          fill="#0f172a"
                          stroke="#38bdf8"
                          strokeWidth="3"
                          filter="url(#intGlow)"
                        />
                        <circle
                          cx={station.x}
                          cy={station.y}
                          r="7"
                          fill={isSelected ? '#38bdf8' : '#0284c7'}
                        />
                      </>
                    ) : (
                      /* Regular Station Circle */
                      <circle
                        cx={station.x}
                        cy={station.y}
                        r={isSelected ? '9' : '6'}
                        fill={isSelected ? '#38bdf8' : '#0f172a'}
                        stroke={isSelected ? '#ffffff' : '#38bdf8'}
                        strokeWidth={isSelected ? '3' : '2'}
                        className="transition-all duration-200 hover:scale-125"
                      />
                    )}

                    {/* Origin / Destination Pins Badges */}
                    {isOrigin && (
                      <g transform={`translate(${station.x - 10}, ${station.y - 28})`}>
                        <rect width="20" height="14" rx="4" fill="#10b981" />
                        <text x="10" y="10" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                          {isAr ? 'بداية' : 'Start'}
                        </text>
                      </g>
                    )}
                    {isDest && (
                      <g transform={`translate(${station.x - 10}, ${station.y - 28})`}>
                        <rect width="20" height="14" rx="4" fill="#f43f5e" />
                        <text x="10" y="10" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                          {isAr ? 'نهاية' : 'End'}
                        </text>
                      </g>
                    )}

                    {/* Station Name Labels */}
                    <text
                      x={station.x}
                      y={station.y + (station.y > 280 ? -18 : 22)}
                      fill={isSelected ? '#ffffff' : isHovered ? '#38bdf8' : '#cbd5e1'}
                      fontSize={isSelected || station.isInterchange ? '11' : '10'}
                      fontWeight={isSelected || station.isInterchange ? 'bold' : '500'}
                      textAnchor="middle"
                      className="pointer-events-none transition-colors duration-200 shadow-sm"
                    >
                      {displayName}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom Bar Info Note */}
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              {isAr ? 'انقر على أي محطة لعرض التفاصيل وتحديد الوجهة.' : 'Click any station to view details and set routes.'}
            </span>
            <span className="text-slate-400 font-medium">
              {isAr ? 'السرعة التشغيلية: 80 كم/س' : 'Operating Speed: 80 km/h'}
            </span>
          </div>
        </div>

        {/* Station Details Drawer / Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Station Card */}
          {activeStation ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -z-10" />

              {/* Station Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
                    {isAr ? activeStation.zoneAr : activeStation.zoneEn}
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {isAr ? activeStation.nameAr : activeStation.nameEn}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    {isAr ? activeStation.nameEn : activeStation.nameAr}
                  </p>
                </div>

                {activeStation.isInterchange && (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400" title={isAr ? 'محطة تبادلية' : 'Transfer Hub'}>
                    <Zap className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Station Description */}
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                {isAr ? activeStation.descriptionAr : activeStation.descriptionEn}
              </p>

              {/* Interchange Connection Badge if applicable */}
              {activeStation.isInterchange && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/30 space-y-1">
                  <div className="text-xs text-cyan-400 font-semibold flex items-center gap-1.5">
                    <Subway className="w-4 h-4" />
                    <span>{isAr ? 'الربط والتبادل:' : 'Transfer Connection:'}</span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {isAr ? activeStation.interchangeWithAr : activeStation.interchangeWithEn}
                  </div>
                </div>
              )}

              {/* Facilities Checklist */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400">
                  {isAr ? 'التجهيزات والخدمات المتوفرة:' : 'Station Facilities:'}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(isAr ? activeStation.facilitiesAr : activeStation.facilitiesEn).map((facility, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{facility}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Route Selector Actions */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOriginStation(activeStation)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    originStation?.id === activeStation.id
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تحديد كمنطلق' : 'Set Start'}</span>
                </button>
                <button
                  onClick={() => setDestStation(activeStation)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    destStation?.id === activeStation.id
                      ? 'bg-rose-500 text-white font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تحديد كوجهة' : 'Set End'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-3">
              <MapPin className="w-10 h-10 mx-auto text-slate-600 animate-bounce" />
              <p>{isAr ? 'اختر محطة من الخريطة للبدء' : 'Select a station on the map'}</p>
            </div>
          )}

          {/* Route Summary Preview Card */}
          {originStation && destStation && originStation.id !== destStation.id && (
            <div className="bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/30 rounded-2xl p-5 space-y-3">
              <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                {isAr ? 'ملخص الرحلة المحددة' : 'Selected Route Plan'}
              </div>
              <div className="flex items-center justify-between text-sm text-white font-semibold">
                <span className="text-emerald-400">{isAr ? originStation.nameAr : originStation.nameEn}</span>
                <ArrowRight className={`w-4 h-4 text-cyan-400 ${isAr ? 'rotate-180' : ''}`} />
                <span className="text-rose-400">{isAr ? destStation.nameAr : destStation.nameEn}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  {isAr ? 'الوقت المتوقع: ~35 دقيقة' : 'Est. Time: ~35 mins'}
                </span>
                <span className="text-cyan-300 font-bold">
                  {isAr ? 'التذكرة: 15 ج.م' : 'Fare: 15 EGP'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
