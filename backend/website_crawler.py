import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import Set, List, Dict
from collections import defaultdict, deque

def crawl_website(base_url: str, max_pages: int = 3000) -> Dict:
    """
    Crawl a website starting from base_url and discover all internal pages.
    Uses BFS (breadth-first search) to ensure deep crawling of all levels.
    
    Args:
        base_url: The starting URL to crawl
        max_pages: Maximum number of pages to discover (default 3000)
    
    Returns:
        Dictionary with discovered URLs organized by groups
    """
    # Normalize base URL
    if not base_url.startswith(('http://', 'https://')):
        base_url = 'https://' + base_url
    
    # Parse base URL to get domain
    parsed_base = urlparse(base_url)
    base_domain = parsed_base.netloc
    
    # Use deque for BFS (breadth-first search) - ensures we explore all levels
    discovered_urls: Set[str] = set()
    to_visit = deque([base_url])  # Changed from set to deque for BFS
    visited: Set[str] = set()
    
    print(f"Starting crawl of {base_url} (max {max_pages} pages)")
    
    while to_visit and len(discovered_urls) < max_pages:
        current_url = to_visit.popleft()  # BFS: take from front of queue
        
        if current_url in visited:
            continue
            
        visited.add(current_url)
        
        try:
            # Fetch the page
            response = requests.get(current_url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            
            if response.status_code != 200:
                continue
                
            # Only process HTML content
            content_type = response.headers.get('Content-Type', '')
            if 'text/html' not in content_type:
                # Still add non-HTML URLs if they're from the same domain
                if urlparse(current_url).netloc == base_domain:
                    discovered_urls.add(current_url)
                continue
            
            discovered_urls.add(current_url)
            
            if len(discovered_urls) % 50 == 0:
                print(f"Progress: {len(discovered_urls)} pages discovered...")
            
            # Parse HTML and find links
            soup = BeautifulSoup(response.text, 'html.parser')
            
            for link in soup.find_all('a', href=True):
                href = link['href']
                
                # Skip empty hrefs, javascript, mailto, tel links
                if not href or href.startswith(('#', 'javascript:', 'mailto:', 'tel:')):
                    continue
                
                # Convert relative URLs to absolute
                absolute_url = urljoin(current_url, href)
                
                # Parse the URL
                parsed_url = urlparse(absolute_url)
                
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
                    '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.exe', '.mp4'
                ]
                
                if any(pattern in clean_url.lower() for pattern in skip_patterns):
                    continue
                
                # Add to queue if not visited and not already queued
                if clean_url not in visited and clean_url not in discovered_urls:
                    to_visit.append(clean_url)  # BFS: add to end of queue
                    
        except Exception as e:
            print(f"Error crawling {current_url}: {e}")
            continue
    
    print(f"Crawling complete: {len(discovered_urls)} pages discovered")
    
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


