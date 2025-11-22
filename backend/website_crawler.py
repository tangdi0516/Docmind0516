import asyncio
from playwright.async_api import async_playwright
from urllib.parse import urljoin, urlparse
from typing import Set, List, Dict
from collections import defaultdict
import time

async def crawl_website(base_url: str, max_pages: int = 3000, max_time: int = 120) -> Dict:
    """
    Crawl a website using Playwright (Headless Browser).
    This handles dynamic content (JS) and bypasses basic anti-bot protections.
    """
    start_time = time.time()
    
    # Normalize base URL
    if not base_url.startswith(('http://', 'https://')):
        base_url = 'https://' + base_url
    
    parsed_base = urlparse(base_url)
    base_domain = parsed_base.netloc
    
    discovered_urls: Set[str] = set()
    visited: Set[str] = set()
    to_visit = [base_url]
    
    print(f"Starting Playwright crawl of {base_url}...")
    
    try:
        async with async_playwright() as p:
            # Launch browser with stealth arguments
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1280, 'height': 800},
                locale='en-US',
                timezone_id='Australia/Sydney'
            )
            
            page = await context.new_page()
            
            while to_visit and len(discovered_urls) < max_pages:
                # Check time limit
                if time.time() - start_time > max_time:
                    print("Time limit reached.")
                    break
                
                current_url = to_visit.pop(0)
                if current_url in visited:
                    continue
                    
                visited.add(current_url)
                print(f"Crawling: {current_url}")
                
                try:
                    # Navigate to page
                    response = await page.goto(current_url, wait_until='domcontentloaded', timeout=15000)
                    
                    if not response or response.status != 200:
                        continue
                        
                    # Wait a bit for JS to execute
                    await page.wait_for_timeout(1000)
                    
                    # Add to discovered
                    discovered_urls.add(current_url)
                    
                    if len(discovered_urls) % 10 == 0:
                        print(f"Progress: {len(discovered_urls)} pages...")
                    
                    # Extract links
                    links = await page.evaluate("""
                        () => {
                            return Array.from(document.querySelectorAll('a[href]'))
                                .map(a => a.href)
                                .filter(href => href.startsWith('http'));
                        }
                    """)
                    
                    for href in links:
                        # Basic filtering
                        if any(ext in href.lower() for ext in ['.pdf', '.jpg', '.png', '.zip', '#']):
                            continue
                            
                        parsed = urlparse(href)
                        if parsed.netloc == base_domain:
                            clean_url = href.split('#')[0]
                            if clean_url not in visited and clean_url not in discovered_urls and clean_url not in to_visit:
                                to_visit.append(clean_url)
                                
                except Exception as e:
                    print(f"Error on {current_url}: {e}")
                    continue
            
            await browser.close()
            
    except Exception as e:
        print(f"Fatal Playwright error: {e}")
        # Return what we have so far
    
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

