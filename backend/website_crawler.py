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

import asyncio
from playwright.async_api import async_playwright
try:
    from playwright_stealth import stealth_async
except ImportError:
    stealth_async = None

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import Set, List, Dict
from collections import defaultdict, deque
import time
import random

# List of realistic User Agents
USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
]

async def crawl_website(base_url: str, max_pages: int = 3000, max_time: int = 120) -> Dict:
    """
    Triple Strategy Crawler:
    1. Sitemap (Best for large sites)
    2. Playwright (Best for JS sites)
    3. Requests BFS (Fallback for stability)
    """
    start_time = time.time()
    debug_logs = []
    
    if not base_url.startswith(('http://', 'https://')):
        base_url = 'https://' + base_url
    
    parsed_base = urlparse(base_url)
    base_domain = parsed_base.netloc
    
    discovered_urls: Set[str] = set()
    
    # --- STRATEGY 1: SITEMAP ---
    try:
        debug_logs.append("Starting Strategy 1: Sitemap")
        sitemap_urls = set()
        # Check robots.txt
        try:
            robots_url = f"{parsed_base.scheme}://{base_domain}/robots.txt"
            resp = requests.get(robots_url, timeout=5, headers={'User-Agent': 'Googlebot/2.1'})
            if resp.status_code == 200:
                for line in resp.text.splitlines():
                    if line.lower().startswith('sitemap:'):
                        sitemap_urls.add(line.split(':', 1)[1].strip())
        except Exception:
            pass
        
        sitemap_urls.add(f"{parsed_base.scheme}://{base_domain}/sitemap.xml")
        sitemap_urls.add(f"{parsed_base.scheme}://{base_domain}/sitemap_index.xml")
        
        for sm_url in list(sitemap_urls):
            try:
                resp = requests.get(sm_url, timeout=10, headers={'User-Agent': 'Googlebot/2.1'})
                if resp.status_code == 200:
                    import re
                    urls = re.findall(r'<loc>(https?://[^<]+)</loc>', resp.text)
                    for url in urls:
                        if base_domain in url:
                            discovered_urls.add(url.strip())
            except Exception:
                pass
                
        if len(discovered_urls) > 10:
            debug_logs.append(f"Sitemap success: {len(discovered_urls)} URLs")
            return _format_results(base_url, discovered_urls, debug_logs)
    except Exception as e:
        debug_logs.append(f"Sitemap failed: {str(e)}")

    # --- STRATEGY 2: PLAYWRIGHT ---
    try:
        debug_logs.append("Starting Strategy 2: Playwright")
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
            context = await browser.new_context(
                user_agent=random.choice(USER_AGENTS),
                viewport={'width': 1366, 'height': 768}
            )
            page = await context.new_page()
            if stealth_async: await stealth_async(page)
            
            try:
                response = await page.goto(base_url, timeout=30000, wait_until='domcontentloaded')
                if response and response.status == 200:
                    # It works! Let's crawl a bit
                    content = await page.content()
                    soup = BeautifulSoup(content, 'html.parser')
                    for a in soup.find_all('a', href=True):
                        href = a['href']
                        full_url = urljoin(base_url, href)
                        if urlparse(full_url).netloc == base_domain:
                            discovered_urls.add(full_url)
                    
                    debug_logs.append(f"Playwright success: {len(discovered_urls)} URLs")
                    if len(discovered_urls) > 0:
                        await browser.close()
                        return _format_results(base_url, discovered_urls, debug_logs)
            except Exception as e:
                debug_logs.append(f"Playwright navigation failed: {str(e)}")
            
            await browser.close()
    except Exception as e:
        debug_logs.append(f"Playwright failed to launch: {str(e)}")

    # --- STRATEGY 3: REQUESTS BFS (Fallback) ---
    debug_logs.append("Starting Strategy 3: Requests BFS")
    try:
        to_visit = deque([base_url])
        visited = set()
        
        while to_visit and len(discovered_urls) < max_pages:
            if time.time() - start_time > max_time: break
            
            url = to_visit.popleft()
            if url in visited: continue
            visited.add(url)
            
            try:
                resp = requests.get(url, timeout=10, headers={'User-Agent': random.choice(USER_AGENTS)})
                if resp.status_code == 200:
                    discovered_urls.add(url)
                    soup = BeautifulSoup(resp.text, 'html.parser')
                    for a in soup.find_all('a', href=True):
                        full_url = urljoin(url, a['href'])
                        if urlparse(full_url).netloc == base_domain and full_url not in visited:
                            to_visit.append(full_url)
            except Exception:
                pass
                
    except Exception as e:
        debug_logs.append(f"Requests BFS failed: {str(e)}")

    return _format_results(base_url, discovered_urls, debug_logs)

def _format_results(base_url: str, discovered_urls: Set[str], logs: List[str] = []) -> Dict:
    # ... existing formatting logic ...
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
        'all_urls': sorted(list(discovered_urls)),
        'debug_logs': logs
    }

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

