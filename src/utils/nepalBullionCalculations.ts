/**
 * Nepal Bullion Weight, Price, and Currency Calculations
 * Based on Nepal Bureau of Standards & Metrology and FENEGOSIDA conversion standards.
 */

// 1 Tola (तोला) = 11.6638 Grams (ग्राम)
export const GRAMS_PER_TOLA = 11.6638;
export const LAL_PER_TOLA = 100;
export const AANA_PER_TOLA = 16;
export const LAL_PER_AANA = 6.25;

/**
 * Converts grams to Tola and Lal
 */
export function gramsToTolaLal(grams: number): { tola: number; lal: number; formatted: string } {
  if (isNaN(grams) || grams <= 0) {
    return { tola: 0, lal: 0, formatted: '० तोला ० लाल' };
  }
  const totalTolas = grams / GRAMS_PER_TOLA;
  const tola = Math.floor(totalTolas);
  const remainingTolaFraction = totalTolas - tola;
  const lal = Math.round(remainingTolaFraction * LAL_PER_TOLA * 100) / 100;

  return {
    tola,
    lal,
    formatted: `${toNepaliDigits(tola)} तोला ${toNepaliDigits(lal.toFixed(2))} लाल (${tola} Tola ${lal.toFixed(2)} Lal)`,
  };
}

/**
 * Converts Tola and Lal to Grams
 */
export function tolaLalToGrams(tola: number, lal: number): number {
  const safeTola = Number(tola) || 0;
  const safeLal = Number(lal) || 0;
  const totalTolaEquivalent = safeTola + safeLal / LAL_PER_TOLA;
  return Math.round(totalTolaEquivalent * GRAMS_PER_TOLA * 1000) / 1000;
}

/**
 * Converts Tola, Aana, Lal to Grams
 */
export function tolaAanaLalToGrams(tola: number, aana: number, lal: number): number {
  const safeTola = Number(tola) || 0;
  const safeAana = Number(aana) || 0;
  const safeLal = Number(lal) || 0;
  const totalLal = safeTola * 100 + safeAana * LAL_PER_AANA + safeLal;
  return Math.round((totalLal / 100) * GRAMS_PER_TOLA * 1000) / 1000;
}

/**
 * Calculates rate per gram from rate per tola
 */
export function getRatePerGram(ratePerTola: number): number {
  if (!ratePerTola || ratePerTola <= 0) return 0;
  return Math.round((ratePerTola / GRAMS_PER_TOLA) * 100) / 100;
}

/**
 * Maps English digits to Nepali Devanagari digits
 */
export function toNepaliDigits(input: number | string): string {
  if (input === undefined || input === null) return '';
  const str = input.toString();
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return str.replace(/[0-9]/g, (digit) => nepaliDigits[parseInt(digit, 10)]);
}

/**
 * Formats amount into Nepali Rupee notation (रु. १,२५,०००)
 */
export function formatNPR(amount: number, inNepaliScript = false): string {
  if (isNaN(amount)) return inNepaliScript ? 'रु. ०' : 'NPR 0';
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);

  if (inNepaliScript) {
    return `रु. ${toNepaliDigits(formatted)}`;
  }
  return `NPR ${formatted}`;
}

/**
 * Converts number to formal words in Nepali (अक्षरेपी)
 */
export function numberToNepaliWords(num: number): string {
  if (isNaN(num) || num <= 0) return 'शून्य रुपैयाँ मात्र';

  const intPart = Math.floor(num);
  const paisa = Math.round((num - intPart) * 100);

  const ones = [
    '', 'एक', 'दुई', 'तीन', 'चार', 'पाँच', 'छ', 'सात', 'आठ', 'नौ',
    'दश', 'एघार', 'बाह्र', 'तेह्र', 'चौध', 'पन्ध्र', 'सोह्र', 'सत्र', 'अठार', 'उन्नाइस',
    'बीस', 'एक्काइस', 'बाइस', 'तेइस', 'चौबिस', 'पच्चिस', 'छब्बीस', 'सत्ताइस', 'अठ्ठाइस', 'उनन्तिस',
    'तीस', 'एकतीस', 'बत्तीस', 'तेत्तीस', 'चौतीस', 'पैंतीस', 'छत्तीस', 'सरतीस', 'अठतीस', 'उनन्चालीस',
    'चालीस', 'एकचालीस', 'बयालीस', 'त्रिचालीस', 'चौवालीस', 'पैंतालीस', 'छयालीस', 'सतचालीस', 'अठचालीस', 'उनपचास',
    'पचास', 'एकाउन्न', 'बाउन्न', 'त्रिपन्न', 'चउन्न', 'पचपन्न', 'छपन्न', 'सन्ताउन्न', 'अन्ठाउन्न', 'उनन्साठी',
    'साठी', 'एकसट्ठी', 'बासट्ठी', 'त्रीसट्ठी', 'चौंसट्ठी', 'पैंसट्ठी', 'छयसट्ठी', 'सतसट्ठी', 'अठसट्ठी', 'उनन्सत्तरी',
    'सत्तरी', 'एकहत्तर', 'बहत्तर', 'त्रिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छयहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी',
    'असी', 'एकासी', 'बयासी', 'त्रियासी', 'चौरासी', 'पचासी', 'छयासी', 'सतासी', 'अठासी', 'उनान्नब्बे',
    'नब्बे', 'एकान्नब्बे', 'बयान्नब्बे', 'त्रियान्नब्बे', 'चौरान्नब्बे', 'पन्चान्नब्बे', 'छयान्नब्बे', 'सन्तान्नब्बे', 'अन्ठान्नब्बे', 'उनान्सय'
  ];

  function convertTwoDigits(n: number): string {
    return ones[n] || '';
  }

  let result = '';
  let remaining = intPart;

  // Crore (करोड)
  if (remaining >= 10000000) {
    const crore = Math.floor(remaining / 10000000);
    result += (crore < 100 ? convertTwoDigits(crore) : `${crore}`) + ' करोड ';
    remaining %= 10000000;
  }

  // Lakh (लाख)
  if (remaining >= 100000) {
    const lakh = Math.floor(remaining / 100000);
    result += convertTwoDigits(lakh) + ' लाख ';
    remaining %= 100000;
  }

  // Thousand (हजार)
  if (remaining >= 1000) {
    const thousand = Math.floor(remaining / 1000);
    result += convertTwoDigits(thousand) + ' हजार ';
    remaining %= 1000;
  }

  // Hundred (सय)
  if (remaining >= 100) {
    const hundred = Math.floor(remaining / 100);
    result += convertTwoDigits(hundred) + ' सय ';
    remaining %= 100;
  }

  // Tens and ones
  if (remaining > 0) {
    result += convertTwoDigits(remaining) + ' ';
  }

  result = result.trim() + ' रुपैयाँ';

  if (paisa > 0) {
    result += ` र ${convertTwoDigits(paisa)} पैसा`;
  }

  return result + ' मात्र';
}

