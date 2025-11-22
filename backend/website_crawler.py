import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import Set, List, Dict
from collections import defaultdict, deque
import time

def crawl_website(base_url: str, max_pages: int = 3000, max_time: int = 120) -> Dict:
    """
    Crawl a website starting from base_url and discover all internal pages.
    Uses BFS (breadth-first search) to ensure deep crawling of all levels.
    
    Args:
        base_url: The starting URL to crawl
        max_pages: Maximum number of pages to discover (default 3000)
        max_time: Maximum time in seconds to crawl (default 120s = 2 minutes)
    
    Returns:
        Dictionary with discovered URLs organized by groups
    """
    try:
        start_time = time.time()
        
        # Normalize base URL
        if not base_url.startswith(('http://', 'https://')):
            base_url = 'https://' + base_url
        
        # Parse base URL to get domain
        parsed_base = urlparse(base_url)
        base_domain = parsed_base.netloc
        
        if not base_domain:
            raise ValueError(f"Invalid URL: {base_url}")
        
        # Use deque for BFS (breadth-first search) - ensures we explore all levels
        discovered_urls: Set[str] = set()
        to_visit = deque([base_url])  # Changed from set to deque for BFS
        visited: Set[str] = set()
        
        print(f"Starting crawl of {base_url} (max {max_pages} pages, {max_time}s timeout)")
        print(f"Base domain: {base_domain}")
        
        error_count = 0
        max_errors = 50  # Stop if too many errors
        
        # First, test if the site is accessible
        print(f"Testing connectivity to {base_url}...")
        try:
            test_response = requests.get(base_url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }, allow_redirects=True)
            print(f"Initial test: Status {test_response.status_code}, Content-Type: {test_response.headers.get('Content-Type', 'unknown')}")
            
            if test_response.status_code == 403:
                print("WARNING: Site returned 403 Forbidden. The site may block automated crawlers.")
            elif test_response.status_code >= 400:
                print(f"WARNING: Site returned status {test_response.status_code}")
        except Exception as e:
            print(f"WARNING: Initial connectivity test failed: {e}")
        
        while to_visit and len(discovered_urls) < max_pages and error_count < max_errors:
            # Check time limit
            elapsed = time.time() - start_time
            if elapsed > max_time:
                print(f"Time limit reached ({elapsed:.1f}s). Stopping crawl with {len(discovered_urls)} pages.")
                break
            current_url = to_visit.popleft()  # BFS: take from front of queue
            
            if current_url in visited:
                continue
                
            visited.add(current_url)
            
            try:
                # Add small delay to be polite (reduced from 0.1 to 0.05 for faster crawling)
                time.sleep(0.05)
                
                # Create a session to maintain cookies and connection
                session = requests.Session()
                
                # Fetch the page with comprehensive browser-like headers
                response = session.get(current_url, timeout=15, headers={
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Cache-Control': 'max-age=0',
                    'DNT': '1',
                }, allow_redirects=True, verify=True)
                
                if response.status_code == 403:
                    print(f"Access forbidden (403) on {current_url} - site may block crawlers")
                    error_count += 1
                    continue
                elif response.status_code == 503:
                    print(f"Service unavailable (503) on {current_url}")
                    error_count += 1
                    continue
                elif response.status_code != 200:
                    print(f"Skipping {current_url} (status {response.status_code})")
                    continue
                    
                # Only process HTML content
                content_type = response.headers.get('Content-Type', '')
                if 'text/html' not in content_type:
                    # Still add non-HTML URLs if they're from the same domain
                    if urlparse(current_url).netloc == base_domain:
                        discovered_urls.add(current_url)
                    continue
                
                discovered_urls.add(current_url)
                
                if len(discovered_urls) % 10 == 0:
                    print(f"Progress: {len(discovered_urls)} pages discovered, {len(to_visit)} in queue...")
                
                # Parse HTML and find links
                soup = BeautifulSoup(response.text, 'html.parser')
                
                links_found = 0
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    
                    # Skip empty hrefs, javascript, mailto, tel links
                    if not href or href.startswith(('#', 'javascript:', 'mailto:', 'tel:')):
                        continue
                    
                    # Convert relative URLs to absolute
                    try:
                        absolute_url = urljoin(current_url, href)
                    except Exception:
                        continue
                    
                    # Parse the URL
                    try:
                        parsed_url = urlparse(absolute_url)
                    except Exception:
                        continue
                    
                    # Only include URLs from the same domain
                    if parsed_url.netloc != base_domain:
                        continue
                    
                    # Remove fragment (#) but KEEP query parameters (they might be important for products)
                    clean_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
                    if parsed_url.query:
                        clean_url += f"?{parsed_url.query}"
                    
                    # Less aggressive filtering - only skip obvious non-content
                    skip_patterns = [
                        '/wp-admin', '/wp-login', '/admin/', '/login',
                        '/cart', '/checkout', '/my-account',
                        '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.exe', '.mp4', '.css', '.js'
                    ]
                    
                    if any(pattern in clean_url.lower() for pattern in skip_patterns):
                        continue
                    
                    # Add to queue if not visited and not already queued
                    if clean_url not in visited and clean_url not in discovered_urls:
                        to_visit.append(clean_url)  # BFS: add to end of queue
                        links_found += 1
                
                if links_found > 0 and len(discovered_urls) <= 5:
                    print(f"Found {links_found} links on {current_url}")
                        
            except requests.exceptions.Timeout:
                print(f"Timeout on {current_url}")
                error_count += 1
            except requests.exceptions.RequestException as e:
                print(f"Request error on {current_url}: {e}")
                error_count += 1
            except Exception as e:
                print(f"Error crawling {current_url}: {e}")
                error_count += 1
                continue
        
        print(f"Crawling complete: {len(discovered_urls)} pages discovered")
        
        if error_count >= max_errors:
            print(f"Warning: Stopped due to too many errors ({error_count})")
        
        # Group URLs by path segments
        url_groups = defaultdict(list)
        
        for url in discovered_urls:
            parsed = urlparse(url)
            path = parsed.path.strip('/')
            
            if not path:
                # Root URL
                url_groups['Main'].append(url)
            else:
                # Get first path segment as group name
                first_segment = path.split('/')[0]
                group_name = first_segment.replace('-', ' ').replace('_', ' ').title()
                url_groups[group_name].append(url)
        
        # Sort URLs within each group
        for group in url_groups:
            url_groups[group].sort()
        
        # Convert to list of groups with metadata
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
    
    except Exception as e:
        print(f"Fatal error in crawl_website: {e}")
        import traceback
        traceback.print_exc()
        # Return empty result instead of crashing
        return {
            'base_url': base_url,
            'total_count': 0,
            'groups': [],
            'all_urls': [],
            'error': str(e)
        }

