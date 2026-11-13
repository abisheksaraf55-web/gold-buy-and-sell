import { PurchaseTransaction } from '../types/bullion';
import { formatNPR, toNepaliDigits } from './nepalBullionCalculations';
import sealImage from '../assets/images/nepal_bullion_seal_1790317148844.jpg';

/**
 * Loads an image safely with anonymous CORS and timeout.
 * Returns null if the image fails to load, preventing any canvas tainting or crash.
 */
function loadImageSafe(src: string | undefined): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 4000);
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

/**
 * Wraps text into multiple lines within a maximum pixel width.
 */
function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Truncates text cleanly so it never overflows a given pixel width.
 */
function fitTextToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}...`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}...`;
}

/**
 * Draws an image preserving aspect ratio inside a bounding box.
 */
function drawImageContained(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  maxW: number,
  maxH: number
): void {
  const imgRatio = img.width / (img.height || 1);
  const boxRatio = maxW / maxH;
  let drawW = maxW;
  let drawH = maxH;
  if (imgRatio > boxRatio) {
    drawH = maxW / imgRatio;
  } else {
    drawW = maxH * imgRatio;
  }
  const offsetX = x + (maxW - drawW) / 2;
  const offsetY = y + (maxH - drawH) / 2;
  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
}

/**
 * Initializes a blank standard A4 portrait canvas (1240 x 1754 at 150 DPI)
 * with double legal borders and subtle watermark.
 */
function createA4PageCanvas(
  watermarkSeal: HTMLImageElement | null
): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  outerX: number;
  outerY: number;
  outerW: number;
  outerH: number;
  contentLeft: number;
  contentRight: number;
  contentWidth: number;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 1754;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not available');
  }

  // Clean crisp white paper
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Very subtle watermark so printed black text remains 100% crisp
  ctx.save();
  ctx.globalAlpha = 0.025;
  if (watermarkSeal) {
    ctx.drawImage(watermarkSeal, canvas.width / 2 - 250, 620, 500, 500);
  }
  ctx.restore();

  const outerX = 40;
  const outerY = 40;
  const outerW = canvas.width - 80; // 1160 px
  const outerH = canvas.height - 80; // 1674 px

  // Primary crisp black border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(outerX, outerY, outerW, outerH);

  // Inner border
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 1;
  ctx.strokeRect(outerX + 6, outerY + 6, outerW - 12, outerH - 12);

  const contentLeft = outerX + 18;
  const contentWidth = outerW - 36; // 1124 px
  const contentRight = contentLeft + contentWidth;

  return {
    canvas,
    ctx,
    outerX,
    outerY,
    outerW,
    outerH,
    contentLeft,
    contentRight,
    contentWidth,
  };
}

function drawPageFooter(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  outerY: number,
  contentLeft: number,
  contentRight: number,
  transaction: PurchaseTransaction,
  pageNumber: number,
  totalPages: number
): void {
  const legalFooterY = canvas.height - outerY - 16;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(contentLeft, legalFooterY - 14);
  ctx.lineTo(contentRight, legalFooterY - 14);
  ctx.stroke();

  ctx.font = 'bold 15.5px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.fillText(
    `प्रमाणीकरण कोड: ${transaction.tamperVerificationHash || 'NEP-LEGAL-VERIFIED'}`,
    contentLeft,
    legalFooterY + 4
  );

  ctx.textAlign = 'right';
  ctx.fillText(
    `मुलुकी अपराध संहिता २०७४ दफा २४४ अनुसार प्रमाणित आधिकारिक भरपाई  |  पृष्ठ ${toNepaliDigits(pageNumber)} / ${toNepaliDigits(totalPages)} (Page ${pageNumber} of ${totalPages})`,
    contentRight,
    legalFooterY + 4
  );
  ctx.textAlign = 'left';
}

/**
 * Renders the complete official Nepali Legal Purchase Deed as multi-page A4 canvases:
 * - Page 1 (and overflow page if many items): Main Legal Contract & Biometrics (Open layout, no stamp table, large readable black text)
 * - Next Page: Attached Seller ID Photos (Front & Back) when present
 */
