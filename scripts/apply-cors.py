#!/usr/bin/env python3
"""Aplica cors.json no bucket do Firebase Storage usando o access_token
do Firebase CLI (já autenticado em ~/.config/configstore/firebase-tools.json).

Uso:
    python scripts/apply-cors.py [bucket-name]

Se o bucket não for passado, usa 'milkypot-ad945.firebasestorage.app'.
"""
import json
import os
import sys
import time
import urllib.request
import urllib.parse
import urllib.error

BUCKET = sys.argv[1] if len(sys.argv) > 1 else 'milkypot-ad945.firebasestorage.app'
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
CORS_FILE = os.path.join(REPO, 'cors.json')
CONFIG = os.path.expanduser('~/.config/configstore/firebase-tools.json')

# Firebase CLI OAuth client (public)
CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'


def get_access_token():
    with open(CONFIG, 'r', encoding='utf-8') as f:
        data = json.load(f)
    tokens = data.get('tokens') or {}
    now_ms = int(time.time() * 1000)
    expires_at = tokens.get('expires_at', 0)
    access = tokens.get('access_token')
    refresh = tokens.get('refresh_token')

    if access and expires_at - now_ms > 60_000:
        return access

    if not refresh:
        raise SystemExit('Sem refresh_token disponivel — rode `firebase login` primeiro.')

    # Refresh
    body = urllib.parse.urlencode({
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'refresh_token': refresh,
        'grant_type': 'refresh_token',
    }).encode()
    req = urllib.request.Request(
        'https://oauth2.googleapis.com/token',
        data=body,
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
    )
    with urllib.request.urlopen(req) as resp:
        payload = json.loads(resp.read())
    return payload['access_token']


def apply_cors(bucket, token):
    with open(CORS_FILE, 'r', encoding='utf-8') as f:
        cors_body = json.load(f)

    body = json.dumps({'cors': cors_body}).encode()
    url = f'https://storage.googleapis.com/storage/v1/b/{urllib.parse.quote(bucket, safe="")}?fields=cors'
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        },
        method='PATCH',
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print('OK', resp.status)
            print(resp.read().decode())
    except urllib.error.HTTPError as e:
        print('ERRO HTTP', e.code)
        print(e.read().decode())
        raise


def show_cors(bucket, token):
    url = f'https://storage.googleapis.com/storage/v1/b/{urllib.parse.quote(bucket, safe="")}?fields=cors'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req) as resp:
        print('CORS atual:', resp.read().decode())


if __name__ == '__main__':
    token = get_access_token()
    print('Aplicando CORS em', BUCKET)
    apply_cors(BUCKET, token)
    print('---')
    show_cors(BUCKET, token)
