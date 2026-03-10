#!/usr/bin/env python3
"""
Simple script to create a test WordPress post via the WP REST API.
Reads WP_USER and WP_PASS from environment. Posts as draft by default.

Usage:
  export WP_USER=youruser
  export WP_PASS=yourpass
  python scripts/wp_create_post.py --site https://dplouffe.ca --title "My test post" --content "Hello world"

Note: This uses basic HTTP auth (WordPress application passwords or a basic-auth plugin may be required).
"""

import os
import sys
import argparse
import base64
import requests


def make_auth_header(user, pwd):
    token = base64.b64encode(f"{user}:{pwd}".encode()).decode()
    return {"Authorization": f"Basic {token}"}


def create_post(site, user, pwd, title, content, status='draft'):
    api = site.rstrip('/') + '/wp-json/wp/v2/posts'
    headers = {'Content-Type': 'application/json'}
    headers.update(make_auth_header(user,pwd))
    payload = {
        'title': title,
        'content': content,
        'status': status
    }
    r = requests.post(api, json=payload, headers=headers, timeout=30)
    return r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--site', required=True, help='Base site URL, e.g. https://dplouffe.ca')
    ap.add_argument('--title', default='Test post from script')
    ap.add_argument('--content', default='This is a test post created by a script.')
    ap.add_argument('--status', default='draft')
    args = ap.parse_args()

    user = os.environ.get('WP_USER')
    pwd = os.environ.get('WP_PASS')
    if not user or not pwd:
        print('ERROR: WP_USER and WP_PASS must be set in the environment')
        sys.exit(2)

    try:
        r = create_post(args.site, user, pwd, args.title, args.content, args.status)
    except Exception as e:
        print('Request failed:', e)
        sys.exit(1)

    if r.status_code in (200,201):
        print('Post created successfully:')
        print(r.json().get('link'))
        sys.exit(0)
    else:
        print('Failed to create post. Status:', r.status_code)
        try:
            print(r.json())
        except Exception:
            print(r.text)
        sys.exit(1)

if __name__ == '__main__':
    main()
