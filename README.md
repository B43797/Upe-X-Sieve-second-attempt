# UPE-X Demo Website

This is a **GitHub Pages demo** of prime detection and factoring, inspired by the UPE-X idea.  
All calculations run entirely in the **browser** using JavaScript (no server, no Python).  

## Features
- **Miller–Rabin primality test** → checks very large numbers (hundreds of digits).  
- **Pollard’s Rho factorization** → factors integers quickly up to ~10^15–10^18 (15–18 digits).  
- **Works offline** → no backend needed, just open `index.html`.  

## Usage
1. Visit the site after enabling GitHub Pages:
2. 2. Enter an integer `N` in the input box.  
3. Click **Run UPE-X Demo**.  
4. The result will show:  
- if `N` is **prime**, or  
- if `N` is **composite**, its factors.  

## Files
- `index.html` — main webpage  
- `style.css` — page styling (purple + yellow theme)  
- `script.js` — JavaScript code (Miller–Rabin + Pollard’s Rho)  

## Examples
- Input: `104723` → Output: `104723 is prime`  
- Input: `899` → Output: `899 is composite. Factors: 29 × 31`  

## Author
Bahbouhi Bouchaib  
Independent Scientist in Number Theory — Nantes, France  
Email: bahbouhi.orion.4710@gmail.com
