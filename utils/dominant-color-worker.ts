// --- Configuration ---
const PIXEL_STEP = 20; // Sample every Nth pixel
const SATURATION_FRACTION = 0.1; // Ignore least saturated half


self.onmessage = async (event) => {
  const { id, imageUrl } = event.data;


  try {
    const response = await fetch(imageUrl, { mode: 'cors' });
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(bitmap, 0, 0);

    const data = ctx?.getImageData(0, 0, bitmap.width, bitmap.height)?.data;
    // Sample pixels and compute their saturation
    const pixels = [];
    const step = PIXEL_STEP;
    function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return [h, s, l];
    }
    if (!data) {
      self.postMessage({ success: false, error: 'Failed to get image data' });
      return;
    }
    for (let i = 0; i < data.length; i += 4 * step) {
      const pr = data[i], pg = data[i+1], pb = data[i+2];
      const [, s] = rgbToHsl(pr, pg, pb);
      pixels.push({ r: pr, g: pg, b: pb, s });
    }
    // Sort pixels by saturation, keep the most saturated half
    pixels.sort((a, b) => b.s - a.s);
    const keep = Math.max(1, Math.floor(pixels.length * SATURATION_FRACTION));
    const vibrantPixels = pixels.slice(0, keep);
    let r = 0, g = 0, b = 0;
    for (const px of vibrantPixels) {
      r += px.r;
      g += px.g;
      b += px.b;
    }
    const count = vibrantPixels.length;
    if (count > 0) {
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
    } else {
      // fallback: average all pixels
      r = g = b = 0;
      for (const px of pixels) {
        r += px.r;
        g += px.g;
        b += px.b;
      }
      r = Math.round(r / pixels.length);
      g = Math.round(g / pixels.length);
      b = Math.round(b / pixels.length);
    }
    const resultColor: [number, number, number] = [r, g, b];
    self.postMessage({ success: true, color: resultColor, id });
  } catch (error) {
    self.postMessage({ success: false, error: error?.toString() || error });
  }
};
