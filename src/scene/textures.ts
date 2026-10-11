import * as THREE from 'three';

// Cache generated textures
const textureCache = new Map<string, THREE.Texture>();

/**
 * Creates high-quality procedural plaster texture (stucco)
 */
export function getPlasterTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const cacheKey = 'plaster_v2';
  if (textureCache.has(`${cacheKey}_map`) && textureCache.has(`${cacheKey}_bump`)) {
    return {
      map: textureCache.get(`${cacheKey}_map`) as THREE.CanvasTexture,
      bumpMap: textureCache.get(`${cacheKey}_bump`) as THREE.CanvasTexture,
    };
  }

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm off-white stucco with soft cream undertone
  ctx.fillStyle = '#f8f5ee';
  ctx.fillRect(0, 0, size, size);

  // Subtle tonal noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise - 1));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise - 4));
  }
  ctx.putImageData(imgData, 0, 0);

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);

  // Fine bump
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 256;
  bumpCanvas.height = 256;
  const bumpCtx = bumpCanvas.getContext('2d')!;
  bumpCtx.fillStyle = '#808080';
  bumpCtx.fillRect(0, 0, 256, 256);
  const bData = bumpCtx.getImageData(0, 0, 256, 256);
  for (let i = 0; i < bData.data.length; i += 4) {
    const val = 128 + (Math.random() - 0.5) * 28;
    bData.data[i] = val;
    bData.data[i + 1] = val;
    bData.data[i + 2] = val;
  }
  bumpCtx.putImageData(bData, 0, 0);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(4, 4);

  textureCache.set(`${cacheKey}_map`, map);
  textureCache.set(`${cacheKey}_bump`, bumpMap);

  return { map, bumpMap };
}

/**
 * Creates warm ashlar stonework texture with crisp mortar
 */
export function getStoneTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const cacheKey = 'stone_v2';
  if (textureCache.has(`${cacheKey}_map`) && textureCache.has(`${cacheKey}_bump`)) {
    return {
      map: textureCache.get(`${cacheKey}_map`) as THREE.CanvasTexture,
      bumpMap: textureCache.get(`${cacheKey}_bump`) as THREE.CanvasTexture,
    };
  }

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bumpCtx = bumpCanvas.getContext('2d')!;

  // Mortar background
  ctx.fillStyle = '#4a443c';
  ctx.fillRect(0, 0, size, size);
  bumpCtx.fillStyle = '#252525';
  bumpCtx.fillRect(0, 0, size, size);

  const rows = 10;
  const rowHeight = size / rows;

  for (let r = 0; r < rows; r++) {
    const cols = 5;
    const colWidth = size / cols;
    const offset = (r % 2) * (colWidth / 2);
    const y = r * rowHeight;

    for (let c = -1; c <= cols + 1; c++) {
      const x = c * colWidth + offset;
      const shade = 160 + Math.floor(Math.random() * 45);
      const warmR = shade + 18;
      const warmG = shade + 8;
      const warmB = shade - 5;

      ctx.fillStyle = `rgb(${warmR}, ${warmG}, ${warmB})`;
      ctx.fillRect(x + 3, y + 3, colWidth - 6, rowHeight - 6);

      // Subtle surface variations
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (let k = 0; k < 5; k++) {
        const sx = x + 6 + Math.random() * (colWidth - 12);
        const sy = y + 6 + Math.random() * (rowHeight - 12);
        ctx.fillRect(sx, sy, 3 + Math.random() * 8, 2 + Math.random() * 5);
      }

      // Bump
      bumpCtx.fillStyle = `rgb(${shade + 20}, ${shade + 20}, ${shade + 20})`;
      bumpCtx.fillRect(x + 3, y + 3, colWidth - 6, rowHeight - 6);
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 2);

  textureCache.set(`${cacheKey}_map`, map);
  textureCache.set(`${cacheKey}_bump`, bumpMap);

  return { map, bumpMap };
}

/**
 * Creates rich terracotta roof tile texture with highlights
 */
