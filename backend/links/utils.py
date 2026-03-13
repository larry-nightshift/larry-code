import re
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
import logging

logger = logging.getLogger(__name__)

TRACKING_PARAMS = {'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'}


def normalize_url(raw_url):
    """
    Normalize a URL for uniqueness checking.
    Returns (normalized_url, hostname).
    """
    # Parse the URL
    parsed = urlparse(raw_url.strip())

    # Lowercase the hostname
    hostname = parsed.hostname or parsed.netloc
    hostname = hostname.lower()

    # Remove tracking parameters
    query_params = parse_qs(parsed.query, keep_blank_values=True)
    filtered_params = {k: v for k, v in query_params.items() if k not in TRACKING_PARAMS}
    new_query = urlencode(filtered_params, doseq=True)

    # Reconstruct URL without trailing slash
    normalized = urlunparse((
        parsed.scheme.lower() or 'https',
        hostname,
        parsed.path.rstrip('/'),
        parsed.params,
        new_query,
        ''  # No fragment
    ))

    return normalized, hostname


def fetch_metadata(url, timeout=5):
    """
    Fetch metadata from a URL (best-effort, returns empty dict on failure).
    Returns dict with keys: title, site_name, image_url, favicon_url.
    MVP: Returns empty dict - metadata fetching can be implemented with requests+bs4 later.
    """
    # For MVP, just return empty dict
    # In a real implementation, would use requests + BeautifulSoup to extract metadata
    # from HTML head tags (og:title, og:image, favicon, etc.)
    return {}
