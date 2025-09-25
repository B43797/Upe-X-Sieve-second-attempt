// --- Helper: modular exponentiation ---
function modPow(base, exp, mod) {
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * base) % mod;
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return result;
}

// --- Miller–Rabin primality test ---
function isProbablePrime(n, k = 10) {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n) return false;

  // write n-1 as 2^r * d
  let r = 0n;
  let d = n - 1n;
  while (d % 2n === 0n) {
    d /= 2n;
    r += 1n;
  }

  const bases = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n];
  for (let i = 0; i < k; i++) {
    const a = i < bases.length ? bases[i] : 2n + BigInt(Math.floor(Math.random() * Number(n - 3n)));
    if (a % n === 0n) continue;
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let continueLoop = false;
    for (let j = 1n; j < r; j++) {
      x = modPow(x, 2n, n);
      if (x === n - 1n) {
        continueLoop = true;
        break;
      }
    }
    if (!continueLoop) return false;
  }
  return true;
}

// --- Pollard's Rho factorization ---
function gcd(a, b) {
  while (b) {
    let t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function pollardsRho(n) {
  if (n % 2n === 0n) return 2n;
  let x = 2n, y = 2n, d = 1n;
  const f = (x) => (x * x + 1n) % n;
  while (d === 1n) {
    x = f(x);
    y = f(f(y));
    d = gcd(x > y ? x - y : y - x, n);
  }
  return d === n ? null : d;
}

function factorize(n) {
  if (n === 1n) return [];
  if (isProbablePrime(n)) return [n];
  const divisor = pollardsRho(n);
  if (!divisor) return [n]; // fallback if rho fails
  return [...factorize(divisor), ...factorize(n / divisor)];
}

// --- Main function ---
function analyzeNumber() {
  const input = document.getElementById("numberInput");
  let n;
  try {
    n = BigInt(input.value.trim());
  } catch {
    document.getElementById("output").innerHTML = "⚠️ Please enter a valid integer.";
    return;
  }
  if (n <= 0n) {
    document.getElementById("output").innerHTML = "⚠️ Enter a positive integer.";
    return;
  }

  if (isProbablePrime(n)) {
    document.getElementById("output").innerHTML = `<b>${n}</b> is <span style="color:green">prime</span>.`;
  } else {
    const factors = factorize(n);
    factors.sort((a, b) => (a < b ? -1 : 1));
    document.getElementById("output").innerHTML = `<b>${n}</b> is composite.<br/>Factors: ${factors.join(" × ")}`;
  }
}