export function getRoofTileTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const cacheKey = 'roof_v2';
  if (textureCache.has(`${cacheKey}_map`) && textureCache.has(`${cacheKey}_bump`)) {
    return {
      map: textureCache.get(`${cacheKey}_map`) as THREE.CanvasTexture,
      bumpMap: textureCache.get(`${cacheKey}_bump`) as THREE.CanvasTexture,
    };
  }

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bumpCtx = bumpCanvas.getContext('2d')!;

  ctx.fillStyle = '#6e221b';
  ctx.fillRect(0, 0, size, size);
  bumpCtx.fillStyle = '#303030';
  bumpCtx.fillRect(0, 0, size, size);

  const tileRows = 16;
  const tileHeight = size / tileRows;

  for (let r = 0; r < tileRows; r++) {
    const y = r * tileHeight;
    const tileCols = 16;
    const tileWidth = size / tileCols;
    const offset = (r % 2) * (tileWidth / 2);

    for (let c = -1; c <= tileCols + 1; c++) {
      const x = c * tileWidth + offset;
      const red = 175 + Math.floor(Math.random() * 35);
      const green = 55 + Math.floor(Math.random() * 20);
      const blue = 45 + Math.floor(Math.random() * 15);

      const grad = ctx.createLinearGradient(x, y, x + tileWidth, y);
      grad.addColorStop(0, `rgb(${red - 25}, ${green - 10}, ${blue - 10})`);
      grad.addColorStop(0.5, `rgb(${red + 30}, ${green + 15}, ${blue + 5})`);
      grad.addColorStop(1, `rgb(${red - 30}, ${green - 15}, ${blue - 10})`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, tileWidth - 2, tileHeight - 1, [0, 0, 3, 3]);
      ctx.fill();

      // Bump
      const bGrad = bumpCtx.createLinearGradient(x, y, x + tileWidth, y);
      bGrad.addColorStop(0, '#555555');
      bGrad.addColorStop(0.5, '#d5d5d5');
      bGrad.addColorStop(1, '#454545');
      bumpCtx.fillStyle = bGrad;
      bumpCtx.beginPath();
      bumpCtx.roundRect(x + 1, y + 1, tileWidth - 2, tileHeight - 1, [0, 0, 3, 3]);
      bumpCtx.fill();
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3, 3);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 3);

  textureCache.set(`${cacheKey}_map`, map);
  textureCache.set(`${cacheKey}_bump`, bumpMap);

  return { map, bumpMap };
}

/**
 * Creates green copper patina roof texture
 */
export function getCopperPatinaTexture(): THREE.CanvasTexture {
  const cacheKey = 'copper_patina_v2';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey) as THREE.CanvasTexture;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#417264';
  ctx.fillRect(0, 0, size, size);

  const plateWidth = 32;
  for (let x = 0; x < size; x += plateWidth) {
    const patVar = Math.random() * 25;
    ctx.fillStyle = `rgb(${55 + patVar}, ${115 + patVar}, ${95 + patVar})`;
    ctx.fillRect(x + 2, 0, plateWidth - 4, size);

    // Seam line
    ctx.fillStyle = '#2a483e';
    ctx.fillRect(x, 0, 2, size);
    ctx.fillStyle = '#73ad9c';
    ctx.fillRect(x + 2, 0, 1, size);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);

  textureCache.set(cacheKey, map);
  return map;
}

/**
 * Creates warm wood plank texture with grain
 */
export function getWoodPlankTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const cacheKey = 'wood_planks_v2';
  if (textureCache.has(`${cacheKey}_map`) && textureCache.has(`${cacheKey}_bump`)) {
    return {
      map: textureCache.get(`${cacheKey}_map`) as THREE.CanvasTexture,
      bumpMap: textureCache.get(`${cacheKey}_bump`) as THREE.CanvasTexture,
    };
  }

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bumpCtx = bumpCanvas.getContext('2d')!;

  ctx.fillStyle = '#5c4129';
  ctx.fillRect(0, 0, size, size);
  bumpCtx.fillStyle = '#505050';
  bumpCtx.fillRect(0, 0, size, size);

  const plankHeight = 32;
  for (let y = 0; y < size; y += plankHeight) {
    const tone = 110 + Math.floor(Math.random() * 35);
    const r = tone + 35;
    const g = tone + 10;
    const b = Math.floor(tone * 0.7);

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, y + 2, size, plankHeight - 4);

    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let k = 0; k < 4; k++) {
      const gy = y + 4 + Math.random() * (plankHeight - 8);
      ctx.fillRect(0, gy, size, 1);
    }

    ctx.fillStyle = '#2b1b11';
    ctx.fillRect(0, y, size, 2);

    bumpCtx.fillStyle = `rgb(${tone + 30}, ${tone + 30}, ${tone + 30})`;
    bumpCtx.fillRect(0, y + 2, size, plankHeight - 4);
    bumpCtx.fillStyle = '#181818';
    bumpCtx.fillRect(0, y, size, 2);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 2);

  textureCache.set(`${cacheKey}_map`, map);
  textureCache.set(`${cacheKey}_bump`, bumpMap);

  return { map, bumpMap };
}

