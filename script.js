// script.js
// UPE-X Toy Demo: prime/factor detection using resonance sums from zeta zeros
// Works best for N up to ~1e6 (demo range). All runs in browser JavaScript.

// --- Hardcoded list of first 20 nontrivial zeta zeros (imaginary parts) ---
const ZETA_ZEROS = [
  14.1347251417347, 21.0220396387715, 25.0108575801457, 30.4248761258595,
  32.9350615877392, 37.5861781588257, 40.9187190121475, 43.3270732809149,
  48.0051508811672, 49.7738324776723, 52.9703214777145, 56.4462476970630,
  59.3470440026022, 60.8317785246098, 65.1125440480819, 67.0798105294942,
  69.5464017111730, 72.0671576744818, 75.7046906990839, 77.1448400688742
];

// --- Parameters for smoothing and search window ---
const DEFAULT_SIGMA = 0.15;   // Gaussian smoothing parameter
const DEFAULT_RADIUS = 100;   // range around sqrt(N) to search
const MAX_RADIUS = 1000;      // safety cap

// --- Complex helpers ---
function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
function cMul(a, b) { return { re: a.re*b.re - a.im*b.im, im: a.re*b.im + a.im*b.re }; }
function cScale(a, s) { return { re: a.re*s, im: a.im*s }; }
function cDiv(a, b) {
  const denom = b.re*b.re + b.im*b.im;
  return { re: (a.re*b.re + a.im*b.im)/denom, im: (a.im*b.re - a.re*b.im)/denom };
}
function cExpI(theta) { return { re: Math.cos(theta), im: Math.sin(theta) }; }

// --- Fourier transform of Gaussian ---
function phiHatGaussian(gamma, sigma) {
  return sigma * Math.sqrt(2*Math.PI) * Math.exp(-0.5 * (sigma*sigma) * (gamma*gamma));
}

// --- Weight term for zero γ ---
function wGamma(m, gamma) {
  const sqrtm = Math.sqrt(m);
  const theta = gamma * Math.log(m);
  const num = { re: sqrtm * Math.cos(theta), im: sqrtm * Math.sin(theta) };
  const denom = { re: 0.5, im: gamma };
  return cDiv(num, denom);
}

// --- Main resonance score ---
function computeSpectralScores(N, radius=DEFAULT_RADIUS, sigma=DEFAULT_SIGMA) {
  if (radius > MAX_RADIUS) radius = MAX_RADIUS;
  const m = Math.log(N);
  const sqrtN = Math.floor(Math.sqrt(N));
  const start = Math.max(2, sqrtN - radius);
  const end = sqrtN + radius;

  const coeffs = ZETA_ZEROS.map(gamma => {
    const wg = wGamma(m, gamma);
    const ph = phiHatGaussian(gamma, sigma);
    return cScale(wg, ph);
  });

  const results = [];
  for (let k = start; k <= end; k++) {
    const logk = Math.log(k);
    let acc = { re: 0, im: 0 };
    for (let j = 0; j < ZETA_ZEROS.length; j++) {
      const phase = cExpI(ZETA_ZEROS[j] * logk);
      const term = cMul(coeffs[j], phase);
      acc = cAdd(acc, term);
    }
    results.push({ k: k, score: acc.re });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

// --- Try exact division for candidate factors ---
function tryDivision(N, k) {
  if (N % k === 0) return [k, N / k];
  return null;
}

// --- UI interaction ---
function analyzeNumber() {
  const out = document.getElementById("output");
  out.innerHTML = "";

  const raw = document.getElementById("numberInput").value.trim();
  if (!raw) {
    out.innerHTML = "<b>Please enter an integer N.</b>";
    return;
  }
  const N = Number(raw);
  if (!Number.isFinite(N) || N < 2) {
    out.innerHTML = "<b>Please enter a positive integer ≥ 2.</b>";
    return;
  }

  out.innerHTML = `<b>Computing resonance scores...</b><br/>`;

  setTimeout(() => {
    const scores = computeSpectralScores(N);
    const topK = Math.min(10, scores.length);

    let html = "<h3>Top candidates (k : score)</h3><ol>";
    for (let i = 0; i < topK; i++) {
      html += `<li>${scores[i].k} : ${scores[i].score.toFixed(6)}</li>`;
    }
    html += "</ol>";

    let found = null;
    for (let i = 0; i < topK; i++) {
      const k = scores[i].k;
      const d = tryDivision(N, k);
      if (d) { found = d; break; }
    }

    if (found) {
      html += `<p style="color:green"><b>Factor found:</b> ${found[0]} × ${found[1]}</p>`;
    } else {
      html += `<p style="color:orange"><b>No exact factor found in top ${topK} candidates.</b></p>`;
    }

    out.innerHTML = html;
  }, 30);
}
