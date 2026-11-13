export interface ExtractedIdData {
  detectedDocType?: 'citizenship' | 'national_id' | 'passport' | 'voter_id' | 'driving_license' | 'other';
  fullNameNepali?: string;
  fullNameEnglish?: string;
  grandfatherName?: string;
  fatherName?: string;
  spouseName?: string;
  fatherOrHusbandName?: string;
  idType?: 'citizenship' | 'national_id' | 'passport' | 'voter_id';
  idNumber?: string;
  issuedDistrict?: string;
  issuedDateBS?: string;
  province?: string;
  district?: string;
  municipality?: string;
  wardNo?: string;
  tole?: string;
  currentAddress?: string;
}

export interface ExtractKycOptions {
  frontImage?: string;
  backImage?: string;
}

/**
 * Extracts KYC identity information from any recognized Nepalese identity document:
 * Accepts front image, back image, or both simultaneously to correlate details
 * (such as address and issue date on the back of Citizenship/National ID cards).
 */
export async function extractKycFromIdImage(
  imageOrOptions: string | ExtractKycOptions,
  optionalBackImage?: string
): Promise<ExtractedIdData | null> {
  let frontImage: string | undefined;
  let backImage: string | undefined;

  if (typeof imageOrOptions === 'string') {
    frontImage = imageOrOptions;
    backImage = optionalBackImage;
  } else {
    frontImage = imageOrOptions.frontImage;
    backImage = imageOrOptions.backImage;
  }

  try {
    const response = await fetch('/api/ocr-id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frontImage,
        backImage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend OCR request failed:', response.status, errorData);
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }

    const data: ExtractedIdData = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to extract KYC from ID document:', error);
    throw error;
  }
}
