import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import Set, List, Dict
from collections import defaultdict, deque
import time
import xml.etree.ElementTree as ET

def crawl_website(base_url: str, max_pages: int = 3000, max_time: int = 120) -> Dict:
    """
    Crawl a website starting from base_url.
    Strategy:
    1. Try to find and parse sitemap.xml (Best for dynamic sites like bandh.com.au)
    2. If no sitemap, fall back to BFS crawling
    """
    try:
        start_time = time.time()
        
        # Normalize base URL
        if not base_url.startswith(('http://', 'https://')):
            base_url = 'https://' + base_url
        
        parsed_base = urlparse(base_url)
        base_domain = parsed_base.netloc
        
        if not base_domain:
            raise ValueError(f"Invalid URL: {base_url}")

        discovered_urls: Set[str] = set()
        
        # --- STRATEGY 1: Try Sitemap Parsing ---
        print(f"Attempting Sitemap strategy for {base_domain}...")
        
        # Common sitemap locations
        sitemap_urls = [
            f"{parsed_base.scheme}://{base_domain}/sitemap.xml",
            f"{parsed_base.scheme}://{base_domain}/sitemap_index.xml",
            f"{parsed_base.scheme}://{base_domain}/robots.txt" # Sometimes linked here
        ]
        
        session = requests.Session()
        headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept': '*/*'
        }
        
        for sitemap_url in sitemap_urls:
            try:
                if len(discovered_urls) >= max_pages:
                    break
                    
                print(f"Checking sitemap: {sitemap_url}")
                resp = session.get(sitemap_url, headers=headers, timeout=10)
                
                if resp.status_code == 200:
                    # If it's robots.txt, look for Sitemap: line
                    if 'robots.txt' in sitemap_url:
                        for line in resp.text.splitlines():
                            if line.lower().startswith('sitemap:'):
                                found_sitemap = line.split(':', 1)[1].strip()
                                sitemap_urls.append(found_sitemap)
                        continue

                    # Parse XML
                    try:
                        root = ET.fromstring(resp.content)
                        # Handle namespaces (common in sitemaps)
                        namespaces = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
                        
                        # Check if it's a sitemap index (links to other sitemaps)
                        # Try both with and without namespace
                        sitemaps = root.findall('ns:sitemap', namespaces) or root.findall('sitemap')
                        if sitemaps:
                            print(f"Found sitemap index with {len(sitemaps)} sub-sitemaps")
                            for sm in sitemaps:
                                loc = sm.find('ns:loc', namespaces) or sm.find('loc')
                                if loc is not None and loc.text:
                                    sitemap_urls.append(loc.text)
                        else:
                            # It's a regular sitemap with URLs
                            urls = root.findall('ns:url', namespaces) or root.findall('url')
                            print(f"Found {len(urls)} URLs in sitemap")
                            for url_tag in urls:
                                loc = url_tag.find('ns:loc', namespaces) or url_tag.find('loc')
                                if loc is not None and loc.text:
                                    clean_url = loc.text.strip()
                                    if urlparse(clean_url).netloc == base_domain:
                                        discovered_urls.add(clean_url)
                                        if len(discovered_urls) >= max_pages:
                                            break
                    except ET.ParseError:
                        print("Failed to parse XML")
                        continue
            except Exception as e:
                print(f"Error checking sitemap {sitemap_url}: {e}")
                continue

        # If Sitemap strategy worked well, return early
        if len(discovered_urls) > 10:
            print(f"Sitemap strategy successful! Found {len(discovered_urls)} URLs.")
            return _format_results(base_url, discovered_urls)

        # --- STRATEGY 2: Fallback to BFS Crawling (Existing Logic) ---
        print("Sitemap strategy yielded few results. Falling back to BFS crawl...")
        
        # Use deque for BFS (breadth-first search) - ensures we explore all levels
        to_visit = deque([base_url])
        visited: Set[str] = set()
        
        error_count = 0
        max_errors = 50
        
        # First, test if the site is accessible
        print(f"Testing connectivity to {base_url}...")
        try:
            test_response = requests.get(base_url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }, allow_redirects=True)
            
            if test_response.status_code == 403:
                print("WARNING: Site returned 403 Forbidden.")
        except Exception as e:
            print(f"WARNING: Initial connectivity test failed: {e}")
        
        while to_visit and len(discovered_urls) < max_pages and error_count < max_errors:
            # Check time limit
            elapsed = time.time() - start_time
            if elapsed > max_time:
                print(f"Time limit reached ({elapsed:.1f}s).")
                break
                
            current_url = to_visit.popleft()
            
            if current_url in visited:
                continue
                
            visited.add(current_url)
            
            try:
                time.sleep(0.05)
                
                session = requests.Session()
                response = session.get(current_url, timeout=15, headers={
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                }, allow_redirects=True, verify=True)
                
                if response.status_code != 200:
                    continue
                    
                content_type = response.headers.get('Content-Type', '')
                if 'text/html' not in content_type:
                    continue
                
                discovered_urls.add(current_url)
                
                if len(discovered_urls) % 10 == 0:
                    print(f"Progress: {len(discovered_urls)} pages...")
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    if not href or href.startswith(('#', 'javascript:', 'mailto:', 'tel:')):
                        continue
                    
                    try:
                        absolute_url = urljoin(current_url, href)
                        parsed_url = urlparse(absolute_url)
                        if parsed_url.netloc != base_domain:
                            continue
                        
                        clean_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
                        if parsed_url.query:
                            clean_url += f"?{parsed_url.query}"
                        
                        skip_patterns = ['.pdf', '.jpg', '.png', '.zip', '/wp-admin', '/login']
                        if any(p in clean_url.lower() for p in skip_patterns):
                            continue
                        
                        if clean_url not in visited and clean_url not in discovered_urls:
                            to_visit.append(clean_url)
                            
                    except Exception:
                        continue
                        
            except Exception as e:
                print(f"Error crawling {current_url}: {e}")
                error_count += 1
                continue
        
        return _format_results(base_url, discovered_urls)
    
    except Exception as e:
        print(f"Fatal error: {e}")
        return {
            'base_url': base_url,
            'total_count': 0,
            'groups': [],
            'all_urls': [],
            'error': str(e)
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