/**
 * Creates dark craggy rock texture with mossy flecks
 */
export function getCragRockTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const cacheKey = 'crag_rock_v2';
  if (textureCache.has(`${cacheKey}_map`) && textureCache.has(`${cacheKey}_bump`)) {
    return {
      map: textureCache.get(`${cacheKey}_map`) as THREE.CanvasTexture,
      bumpMap: textureCache.get(`${cacheKey}_bump`) as THREE.CanvasTexture,
    };
  }

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bumpCtx = bumpCanvas.getContext('2d')!;

  ctx.fillStyle = '#252932';
  ctx.fillRect(0, 0, size, size);
  bumpCtx.fillStyle = '#404040';
  bumpCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 35; i++) {
    const y = Math.random() * size;
    const h = 5 + Math.random() * 15;
    const shade = 40 + Math.floor(Math.random() * 30);
    const moss = Math.random() > 0.6 ? 12 : 0;

    ctx.fillStyle = `rgb(${shade}, ${shade + moss}, ${shade + 4})`;
    ctx.fillRect(0, y, size, h);

    bumpCtx.fillStyle = `rgb(${shade * 2.8}, ${shade * 2.8}, ${shade * 2.8})`;
    bumpCtx.fillRect(0, y, size, h);
  }

  // Mossy green patches
  ctx.fillStyle = 'rgba(45, 68, 38, 0.45)';
  for (let m = 0; m < 40; m++) {
    const mx = Math.random() * size;
    const my = Math.random() * size;
    const mr = 6 + Math.random() * 20;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 2);

  textureCache.set(`${cacheKey}_map`, map);
  textureCache.set(`${cacheKey}_bump`, bumpMap);

  return { map, bumpMap };
}

/**
 * Creates pale moon surface texture
 */
export function getMoonTexture(): THREE.CanvasTexture {
  const cacheKey = 'moon_v2';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey) as THREE.CanvasTexture;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f2f6ff';
  ctx.fillRect(0, 0, size, size);

  // Maria lunar plains
  ctx.fillStyle = 'rgba(180, 192, 215, 0.5)';
  const mariaCenters = [
    { x: 190, y: 180, r: 90 },
    { x: 330, y: 150, r: 75 },
    { x: 270, y: 290, r: 85 },
    { x: 370, y: 320, r: 60 },
    { x: 140, y: 310, r: 65 },
  ];

  mariaCenters.forEach(({ x, y, r }) => {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(165, 178, 202, 0.65)');
    grad.addColorStop(0.7, 'rgba(180, 192, 215, 0.35)');
    grad.addColorStop(1, 'rgba(242, 246, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  const map = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, map);
  return map;
}

/**
 * Creates warm glowing window canvas texture with mullions
 */
export function getWindowPaneTexture(): THREE.CanvasTexture {
  const cacheKey = 'window_pane_v2';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey) as THREE.CanvasTexture;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c130d';
  ctx.fillRect(0, 0, size, size);

  const paneGrad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size * 0.65);
  paneGrad.addColorStop(0, '#fff0c2');
  paneGrad.addColorStop(0.5, '#ffbb44');
  paneGrad.addColorStop(1, '#e68020');

  const m = 8;
  const w = (size - m * 3) / 2;
  const h = (size - m * 3) / 2;

  ctx.fillStyle = paneGrad;
  ctx.fillRect(m, m, w, h);
  ctx.fillRect(m * 2 + w, m, w, h);
  ctx.fillRect(m, m * 2 + h, w, h);
  ctx.fillRect(m * 2 + w, m * 2 + h, w, h);

  const map = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, map);
  return map;
}
