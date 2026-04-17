/**
 * Utilitaires pour l'optimisation des images sur Sɔrɔ
 */

/**
 * Génère un placeholder SVG flou (shimmer) pour next/image blurDataURL.
 * Utilisé pour un chargement progressif élégant (WOW effect).
 */
export const getShimmerBlur = (w: number, h: number) => {
  const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f2f2f2" offset="20%" />
      <stop stop-color="#e2e2e2" offset="50%" />
      <stop stop-color="#f2f2f2" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f6f7f8" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

  const toBase64 = (str: string) =>
    typeof window === 'undefined'
      ? Buffer.from(str).toString('base64')
      : window.btoa(str);

  return `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`;
};

/**
 * Blur data URL universel et élégant pour Sɔrô (couleur primaire douce)
 */
export const SORO_BLUR_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
