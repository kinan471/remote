/**
 * YAKALA ULTRA SCRAPER ENGINE V2 - STEALTH BROWSER POOL
 * Playwright Stealth browser pool with random delays, user-agents, and dynamic fallback
 */

import { ENGINE_CONFIG } from './config';

/**
 * Interface representing a successfully fetched webpage
 */
export interface BrowserFetchResult {
  html: string;
  screenshotBase64?: string; // Used for Vision OCR Fallback
  status: number;
  success: boolean;
  error?: string;
}

/**
 * Stealth Browser Fetcher: Loads a URL, bypasses anti-bot overlay, and returns HTML/Screenshot
 */
export async function fetchWithStealth(url: string, platform: string, forceJS = false): Promise<BrowserFetchResult> {
  const userAgent = ENGINE_CONFIG.userAgents[Math.floor(Math.random() * ENGINE_CONFIG.userAgents.length)];
  
  // 1. Direct HTTP fetch is removed because Vercel IPs are strictly blacklisted by Turkish e-commerce sites.

  // 2. Playwright Stealth Fetcher (Decoupled & Serverless-Safe Fallback)
  try {
    console.log(`[BrowserPool] [Playwright-Stealth] Launching stealth chromium instance for: ${url}`);
    
    // Dynamic import to prevent Vercel Serverless build compilation crashes
    let playwright;
    try {
      const playwrightLib = 'playwright';
      playwright = require(playwrightLib);
    } catch {
      // Graceful fallback to Firecrawl API if playwright binary is missing in Vercel environment
      console.warn("[BrowserPool] Playwright is not installed/supported in this environment. Falling back to Firecrawl.");
      
      if (ENGINE_CONFIG.firecrawlKey) {
        const firecrawlRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${ENGINE_CONFIG.firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            url, 
            formats: ["html"],
            waitFor: 2500 // Wait for JS rendering
          })
        });
        
        if (firecrawlRes.ok) {
          const json = await firecrawlRes.json();
          if (json.data && json.data.html) {
             return {
               html: json.data.html,
               status: 200,
               success: true,
               error: "Playwright missing. Degraded to Firecrawl HTML fetch."
             };
          }
        }
      }

      // Ultimate fallback if Firecrawl also fails
      const res = await fetch(url, { headers: { 'User-Agent': userAgent } });
      const html = await res.text();
      return {
        html,
        status: res.status,
        success: res.ok,
        error: "Playwright binary not found in hosting environment. Degraded to standard HTTP fetch."
      };
    }

    const browser = await playwright.chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1920,1080'
      ]
    });

    const context = await browser.newContext({
      userAgent,
      viewport: { width: 1280, height: 800 },
      locale: 'tr-TR',
      timezoneId: 'Europe/Istanbul'
    });

    // Mask browser fingerprinting
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      (window as any).chrome = { runtime: {} };
    });

    const page = await context.newPage();
    
    // Set human-like scroll movements and random wait delays
    await page.route('**/*', (route: any) => {
      const request = route.request();
      // Block analytical scripts, ads, and media files to save 70% bandwidth
      const resourceType = request.resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(resourceType) && !url.includes('amazon')) {
        route.abort();
      } else {
        route.continue();
      }
    });

    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Simulate human interaction (random mouse scrolling curves)
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          
          if (totalHeight >= scrollHeight || totalHeight > 1600) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // Check for Captcha / Anti-Bot triggers
    const pageTitle = await page.title();
    const titleLower = pageTitle.toLowerCase();
    const hasCaptcha = ["captcha", "robot", "security check", "security validation"].some(kw => titleLower.includes(kw));

    let screenshotBase64: string | undefined = undefined;

    if (hasCaptcha) {
      console.warn(`[BrowserPool] [CAPTCHA] Security overlay detected on: ${url}. Generating fallback screenshot...`);
      const screenshotBuffer = await page.screenshot({ fullPage: false });
      screenshotBase64 = screenshotBuffer.toString('base64');
    }

    const html = await page.content();
    const status = response ? response.status() : 200;

    await browser.close();

    return {
      html,
      screenshotBase64,
      status,
      success: !hasCaptcha,
      error: hasCaptcha ? "Blocked by security captcha overlay." : undefined
    };

  } catch (err: any) {
    console.error(`[BrowserPool] Playwright extraction error:`, err.message);
    
    // Ultimate graceful degrade to empty payload
    return {
      html: '',
      status: 500,
      success: false,
      error: err.message
    };
  }
}
