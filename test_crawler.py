import sys
sys.path.append('/Users/ditang/gemini-project/antigravity/scratch/backend')

from website_crawler import crawl_website

# Test with a simple website
print("Testing crawler with example.com...")
result = crawl_website("https://example.com", max_pages=10)
print(f"Result: {result}")
