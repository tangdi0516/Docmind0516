import asyncio
from playwright.async_api import async_playwright
try:
    from playwright_stealth import stealth_async
except ImportError:
    stealth_async = None

import requests
from urllib.parse import urlparse
from typing import Set, List, Dict, Any
import time
import random

# Realistic User Agents
USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
]

async def crawl_website(base_url: str, max_pages: int = 3000, max_time: int = 120) -> Dict:
    """
    Professional Website Crawler
    1. Discovery: Uses Sitemap (primary) and Playwright (fallback) to find ALL accessible URLs.
    2. Organization: Structuring URLs into a hierarchical tree based on path.
    """
    start_time = time.time()
    
    if not base_url.startswith(('http://', 'https://')):
        base_url = 'https://' + base_url
    
    parsed_base = urlparse(base_url)
    base_domain = parsed_base.netloc
    
    discovered_urls: Set[str] = set()
    
    print(f"--- Starting Scan for {base_domain} ---")

    # Phase 1: Fast Discovery via Sitemap (The "DocsBot" way)
    # Most structured sites (Shopify, WordPress, Custom) have this.
    sitemap_urls = set()
    try:
        # 1. Check robots.txt
        robots_url = f"{parsed_base.scheme}://{base_domain}/robots.txt"
        resp = requests.get(robots_url, timeout=5, headers={'User-Agent': 'Googlebot/2.1'})
        if resp.status_code == 200:
            for line in resp.text.splitlines():
                if line.lower().startswith('sitemap:'):
                    sitemap_urls.add(line.split(':', 1)[1].strip())
        
        # 2. Standard locations
        sitemap_urls.add(f"{parsed_base.scheme}://{base_domain}/sitemap.xml")
        sitemap_urls.add(f"{parsed_base.scheme}://{base_domain}/sitemap_index.xml")
        
        for sm_url in list(sitemap_urls):
            try:
                print(f"Checking Sitemap: {sm_url}")
                resp = requests.get(sm_url, timeout=10, headers={'User-Agent': 'Googlebot/2.1'})
                if resp.status_code == 200:
                    import re
                    # Extract URLs (simple regex is faster and more robust for XML variations)
                    urls = re.findall(r'<loc>(https?://[^<]+)</loc>', resp.text)
                    for url in urls:
                        if base_domain in url:
                            discovered_urls.add(url.strip())
            except Exception:
                continue
    except Exception as e:
        print(f"Sitemap discovery error: {e}")

    # Phase 2: Deep Discovery via Playwright (If Sitemap missed or failed)
    # Only run if we found very few pages, implying Sitemap was hidden or incomplete.
    if len(discovered_urls) < 10:
        print("Sitemap yielded low results. Engaging Deep Scan (Playwright)...")
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
                context = await browser.new_context(
                    user_agent=random.choice(USER_AGENTS),
                    viewport={'width': 1440, 'height': 900}
                )
                page = await context.new_page()
                if stealth_async: await stealth_async(page)
                
                visited = set()
                to_visit = [base_url]
                
                while to_visit and len(discovered_urls) < max_pages:
                    if time.time() - start_time > max_time: break
                    
                    url = to_visit.pop(0)
                    if url in visited: continue
                    visited.add(url)
                    
                    try:
                        resp = await page.goto(url, timeout=20000, wait_until='domcontentloaded')
                        if resp and resp.status == 200:
                            discovered_urls.add(url)
                            
                            # Extract links
                            links = await page.evaluate("""
                                () => Array.from(document.querySelectorAll('a[href]'))
                                    .map(a => a.href)
                                    .filter(href => href.startsWith('http'))
                            """)
                            
                            for link in links:
                                parsed = urlparse(link)
                                if parsed.netloc == base_domain:
                                    clean = link.split('#')[0]
                                    if clean not in visited and clean not in discovered_urls and clean not in to_visit:
                                        to_visit.append(clean)
                    except Exception:
                        continue
                
                await browser.close()
        except Exception as e:
            print(f"Deep Scan error: {e}")

    print(f"--- Scan Complete. Found {len(discovered_urls)} URLs ---")
    
    # Phase 3: Intelligent Structuring (The "Tree" Logic)
    return _build_url_tree(base_url, discovered_urls)

def _build_url_tree(base_url: str, urls: Set[str]) -> Dict:
    """
    Converts a flat list of URLs into a hierarchical directory tree.
    Example:
    /products/toilet/a -> products -> toilet -> a
    """
    # Sort URLs to ensure parent folders usually come before children
    sorted_urls = sorted(list(urls))
    
    # The Root Node
    tree = {
        'id': 'root',
        'name': base_url,
        'type': 'root',
        'children': {}, # Keyed by segment name for easy lookup
        'count': len(sorted_urls),
        'urls': [] # URLs that belong directly to this node (e.g. the home page)
    }
    
    for url in sorted_urls:
        parsed = urlparse(url)
        path = parsed.path.strip('/')
        segments = [s for s in path.split('/') if s]
        
        current_node = tree
        
        # Traverse the path to find/create the correct folder
        for i, segment in enumerate(segments):
            # If this is the last segment, it might be a file (page) or a folder
            # For simplicity in web routing, we treat everything as a node that can contain pages
            
            if segment not in current_node['children']:
                # Create new folder node
                current_node['children'][segment] = {
                    'id': f"{current_node['id']}-{segment}",
                    'name': segment.replace('-', ' ').replace('_', ' ').title(),
                    'type': 'folder',
                    'children': {},
                    'urls': [],
                    'total_descendants': 0
                }
            
            current_node = current_node['children'][segment]
            current_node['total_descendants'] += 1
            
        # Add the URL to the final node
        current_node['urls'].append({
            'url': url,
            'title': segments[-1].replace('-', ' ').replace('_', ' ').title() if segments else "Home"
        })

    # Helper to convert dict-of-children to list-of-children (for Frontend React)
    def dict_to_list(node):
        children_list = []
        for key, child in node['children'].items():
            children_list.append(dict_to_list(child))
        
        # Sort children: Folders first, then alphabetically
        children_list.sort(key=lambda x: x['name'])
        
        return {
            'id': node['id'],
            'name': node['name'],
            'type': node['type'],
            'children': children_list,
            'urls': node['urls'],
            'count': len(node['urls']) + node.get('total_descendants', 0)
        }

    return {
        'base_url': base_url,
        'total_count': len(sorted_urls),
        'tree': dict_to_list(tree)
    }
