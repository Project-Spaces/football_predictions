"""
Scrape soccervista.com predictions page using FireCrawl.
Extracts match data including teams, leagues, form, and predictions.
"""

import os
import sys
import json
from dotenv import load_dotenv
from firecrawl import FirecrawlApp

load_dotenv()

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")

def scrape_predictions(url: str) -> str:
    """Scrape a soccervista page and return markdown content."""
    app = FirecrawlApp(api_key=FIRECRAWL_API_KEY)
    result = app.scrape(
        url,
        formats=["markdown"],
        wait_for=5000,  # wait 5s for JS to render
    )
    return getattr(result, "markdown", str(result))

def main():
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.soccervista.com"
    print(f"Scraping: {url}")
    content = scrape_predictions(url)

    # Save raw output
    os.makedirs(".tmp", exist_ok=True)
    output_path = ".tmp/soccervista_raw.md"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Content saved to {output_path}")
    print(f"Content length: {len(content)} chars")
    # Print first 3000 chars as preview
    print("\n--- PREVIEW ---")
    print(content[:3000])

if __name__ == "__main__":
    main()
