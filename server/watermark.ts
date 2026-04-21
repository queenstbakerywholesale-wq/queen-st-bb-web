/**
 * Watermark utility — adds a subtle "QUEEN ST BB" brand watermark
 * Uses sharp for server-side image compositing with SVG text overlay.
 * The watermark is semi-transparent, positioned bottom-right, and
 * sized proportionally to the image dimensions.
 */
import sharp from "sharp";

interface WatermarkOptions {
  text?: string;
  opacity?: number; // 0.0–1.0, default 0.15
  fontSize?: number; // auto-calculated if not provided
  position?: "bottom-right" | "bottom-left" | "bottom-center" | "center";
}

/**
 * Apply a brand watermark to an image buffer.
 * Returns a new buffer with the watermark composited.
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  const {
    text = "QUEEN ST BB",
    opacity = 0.15,
    position = "bottom-right",
  } = options;

  // Get image metadata to calculate proportional sizing
  const metadata = await sharp(imageBuffer).metadata();
  const imgWidth = metadata.width || 800;
  const imgHeight = metadata.height || 600;

  // Auto-calculate font size: ~3% of image width, min 14px, max 48px
  const autoFontSize = Math.max(14, Math.min(48, Math.round(imgWidth * 0.03)));
  const fontSize = options.fontSize || autoFontSize;

  // Letter spacing for luxury feel
  const letterSpacing = fontSize * 0.25;
  const textWidth = text.length * (fontSize * 0.6 + letterSpacing);
  const svgWidth = Math.round(textWidth + fontSize * 2);
  const svgHeight = Math.round(fontSize * 2.5);

  // Position calculations
  let x: number, y: number;
  const padding = Math.round(imgWidth * 0.03);

  switch (position) {
    case "bottom-left":
      x = padding;
      y = imgHeight - svgHeight - padding;
      break;
    case "bottom-center":
      x = Math.round((imgWidth - svgWidth) / 2);
      y = imgHeight - svgHeight - padding;
      break;
    case "center":
      x = Math.round((imgWidth - svgWidth) / 2);
      y = Math.round((imgHeight - svgHeight) / 2);
      break;
    case "bottom-right":
    default:
      x = imgWidth - svgWidth - padding;
      y = imgHeight - svgHeight - padding;
      break;
  }

  // Ensure position is not negative
  x = Math.max(0, x);
  y = Math.max(0, y);

  // Clamp SVG dimensions to fit within the image
  const finalSvgWidth = Math.min(svgWidth, imgWidth);
  const finalSvgHeight = Math.min(svgHeight, imgHeight);

  // Recalculate position with clamped dimensions
  if (x + finalSvgWidth > imgWidth) x = Math.max(0, imgWidth - finalSvgWidth);
  if (y + finalSvgHeight > imgHeight) y = Math.max(0, imgHeight - finalSvgHeight);

  // Skip watermark if image is too small for meaningful text
  if (finalSvgWidth < 20 || finalSvgHeight < 10) {
    return imageBuffer;
  }

  // Create SVG watermark text
  // Using a clean sans-serif for the watermark (matches brand identity)
  const svgText = `
    <svg width="${finalSvgWidth}" height="${finalSvgHeight}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="50%"
        y="55%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif"
        font-weight="400"
        font-size="${fontSize}px"
        letter-spacing="${letterSpacing}px"
        fill="rgba(255, 255, 255, ${opacity})"
      >${text}</text>
    </svg>
  `.trim();

  const svgBuffer = Buffer.from(svgText);

  // Composite watermark onto the image
  const result = await sharp(imageBuffer)
    .composite([
      {
        input: svgBuffer,
        top: y,
        left: x,
      },
    ])
    .toBuffer();

  return result;
}
