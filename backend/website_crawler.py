import asyncio
from playwright.async_api import async_playwright
from urllib.parse import urljoin, urlparse
from typing import Set, List, Dict
from collections import defaultdict
import time

import asyncio
from playwright.async_api import async_playwright
# Try to import stealth, handle if missing
try:
    from playwright_stealth import stealth_async
except ImportError:
    stealth_async = None

import requests
import xml.etree.ElementTree as ET
from urllib.parse import urljoin, urlparse
from typing import Set, List, Dict
from collections import defaultdict
import time

async def crawl_website(base_url: str, max_pages: int = 3000, max_time: int = 120) -> Dict:
    """
    Hybrid Crawler:
    1. Try Sitemap parsing first (Fastest, bypasses JS)
    2. Fallback to Playwright with Stealth (Handles JS & Anti-bot)
    """
    start_time = time.time()
    
    # Normalize base URL
    if not base_url.startswith(('http://', 'https://')):
        base_url = 'https://' + base_url
    
    parsed_base = urlparse(base_url)
    base_domain = parsed_base.netloc
    
    # --- STRATEGY 1: SITEMAP (Fast & Stealthy) ---
    print(f"Strategy 1: Checking Sitemaps for {base_domain}...")
    sitemap_urls = set()
    
    # 1. Check robots.txt
    try:
        robots_url = f"{parsed_base.scheme}://{base_domain}/robots.txt"
        resp = requests.get(robots_url, timeout=5, headers={'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)'})
        if resp.status_code == 200:
            for line in resp.text.splitlines():
                if line.lower().startswith('sitemap:'):
                    sitemap_urls.add(line.split(':', 1)[1].strip())
    except Exception:
        pass
    
    # 2. Default locations
    sitemap_urls.add(f"{parsed_base.scheme}://{base_domain}/sitemap.xml")
    sitemap_urls.add(f"{parsed_base.scheme}://{base_domain}/sitemap_index.xml")
    
    discovered_urls = set()
    
    for sitemap_url in list(sitemap_urls):
        try:
            print(f"Parsing sitemap: {sitemap_url}")
            resp = requests.get(sitemap_url, timeout=10, headers={'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)'})
            if resp.status_code == 200:
                # Simple XML parsing (ignoring namespaces for simplicity)
                content = resp.text
                # Extract all URLs roughly
                import re
                urls = re.findall(r'<loc>(https?://[^<]+)</loc>', content)
                for url in urls:
                    if base_domain in url:
                        discovered_urls.add(url.strip())
                        if len(discovered_urls) >= max_pages:
                            break
        except Exception as e:
            print(f"Sitemap error: {e}")
            
    if len(discovered_urls) > 10:
        print(f"Strategy 1 Success: Found {len(discovered_urls)} URLs via Sitemap")
        return _format_results(base_url, discovered_urls)

    # --- STRATEGY 2: PLAYWRIGHT STEALTH (Dynamic) ---
    print("Strategy 1 failed/low results. Strategy 2: Starting Stealth Playwright...")
    
    visited: Set[str] = set()
    to_visit = [base_url]
    
    try:
        async with async_playwright() as p:
            # Launch with extra args to hide automation
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
            )
            
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1366, 'height': 768},
                locale='en-US',
                timezone_id='Australia/Sydney'
            )
            
            page = await context.new_page()
            
            # Apply stealth scripts if available
            if stealth_async:
                await stealth_async(page)
            
            while to_visit and len(discovered_urls) < max_pages:
                if time.time() - start_time > max_time:
                    break
                
                current_url = to_visit.pop(0)
                if current_url in visited:
                    continue
                    
                visited.add(current_url)
                print(f"Crawling: {current_url}")
                
                try:
                    response = await page.goto(current_url, wait_until='domcontentloaded', timeout=20000)
                    
                    # Handle blocks
                    if response and response.status in [403, 503]:
                        print(f"Blocked ({response.status}) on {current_url}")
                        continue
                        
                    await page.wait_for_timeout(1000) # Wait for JS
                    
                    discovered_urls.add(current_url)
                    
                    # Extract links using JS
                    links = await page.evaluate("""
                        () => {
                            return Array.from(document.querySelectorAll('a[href]'))
                                .map(a => a.href)
                                .filter(href => href.startsWith('http'));
                        }
                    """)
                    
                    for href in links:
                        if any(ext in href.lower() for ext in ['.pdf', '.jpg', '.png', '#']):
                            continue
                        parsed = urlparse(href)
                        if parsed.netloc == base_domain:
                            clean = href.split('#')[0]
                            if clean not in visited and clean not in discovered_urls and clean not in to_visit:
                                to_visit.append(clean)
                                
                except Exception as e:
                    print(f"Page error: {e}")
                    continue
            
            await browser.close()
            
    except Exception as e:
        print(f"Playwright error: {e}")
    
    return _format_results(base_url, discovered_urls)

def _format_results(base_url: str, discovered_urls: Set[str]) -> Dict:
    # Group URLs by path segments
    url_groups = defaultdict(list)
    
    for url in discovered_urls:
        parsed = urlparse(url)
        path = parsed.path.strip('/')
        
        if not path:
            url_groups['Main'].append(url)
        else:
            first_segment = path.split('/')[0]
            group_name = first_segment.replace('-', ' ').replace('_', ' ').title()
            url_groups[group_name].append(url)
    
    # Sort URLs within each group
    for group in url_groups:
        url_groups[group].sort()
    
    # Convert to list of groups
    grouped_data = []
    for group_name in sorted(url_groups.keys()):
        urls = url_groups[group_name]
        grouped_data.append({
            'name': group_name,
            'count': len(urls),
            'urls': urls
        })
    
    return {
        'base_url': base_url,
        'total_count': len(discovered_urls),
        'groups': grouped_data,
        'all_urls': sorted(list(discovered_urls))
    }

