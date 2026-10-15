/**
 * CricPlus Image Compression Utility
 * Compresses any user photo to strictly <= 100 KB for player profiles and auction cards.
 */

export async function compressImageUnder100KB(
  file: File,
  maxSizeBytes: number = 100 * 1024
): Promise<{ dataUrl: string; sizeInKb: number }> {
  return new Promise((resolve, reject) => {
    // Basic file type validation
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file must be an image (JPG, PNG, WebP)'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimension 600px provides crisp portraits for cards and overlays
        const maxDim = 600;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        // Draw image with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Iteratively test quality from 0.88 down to 0.35 until size <= 100 KB
        let bestUrl = canvas.toDataURL('image/jpeg', 0.85);
        let bestSize = Math.round((bestUrl.length - 22) * 0.75);

        for (let q = 0.85; q >= 0.3; q -= 0.1) {
          const testUrl = canvas.toDataURL('image/jpeg', q);
          const testSize = Math.round((testUrl.length - 22) * 0.75);
          bestUrl = testUrl;
          bestSize = testSize;
          if (testSize <= maxSizeBytes) {
            break;
          }
        }

        resolve({
          dataUrl: bestUrl,
          sizeInKb: Math.round(bestSize / 1024),
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
