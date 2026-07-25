/**
 * deviceFingerprint.js — Collecte d'empreinte stable au niveau machine.
 *
 * Objectif : identifier le même PC même si l'utilisateur change de navigateur.
 * On combine des signaux stables (GPU, écran, timezone, platform) qui ne
 * varient pas entre Chrome et Firefox sur la même machine.
 *
 * Ces données sont envoyées au backend lors de chaque appel auth pour
 * enforcer la règle "un appareil = un seul compte".
 */

/**
 * Génère un canvas fingerprint basé sur le rendu graphique du GPU/driver.
 * Identique entre navigateurs sur la même machine (même GPU, même driver).
 */
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Texte avec caractères spéciaux pour maximiser les différences GPU
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Convessa🔐', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Convessa🔐', 4, 17);

    return canvas.toDataURL().slice(-50); // 50 derniers chars suffisent
  } catch {
    return '';
  }
}

/**
 * Génère un WebGL fingerprint basé sur le renderer GPU.
 * Très stable entre navigateurs sur la même machine.
 */
function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
    const vendor = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      : gl.getParameter(gl.VENDOR);

    return `${vendor}|${renderer}`;
  } catch {
    return '';
  }
}

/**
 * Collecte les données stables de la machine.
 */
function getMachineSignals() {
  const nav = navigator;
  const screen = window.screen;

  return {
    // Écran — identique entre navigateurs
    screenWidth:       screen.width,
    screenHeight:      screen.height,
    screenDepth:       screen.colorDepth,
    devicePixelRatio:  window.devicePixelRatio,

    // Timezone — identique sur la même machine
    timezone:          Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset:    new Date().getTimezoneOffset(),

    // Plateforme OS — identique entre navigateurs
    platform:          nav.platform || '',
    oscpu:             nav.oscpu || '',
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    deviceMemory:      nav.deviceMemory || 0,

    // Langue système — identique entre navigateurs
    language:          nav.language || '',
    languages:         nav.languages?.join(',') || '',

    // GPU fingerprint — très stable
    webgl:             getWebGLFingerprint(),
    canvas:            getCanvasFingerprint(),

    // Touch — identique
    maxTouchPoints:    nav.maxTouchPoints || 0,
  };
}

/**
 * Hache les signaux en une chaîne stable de 64 chars.
 * Utilise SubtleCrypto (disponible en HTTPS et localhost).
 */
async function hashSignals(signals) {
  const str = JSON.stringify(signals);
  try {
    const buffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(str)
    );
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    // Fallback si SubtleCrypto non disponible
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

/**
 * Point d'entrée principal — retourne un objet à envoyer au backend.
 *
 * @returns {Promise<{ machineHash: string, signals: object }>}
 *   machineHash : empreinte stable de la machine (hex 64 chars)
 *   signals     : données brutes pour le backoffice admin
 */
export async function collectDeviceFingerprint() {
  const signals = getMachineSignals();
  const machineHash = await hashSignals(signals);

  return {
    machineHash,
    signals: {
      screen:    `${signals.screenWidth}x${signals.screenHeight}x${signals.screenDepth}@${signals.devicePixelRatio}x`,
      timezone:  signals.timezone,
      platform:  signals.platform,
      cpus:      signals.hardwareConcurrency,
      memory:    signals.deviceMemory,
      language:  signals.language,
      webgl:     signals.webgl,
      canvas:    signals.canvas,
    },
  };
}

/**
 * Récupère ou calcule le fingerprint machine depuis sessionStorage.
 * Recalculé à chaque session navigateur (pas persisté en localStorage
 * pour ne pas être effacé facilement).
 */
export async function getCachedMachineHash() {
  const cached = sessionStorage.getItem('_mfp');
  if (cached) return cached;

  const { machineHash } = await collectDeviceFingerprint();
  sessionStorage.setItem('_mfp', machineHash);
  return machineHash;
}
