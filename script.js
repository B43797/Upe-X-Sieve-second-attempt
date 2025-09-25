// script.js
// Toy UPE-X spectral scorer for browser demo.
// Replace previous script.js with this file (works with index.html + style.css).
// - Computes S_G(m; k) = Re sum_j w_gamma(m) * Phi_hat(gamma) * exp(i gamma log k)
// - Uses small hard-coded zeta-zero list (first ~20 imaginary parts)
// - Shows top candidates around sqrt(N) and attempts direct division (confirm factors)

// -------------------- configuration --------------------
const ZETA_ZEROS = [
  14.1347251417347, 21.0220396387715, 25.0108575801457, 30.4248761258595,
  32.9350615877392, 37.5861781588257, 40.9187190121475, 43.3270732809149,
  48.0051508811672, 49.7738324776723, 52.9703214777145, 56.4462476970630,
  59.3470440026022, 60.8317785246098, 65.1125440480819, 67.0798105294942,
  69.5464017111730, 72.0671576744818, 75.7046906990839, 77.1448400688742
];
// default smoothing width (sigma) and radius for candidate window
const DEFAULT_SIGMA = 0.12;   // tune: smaller => finer resolution but needs more zeros
const DEFAULT_RADIUS = 200;   // number of integers around sqrt(N) to score
const MAX_RADIUS = 2000;      // safety cap to avoid freezing browser

// -------------------- small complex helpers --------------------
function cAdd(a, b) { return {re: a.re + b.re, im: a.im + b.im}; }
function cMul(a, b) {
  return { re: a.re*b.re - a.im*b.im, im: a.re*b.im + a.im*b.re };
}
function cScale(a, s) { return { re: a.re*s, im: a.im*s }; }
function cDiv(a, b) {
  // (a)/(b) where a,b complex
  const denom = b.re*b.re + b.im*b.im;
  return { re: (a.re*b.re + a.im*b.im)/denom, im: (a.im*b.re - a.re*b.im)/denom };
}
function cExpI(theta) { return { re: Math.cos(theta), im: Math.sin(theta) }; }

// -------------------- spectral components --------------------
function phiHatGaussian(gamma, sigma) {
  // Φ̂(t) = σ * sqrt(2π) * exp( - (σ^2 t^2)/2 )
  return sigma * Math.sqrt(2*Math.PI) * Math.exp(-0.5 * (sigma*sigma) * (gamma*gamma));
}

function wGamma(m, gamma) {
  // w = m^{1/2} * exp(i γ log m) / (1/2 + iγ)
  // compute numerator as complex: m^{1/2} * e^{i γ log m}
  const sqrtm = Math.sqrt(m);
  const theta = gamma * Math.log(m);
  const num = { re: sqrtm * Math.cos(theta), im: sqrtm * Math.sin(theta) };
  const denom = { re: 0.5, im: gamma };
  return cDiv(num, denom); // complex
}

// -------------------- main scoring function --------------------
function computeSpectralScores(N, radius=DEFAULT_RADIUS, sigma=DEFAULT_SIGMA) {
  // Return array of {k, score} for k in [sqrtN-radius, sqrtN+radius]
  if (radius > MAX_RADIUS) radius = MAX_RADIUS;
  const m = Math.log(N);
  const sqrtN = Math.floor(Math.sqrt(N));
  const start = Math.max(2, sqrtN - radius);
  const end = sqrtN + radius;
  // precompute coefficients: coeff_j = wGamma(m,gamma) * phiHatGaussian(gamma,sigma)
  const coeffs = ZETA_ZEROS.map(gamma => {
    const ph = phiHatGaussian(gamma, sigma);
    const wg = wGamma(m, gamma); // complex
    return cScale(wg, ph); // complex
  });

  const results = [];
  for (let k = start; k <= end; k++) {
    // accumulate sum_j coeff_j * exp(i gamma log k)
    const logk = Math.log(k);
    let acc = { re: 0.0, im: 0.0 };
    for (let j = 0; j < ZETA_ZEROS.length; j++) {
      const gamma = ZETA_ZEROS[j];
      const coeff = coeffs[j]; // complex
      const phase = cExpI(gamma * logk);
      const term = cMul(coeff, phase);
      acc = cAdd(acc, term);
    }
    // score is real part
    results.push({ k: k, score: acc.re });
  }
  // sort descending by score
  results.sort((a,b) => b.score - a.score);
  return results;
}

// -------------------- factor verification (direct division) --------------------
function tryDivision(N, k) {
  // simple integer division check; N and k are JS Numbers (safe for demo ranges)
  if (N % k === 0) {
    return [k, N / k];
  }
  return null;
}

// -------------------- UI interaction --------------------
function analyzeNumber() {
  const out = document.getElementById('output');
  out.innerHTML = ''; // clear

  const input = document.getElementById('numberInput');
  const raw = (input.value || '').trim();
  if (!raw) {
    out.innerHTML = '<b>Please enter an integer N.</b>';
    return;
  }
  // parse as number (demo purpose: avoid BigInt complexity)
  const N = Number(raw);
  if (!Number.isFinite(N) || N < 2) {
    out.innerHTML = '<b>Please enter a positive integer ≥ 2 (within JavaScript number range).</b>';
    return;
  }

  // optional radius and sigma inputs if present
  let radius = DEFAULT_RADIUS;
  const rElem = document.getElementById('radiusInput');
  if (rElem && rElem.value) {
    const rv = Number(rElem.value);
    if (!isNaN(rv) && rv >= 1) radius = Math.min(MAX_RADIUS, Math.floor(rv));
  }
  let sigma = DEFAULT_SIGMA;
  const sElem = document.getElementById('sigmaInput');
  if (sElem && sElem.value) {
    const sv = Number(sElem.value);
    if (!isNaN(sv) && sv > 0) sigma = sv;
  }

  out.innerHTML = `<b>Computing spectral scores (radius=${radius}, sigma=${sigma})...</b><br/>`;
  // compute (this may take time for big radius)
  setTimeout(() => {
    const scores = computeSpectralScores(N, radius, sigma);
    // show top 12
    const topK = Math.min(12, scores.length);
    let html = '<h3>Top candidates (k : score)</h3><ol>';
    for (let i = 0; i < topK; i++) {
      const entry = scores[i];
      html += `<li>${entry.k} : ${entry.score.toFixed(6)}</li>`;
    }
    html += '</ol>';

    // attempt direct division on top candidates
    let found = null;
    for (let i = 0; i < topK; i++) {
      const k = scores[i].k;
      const d = tryDivision(N, k);
      if (d) { found = d; break; }
    }
    if (found) {
      html += `<p style="color:green"><b>Factor found by direct division:</b> ${found[0]} × ${found[1]}</p>`;
    } else {
      html += `<p style="color:orange"><b>No exact factor found among top ${topK} candidates.</b></p>`;
      html += `<p>If a factor is nearby, you may increase the radius or adjust sigma.</p>`;
    }

    out.innerHTML = html;
  }, 20);
}

// -------------------- attach analyze button if page loads before script --------------------
document.addEventListener('DOMContentLoaded', function() {
  // if the page has a button with onclick attribute, nothing needed;
  // but we also enhance: if there are radius/sigma inputs, they are optional.
  // (index.html can include <input id="radiusInput"> and <input id="sigmaInput"> for tuning)
});
