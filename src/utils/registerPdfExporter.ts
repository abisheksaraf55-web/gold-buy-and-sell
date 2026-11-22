import { jsPDF } from 'jspdf';
import { PurchaseTransaction, ShopDetails } from '../types/bullion';
import { formatNPR, toNepaliDigits } from './nepalBullionCalculations';
import sealImage from '../assets/images/nepal_bullion_seal_1790317148844.jpg';

export interface RegisterPdfFilterMetadata {
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  metalFilter?: 'all' | 'gold' | 'silver';
  paymentFilter?: 'all' | 'bank' | 'cash';
  districtFilter?: string;
  complianceFilter?: 'all' | 'verified' | 'partial';
}

export interface ExportRegisterPdfOptions {
  transactions: PurchaseTransaction[];
  totalCount: number;
  shop?: ShopDetails;
  filters?: RegisterPdfFilterMetadata;
  filename?: string;
}

function loadImageSafe(src: string | undefined): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 3500);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = src;
  });
}

function fitTextToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}…`;
}

function buildFilterSummaryText(filters?: RegisterPdfFilterMetadata): string {
  if (!filters) return 'सबै अभिलेख (All Records)';

  const parts: string[] = [];
  if (filters.searchQuery?.trim()) {
    parts.push(`खोज: "${filters.searchQuery.trim()}"`);
  }
  if (filters.startDate || filters.endDate) {
    parts.push(`मिति: ${filters.startDate || 'सुरु'} देखि ${filters.endDate || 'हालसम्म'}`);
  }
  if (filters.metalFilter && filters.metalFilter !== 'all') {
    parts.push(`धातु: ${filters.metalFilter === 'gold' ? 'सुन (Gold)' : 'चाँदी (Silver)'}`);
  }
  if (filters.paymentFilter && filters.paymentFilter !== 'all') {
    parts.push(`भुक्तानी: ${filters.paymentFilter === 'cash' ? 'नगद (Cash)' : 'बैंकिङ/डिजिटल'}`);
  }
  if (filters.districtFilter && filters.districtFilter !== 'all') {
    parts.push(`जिल्ला: ${filters.districtFilter}`);
  }
  if (filters.complianceFilter && filters.complianceFilter !== 'all') {
    parts.push(`KYC: ${filters.complianceFilter === 'verified' ? 'सुरक्षित प्रमाणित' : 'आंशिक'}`);
  }

  return parts.length > 0 ? parts.join('  |  ') : 'सबै अभिलेख (कुनै फिल्टर लागू नभएको)';
}

interface RegisterPageContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  contentLeft: number;
  contentRight: number;
  contentWidth: number;
}

function createA4RegisterPage(
  watermarkSeal: HTMLImageElement | null
): RegisterPageContext {
  const canvas = document.createElement('canvas');
  canvas.width = 1240; // A4 Portrait at 150 DPI
  canvas.height = 1754;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // Crisp white archival background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle watermark seal
  if (watermarkSeal) {
    ctx.save();
    ctx.globalAlpha = 0.025;
    ctx.drawImage(watermarkSeal, canvas.width / 2 - 240, 620, 480, 480);
    ctx.restore();
  }

  // Outer archival frame
  const outerX = 36;
  const outerY = 36;
  const outerW = 1168;
  const outerH = 1682;

  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 2.2;
  ctx.strokeRect(outerX, outerY, outerW, outerH);

  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(outerX + 5, outerY + 5, outerW - 10, outerH - 10);

  return {
    canvas,
    ctx,
    contentLeft: 52,
    contentRight: 1188,
    contentWidth: 1136,
  };
}

const COLUMNS = [
  { key: 'serial', label1: 'सिरीयल नं.', label2: 'भौचर नं.', w: 130, align: 'left' as const },
  { key: 'date', label1: 'मिति (वि.सं.)', label2: 'ई.सं. / समय', w: 115, align: 'left' as const },
  { key: 'seller', label1: 'बिक्रेताको विवरण', label2: 'नाम / बाबुको नाम', w: 195, align: 'left' as const },
  { key: 'idContact', label1: 'परिचयपत्र नं.', label2: 'सम्पर्क / ठेगाना', w: 165, align: 'left' as const },
  { key: 'items', label1: 'गहना / धातु विवरण', label2: 'शुद्धता र संख्या', w: 195, align: 'left' as const },
  { key: 'weight', label1: 'खुद तौल (g)', label2: 'तौल (तोला)', w: 110, align: 'right' as const },
  { key: 'payout', label1: 'कुल भुक्तानी (रु.)', label2: 'माध्यम', w: 136, align: 'right' as const },
  { key: 'status', label1: 'प्रमाणीकरण', label2: 'KYC स्थिति', w: 90, align: 'center' as const },
];

function drawTableHeader(
  ctx: CanvasRenderingContext2D,
  contentLeft: number,
  contentWidth: number,
  startY: number
): number {
  const headerH = 48;
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(contentLeft, startY, contentWidth, headerH);

  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(contentLeft, startY, contentWidth, headerH);

  let colX = contentLeft;
  COLUMNS.forEach((col, idx) => {
    if (idx > 0) {
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(colX, startY);
      ctx.lineTo(colX, startY + headerH);
      ctx.stroke();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14.5px "Mukta", "Plus Jakarta Sans", sans-serif';
    let textX = colX + 8;
    if (col.align === 'right') {
      ctx.textAlign = 'right';
      textX = colX + col.w - 8;
    } else if (col.align === 'center') {
      ctx.textAlign = 'center';
      textX = colX + col.w / 2;
    } else {
      ctx.textAlign = 'left';
    }

    ctx.fillText(col.label1, textX, startY + 20);
    ctx.fillStyle = '#d1d5db';
    ctx.font = '600 12.5px "Mukta", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(col.label2, textX, startY + 39);

    colX += col.w;
  });

  ctx.textAlign = 'left';
  return startY + headerH;
}

/**
 * Generates and downloads a formatted multi-page A4 PDF of the filtered Police Audit Register
 * for physical archival, preserving full Nepali Devanagari script and legal compliance metadata.
 */
export async function exportPoliceAuditRegisterToPDF({
  transactions,
  totalCount,
  shop,
  filters,
  filename,
}: ExportRegisterPdfOptions): Promise<void> {
  if (!transactions || transactions.length === 0) {
    return;
  }

  try {
    await document.fonts.ready;
  } catch {
    // Proceed even if fonts readiness rejects
  }

  const loadedSeal = await loadImageSafe(sealImage);
  const resolvedShop = shop || transactions[0]?.shop;

  const totalGoldGrams = transactions.reduce((sum, tx) => {
    return (
      sum +
      tx.items
        .filter((i) => i.metalType === 'gold')
        .reduce((s, i) => s + (Number(i.netWeightGrams) || 0), 0)
    );
  }, 0);

  const totalSilverGrams = transactions.reduce((sum, tx) => {
    return (
      sum +
      tx.items
        .filter((i) => i.metalType === 'silver')
        .reduce((s, i) => s + (Number(i.netWeightGrams) || 0), 0)
    );
  }, 0);

  const grandTotalPayout = transactions.reduce(
    (sum, tx) => sum + (Number(tx.grandTotalAmount) || 0),
    0
  );

  const now = new Date();
  const exportTimestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;
  const filterSummary = buildFilterSummaryText(filters);

  const pages: RegisterPageContext[] = [];
  const maxContentBottomY = 1628;

  // --- PAGE 1 HEADER ---
  let currentPage = createA4RegisterPage(loadedSeal);
  pages.push(currentPage);

  const drawFirstPageHeader = (page: RegisterPageContext): number => {
    const { ctx, contentLeft, contentRight, contentWidth } = page;
    let y = 56;

    // Seal on left
    if (loadedSeal) {
      ctx.drawImage(loadedSeal, contentLeft, y, 64, 64);
    }

    const titleCenterX = (contentLeft + contentRight) / 2;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px "Mukta", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      fitTextToWidth(ctx, resolvedShop?.nameNepali || 'नेपाल सुनचाँदी व्यवसायी खरिद अभिलेख', 820),
      titleCenterX,
      y + 22
    );

    ctx.font = 'bold 15px "Plus Jakarta Sans", "Mukta", sans-serif';
    ctx.fillStyle = '#374151';
    ctx.fillText(
      fitTextToWidth(
        ctx,
        resolvedShop?.nameEnglish
          ? `${resolvedShop.nameEnglish} — Official Bullion Purchase Audit Register`
          : 'Official Bullion Purchase & Police Audit Register',
        840
      ),
      titleCenterX,
      y + 44
    );

    ctx.font = '600 13.5px "Mukta", sans-serif';
    ctx.fillStyle = '#1f2937';
    const shopMetaParts: string[] = [];
    if (resolvedShop?.address) shopMetaParts.push(`ठेगाना: ${resolvedShop.address}`);
    if (resolvedShop?.panVatNumber) shopMetaParts.push(`PAN/VAT: ${toNepaliDigits(resolvedShop.panVatNumber)}`);
    if (resolvedShop?.phone) shopMetaParts.push(`फोन: ${toNepaliDigits(resolvedShop.phone)}`);
    ctx.fillText(
      fitTextToWidth(ctx, shopMetaParts.join('  •  ') || 'नेपाल मुलुकी अपराध संहिता २०७४ दफा २४४ अनुसार अभिलेख', 900),
      titleCenterX,
      y + 66
    );

    y += 78;

    // Title Bar
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(contentLeft, y, contentWidth, 42);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(contentLeft, y, contentWidth, 42);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 18px "Mukta", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      'दैनिक सुनचाँदी खरिद दर्ता किताब (Police Audit & Archival Register)',
      titleCenterX,
      y + 27
    );
    y += 50;

    // Filter & Export Metadata Bar
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(contentLeft, y, contentWidth, 34);
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.strokeRect(contentLeft, y, contentWidth, 34);

    ctx.textAlign = 'left';
    ctx.font = '600 13px "Mukta", "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#111827';
    ctx.fillText(
      fitTextToWidth(ctx, `लागू फिल्टर: ${filterSummary}`, contentWidth - 260),
      contentLeft + 10,
      y + 22
    );

    ctx.textAlign = 'right';
    ctx.fillStyle = '#374151';
    ctx.fillText(`प्रिन्ट मिति: ${exportTimestamp}`, contentRight - 10, y + 22);
    y += 42;

    // 4 Summary KPI Boxes
    const boxGap = 12;
    const boxW = (contentWidth - boxGap * 3) / 4;
    const boxH = 58;
    const kpis = [
      {
        title: 'अभिलेख संख्या (Records)',
        value: `${toNepaliDigits(transactions.length)} वटा`,
        sub: transactions.length !== totalCount ? `कुल ${toNepaliDigits(totalCount)} मध्ये फिल्टर गरिएको` : 'सबै प्रमाणित अभिलेख',
      },
      {
        title: 'जम्मा खरिद सुन (Gold)',
        value: `${totalGoldGrams.toFixed(2)} g`,
        sub: `तोला: ${(totalGoldGrams / 11.6638).toFixed(2)} तोला`,
      },
      {
        title: 'जम्मा खरिद चाँदी (Silver)',
        value: `${totalSilverGrams.toFixed(2)} g`,
        sub: `तोला: ${(totalSilverGrams / 11.6638).toFixed(2)} तोला`,
      },
      {
        title: 'कुल भुक्तानी रकम (Payout)',
        value: formatNPR(grandTotalPayout, true),
        sub: 'नेपाल कानुन र AML अनुकूल',
      },
    ];

    kpis.forEach((kpi, idx) => {
      const bx = contentLeft + idx * (boxW + boxGap);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, y, boxW, boxH);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1.1;
      ctx.strokeRect(bx, y, boxW, boxH);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#4b5563';
      ctx.font = 'bold 12px "Mukta", "Plus Jakarta Sans", sans-serif';
      ctx.fillText(kpi.title, bx + 10, y + 17);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16.5px "Mukta", "Plus Jakarta Sans", sans-serif';
      ctx.fillText(fitTextToWidth(ctx, kpi.value, boxW - 20), bx + 10, y + 37);

      ctx.fillStyle = '#6b7280';
      ctx.font = '500 11.5px "Mukta", "Plus Jakarta Sans", sans-serif';
      ctx.fillText(fitTextToWidth(ctx, kpi.sub, boxW - 20), bx + 10, y + 52);
    });

    ctx.textAlign = 'left';
    return y + boxH + 12;
  };

  const drawContinuationHeader = (page: RegisterPageContext): number => {
    const { ctx, contentLeft, contentRight, contentWidth } = page;
    const y = 52;
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(contentLeft, y, contentWidth, 34);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(contentLeft, y, contentWidth, 34);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 15px "Mukta", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      fitTextToWidth(
        ctx,
        `${resolvedShop?.nameNepali || 'नेपाल सुनचाँदी खरिद अभिलेख'} — प्रहरी अडिट दर्ता पुस्तिका (निरन्तरता)`,
        contentWidth - 260
      ),
      contentLeft + 10,
      y + 22
    );

    ctx.textAlign = 'right';
    ctx.font = '600 12.5px "Mukta", "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#374151';
    ctx.fillText(`प्रिन्ट मिति: ${exportTimestamp}`, contentRight - 10, y + 22);
    ctx.textAlign = 'left';
    return y + 42;
  };

  let currY = drawFirstPageHeader(currentPage);
  currY = drawTableHeader(currentPage.ctx, currentPage.contentLeft, currentPage.contentWidth, currY);

  const rowH = 58;

  transactions.forEach((tx, idx) => {
    if (currY + rowH > maxContentBottomY) {
      currentPage = createA4RegisterPage(loadedSeal);
      pages.push(currentPage);
      currY = drawContinuationHeader(currentPage);
      currY = drawTableHeader(currentPage.ctx, currentPage.contentLeft, currentPage.contentWidth, currY);
    }

    const { ctx, contentLeft, contentWidth } = currentPage;
    ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
    ctx.fillRect(contentLeft, currY, contentWidth, rowH);

    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.strokeRect(contentLeft, currY, contentWidth, rowH);

    let colX = contentLeft;
    COLUMNS.forEach((col, cIdx) => {
      if (cIdx > 0) {
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(colX, currY);
        ctx.lineTo(colX, currY + rowH);
        ctx.stroke();
      }

      const maxCellW = col.w - 14;
      const line1Y = currY + 23;
      const line2Y = currY + 45;

      if (col.key === 'serial') {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 13.5px "JetBrains Mono", "Mukta", monospace';
        const serialText = `${idx + 1}. ${tx.contractSerialNumber || `SN-${tx.voucherNumber}`}`;
        ctx.fillText(fitTextToWidth(ctx, serialText, maxCellW), colX + 7, line1Y);

        ctx.fillStyle = '#4b5563';
        ctx.font = '500 12px "JetBrains Mono", "Mukta", monospace';
        ctx.fillText(fitTextToWidth(ctx, tx.voucherNumber || '-', maxCellW), colX + 7, line2Y);
      } else if (col.key === 'date') {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 13.5px "Mukta", sans-serif';
        ctx.fillText(fitTextToWidth(ctx, tx.dateBS || '-', maxCellW), colX + 7, line1Y);

        ctx.fillStyle = '#4b5563';
        ctx.font = '500 11.5px "Plus Jakarta Sans", sans-serif';
        const adText = `${tx.dateAD || ''}${tx.time ? ` ${tx.time}` : ''}`.trim() || '-';
        ctx.fillText(fitTextToWidth(ctx, adText, maxCellW), colX + 7, line2Y);
      } else if (col.key === 'seller') {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px "Mukta", sans-serif';
        ctx.fillText(fitTextToWidth(ctx, tx.seller.fullNameNepali || tx.seller.fullNameEnglish || '-', maxCellW), colX + 7, line1Y);

        ctx.fillStyle = '#4b5563';
        ctx.font = '500 12px "Mukta", "Plus Jakarta Sans", sans-serif';
        const subSeller = tx.seller.fatherName
          ? `बाबु: ${tx.seller.fatherName}`
          : tx.seller.fullNameEnglish || '-';
        ctx.fillText(fitTextToWidth(ctx, subSeller, maxCellW), colX + 7, line2Y);
      } else if (col.key === 'idContact') {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 13px "JetBrains Mono", "Mukta", sans-serif';
        const idText = `${tx.seller.idNumber || 'अनुपलब्ध'}${tx.seller.issuedDistrict ? ` (${tx.seller.issuedDistrict})` : ''}`;
        ctx.fillText(fitTextToWidth(ctx, idText, maxCellW), colX + 7, line1Y);

        ctx.fillStyle = '#4b5563';
        ctx.font = '500 12px "Mukta", sans-serif';
        const contactText = `${tx.seller.mobileNumber || '-'} • ${tx.seller.district || tx.seller.currentAddress || '-'}`;
        ctx.fillText(fitTextToWidth(ctx, contactText, maxCellW), colX + 7, line2Y);
      } else if (col.key === 'items') {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 13.5px "Mukta", sans-serif';
        const itemsNames = tx.items.map((i) => i.itemName).join(', ') || '-';
        ctx.fillText(fitTextToWidth(ctx, itemsNames, maxCellW), colX + 7, line1Y);

        ctx.fillStyle = '#4b5563';
        ctx.font = '500 12px "Mukta", sans-serif';
        const purityInfo = `${tx.items[0]?.metalType === 'gold' ? 'सुन' : 'चाँदी'} (${tx.items[0]?.purityLabel || ''}) • ${toNepaliDigits(tx.items.length)} वस्तु`;
        ctx.fillText(fitTextToWidth(ctx, purityInfo, maxCellW), colX + 7, line2Y);
      } else if (col.key === 'weight') {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 13.5px "Mukta", "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`${tx.totalNetGrams.toFixed(2)} g`, colX + col.w - 7, line1Y);

        ctx.fillStyle = '#4b5563';
        ctx.font = '500 12px "Mukta", sans-serif';
        ctx.fillText(`${tx.totalNetTola.toFixed(2)} तोला`, colX + col.w - 7, line2Y);
      } else if (col.key === 'payout') {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 13.5px "Mukta", "Plus Jakarta Sans", sans-serif';
        ctx.fillText(fitTextToWidth(ctx, formatNPR(tx.grandTotalAmount, true), maxCellW), colX + col.w - 7, line1Y);

        ctx.fillStyle = '#4b5563';
        ctx.font = '600 12px "Mukta", sans-serif';
        ctx.fillText(tx.payment.method === 'cash' ? 'नगद' : 'बैंकिङ/डिजिटल', colX + col.w - 7, line2Y);
      } else if (col.key === 'status') {
        const isFullKyc = Boolean(
          tx.seller.idNumber &&
          (tx.seller.signatureUrl || tx.seller.leftThumbprintUrl) &&
          tx.declaration.isAbsoluteOwner
        );
        ctx.textAlign = 'center';
        ctx.fillStyle = isFullKyc ? '#065f46' : '#92400e';
        ctx.font = 'bold 13px "Mukta", sans-serif';
        ctx.fillText(isFullKyc ? 'सुरक्षित' : 'आंशिक', colX + col.w / 2, line1Y);

        ctx.fillStyle = '#6b7280';
        ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(isFullKyc ? 'Verified' : 'Partial', colX + col.w / 2, line2Y);
      }

      colX += col.w;
    });

    currY += rowH;
  });

  // --- TABLE TOTALS SUMMARY ROW + ARCHIVAL SIGN-OFF BLOCK ---
  const neededBottomH = 44 + 18 + 108;
  if (currY + neededBottomH > maxContentBottomY) {
    currentPage = createA4RegisterPage(loadedSeal);
    pages.push(currentPage);
    currY = drawContinuationHeader(currentPage);
  }

  {
    const { ctx, contentLeft, contentRight, contentWidth } = currentPage;
    // Totals Bar
    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(contentLeft, currY, contentWidth, 42);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(contentLeft, currY, contentWidth, 42);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 15px "Mukta", sans-serif';
    ctx.fillText(
      `कुल जम्मा (${toNepaliDigits(transactions.length)} सम्झौता):  सुन ${totalGoldGrams.toFixed(2)} g  |  चाँदी ${totalSilverGrams.toFixed(2)} g`,
      contentLeft + 12,
      currY + 26
    );

    ctx.textAlign = 'right';
    ctx.font = 'bold 16px "Mukta", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`जम्मा भुक्तानी: ${formatNPR(grandTotalPayout, true)}`, contentRight - 12, currY + 26);
    currY += 60;

    // Archival Sign-off Box
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(contentLeft, currY, contentWidth, 104);
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.strokeRect(contentLeft, currY, contentWidth, 104);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 14px "Mukta", sans-serif';
    ctx.fillText(
      'प्रमाणित गरिन्छ कि माथि उल्लेखित सम्पूर्ण खरिद कारोबार प्रचलित नेपाल कानुन र KYC मापदण्ड अनुसार दर्ता गरिएको छ।',
      contentLeft + 14,
      currY + 24
    );

    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.4;
    // Left Signature Line (Shop)
    ctx.beginPath();
    ctx.moveTo(contentLeft + 18, currY + 72);
    ctx.lineTo(contentLeft + 320, currY + 72);
    ctx.stroke();

    ctx.font = 'bold 13.5px "Mukta", sans-serif';
    ctx.fillText(
      `तयार गर्ने / सञ्चालकको दस्तखत र पसलको छाप (${resolvedShop?.proprietorName || 'सञ्चालक'})`,
      contentLeft + 18,
      currY + 92
    );

    // Right Signature Line (Police / Audit Officer)
    ctx.beginPath();
    ctx.moveTo(contentRight - 320, currY + 72);
    ctx.lineTo(contentRight - 18, currY + 72);
    ctx.stroke();

    ctx.textAlign = 'right';
    ctx.fillText('प्रहरी / राजस्व लेखापरीक्षण प्रमाणित दस्तखत र मिति', contentRight - 18, currY + 92);
    ctx.textAlign = 'left';
  }

  // --- STAMP PAGE NUMBERS & ARCHIVAL FOOTER ON ALL PAGES ---
  const totalPages = pages.length;
  pages.forEach((p, pageIdx) => {
    const { ctx, contentLeft, contentRight, contentWidth } = p;
    const footerY = 1656;

    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(contentLeft, footerY);
    ctx.lineTo(contentLeft + contentWidth, footerY);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#374151';
    ctx.font = '600 12.5px "Mukta", sans-serif';
    ctx.fillText(
      'नेपाल सुनचाँदी कानुनी खरिद प्रणाली • मुलुकी अपराध संहिता २०७४ दफा २४४ र सम्पत्ति शुद्धीकरण ऐन २०६४ अनुसार भौतिक अभिलेख',
      contentLeft,
      footerY + 22
    );

    ctx.textAlign = 'right';
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 13px "Mukta", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `पृष्ठ ${toNepaliDigits(pageIdx + 1)} / ${toNepaliDigits(totalPages)} (Page ${pageIdx + 1} of ${totalPages})`,
      contentRight,
      footerY + 22
    );
    ctx.textAlign = 'left';
  });

  // --- COMPILE TO A4 PDF ---
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidthMm = 210;
  const pageHeightMm = 297;
  const marginTopMm = 5;
  const marginBottomMm = 12;
  const printHeightMm = pageHeightMm - marginTopMm - marginBottomMm;

  pages.forEach((p, idx) => {
    if (idx > 0) {
      pdf.addPage('a4', 'portrait');
    }
    const ratio = p.canvas.width / (p.canvas.height || 1);
    const printWidthMm = Math.min(pageWidthMm - 10, printHeightMm * ratio);
    const xOffsetMm = (pageWidthMm - printWidthMm) / 2;
    const imgData = p.canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', xOffsetMm, marginTopMm, printWidthMm, printHeightMm);
  });

  const safeFilename =
    filename || `nepal_bullion_audit_register_${now.toISOString().split('T')[0]}`;
  pdf.save(`${safeFilename}.pdf`);
}