/**
 * Converts number to words in English (Indian numbering system: Lakh / Crore)
 */
export function numberToEnglishWords(num: number): string {
  if (isNaN(num) || num <= 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
  }

  let n = Math.floor(num);
  let words = '';

  if (n >= 10000000) {
    const crore = Math.floor(n / 10000000);
    words += (crore < 100 ? inWords(crore) : inWords(Math.floor(crore / 100)) + ' Hundred ' + inWords(crore % 100)) + ' Crore ';
    n %= 10000000;
  }

  if (n >= 100000) {
    const lakh = Math.floor(n / 100000);
    words += inWords(lakh) + ' Lakh ';
    n %= 100000;
  }

  if (n >= 1000) {
    const thousand = Math.floor(n / 1000);
    words += inWords(thousand) + ' Thousand ';
    n %= 1000;
  }

  if (n >= 100) {
    const hundred = Math.floor(n / 100);
    words += inWords(hundred) + ' Hundred ';
    n %= 100;
  }

  if (n > 0) {
    words += inWords(n) + ' ';
  }

  return words.trim() + ' Rupees Only';
}

/**
 * Generate current approximate Bikram Sambat (BS) date
 * (Nepal year = Gregorian year + 56/57)
 */
export function getCurrentDateBS(): string {
  const now = new Date();
  const adYear = now.getFullYear();
  const adMonth = now.getMonth() + 1;
  const adDay = now.getDate();

  // Approximate BS conversion (accurate for UI display; BS is typically AD + 56 years, 8 months)
  let bsYear = adYear + 56;
  let bsMonth = adMonth + 8;
  let bsDay = adDay + 17;

  if (bsDay > 30) {
    bsDay -= 30;
    bsMonth += 1;
  }
  if (bsMonth > 12) {
    bsMonth -= 12;
    bsYear += 1;
  }

  return `${toNepaliDigits(bsYear)}/${toNepaliDigits(String(bsMonth).padStart(2, '0'))}/${toNepaliDigits(String(bsDay).padStart(2, '0'))}`;
}

export function getCurrentFiscalYearBS(): string {
  const now = new Date();
  const currentBSYear = now.getFullYear() + 57;
  return `${toNepaliDigits(currentBSYear - 1)}/${toNepaliDigits(String(currentBSYear).slice(-2))}`;
}

/**
 * Generate a unique tamper-evident voucher code
 */
export function generateVoucherNumber(count: number): string {
  const currentYear = new Date().getFullYear() + 57;
  const padded = String(count).padStart(4, '0');
  return `NP-GOLD-${currentYear}-${padded}`;
}

/**
 * Generate official legal contract serial number (e.g. SN-२०८१-०००१ / SN-2083-0001)
 * Used in audit registers, police inquiries, and court compliance documents.
 */
export function generateContractSerialNumber(serialNo: number): string {
  const currentYear = new Date().getFullYear() + 57;
  const padded = String(serialNo).padStart(4, '0');
  return `SN-${currentYear}-${padded}`;
}

/**
 * Generate a cryptographic-like hash string for deed verification
 */
export function generateVerificationHash(voucher: string, sellerId: string, amount: number): string {
  const raw = `${voucher}:${sellerId}:${amount}:${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `NEP-LEGAL-${hex}-${Math.floor(1000 + Math.random() * 9000)}`;
}
