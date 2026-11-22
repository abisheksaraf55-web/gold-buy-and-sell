import PptxGenJS from 'pptxgenjs';
import { ShopDetails } from '../types/bullion';
import { formatNPR } from './nepalBullionCalculations';

export interface DemoSlideCard {
  heading: string;
  body: string;
}

export interface DemoSlideDefinition {
  number: string;
  kicker: string;
  title: string;
  subtitleNepali: string;
  layout: 'cover' | 'two-col' | 'workflow' | 'cards' | 'table' | 'closing';
  highlights: string[];
  cards?: DemoSlideCard[];
  leftColumn?: { heading: string; points: string[] };
  rightColumn?: { heading: string; points: string[] };
  tableHeaders?: string[];
  tableRows?: string[][];
  speakerNotes: string;
}

export interface DemoDeckContext {
  shop?: ShopDetails;
  transactionCount?: number;
  totalGoldGrams?: number;
  totalSilverGrams?: number;
  totalPayoutNPR?: number;
}

export const DEMO_SLIDES: DemoSlideDefinition[] = [
  {
    number: '01',
    kicker: 'Executive Product Demonstration',
    title: 'Nepal Bullion Legal Purchase & KYC System',
    subtitleNepali: 'नेपाल सुनचाँदी कानुनी खरिद तथा ग्राहक पहिचान (KYC) प्रणाली',
    layout: 'cover',
    highlights: [
      'Muluki Criminal Code 2074 (Section 244) Compliance',
      'Asset (Money) Laundering Prevention Act 2064 Controls',
      'AI Multi-ID Reader, Real Biometrics & Tamper-Evident A4 Deeds',
      'Police Audit Register with Search, Date Filter, CSV & A4 PDF Export',
    ],
    speakerNotes:
      'Welcome to the demonstration of the Nepal Bullion Legal Purchase & KYC System — a compliance-first platform built specifically for gold and silver jewelers in Nepal to eliminate stolen-goods liability and automate police/AML recordkeeping.',
  },
  {
    number: '02',
    kicker: '01. Problem & Regulatory Mandate',
    title: 'Why Jewelers Need Verifiable Purchase Compliance',
    subtitleNepali: 'सुनचाँदी खरिद कारोबारमा कानुनी जोखिम र समाधान',
    layout: 'two-col',
    highlights: [
      'Second-hand gold/silver purchases carry criminal liability if stolen goods cannot be traced to a verified seller.',
      'Manual paper ledgers lack 3-generation family lineage, legible ID archival, and rapid audit filtering.',
    ],
    leftColumn: {
      heading: 'Operational & Legal Risks',
      points: [
        'Section 244 exposure if ownership origin is undocumented',
        'Incomplete handwritten seller names, addresses & ID numbers',
        'Cash payouts above NPR 50,000 triggering AML compliance flags',
        'Physical register damage or slow lookup during police audits',
      ],
    },
    rightColumn: {
      heading: 'Automated System Safeguards',
      points: [
        'Mandatory 3-generation lineage (Grandfather, Father & Spouse)',
        'AI Vision auto-fill from front & back Nepali ID document photos',
        'Real biometric thumbprint capture & digital seller signature',
        'Tamper-evident A4 legal deeds & searchable audit register',
      ],
    },
    speakerNotes:
      'Jewelers buying scrap or customer-owned jewelry face serious legal risk under Muluki Criminal Code 2074 Section 244. This system turns every counter purchase into an airtight legal record.',
  },
  {
    number: '03',
    kicker: '02. Guided Counter Workflow',
    title: '5-Step Legal Purchase & Verification Flow',
    subtitleNepali: 'पाँच चरणको सुरक्षित सुनचाँदी खरिद प्रक्रिया',
    layout: 'workflow',
    highlights: [
      'Every purchase passes through five structured compliance gates before generating a numbered legal deed.',
    ],
    cards: [
      {
        heading: '1. AI ID Photo & Seller KYC',
        body: 'Capture or upload Front/Back ID photos first; AI auto-fills name, ID no., district, municipality, and 3-generation lineage.',
      },
      {
        heading: '2. Bullion Weight & Valuation',
        body: 'Enter gross grams, stone/wax/Jarti deductions, testing method (XRF, Touchstone, Densimeter), and Tola/Lal net value.',
      },
      {
        heading: '3. Sec. 244 Legal Declaration',
        body: 'Record lawful ownership source (ancestral, stridhan, billed purchase, remittance) and statutory affidavit terms.',
      },
      {
        heading: '4. AML Payment Trace',
        body: 'Capture bank transfer, cheque, or ConnectIPS trace and enforce NPR 50,000 cash threshold compliance alerts.',
      },
      {
        heading: '5. Biometrics & A4 Deed',
        body: 'Attach real inked/scanner left & right thumbprints, digital signature, witness details, and lock the A4 PDF deed.',
      },
    ],
    speakerNotes:
      'Notice how Step 1 puts ID photography first: staff snap the citizenship or national ID front and back, click to auto-fill, verify weights and deductions, and finish with biometrics.',
  },
  {
    number: '04',
    kicker: '03. Smart KYC & Document Capture',
    title: 'First-Position AI Multi-ID Reader & Framing',
    subtitleNepali: 'स्वचालित परिचयपत्र पहिचान र आयताकार क्रप प्रणाली',
    layout: 'two-col',
    highlights: [
      'Supports Citizenship Certificates, National ID Cards (NID), Passports, and Voter IDs — front and back sides simultaneously.',
    ],
    leftColumn: {
      heading: 'Rectangular Camera & Crop Studio',
      points: [
        'Live camera alignment frame sized for Nepali ID cards',
        'Manual rotate, resize & rectangular edge crop before OCR',
        'High-clarity optimized storage for A4 print attachment',
        'One-click click-to-scan directly on uploaded ID thumbnails',
      ],
    },
    rightColumn: {
      heading: 'Auto-Extracted Devanagari & English Fields',
      points: [
        'Full Name (Nepali & English), Father, Grandfather & Spouse',
        'ID Type, Document Number, Issued District & BS Issue Date',
        'Normalized Province dropdown, District, Municipality & Ward',
        'Zero manual re-typing of complex citizenship numbers',
      ],
    },
    speakerNotes:
      'Staff can photograph or upload both sides of a citizenship card or National ID. The backend Gemini proxy extracts Nepali Devanagari and English fields cleanly and normalizes province values automatically.',
  },
  {
    number: '05',
    kicker: '04. Valuation & Authentic Biometrics',
    title: 'Precision Tola-Lal Math & Real Thumbprint Integrity',
    subtitleNepali: 'शुद्ध तौल गणना र वास्तविक औंठाछाप प्रमाणीकरण',
    layout: 'cards',
    highlights: [
      'Built for traditional Nepali bullion standards while eliminating invalid synthetic fingerprint stamps.',
    ],
    cards: [
      {
        heading: 'Exact Bullion Conversion (11.6638 g)',
        body: 'Automatic real-time conversion between Grams, Tola, and Lal (1 Tola = 100 Lal) across 24K Chhapawal, 22K Tejabi, 18K, and 999 Fine Silver.',
      },
      {
        heading: 'Flexible Deduction Controls',
        body: 'Supports itemized deductions (stone, wax/dirt, Jarti %) or direct manual gram deduction with instant net weight & NPR recalculation.',
      },
      {
        heading: 'Authentic Biometrics Only',
        body: 'Thumbprint pads accept real biometric scanner images, mobile camera captures of inked thumbprints, or physical ink impressions on printed A4 deeds — zero fake synthetic stamps.',
      },
      {
        heading: 'Digital Signature & Witness Attestation',
        body: 'Touch/mouse seller signature canvas with clean printable output plus optional witness KYC record for high-value transactions.',
      },
    ],
    speakerNotes:
      'Every calculation follows Nepali bullion math (11.6638g per Tola). Crucially, we enforce real biometrics only—no generated fake fingerprint graphics that could invalidate a legal deed.',
  },
  {
    number: '06',
    kicker: '05. Legal Deed & Executive Dashboard',
    title: 'Tamper-Evident A4 Deeds & Live Activity Trends',
    subtitleNepali: 'प्रमाणित A4 खरिद भरपाई र दैनिक कारोबार ड्यासबोर्ड',
    layout: 'two-col',
    highlights: [
      'Generates printer-ready Nepali Devanagari A4 deeds alongside daily gold/silver KPI analytics.',
    ],
    leftColumn: {
      heading: 'A4 Legal Purchase Deed (भरपाई)',
      points: [
        '150 DPI Nepali Devanagari canvas-to-PDF rendering (zero font garble)',
        'Sequential contract serial (SN-2083-XXXX) & tamper hash',
        '2.5cm × 3.0cm biometric thumbprint boxes & open buyer stamp zone',
        'Embedded front/back ID photocopies & safe printer margins',
      ],
    },
    rightColumn: {
      heading: 'Daily Bullion Dashboard',
      points: [
        'Live daily gold & silver weight purchased (grams & tola)',
        'Total daily payout summary & active market rate board',
        'Multi-day Activity Trends Chart for purchase volume visibility',
        'Direct one-click shortcuts to new forms & recent deeds',
      ],
    },
    speakerNotes:
      'Once submitted, the system produces a multi-page A4 legal deed rendered cleanly in Nepali Devanagari, plus updates the Daily Dashboard and Activity Trends Chart in real time.',
  },
  {
    number: '07',
    kicker: '06. Police Audit Register & Archival',
    title: 'Instant Audit Search, Date Filters & A4 PDF Export',
    subtitleNepali: 'प्रहरी अडिट दर्ता किताब, खोज र A4 PDF निर्यात',
    layout: 'cards',
    highlights: [
      'Designed for immediate verification during police, tax, or AML inspections.',
    ],
    cards: [
      {
        heading: 'Dual-Script Search Bar',
        body: 'Search simultaneously across seller names (Nepali & English), mobile numbers, BS/AD dates, serial numbers, and citizenship IDs with automatic Devanagari/ASCII digit normalization.',
      },
      {
        heading: 'AD Date Range & Multi-Facet Filters',
        body: 'Filter by From/To calendar dates, metal type (Gold/Silver), payment mode (Cash/Banking), issued district, and KYC verification completeness.',
      },
      {
        heading: 'Formatted A4 Archival PDF Export',
        body: 'Export the exact filtered register as a multi-page A4 PDF with shop seal, applied filter summary, KPI totals, repeated headers, and sign-off lines for physical binders.',
      },
      {
        heading: 'Excel-Ready CSV Backup',
        body: 'Download UTF-8 BOM CSV exports containing full 3-generation lineage, net weights, payment traces, and security hashes.',
      },
    ],
    speakerNotes:
      'During an inspection, jewelers can filter any date range or seller name in seconds and click Export to PDF to produce a clean A4 archival register ready for physical filing and officer sign-off.',
  },
  {
    number: '08',
    kicker: '07. Security & Cloud Architecture',
    title: 'Shop-Isolated Cloud Sync & Offline Resilience',
    subtitleNepali: 'क्लाउड सुरक्षा, प्रयोगकर्ता पहुँच नियन्त्रण र अफलाइन ब्याकअप',
    layout: 'table',
    highlights: [
      'Enterprise-grade data isolation ensures every jeweler owns and accesses only their verified store records.',
    ],
    tableHeaders: ['System Layer', 'Technology & Implementation', 'Operational Benefit'],
    tableRows: [
      [
        'Authentication',
        'Firebase Auth (Google OAuth + verified session checks)',
        'Only authorized shop owners access store records & settings',
      ],
      [
        'Cloud Database',
        'User-scoped Cloud Firestore (users/{uid}/...) + strict security rules',
        'Real-time cross-device sync with owner-only read/write isolation',
      ],
      [
        'Offline Continuity',
        'Local browser cache + Full JSON Backup Export & Restore modal',
        'Zero counter downtime during internet interruptions',
      ],
      [
        'AI OCR Proxy',
        'Express server endpoint (/api/ocr-id) with server-side Gemini API key',
        'API credentials remain private on server; clean sanitized client errors',
      ],
    ],
    speakerNotes:
      'Every shop account is isolated by authenticated UID in Firestore, paired with local offline caching, full JSON backup/restore, and server-side OCR processing. Thank you — ready for live Q&A or walkthrough.',
  },
];

