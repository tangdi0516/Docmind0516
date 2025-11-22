import asyncio
from playwright.async_api import async_playwright
try:
    from playwright_stealth import stealth_async
except ImportError:
    stealth_async = None

import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from typing import Set, List, Dict, Any
import time
import random
import re

# Realistic User Agents
USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
]

async def crawl_website(base_url: str, max_pages: int = 3000, max_time: int = 120) -> Dict:
    """
    Professional Website Crawler with Triple Fallback Strategy:
    1. Sitemap (Fastest, most reliable for structured sites)
    2. Playwright (Best for JS-heavy sites, but resource intensive)
    3. Requests BFS (Fallback for when Playwright fails in restricted envs)
    """
    start_time = time.time()
    debug_logs = []
    
    try:
        if not base_url.startswith(('http://', 'https://')):
            base_url = 'https://' + base_url
        
        parsed_base = urlparse(base_url)
        base_domain = parsed_base.netloc
        
        discovered_urls: Set[str] = set()
        
        debug_logs.append(f"Starting scan for {base_domain}")

        # --- Phase 1: Sitemap Discovery ---
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
                    debug_logs.append(f"Checking Sitemap: {sm_url}")
                    resp = requests.get(sm_url, timeout=10, headers={'User-Agent': 'Googlebot/2.1'})
                    if resp.status_code == 200:
                        # Extract URLs (simple regex is faster and more robust for XML variations)
                        urls = re.findall(r'<loc>(https?://[^<]+)</loc>', resp.text)
                        for url in urls:
                            if base_domain in url:
                                discovered_urls.add(url.strip())
                except Exception:
                    continue
            
            if discovered_urls:
                debug_logs.append(f"Sitemap found {len(discovered_urls)} URLs")
        except Exception as e:
            debug_logs.append(f"Sitemap error: {str(e)}")

        # --- Phase 2: Playwright Deep Scan ---
        # Only if Sitemap yielded few results
        if len(discovered_urls) < 5:
            debug_logs.append("Sitemap yielded low results. Attempting Playwright...")
            try:
                async with async_playwright() as p:
                    browser = await p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
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
                            resp = await page.goto(url, timeout=15000, wait_until='domcontentloaded')
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
                    debug_logs.append(f"Playwright found {len(discovered_urls)} URLs")
            except Exception as e:
                debug_logs.append(f"Playwright failed: {str(e)}")
                # Fallback to Phase 3 will happen next

        # --- Phase 3: Requests BFS (Fallback) ---
        # If we still have very few URLs (meaning Playwright failed or site is JS-heavy but Playwright crashed)
        if len(discovered_urls) < 5:
            debug_logs.append("Playwright failed or yielded low results. Falling back to Requests BFS...")
            try:
                visited = set()
                to_visit = [base_url]
                session = requests.Session()
                session.headers.update({'User-Agent': random.choice(USER_AGENTS)})
                
                while to_visit and len(discovered_urls) < max_pages:
                    if time.time() - start_time > max_time: break
                    
                    url = to_visit.pop(0)
                    if url in visited: continue
                    visited.add(url)
                    
                    try:
                        resp = session.get(url, timeout=10)
                        if resp.status_code == 200:
                            discovered_urls.add(url)
                            soup = BeautifulSoup(resp.text, 'html.parser')
                            for a in soup.find_all('a', href=True):
                                link = urljoin(url, a['href'])
                                parsed = urlparse(link)
                                if parsed.netloc == base_domain:
                                    clean = link.split('#')[0]
                                    if clean not in visited and clean not in discovered_urls and clean not in to_visit:
                                        to_visit.append(clean)
                    except Exception:
                        continue
                debug_logs.append(f"Requests BFS found {len(discovered_urls)} URLs")
            except Exception as e:
                debug_logs.append(f"Requests BFS failed: {str(e)}")

        debug_logs.append(f"Scan complete. Total found: {len(discovered_urls)}")
        
        # Build Tree
        return {
            **_build_url_tree(base_url, discovered_urls),
            'debug_logs': debug_logs
        }

    except Exception as e:
        # Catastrophic failure catch-all
        print(f"CRITICAL CRAWLER ERROR: {e}")
        return {
            'base_url': base_url,
            'total_count': 0,
            'tree': None,
            'debug_logs': debug_logs + [f"Critical Error: {str(e)}"]
        }

def _build_url_tree(base_url: str, urls: Set[str]) -> Dict:
    """
    Converts a flat list of URLs into a hierarchical directory tree.
    """
    sorted_urls = sorted(list(urls))
    
    tree = {
        'id': 'root',
        'name': base_url,
        'type': 'root',
        'children': {},
        'count': len(sorted_urls),
        'urls': []
    }
    
    for url in sorted_urls:
        parsed = urlparse(url)
        path = parsed.path.strip('/')
        segments = [s for s in path.split('/') if s]
        
        current_node = tree
        
        for i, segment in enumerate(segments):
            if segment not in current_node['children']:
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
            
        current_node['urls'].append({
            'url': url,
            'title': segments[-1].replace('-', ' ').replace('_', ' ').title() if segments else "Home"
        })

    def dict_to_list(node):
        children_list = []
        for key, child in node['children'].items():
            children_list.append(dict_to_list(child))
        
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
