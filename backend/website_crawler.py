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

async def crawl_website(base_url: str, max_pages=500, max_time=120):
    """
    Crawl a website and return discovered URLs in a tree structure.
    This uses a multi-phase approach:
    1. Try sitemap.xml
    2. (Playwright disabled by default on Railway)
    3. Fallback to requests-based BFS
    """
    debug_logs = []
    start_time = time.time()
    
    # Normalize URL - add https:// if missing
    if not base_url.startswith(('http://', 'https://')):
        base_url = 'https://' + base_url
        debug_logs.append(f"Auto-added https:// prefix. Final URL: {base_url}")
    
    try:
        parsed = urlparse(base_url)
        base_domain = parsed.netloc
        
        # Normalize domain: remove www. prefix for matching purposes
        normalized_domain = base_domain.replace('www.', '') if base_domain.startswith('www.') else base_domain
        
        discovered_urls: Set[str] = set()
        
        debug_logs.append(f"Starting scan for {base_domain} (normalized: {normalized_domain})")

        # --- Phase 1: Sitemap Discovery ---
        sitemap_urls = set()
        try:
            # 1. Check robots.txt
            robots_url = f"{parsed.scheme}://{base_domain}/robots.txt"
            resp = requests.get(robots_url, timeout=5, headers={'User-Agent': 'Googlebot/2.1'})
            if resp.status_code == 200:
                for line in resp.text.splitlines():
                    if line.lower().startswith('sitemap:'):
                        sitemap_urls.add(line.split(':', 1)[1].strip())
            
            # 2. Standard locations
            sitemap_urls.add(f"{parsed.scheme}://{base_domain}/sitemap.xml")
            sitemap_urls.add(f"{parsed.scheme}://{base_domain}/sitemap_index.xml")
            
            for sm_url in list(sitemap_urls):
                try:
                    debug_logs.append(f"Checking Sitemap: {sm_url}")
                    resp = requests.get(sm_url, timeout=10, headers={'User-Agent': 'Googlebot/2.1'})
                    if resp.status_code == 200:
                        # Extract URLs (simple regex is faster and more robust for XML variations)
                        urls = re.findall(r'<loc>(https?://[^<]+)</loc>', resp.text)
                        for url in urls:
                            # Skip sitemap URLs themselves, only keep actual pages
                            if 'sitemap' in url.lower() and url.lower().endswith('.xml'):
                                continue
                            if normalized_domain in url or base_domain in url:
                                discovered_urls.add(url.strip())
                except Exception:
                    continue
            
            if discovered_urls:
                debug_logs.append(f"Sitemap found {len(discovered_urls)} URLs")
        except Exception as e:
            debug_logs.append(f"Sitemap error: {str(e)}")

        # --- Phase 2: Playwright Deep Scan ---
        # Enable for sites with anti-bot protection (like Cloudflare)
        if len(discovered_urls) < 5:
            debug_logs.append(f"Sitemap yielded {len(discovered_urls)} URLs. Attempting Playwright...")
            try:
                from playwright.async_api import async_playwright
                
                async with async_playwright() as p:
                    browser = await p.chromium.launch(
                        headless=True,
                        args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                    )
                    context = await browser.new_context(
                        user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        viewport={'width': 1920, 'height': 1080'},
                        locale='en-US'
                    )
                    page = await context.new_page()
                    
                    visited = set()
                    to_visit = [base_url]
                    
                    while to_visit and len(discovered_urls) < max_pages:
                        if time.time() - start_time > max_time: 
                            debug_logs.append("Playwright timed out")
                            break
                        
                        url = to_visit.pop(0)
                        if url in visited: continue
                        visited.add(url)
                        
                        try:
                            resp = await page.goto(url, timeout=30000, wait_until='domcontentloaded')
                            if resp and resp.status == 200:
                                discovered_urls.add(url)
                                debug_logs.append(f"Playwright: Fetched {url} - Status 200")
                                
                                # Extract links
                                links = await page.evaluate("""
                                    () => Array.from(document.querySelectorAll('a[href]'))
                                        .map(a => a.href)
                                        .filter(href => href.startsWith('http'))
                                """)
                                
                                links_found = 0
                                for link in links:
                                    parsed = urlparse(link)
                                    if parsed.netloc.replace('www.', '') == normalized_domain:
                                        clean = link.split('#')[0].split('?')[0]
                                        if clean not in visited and clean not in discovered_urls and clean not in to_visit:
                                            to_visit.append(clean)
                                            links_found += 1
                                debug_logs.append(f"Playwright: Found {links_found} new links")
                        except Exception as page_error:
                            debug_logs.append(f"Playwright: Failed {url}: {str(page_error)}")
                            continue
                    
                    await browser.close()
                    debug_logs.append(f"Playwright found {len(discovered_urls)} URLs total")
            except ImportError:
                debug_logs.append("Playwright not available, skipping...")
            except Exception as e:
                debug_logs.append(f"Playwright failed: {str(e)}")
                # Fallback to requests BFS

        # --- Phase 3: Requests BFS (Fallback) ---
        # Always use BFS if we found very few URLs from sitemap
        if len(discovered_urls) < 5:
            debug_logs.append(f"Starting Requests BFS fallback (currently have {len(discovered_urls)} URLs)...")
            try:
                visited = set()
                to_visit = [base_url]
                session = requests.Session()
                
                # Advanced anti-detection headers
                session.headers.update({
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    'Cache-Control': 'max-age=0',
                    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"'
                })
                
                # Add initial cookies to look more like a real browser
                session.cookies.set('visited', 'true', domain=base_domain.replace('www.', ''))
                
                while to_visit and len(discovered_urls) < max_pages:
                    if time.time() - start_time > max_time: 
                        debug_logs.append("BFS timed out")
                        break
                    
                    url = to_visit.pop(0)
                    if url in visited: continue
                    visited.add(url)
                    
                    try:
                        # Add slight delay to look more human
                        import time as time_module
                        time_module.sleep(0.5)
                        
                        # Add Referer header for subsequent requests
                        headers = {}
                        if len(visited) > 1:
                            headers['Referer'] = base_url
                        
                        resp = session.get(url, timeout=15, headers=headers, allow_redirects=True)
                        debug_logs.append(f"BFS: Fetched {url} - Status {resp.status_code}")
                        
                        if resp.status_code == 200:
                            discovered_urls.add(url)
                            soup = BeautifulSoup(resp.text, 'html.parser')
                            links_found = 0
                            for a in soup.find_all('a', href=True):
                                link = urljoin(url, a['href'])
                                parsed = urlparse(link)
                                if parsed.netloc.replace('www.', '') == normalized_domain:
                                    clean = link.split('#')[0].split('?')[0]  # Remove query params too
                                    if clean not in visited and clean not in discovered_urls and clean not in to_visit:
                                        to_visit.append(clean)
                                        links_found += 1
                            debug_logs.append(f"BFS: Found {links_found} new links on {url}")
                    except Exception as req_error:
                        debug_logs.append(f"BFS: Failed to fetch {url}: {str(req_error)}")
                        continue
                        
                debug_logs.append(f"Requests BFS found {len(discovered_urls)} URLs total")
            except Exception as e:
                debug_logs.append(f"Requests BFS exception: {str(e)}")
                import traceback
                debug_logs.append(f"BFS Traceback: {traceback.format_exc()}")

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