export async function renderNepaliLegalDeedPagesToCanvases(
  transaction: PurchaseTransaction
): Promise<HTMLCanvasElement[]> {
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font readiness fallback
    }
  }

  const { shop, seller, items, declaration, payment, witness } = transaction;

  const [
    loadedSeal,
    loadedSellerPhoto,
    loadedLeftThumb,
    loadedRightThumb,
    loadedSignature,
    loadedIdFront,
    loadedIdBack,
  ] = await Promise.all([
    loadImageSafe(shop.stampSealUrl || sealImage),
    loadImageSafe(seller.sellerPhotoUrl),
    loadImageSafe(seller.leftThumbprintUrl),
    loadImageSafe(seller.rightThumbprintUrl),
    loadImageSafe(seller.signatureUrl),
    loadImageSafe(seller.idCardFrontUrl),
    loadImageSafe(seller.idCardBackUrl),
  ]);

  const pages: HTMLCanvasElement[] = [];

  // ==================== PAGE 1 ====================
  let pageState = createA4PageCanvas(loadedSeal);
  let { canvas, ctx, outerY, contentLeft, contentRight, contentWidth } = pageState;
  pages.push(canvas);

  const maxPageBottomY = canvas.height - outerY - 40; // Reserve space for footer

  // 1. Header Top Meta Line
  ctx.font = 'bold 16px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  const contractSN = `सम्झौता सिरीयल नं.: ${transaction.contractSerialNumber || `SN-${transaction.voucherNumber}`}`;
  ctx.fillText(contractSN, contentLeft, outerY + 28);

  const fiscalText = `आ.व.: ${toNepaliDigits(transaction.fiscalYear || '२०८१/०८२')}   |   पसल दर्ता नं.: ${toNepaliDigits(shop.businessRegNumber || '१४८२०१/०७२/०७३')}`;
  ctx.textAlign = 'right';
  ctx.fillText(fiscalText, contentRight, outerY + 28);

  // 2. Shop Header Details
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 30px "Mukta", serif';
  ctx.fillText(
    fitTextToWidth(ctx, shop.nameNepali || 'श्री अन्नपूर्ण सुनचाँदी गहना मन्दिर प्रा.लि.', contentWidth - 20),
    canvas.width / 2,
    outerY + 62
  );

  let headerY = outerY + 86;
  ctx.font = '600 17px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(
    fitTextToWidth(
      ctx,
      `${shop.address || 'न्युरोड, काठमाडौं'}   |   फोन: ${toNepaliDigits(shop.phone || '०१-४२४५६७८')}`,
      contentWidth - 20
    ),
    canvas.width / 2,
    headerY
  );

  headerY += 22;
  ctx.font = 'bold 16px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(
    `स्थायी लेखा नं. (PAN/VAT): ${toNepaliDigits(shop.panVatNumber || '६०१२८४९१२')}   |   महासंघ दर्ता नं.: ${shop.fenegosidaMembershipNo || 'KTM-FENEGOSIDA-084'}`,
    canvas.width / 2,
    headerY
  );

  // 3. Document Title Banner
  const titleY = headerY + 12;
  ctx.fillStyle = '#000000';
  ctx.fillRect(contentLeft, titleY, contentWidth, 36);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Mukta", sans-serif';
  ctx.fillText('सुनचाँदी खरिद भरपाई तथा कानुनी कबुलियतनामा', canvas.width / 2, titleY + 25);

  ctx.fillStyle = '#000000';
  ctx.font = '600 14.5px "Mukta", sans-serif';
  ctx.fillText(
    '(मुलुकी अपराध संहिता २०७४ दफा २४४ र सम्पत्ति शुद्धीकरण निवारण ऐन २०६४ बमोजिम प्रमाणित कानुनी लिखत)',
    canvas.width / 2,
    titleY + 54
  );
  ctx.textAlign = 'left';

  // 4. Voucher Info Bar
  const voucherY = titleY + 62;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(contentLeft, voucherY, contentWidth, 32);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(contentLeft, voucherY, contentWidth, 32);

  ctx.font = 'bold 16.5px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(`भरपाई नं.: #${transaction.voucherNumber}`, contentLeft + 12, voucherY + 22);
  ctx.fillText(`कारोबार मिति: ${toNepaliDigits(transaction.dateBS)} (वि.सं.)`, contentLeft + 380, voucherY + 22);
  ctx.textAlign = 'right';
  ctx.fillText(`समय: ${transaction.time} (${transaction.dateAD})`, contentRight - 12, voucherY + 22);
  ctx.textAlign = 'left';

  // 5. Section 1: Seller KYC
  let currY = voucherY + 42;

  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(contentLeft, currY, contentWidth, 28);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(contentLeft, currY, contentWidth, 28);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 18px "Mukta", sans-serif';
  ctx.fillText('१. बिक्रेताको पूर्ण व्यक्तिगत तथा ३ पुस्ते विवरण (सक्कल परिचयपत्र रुजु)', contentLeft + 10, currY + 20);

  currY += 28;
  const kycBoxY = currY;
  const kycBoxHeight = 190;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(contentLeft, kycBoxY, contentWidth, kycBoxHeight);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(contentLeft, kycBoxY, contentWidth, kycBoxHeight);

  // Photo Frame on Right
  const photoW = 130;
  const photoH = 166;
  const photoX = contentRight - photoW - 14;
  const photoY = kycBoxY + 12;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(photoX, photoY, photoW, photoH);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  if (loadedSellerPhoto) {
    drawImageContained(ctx, loadedSellerPhoto, photoX + 3, photoY + 3, photoW - 6, photoH - 26);
  }
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 13px "Mukta", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('प्रमाणित तस्बिर', photoX + photoW / 2, photoY + photoH - 6);
  ctx.textAlign = 'left';

  // KYC Text Area
  const kycLeft = contentLeft + 12;
  const kycMaxRight = photoX - 16;
  const col2X = kycLeft + 510;

  // Row 1: Name & Mobile
  ctx.font = 'bold 17px "Mukta", sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('बिक्रेताको नाम:', kycLeft, kycBoxY + 25);
  ctx.font = 'bold 18.5px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  const nameText = `${seller.fullNameNepali || 'खुलाइएको छैन'}${seller.fullNameEnglish ? ` (${seller.fullNameEnglish})` : ''}`;
  ctx.fillText(fitTextToWidth(ctx, nameText, col2X - (kycLeft + 125) - 12), kycLeft + 125, kycBoxY + 25);

  ctx.font = 'bold 17px "Mukta", sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('मोवाइल नं.:', col2X, kycBoxY + 25);
  ctx.font = 'bold 18px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(toNepaliDigits(seller.mobileNumber || 'N/A'), col2X + 100, kycBoxY + 25);

  // 3-Puste Lineage Strip
  const pusteY = kycBoxY + 38;
  const pusteW = kycMaxRight - kycLeft;
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(kycLeft, pusteY, pusteW, 34);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(kycLeft, pusteY, pusteW, 34);

  const pColW = Math.floor(pusteW / 3);
  ctx.font = 'bold 15.5px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(
    fitTextToWidth(ctx, `१. बाजे: ${seller.grandfatherName || 'खुलाइएको छैन'}`, pColW - 14),
    kycLeft + 10,
    pusteY + 23
  );
  ctx.fillText(
    fitTextToWidth(ctx, `२. बाबु: ${seller.fatherName || seller.fatherOrHusbandName || 'खुलाइएको छैन'}`, pColW - 14),
    kycLeft + pColW + 6,
    pusteY + 23
  );
  ctx.fillText(
    fitTextToWidth(ctx, `३. पति/पत्नी: ${seller.spouseName || 'अविवाहित'}`, pColW - 14),
    kycLeft + pColW * 2 + 6,
    pusteY + 23
  );

  // Row 2: ID Info
  const idLabel =
    seller.idType === 'citizenship'
      ? 'नागरिकता नं.:'
      : seller.idType === 'national_id'
        ? 'राष्ट्रिय परिचयपत्र नं.:'
        : 'राहदानी / परिचयपत्र नं.:';
  ctx.font = 'bold 16.5px "Mukta", sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText(idLabel, kycLeft, kycBoxY + 99);
  ctx.font = 'bold 18px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(fitTextToWidth(ctx, toNepaliDigits(seller.idNumber), 330), kycLeft + 165, kycBoxY + 99);

  ctx.font = 'bold 16.5px "Mukta", sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('जारी जिल्ला/मिति:', col2X, kycBoxY + 99);
  ctx.font = 'bold 17px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(
    fitTextToWidth(ctx, `${seller.issuedDistrict || 'काठमाडौं'} | ${toNepaliDigits(seller.issuedDateBS || '')}`, kycMaxRight - (col2X + 135)),
    col2X + 135,
    kycBoxY + 99
  );

  // Row 3: Permanent Address
  ctx.font = 'bold 16.5px "Mukta", sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('स्थायी ठेगाना:', kycLeft, kycBoxY + 131);
  ctx.font = 'bold 17px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  const fullAddress = `${seller.province || ''}, ${seller.district || ''}, ${seller.municipality || ''}-${toNepaliDigits(seller.wardNo || '')}${seller.tole ? `, ${seller.tole}` : ''}`;
  ctx.fillText(fitTextToWidth(ctx, fullAddress, kycMaxRight - (kycLeft + 118)), kycLeft + 118, kycBoxY + 131);

  // Row 4: Current Address
  ctx.font = 'bold 16.5px "Mukta", sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('हालको ठेगाना:', kycLeft, kycBoxY + 163);
  ctx.font = '600 17px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(
    fitTextToWidth(ctx, seller.currentAddress || seller.district || 'स्थायी ठेगाना समान', kycMaxRight - (kycLeft + 118)),
    kycLeft + 118,
    kycBoxY + 163
  );

  currY = kycBoxY + kycBoxHeight + 10;

  // 6. Section 2: Precious Metal Items Table
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(contentLeft, currY, contentWidth, 30);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(contentLeft, currY, contentWidth, 30);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 18.5px "Mukta", sans-serif';
  ctx.fillText('२. खरिद गरिएको गहना तथा धातुको पूर्ण विवरण (मूल्याङ्कन तथा परीक्षण)', contentLeft + 10, currY + 22);

  currY += 30;

  // Strict Non-overlapping Table Columns (Total = 1124 px)
  const cols = [
    { line1: 'क्र.सं.', line2: '', x: contentLeft, w: 50, align: 'center' },
    { line1: 'विवरण', line2: '(गहना/धातु)', x: contentLeft + 50, w: 224, align: 'left' },
    { line1: 'क्यारेट /', line2: 'गुणस्तर', x: contentLeft + 274, w: 145, align: 'left' },
    { line1: 'जम्मा तौल', line2: '(ग्राम)', x: contentLeft + 419, w: 110, align: 'right' },
    { line1: 'कट्टा', line2: '(पत्थर/लाहा)', x: contentLeft + 529, w: 105, align: 'right' },
    { line1: 'खुद तौल', line2: '(ग्राम / तोला)', x: contentLeft + 634, w: 165, align: 'right' },
    { line1: 'जाँच विधि', line2: '(शुद्धता %)', x: contentLeft + 799, w: 105, align: 'center' },
    { line1: 'दर / तोला', line2: '(रु.)', x: contentLeft + 904, w: 110, align: 'right' },
    { line1: 'कुल रकम', line2: '(रु.)', x: contentLeft + 1014, w: 110, align: 'right' },
  ];

  // Table Header Row (46 px tall, 2 lines)
  const headerRowH = 46;
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(contentLeft, currY, contentWidth, headerRowH);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(contentLeft, currY, contentWidth, headerRowH);

  ctx.font = 'bold 15.5px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';

  cols.forEach((c, idx) => {
    if (idx > 0) {
      ctx.beginPath();
      ctx.moveTo(c.x, currY);
      ctx.lineTo(c.x, currY + headerRowH);
      ctx.stroke();
    }
    let drawX = c.x + 8;
    if (c.align === 'center') drawX = c.x + c.w / 2;
    if (c.align === 'right') drawX = c.x + c.w - 8;
    ctx.textAlign = c.align as CanvasTextAlign;
    if (c.line2) {
      ctx.fillText(c.line1, drawX, currY + 19);
      ctx.fillText(c.line2, drawX, currY + 39);
    } else {
      ctx.fillText(c.line1, drawX, currY + 29);
    }
  });
  ctx.textAlign = 'left';

  currY += headerRowH;
  const dataRowH = 52;

  items.forEach((item, idx) => {
    const totalDeductions =
      item.deductionMode === 'direct_grams' && item.manualDeductionGrams !== undefined
        ? item.manualDeductionGrams
        : (item.stoneWeightGrams || 0) + (item.waxDirtWeightGrams || 0) + (item.jartiWeightGrams || 0);

    ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(contentLeft, currY, contentWidth, dataRowH);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(contentLeft, currY, contentWidth, dataRowH);

    // Draw vertical column dividers
    cols.forEach((c, cIdx) => {
      if (cIdx > 0) {
        ctx.beginPath();
        ctx.moveTo(c.x, currY);
        ctx.lineTo(c.x, currY + dataRowH);
        ctx.stroke();
      }
    });

    ctx.fillStyle = '#000000';

    // 1. S.N.
    ctx.textAlign = 'center';
    ctx.font = 'bold 17px "Mukta", sans-serif';
    ctx.fillText(toNepaliDigits(idx + 1), cols[0].x + cols[0].w / 2, currY + 32);

    // 2. Item Name (wrap to 2 lines cleanly inside col width)
    ctx.textAlign = 'left';
    ctx.font = 'bold 16px "Mukta", sans-serif';
    const itemLines = wrapCanvasText(ctx, item.itemName || '', cols[1].w - 14);
    if (itemLines.length <= 1) {
      ctx.fillText(fitTextToWidth(ctx, item.itemName, cols[1].w - 14), cols[1].x + 7, currY + 31);
    } else {
      ctx.fillText(fitTextToWidth(ctx, itemLines[0], cols[1].w - 14), cols[1].x + 7, currY + 21);
      ctx.fillText(fitTextToWidth(ctx, itemLines.slice(1).join(' '), cols[1].w - 14), cols[1].x + 7, currY + 42);
    }

    // 3. Purity
    ctx.font = 'bold 15.5px "Mukta", sans-serif';
    const purityLines = wrapCanvasText(ctx, item.purityLabel || '', cols[2].w - 14);
    if (purityLines.length <= 1) {
      ctx.fillText(fitTextToWidth(ctx, item.purityLabel, cols[2].w - 14), cols[2].x + 7, currY + 31);
    } else {
      ctx.fillText(fitTextToWidth(ctx, purityLines[0], cols[2].w - 14), cols[2].x + 7, currY + 21);
      ctx.fillText(fitTextToWidth(ctx, purityLines.slice(1).join(' '), cols[2].w - 14), cols[2].x + 7, currY + 42);
    }

    // 4. Gross Weight
    ctx.textAlign = 'right';
    ctx.font = 'bold 16.5px "Mukta", sans-serif';
    ctx.fillText(`${toNepaliDigits(item.grossWeightGrams.toFixed(2))} g`, cols[3].x + cols[3].w - 8, currY + 31);

    // 5. Deduction
    ctx.fillStyle = '#991b1b';
    ctx.fillText(`-${toNepaliDigits(totalDeductions.toFixed(2))} g`, cols[4].x + cols[4].w - 8, currY + 31);

    // 6. Net Weight (2 clean lines)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16.5px "Mukta", sans-serif';
    ctx.fillText(`${toNepaliDigits(item.netWeightGrams.toFixed(2))} ग्राम`, cols[5].x + cols[5].w - 8, currY + 22);
    ctx.font = 'bold 14.5px "Mukta", sans-serif';
    ctx.fillText(`(${toNepaliDigits(item.netWeightTola)} तोला ${toNepaliDigits(item.netWeightLal)} लाल)`, cols[5].x + cols[5].w - 8, currY + 43);

    // 7. Testing Method (2 clean lines)
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px "Mukta", sans-serif';
    const testMethodText =
      item.testingMethod === 'touchstone_acid'
        ? 'कसी/एसिड'
        : item.testingMethod === 'electronic_densimeter'
          ? 'डेन्सिमिटर'
          : item.testingMethod === 'xrf_spectrometer'
            ? 'XRF मेशिन'
            : 'हलमार्क';
    ctx.fillText(testMethodText, cols[6].x + cols[6].w / 2, currY + 22);
    ctx.font = 'bold 14.5px "Mukta", sans-serif';
    ctx.fillText(`${toNepaliDigits(item.testedPurityPercentage)}%`, cols[6].x + cols[6].w / 2, currY + 43);

    // 8. Rate per tola
    ctx.textAlign = 'right';
    ctx.font = 'bold 16px "Mukta", sans-serif';
    ctx.fillText(fitTextToWidth(ctx, formatNPR(item.ratePerTola, true), cols[7].w - 10), cols[7].x + cols[7].w - 7, currY + 31);

    // 9. Total Value
    ctx.font = 'bold 16.5px "Mukta", sans-serif';
    ctx.fillText(fitTextToWidth(ctx, formatNPR(item.totalItemValue, true), cols[8].w - 10), cols[8].x + cols[8].w - 7, currY + 31);

    currY += dataRowH;
  });

  // Table Totals Row
  const totalsRowH = 40;
  ctx.fillStyle = '#ecfdf5';
  ctx.fillRect(contentLeft, currY, contentWidth, totalsRowH);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(contentLeft, currY, contentWidth, totalsRowH);

  ctx.textAlign = 'left';
  ctx.font = 'bold 17.5px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText('कुल जम्मा:', contentLeft + 12, currY + 26);

  ctx.font = 'bold 17px "Mukta", sans-serif';
  ctx.fillText(
    `जम्मा तौल: ${toNepaliDigits(transaction.totalGrossGrams.toFixed(2))} ग्राम   |   खुद तौल: ${toNepaliDigits(transaction.totalNetGrams.toFixed(2))} ग्राम (${toNepaliDigits(transaction.totalNetTola.toFixed(2))} तोला)`,
    contentLeft + 135,
    currY + 26
  );

  ctx.textAlign = 'right';
  ctx.font = 'bold 18.5px "Mukta", sans-serif';
  ctx.fillText(`अन्तिम भुक्तानी: ${formatNPR(transaction.grandTotalAmount, true)}`, contentRight - 10, currY + 26);
  currY += totalsRowH;

  // Amount in Words Bar
  const wordsRowH = 36;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(contentLeft, currY, contentWidth, wordsRowH);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(contentLeft, currY, contentWidth, wordsRowH);

  ctx.textAlign = 'left';
  ctx.font = 'bold 16.5px "Mukta", sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('अक्षरेपी रकम:', contentLeft + 12, currY + 24);
  ctx.font = 'bold 17.5px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  const wordsText = payment.amountInWordsNepali || `${payment.amountInWordsEnglish || ''} मात्र`;
  ctx.fillText(fitTextToWidth(ctx, wordsText, contentWidth - 135), contentLeft + 122, currY + 24);

  currY += wordsRowH + 12;

  // 7. Section 3: Statutory Declaration (३. सम्पत्ति प्राप्ति स्रोत तथा कानुनी कबुलियतनामा)
  const sourceNameMap: Record<string, string> = {
    ancestral_property: 'पैतृक / बाबुबाजेको सम्पत्ति',
    marriage_stridhan_dowry: 'विवाहको स्त्रीधन / दाइजो / पेवा',
    purchased_with_receipt: 'पहिले आफैंले खरिद गरेको (बिल संलग्न)',
    foreign_remittance: 'विदेशबाट ल्याएको वैध सुन',
    personal_income: 'व्यक्तिगत वैध आर्जनबाट खरिद',
  };
  const sourceText = sourceNameMap[declaration.source] || 'वैधानिक व्यक्तिगत आर्जनबाट खरिद';

  const fullAffidavit = `श्री ${seller.grandfatherName || '........'} को नाति/नातिनी, श्री ${seller.fatherName || seller.fatherOrHusbandName || '........'} को छोरा/छोरी, ${seller.spouseName ? `श्री ${seller.spouseName} को पति/पत्नी, ` : ''}जिल्ला ${seller.district || '........'}, ${seller.municipality || '........'} वडा नं. ${toNepaliDigits(seller.wardNo || '..')} बस्ने म बिक्रेता ${seller.fullNameNepali || '........'} ले माथि उल्लेखित सुन/चाँदीका गहना तथा धातु मेरो आफ्नै वैध हकभोग, पूर्ण स्वामित्व तथा वैधानिक स्रोतबाट आर्जित भएको व्यहोरा सत्य हो। यो धातु कुनै चोरी, डकैती, ठगी, तस्करी, वा कुनै गैरकानुनी कसूरबाट प्राप्त भएको होइन, न त कुनै बैंक, वित्तीय संस्था वा व्यक्तिमा धितो, बन्धक वा रोक्का राखिएको छ। मैले यो मालवस्तु आफ्नो राजीखुसीले आजका मितिमा प्रचलित बजार दर अनुसार यस पसललाई बिक्री गरी भुक्तानी बुझिलिएँ। यदि भविष्यमा यो मालवस्तु कुनै मुद्दा-मामिला, चोरी वा गैरकानुनी स्रोत प्रमाणित भएमा त्यसबाट उत्पन्न हुने सम्पूर्ण देवानी तथा फौजदारी दायित्व (मुलुकी अपराध संहिता २०७४ बमोजिम) ३ पुस्तासम्मको हकदाबी समेत म स्वयं बिक्रेताले बेहोर्नेछु। यस खरिद कार्यबाट पसल वा सञ्चालकलाई कुनै पनि प्रकारको क्षति वा कानुनी झमेला परेमा सोको शतप्रतिशत क्षतिपूर्ति म आफैंले बेहोर्नेछु भनी यो भरपाई सहिछाप गरिदिएँ।`;

  ctx.font = '600 17px "Mukta", sans-serif';
  const affidavitLines = wrapCanvasText(ctx, fullAffidavit, contentWidth - 28);
  const affLineHeight = 23;
  const affBoxH = 66 + affidavitLines.length * affLineHeight + 10;

  if (currY + 30 + affBoxH > maxPageBottomY) {
    pageState = createA4PageCanvas(loadedSeal);
    canvas = pageState.canvas;
    ctx = pageState.ctx;
    pages.push(canvas);
    currY = outerY + 24;
  }

  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(contentLeft, currY, contentWidth, 30);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(contentLeft, currY, contentWidth, 30);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 18.5px "Mukta", sans-serif';
  ctx.fillText('३. सम्पत्ति प्राप्ति स्रोत तथा कानुनी कबुलियतनामा (मुलुकी अपराध संहिता २०७४ दफा २४४)', contentLeft + 10, currY + 22);

  currY += 30;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(contentLeft, currY, contentWidth, affBoxH);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(contentLeft, currY, contentWidth, affBoxH);

  ctx.font = 'bold 17px "Mukta", sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('गहना/धातु प्राप्तिको स्रोत:', contentLeft + 14, currY + 25);
  ctx.font = 'bold 18px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(sourceText, contentLeft + 195, currY + 25);

  ctx.font = 'bold 17px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(
    'मुलुकी अपराध संहिता २०७४ दफा २४४ तथा सम्पत्ति शुद्धीकरण निवारण ऐन २०६४ बमोजिमको ३ पुस्ते कबुलियत:',
    contentLeft + 14,
    currY + 50
  );

  ctx.font = '600 17px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  let affLineY = currY + 76;
  for (let i = 0; i < affidavitLines.length; i++) {
    ctx.fillText(affidavitLines[i], contentLeft + 14, affLineY);
    affLineY += affLineHeight;
  }

  currY += affBoxH + 10;

  // 8. Section 4: Payment & AML Compliance
  const paySectionTotalH = 28 + 60 + (witness && witness.witness1Name ? 42 : 0);
  if (currY + paySectionTotalH > maxPageBottomY) {
    pageState = createA4PageCanvas(loadedSeal);
    canvas = pageState.canvas;
    ctx = pageState.ctx;
    pages.push(canvas);
    currY = outerY + 24;
  }

  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(contentLeft, currY, contentWidth, 28);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(contentLeft, currY, contentWidth, 28);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 18px "Mukta", sans-serif';
  ctx.fillText('४. भुक्तानी विवरण तथा सम्पत्ति शुद्धीकरण (AML) अनुपालन', contentLeft + 10, currY + 20);

  currY += 28;
  const payBoxH = 60;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(contentLeft, currY, contentWidth, payBoxH);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(contentLeft, currY, contentWidth, payBoxH);

  const payMethodText =
    payment.method === 'bank_transfer'
      ? 'बैंक ट्रान्सफर / RTGS'
      : payment.method === 'account_cheque'
        ? 'एकाउन्ट पेयी चेक'
        : payment.method === 'fonepay_ips'
          ? 'फोनपे / कनेक्ट IPS'
          : 'नगद भुक्तानी (रु. ५०,००० भित्र)';

  ctx.font = 'bold 16.5px "Mukta", sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('भुक्तानी माध्यम:', contentLeft + 14, currY + 24);
  ctx.font = 'bold 17.5px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(payMethodText, contentLeft + 142, currY + 24);

  ctx.font = 'bold 16.5px "Mukta", sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('बिक्रेताको PAN नं.:', contentLeft + 650, currY + 24);
  ctx.font = 'bold 17.5px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(toNepaliDigits(payment.sellerPAN || 'लागु नभएको'), contentLeft + 795, currY + 24);

  ctx.font = 'bold 16.5px "Mukta", sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('बैंक / चेक / भौचर नं.:', contentLeft + 14, currY + 50);
  ctx.font = 'bold 17px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  const bankInfo = `${payment.bankName ? `${payment.bankName} - ` : ''}${payment.transactionReference || payment.chequeNumber || 'नगद कारोबार'}`;
  ctx.fillText(fitTextToWidth(ctx, bankInfo, contentWidth - 200), contentLeft + 185, currY + 50);

  currY += payBoxH + 8;

  // Witness Strip (if present)
  if (witness && witness.witness1Name) {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(contentLeft, currY, contentWidth, 34);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(contentLeft, currY, contentWidth, 34);

    ctx.font = 'bold 16.5px "Mukta", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText(
      fitTextToWidth(
        ctx,
        `रोहवर साक्षी: ${witness.witness1Name}  |  ठेगाना: ${witness.witness1Address || 'काठमाडौं'}  |  नागरिकता/फोन: ${toNepaliDigits(witness.witness1IdNumber || '')} / ${toNepaliDigits(witness.witness1Phone || '')}  (रोहवर प्रमाणित)`,
        contentWidth - 24
      ),
      contentLeft + 12,
      currY + 23
    );
    currY += 42;
  }

  // 9. Section 5: Open Biometrics, Open Seller Info & Open Buyer Stamp/Signature (NO stamp table!)
  const sec5NeededH = 398;
  if (currY + sec5NeededH > maxPageBottomY) {
    pageState = createA4PageCanvas(loadedSeal);
    canvas = pageState.canvas;
    ctx = pageState.ctx;
    pages.push(canvas);
    currY = outerY + 24;
  }

  // Open section divider header (NO enclosed table box!)
  ctx.font = 'bold 18px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(
    `${witness && witness.witness1Name ? '६.' : '५.'} बिक्रेताको औंठाछाप, दस्तखत तथा खरिदकर्ताको आधिकारिक छाप र हस्ताक्षर`,
    contentLeft,
    currY + 18
  );
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(contentLeft, currY + 24);
  ctx.lineTo(contentRight, currY + 24);
  ctx.stroke();

  const sec5BodyY = currY + 32;

  // --- TOP LEFT: FINGERPRINTS (2.5cm x 3cm = 148 x 177 px at 150 DPI) ---
  const fpW = 148;
  const fpH = 177;
  const fpY = sec5BodyY;

  // Left Thumbprint Box
  const fpLeftX = contentLeft;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(fpLeftX, fpY, fpW, fpH);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(fpLeftX, fpY, fpW, fpH);

  if (loadedLeftThumb) {
    drawImageContained(ctx, loadedLeftThumb, fpLeftX + 4, fpY + 4, fpW - 8, fpH - 8);
  }
  ctx.textAlign = 'center';
  ctx.font = 'bold 15.5px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText('बायाँ ल्याप्चे', fpLeftX + fpW / 2, fpY + fpH + 20);

  // Right Thumbprint Box
  const fpRightX = contentLeft + fpW + 20;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(fpRightX, fpY, fpW, fpH);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(fpRightX, fpY, fpW, fpH);

  if (loadedRightThumb) {
    drawImageContained(ctx, loadedRightThumb, fpRightX + 4, fpY + 4, fpW - 8, fpH - 8);
  }
  ctx.textAlign = 'center';
  ctx.font = 'bold 15.5px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText('दायाँ ल्याप्चे', fpRightX + fpW / 2, fpY + fpH + 20);

  // --- HORIZONTAL SIGNATURE LINE ROW (Under Fingerprints on Left, Aligned on Right) ---
  const sellerInfoX = contentLeft;
  const sellerInfoMaxW = 520;
  const buyerX = contentLeft + 580;
  const buyerMaxW = contentRight - buyerX;

  const sigAreaTopY = fpY + fpH + 28;
  if (loadedSignature) {
    drawImageContained(ctx, loadedSignature, sellerInfoX, sigAreaTopY, 190, 36);
  }

  const sigLineY = sigAreaTopY + 38;
  ctx.textAlign = 'left';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;

  // Seller Horizontal Signature Line
  ctx.beginPath();
  ctx.moveTo(sellerInfoX, sigLineY);
  ctx.lineTo(sellerInfoX + 280, sigLineY);
  ctx.stroke();

  // Buyer Horizontal Signature Line (aligned on same baseline)
  ctx.beginPath();
  ctx.moveTo(buyerX, sigLineY);
  ctx.lineTo(buyerX + Math.min(300, buyerMaxW), sigLineY);
  ctx.stroke();

  ctx.font = 'bold 17px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText('बिक्रेताको दस्तखत', sellerInfoX, sigLineY + 22);
  ctx.fillText('सञ्चालक / अधिकृत हस्ताक्षर र पसलको छाप', buyerX, sigLineY + 22);

  // Open Seller Details directly under Seller Signature
  let infoY = sigLineY + 46;
  ctx.font = 'bold 16px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(
    fitTextToWidth(ctx, `नाम: ${seller.fullNameNepali}`, sellerInfoMaxW),
    sellerInfoX,
    infoY
  );

  infoY += 22;
  ctx.fillText(
    fitTextToWidth(ctx, `परिचयपत्र नं.: ${toNepaliDigits(seller.idNumber)}`, sellerInfoMaxW),
    sellerInfoX,
    infoY
  );

  infoY += 22;
  const sellerAddrText = `ठेगाना: ${seller.district}, ${seller.municipality}-${toNepaliDigits(seller.wardNo)}`;
  ctx.fillText(fitTextToWidth(ctx, sellerAddrText, sellerInfoMaxW), sellerInfoX, infoY);

  infoY += 22;
  ctx.fillText(
    fitTextToWidth(ctx, `सम्पर्क नं.: ${toNepaliDigits(seller.mobileNumber)}`, sellerInfoMaxW),
    sellerInfoX,
    infoY
  );

  // Open Shop Details directly under Buyer Signature
  let bInfoY = sigLineY + 46;
  ctx.font = 'bold 16px "Mukta", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(
    fitTextToWidth(ctx, `पसल: ${shop.nameNepali}`, buyerMaxW),
    buyerX,
    bInfoY
  );

  bInfoY += 22;
  ctx.fillText(
    fitTextToWidth(ctx, `सञ्चालक: ${shop.proprietorName || 'सञ्चालक'}`, buyerMaxW),
    buyerX,
    bInfoY
  );

  bInfoY += 22;
  ctx.fillText(
    fitTextToWidth(ctx, `PAN नं.: ${toNepaliDigits(shop.panVatNumber)}`, buyerMaxW),
    buyerX,
    bInfoY
  );

  // ==================== NEXT PAGE: ATTACHED ID PHOTOS ====================
  if (loadedIdFront || loadedIdBack || seller.idCardFrontUrl || seller.idCardBackUrl || loadedSellerPhoto || seller.sellerPhotoUrl) {
    const idPage = createA4PageCanvas(loadedSeal);
    const idCanvas = idPage.canvas;
    const idCtx = idPage.ctx;
    pages.push(idCanvas);

    // Page 2 Header
    idCtx.font = 'bold 16px "Mukta", sans-serif';
    idCtx.fillStyle = '#000000';
    idCtx.textAlign = 'left';
    idCtx.fillText(
      `सम्झौता सिरीयल नं.: ${transaction.contractSerialNumber || `SN-${transaction.voucherNumber}`}  |  भरपाई नं.: #${transaction.voucherNumber}`,
      idPage.contentLeft,
      idPage.outerY + 28
    );
    idCtx.textAlign = 'right';
    idCtx.fillText(`मिति: ${toNepaliDigits(transaction.dateBS)} (वि.सं.)`, idPage.contentRight, idPage.outerY + 28);

    idCtx.textAlign = 'center';
    idCtx.font = 'bold 28px "Mukta", serif';
    idCtx.fillText(
      fitTextToWidth(idCtx, shop.nameNepali || 'श्री अन्नपूर्ण सुनचाँदी गहना मन्दिर प्रा.लि.', idPage.contentWidth - 20),
      idCanvas.width / 2,
      idPage.outerY + 66
    );

    const bannerY = idPage.outerY + 84;
    idCtx.fillStyle = '#000000';
    idCtx.fillRect(idPage.contentLeft, bannerY, idPage.contentWidth, 40);
    idCtx.fillStyle = '#ffffff';
    idCtx.font = 'bold 21px "Mukta", sans-serif';
    idCtx.fillText('संलग्न परिचयपत्र तथा प्रमाणित तस्बिर प्रतिलिपि (अभिलेख पृष्ठ)', idCanvas.width / 2, bannerY + 28);
    idCtx.textAlign = 'left';

    // Seller Identification Summary Bar on Page 2
    const summaryY = bannerY + 54;
    idCtx.fillStyle = '#f8fafc';
    idCtx.fillRect(idPage.contentLeft, summaryY, idPage.contentWidth, 44);
    idCtx.strokeStyle = '#000000';
    idCtx.lineWidth = 1.2;
    idCtx.strokeRect(idPage.contentLeft, summaryY, idPage.contentWidth, 44);

    idCtx.fillStyle = '#000000';
    idCtx.font = 'bold 18px "Mukta", sans-serif';
    idCtx.fillText(
      fitTextToWidth(
        idCtx,
        `बिक्रेता: ${seller.fullNameNepali}   |   परिचयपत्र नं.: ${toNepaliDigits(seller.idNumber)}   |   सम्पर्क: ${toNepaliDigits(seller.mobileNumber)}`,
        idPage.contentWidth - 24
      ),
      idPage.contentLeft + 12,
      summaryY + 29
    );

    // ID Front & Back Cards (Large & Crisp for A4 printing)
    const idCardAreaY = summaryY + 62;
    const idCardH = 560;
    const idCardW = idPage.contentWidth;

    // 1. ID Front Frame
    idCtx.fillStyle = '#ffffff';
    idCtx.fillRect(idPage.contentLeft, idCardAreaY, idCardW, idCardH);
    idCtx.strokeStyle = '#000000';
    idCtx.lineWidth = 1.8;
    idCtx.strokeRect(idPage.contentLeft, idCardAreaY, idCardW, idCardH);

    idCtx.fillStyle = '#e5e7eb';
    idCtx.fillRect(idPage.contentLeft, idCardAreaY, idCardW, 36);
    idCtx.strokeRect(idPage.contentLeft, idCardAreaY, idCardW, 36);
    idCtx.fillStyle = '#000000';
    idCtx.font = 'bold 18.5px "Mukta", sans-serif';
    idCtx.fillText('१. परिचयपत्र / नागरिकता प्रमाणपत्रको अगाडिको भाग (ID Card Front)', idPage.contentLeft + 14, idCardAreaY + 25);

    if (loadedIdFront) {
      drawImageContained(idCtx, loadedIdFront, idPage.contentLeft + 24, idCardAreaY + 50, idCardW - 48, idCardH - 68);
    } else if (loadedSellerPhoto && !loadedIdBack) {
      drawImageContained(idCtx, loadedSellerPhoto, idPage.contentLeft + 24, idCardAreaY + 50, idCardW - 48, idCardH - 68);
    } else {
      idCtx.textAlign = 'center';
      idCtx.fillStyle = '#111827';
      idCtx.font = 'bold 19px "Mukta", sans-serif';
      idCtx.fillText('परिचयपत्र अगाडिको भाग संलग्न गरिएको छैन (वा सक्कल प्रतिलिपि यहाँ टाँस्नुहोस्)', idCanvas.width / 2, idCardAreaY + idCardH / 2 + 12);
      idCtx.textAlign = 'left';
    }

    // 2. ID Back Frame
    const idBackY = idCardAreaY + idCardH + 26;
    idCtx.fillStyle = '#ffffff';
    idCtx.fillRect(idPage.contentLeft, idBackY, idCardW, idCardH);
    idCtx.strokeStyle = '#000000';
    idCtx.lineWidth = 1.8;
    idCtx.strokeRect(idPage.contentLeft, idBackY, idCardW, idCardH);

    idCtx.fillStyle = '#e5e7eb';
    idCtx.fillRect(idPage.contentLeft, idBackY, idCardW, 36);
    idCtx.strokeRect(idPage.contentLeft, idBackY, idCardW, 36);
    idCtx.fillStyle = '#000000';
    idCtx.font = 'bold 18.5px "Mukta", sans-serif';
    idCtx.fillText('२. परिचयपत्र / नागरिकता प्रमाणपत्रको पछाडिको भाग (ID Card Back)', idPage.contentLeft + 14, idBackY + 25);

    if (loadedIdBack) {
      drawImageContained(idCtx, loadedIdBack, idPage.contentLeft + 24, idBackY + 50, idCardW - 48, idCardH - 68);
    } else {
      idCtx.textAlign = 'center';
      idCtx.fillStyle = '#111827';
      idCtx.font = 'bold 19px "Mukta", sans-serif';
      idCtx.fillText('परिचयपत्र पछाडिको भाग संलग्न गरिएको छैन (वा सक्कल प्रतिलिपि यहाँ टाँस्नुहोस्)', idCanvas.width / 2, idBackY + idCardH / 2 + 12);
      idCtx.textAlign = 'left';
    }

    // Verification note above footer
    const signNoteY = idBackY + idCardH + 42;
    idCtx.font = 'bold 17px "Mukta", sans-serif';
    idCtx.fillStyle = '#000000';
    idCtx.fillText('बिक्रेताको दस्तखत: ____________________________', idPage.contentLeft, signNoteY);
    idCtx.textAlign = 'right';
    idCtx.fillText('सक्कल बमोजिम नक्कल ठीक छ (सञ्चालक): ____________________________', idPage.contentRight, signNoteY);
    idCtx.textAlign = 'left';
  }

  // Draw page numbers and verification footer on every page
  const totalPages = pages.length;
  pages.forEach((pCanvas, idx) => {
    const pCtx = pCanvas.getContext('2d');
    if (pCtx) {
      drawPageFooter(
        pCtx,
        pCanvas,
        40,
        58,
        pCanvas.width - 58,
        transaction,
        idx + 1,
        totalPages
      );
    }
  });

  return pages;
}

/**
 * Single-canvas backwards-compatible export (returns Page 1).
 */
export async function renderNepaliLegalDeedToCanvas(
  transaction: PurchaseTransaction
): Promise<HTMLCanvasElement> {
  const pages = await renderNepaliLegalDeedPagesToCanvases(transaction);
  return pages[0];
}
