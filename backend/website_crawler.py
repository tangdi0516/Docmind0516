import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import Set, List

def crawl_website(base_url: str, max_pages: int = 50) -> List[str]:
    """
    Crawl a website starting from base_url and discover all internal pages.
    
    Args:
        base_url: The starting URL to crawl
        max_pages: Maximum number of pages to discover (default 50)
    
    Returns:
        List of discovered URLs
    """
    # Normalize base URL
    if not base_url.startswith(('http://', 'https://')):
        base_url = 'https://' + base_url
    
    # Parse base URL to get domain
    parsed_base = urlparse(base_url)
    base_domain = parsed_base.netloc
    
    # Sets to track visited and to-visit URLs
    discovered_urls: Set[str] = set()
    to_visit: Set[str] = {base_url}
    visited: Set[str] = set()
    
    while to_visit and len(discovered_urls) < max_pages:
        current_url = to_visit.pop()
        
        if current_url in visited:
            continue
            
        visited.add(current_url)
        
        try:
            # Fetch the page
            response = requests.get(current_url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (DocMind Bot)'
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
            
            # Parse HTML and find links
            soup = BeautifulSoup(response.text, 'html.parser')
            
            for link in soup.find_all('a', href=True):
                href = link['href']
                
                # Convert relative URLs to absolute
                absolute_url = urljoin(current_url, href)
                
                # Parse the URL
                parsed_url = urlparse(absolute_url)
                
                # Only include URLs from the same domain
                if parsed_url.netloc != base_domain:
                    continue
                
                # Remove fragment (#) and query parameters for cleaner URLs
                clean_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
                
                # Avoid common non-content pages
                skip_patterns = [
                    '/wp-admin', '/wp-login', '/admin', '/login',
                    '/cart', '/checkout', '/account',
                    '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.exe'
                ]
                
                if any(pattern in clean_url.lower() for pattern in skip_patterns):
                    continue
                
                # Add to queue if not visited
                if clean_url not in visited and clean_url not in discovered_urls:
                    to_visit.add(clean_url)
                    
        except Exception as e:
            print(f"Error crawling {current_url}: {e}")
            continue
    
    return sorted(list(discovered_urls))
