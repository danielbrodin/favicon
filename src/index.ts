type FaviconSize = 16 | 32;

type FilterFn = (canvas: HTMLCanvasElement) => HTMLCanvasElement;

interface Settings {
  target?: HTMLLinkElement;
  size?: FaviconSize;
  showNotification?: boolean;
  notificationColor?: string;
  filters?: FilterFn[];
}

function findFavicon(): HTMLLinkElement | null {
  return document.querySelector<HTMLLinkElement>('[rel="icon"]');
}

export function favicon(settings: Settings): void {
  const el = settings.target ?? findFavicon();
  const size: number =
    settings.size ?? Number(el?.getAttribute('sizes')?.substr(0, 2)) ?? 16;
  const imgSrc = el?.getAttribute('href');

  if (!el || !imgSrc) {
    return;
  }

  const img: HTMLImageElement = document.createElement('img');
  let canvas: HTMLCanvasElement = document.createElement('canvas');
  const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;

  img.onload = () => {
    ctx!.drawImage(img, 0, 0);
    const { filters = [] } = settings;
    filters.forEach(filter => (canvas = filter(canvas)));
    if (settings.showNotification) {
      applyNotification(canvas, settings.notificationColor);
    }
    el.href = canvas.toDataURL();
  };

  img.src = imgSrc;
}

function applyNotification(
  canvas: HTMLCanvasElement,
  color: string = 'red'
): HTMLCanvasElement {
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
  const radius: number = canvas.width / 5;
  const x: number = canvas.width - radius;
  const y: number = radius;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  ctx.fillStyle = color;
  ctx.fill();

  return canvas;
}

export function grayscaleFilter(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const origDataSrc: ImageData = ctx.getImageData(0, 0, width, height);
  const newDataSrc: ImageData = ctx.createImageData(width, height);
  const origData: Uint8ClampedArray = origDataSrc.data;
  const data: Uint8ClampedArray = newDataSrc.data;
  const length: number = origData.length;
  let i: number = 0;

  for (; i < length; i += 4) {
    const [r, g, b, alpha] = [
      origData[i],
      origData[i + 1],
      origData[i + 2],
      origData[i + 3],
    ];
    const luma: number = r * 0.2126 + g * 0.7152 + b * 0.0722;
    data[i] = data[i + 1] = data[i + 2] = luma;
    data[i + 3] = alpha;
  }

  ctx.putImageData(newDataSrc, 0, 0);

  return canvas;
}