const COLORS = {
  charcoal: '171717',
  slateDark: '262626',
  amber: 'D97706',
  amberDark: '92400E',
  amberSoft: 'FEF3C7',
  ivory: 'FAF9F6',
  white: 'FFFFFF',
  border: 'E5E7EB',
  textDark: '111827',
  textMuted: '4B5563',
  textLight: 'D1D5DB',
  emerald: '065F46',
  emeraldSoft: 'ECFDF5',
};

/**
 * Generates and downloads a widescreen 16:9 PowerPoint (.pptx) demonstration deck
 * tailored for the Nepal Bullion Legal Purchase & KYC System.
 */
export async function exportDemoPresentationToPPTX(
  context: DemoDeckContext = {}
): Promise<string> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in
  pptx.author = context.shop?.proprietorName || 'Nepal Bullion System';
  pptx.company = context.shop?.nameEnglish || 'Nepal Bullion Legal Purchase & KYC System';
  pptx.subject = 'Product Demonstration — Nepal Bullion Legal Purchase & KYC System';
  pptx.title = 'Nepal Bullion Legal Purchase & KYC System — Demonstration';

  const shopLabel =
    context.shop?.nameEnglish ||
    context.shop?.nameNepali ||
    'Nepal Bullion Legal Purchase & KYC System';

  const addFooter = (slide: PptxGenJS.Slide, slideNum: number, dark = false) => {
    slide.addShape(pptx.ShapeType.line, {
      x: 0.6,
      y: 6.95,
      w: 12.13,
      h: 0,
      line: { color: dark ? '404040' : COLORS.border, width: 0.75 },
    });
    slide.addText(
      `${shopLabel}  |  Muluki Criminal Code 2074 (Sec. 244) & AML Act 2064 Compliant`,
      {
        x: 0.6,
        y: 7.03,
        w: 9.8,
        h: 0.3,
        fontSize: 9.5,
        color: dark ? COLORS.textLight : COLORS.textMuted,
        fontFace: 'Plus Jakarta Sans',
      }
    );
    slide.addText(`Slide ${slideNum} of ${DEMO_SLIDES.length}`, {
      x: 10.6,
      y: 7.03,
      w: 2.13,
      h: 0.3,
      align: 'right',
      fontSize: 9.5,
      bold: true,
      color: dark ? COLORS.amber : COLORS.textDark,
      fontFace: 'Plus Jakarta Sans',
    });
  };

  const addHeader = (slide: PptxGenJS.Slide, def: DemoSlideDefinition) => {
    slide.background = { color: COLORS.ivory };
    // Top amber bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 0.1,
      fill: { color: COLORS.amber },
      line: { color: COLORS.amber, width: 0 },
    });
    slide.addText(def.kicker.toUpperCase(), {
      x: 0.6,
      y: 0.32,
      w: 10,
      h: 0.28,
      fontSize: 10,
      bold: true,
      color: COLORS.amberDark,
      fontFace: 'Plus Jakarta Sans',
      charSpacing: 1.5,
    });
    slide.addText(def.title, {
      x: 0.6,
      y: 0.6,
      w: 12.1,
      h: 0.55,
      fontSize: 24,
      bold: true,
      color: COLORS.textDark,
      fontFace: 'Georgia',
    });
    slide.addText(def.subtitleNepali, {
      x: 0.6,
      y: 1.15,
      w: 12.1,
      h: 0.32,
      fontSize: 12.5,
      color: COLORS.textMuted,
      fontFace: 'Plus Jakarta Sans',
    });
    slide.addShape(pptx.ShapeType.line, {
      x: 0.6,
      y: 1.54,
      w: 12.13,
      h: 0,
      line: { color: COLORS.border, width: 1 },
    });
  };

  DEMO_SLIDES.forEach((def, idx) => {
    const slide = pptx.addSlide();
    slide.addNotes(def.speakerNotes);

    if (def.layout === 'cover') {
      slide.background = { color: COLORS.charcoal };
      // Left gold accent bar
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 0.24,
        h: 7.5,
        fill: { color: COLORS.amber },
        line: { color: COLORS.amber, width: 0 },
      });

      slide.addText('PRODUCT & COMPLIANCE DEMONSTRATION', {
        x: 0.85,
        y: 0.85,
        w: 11.5,
        h: 0.35,
        fontSize: 11,
        bold: true,
        color: COLORS.amber,
        charSpacing: 2,
        fontFace: 'Plus Jakarta Sans',
      });

      slide.addText(def.title, {
        x: 0.85,
        y: 1.35,
        w: 11.4,
        h: 1.25,
        fontSize: 36,
        bold: true,
        color: COLORS.white,
        fontFace: 'Georgia',
      });

      slide.addText(def.subtitleNepali, {
        x: 0.85,
        y: 2.6,
        w: 11.4,
        h: 0.5,
        fontSize: 18,
        color: COLORS.amberSoft,
        fontFace: 'Plus Jakarta Sans',
      });

      // 4 Pillar Cards
      def.highlights.forEach((hl, hIdx) => {
        const col = hIdx % 2;
        const row = Math.floor(hIdx / 2);
        const bx = 0.85 + col * 5.9;
        const by = 3.45 + row * 1.15;

        slide.addShape(pptx.ShapeType.roundRect, {
          x: bx,
          y: by,
          w: 5.6,
          h: 0.92,
          fill: { color: COLORS.slateDark },
          line: { color: '404040', width: 1 },
          rectRadius: 0.08,
        });
        slide.addText(`0${hIdx + 1}.  ${hl}`, {
          x: bx + 0.22,
          y: by + 0.16,
          w: 5.16,
          h: 0.6,
          fontSize: 12.5,
          bold: true,
          color: COLORS.white,
          valign: 'middle',
          fontFace: 'Plus Jakarta Sans',
        });
      });

      // Live Shop Summary Strip if transactions exist
      const statsText =
        context.transactionCount !== undefined && context.transactionCount > 0
          ? `Prepared for: ${shopLabel}  •  Recorded Deeds: ${context.transactionCount}  •  Gold: ${(context.totalGoldGrams || 0).toFixed(2)} g  •  Silver: ${(context.totalSilverGrams || 0).toFixed(2)} g  •  Total Payout: ${formatNPR(context.totalPayoutNPR || 0, true)}`
          : `Prepared for: ${shopLabel}  •  FENEGOSIDA & Nepal Statutory Bullion Compliance`;

      slide.addText(statsText, {
        x: 0.85,
        y: 6.15,
        w: 11.6,
        h: 0.45,
        fontSize: 11,
        color: COLORS.textLight,
        fontFace: 'Plus Jakarta Sans',
      });

      addFooter(slide, idx + 1, true);
      return;
    }

    addHeader(slide, def);

    if (def.layout === 'two-col' && def.leftColumn && def.rightColumn) {
      // Top highlight banner
      slide.addText(def.highlights.join(' '), {
        x: 0.6,
        y: 1.72,
        w: 12.1,
        h: 0.52,
        fontSize: 13,
        color: COLORS.textDark,
        fontFace: 'Plus Jakarta Sans',
      });

      const drawColCard = (
        x: number,
        heading: string,
        points: string[],
        accentHex: string,
        headerBg: string
      ) => {
        slide.addShape(pptx.ShapeType.roundRect, {
          x,
          y: 2.38,
          w: 5.9,
          h: 4.3,
          fill: { color: COLORS.white },
          line: { color: COLORS.border, width: 1.2 },
          rectRadius: 0.08,
        });
        slide.addShape(pptx.ShapeType.rect, {
          x,
          y: 2.38,
          w: 5.9,
          h: 0.56,
          fill: { color: headerBg },
          line: { color: headerBg, width: 0 },
        });
        slide.addText(heading, {
          x: x + 0.25,
          y: 2.46,
          w: 5.4,
          h: 0.4,
          fontSize: 14.5,
          bold: true,
          color: accentHex,
          fontFace: 'Plus Jakarta Sans',
        });

        const bulletItems = points.map((pt) => ({
          text: pt,
          options: {
            bullet: { indent: 14 },
            breakLine: true,
            paraSpaceAfter: 12,
          },
        }));

        slide.addText(bulletItems, {
          x: x + 0.25,
          y: 3.12,
          w: 5.4,
          h: 3.35,
          fontSize: 13,
          color: COLORS.textDark,
          valign: 'top',
          fontFace: 'Plus Jakarta Sans',
        });
      };

      drawColCard(0.6, def.leftColumn.heading, def.leftColumn.points, COLORS.textDark, 'F3F4F6');
      drawColCard(6.83, def.rightColumn.heading, def.rightColumn.points, COLORS.amberDark, COLORS.amberSoft);
    } else if (def.layout === 'workflow' && def.cards) {
      slide.addText(def.highlights[0] || '', {
        x: 0.6,
        y: 1.72,
        w: 12.1,
        h: 0.42,
        fontSize: 13,
        color: COLORS.textDark,
        fontFace: 'Plus Jakarta Sans',
      });

      const cardW = 2.26;
      const gap = 0.21;
      def.cards.forEach((card, cIdx) => {
        const cx = 0.6 + cIdx * (cardW + gap);
        const cy = 2.35;
        const ch = 4.25;

        slide.addShape(pptx.ShapeType.roundRect, {
          x: cx,
          y: cy,
          w: cardW,
          h: ch,
          fill: { color: COLORS.white },
          line: { color: COLORS.border, width: 1.2 },
          rectRadius: 0.08,
        });
        slide.addShape(pptx.ShapeType.rect, {
          x: cx,
          y: cy,
          w: cardW,
          h: 0.55,
          fill: { color: cIdx === 0 || cIdx === 4 ? COLORS.charcoal : COLORS.amber },
          line: { color: COLORS.charcoal, width: 0 },
        });
        slide.addText(`STEP 0${cIdx + 1}`, {
          x: cx + 0.14,
          y: cy + 0.12,
          w: cardW - 0.28,
          h: 0.32,
          fontSize: 11,
          bold: true,
          color: COLORS.white,
          fontFace: 'Plus Jakarta Sans',
        });
        slide.addText(card.heading.replace(/^\d+\.\s*/, ''), {
          x: cx + 0.14,
          y: cy + 0.72,
          w: cardW - 0.28,
          h: 0.78,
          fontSize: 13.5,
          bold: true,
          color: COLORS.textDark,
          valign: 'top',
          fontFace: 'Georgia',
        });
        slide.addText(card.body, {
          x: cx + 0.14,
          y: cy + 1.56,
          w: cardW - 0.28,
          h: 2.5,
          fontSize: 11.5,
          color: COLORS.textMuted,
          valign: 'top',
          fontFace: 'Plus Jakarta Sans',
        });
      });
    } else if (def.layout === 'cards' && def.cards) {
      slide.addText(def.highlights[0] || '', {
        x: 0.6,
        y: 1.72,
        w: 12.1,
        h: 0.42,
        fontSize: 13,
        color: COLORS.textDark,
        fontFace: 'Plus Jakarta Sans',
      });

      def.cards.forEach((card, cIdx) => {
        const col = cIdx % 2;
        const row = Math.floor(cIdx / 2);
        const cx = 0.6 + col * 6.2;
        const cy = 2.3 + row * 2.25;

        slide.addShape(pptx.ShapeType.roundRect, {
          x: cx,
          y: cy,
          w: 5.93,
          h: 2.02,
          fill: { color: COLORS.white },
          line: { color: COLORS.border, width: 1.2 },
          rectRadius: 0.08,
        });
        slide.addText(`0${cIdx + 1}.  ${card.heading}`, {
          x: cx + 0.25,
          y: cy + 0.2,
          w: 5.43,
          h: 0.42,
          fontSize: 14.5,
          bold: true,
          color: COLORS.amberDark,
          fontFace: 'Georgia',
        });
        slide.addText(card.body, {
          x: cx + 0.25,
          y: cy + 0.68,
          w: 5.43,
          h: 1.18,
          fontSize: 12.2,
          color: COLORS.textDark,
          valign: 'top',
          fontFace: 'Plus Jakarta Sans',
        });
      });
    } else if (def.layout === 'table' && def.tableHeaders && def.tableRows) {
      slide.addText(def.highlights[0] || '', {
        x: 0.6,
        y: 1.72,
        w: 12.1,
        h: 0.42,
        fontSize: 13,
        color: COLORS.textDark,
        fontFace: 'Plus Jakarta Sans',
      });

      const headerMargin: [number, number, number, number] = [8, 10, 8, 10];
      const cellMargin: [number, number, number, number] = [10, 10, 10, 10];

      const rows: PptxGenJS.TableRow[] = [
        def.tableHeaders.map((h) => ({
          text: h,
          options: {
            bold: true,
            color: COLORS.white,
            fill: { color: COLORS.charcoal },
            fontSize: 12.5,
            fontFace: 'Plus Jakarta Sans',
            margin: headerMargin,
          },
        })),
        ...def.tableRows.map((r, rIdx) =>
          r.map((cell, cIdx) => ({
            text: cell,
            options: {
              bold: cIdx === 0,
              color: COLORS.textDark,
              fill: { color: rIdx % 2 === 0 ? COLORS.white : 'F9FAFB' },
              fontSize: 12,
              fontFace: 'Plus Jakarta Sans',
              margin: cellMargin,
            },
          }))
        ),
      ];

      slide.addTable(rows, {
        x: 0.6,
        y: 2.32,
        w: 12.13,
        colW: [2.4, 4.9, 4.83],
        border: { type: 'solid', pt: 1, color: COLORS.border },
        valign: 'middle',
      });

      // Live status footer note
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6,
        y: 5.95,
        w: 12.13,
        h: 0.72,
        fill: { color: COLORS.emeraldSoft },
        line: { color: 'A7F3D0', width: 1 },
        rectRadius: 0.06,
      });
      slide.addText(
        'Deployment Ready: Vite + Express + Cloud Firestore + Gemini Vision OCR Proxy + Real-Time Backup & Printable A4 Compliance Outputs.',
        {
          x: 0.85,
          y: 6.08,
          w: 11.6,
          h: 0.46,
          fontSize: 12,
          bold: true,
          color: COLORS.emerald,
          valign: 'middle',
          fontFace: 'Plus Jakarta Sans',
        }
      );
    }

    addFooter(slide, idx + 1, false);
  });

  const fileName = 'Nepal_Bullion_Legal_Purchase_KYC_Demo.pptx';
  await pptx.writeFile({ fileName });
  return fileName;
}
