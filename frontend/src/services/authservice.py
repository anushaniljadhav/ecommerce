# Simple Python auth service using requests.
# Adjust BASE_URL to point to your backend and install requests (pip install requests).

try:
    import requests  # type: ignore
except Exception:
    # Minimal fallback using urllib to provide a subset of requests.Session functionality
    import urllib.request
    import urllib.error
    import ssl
    import json as _json

    class _SimpleResponse:
        def __init__(self, status, headers, body, url):
            self.status_code = status
            self.headers = headers
            self._body = body
            self.url = url
            self.text = body.decode('utf-8', errors='replace') if isinstance(body, (bytes, bytearray)) else str(body)

        def raise_for_status(self):
            if not (200 <= self.status_code < 300):
                raise Exception(self.text or f"HTTP {self.status_code}")

        def json(self):
            return _json.loads(self.text)

    class _SimpleSession:
        def __init__(self):
            self._context = ssl.create_default_context()

        def _request(self, method, url, data=None, headers=None):
            req = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
            try:
                with urllib.request.urlopen(req, context=self._context) as resp:
                    body = resp.read()
                    return _SimpleResponse(resp.getcode(), dict(resp.getheaders()), body, resp.geturl())
            except urllib.error.HTTPError as e:
                body = e.read() if hasattr(e, "read") else b""
                headers = dict(e.headers) if hasattr(e, "headers") else {}
                return _SimpleResponse(e.code, headers, body, getattr(e, "url", url))

        def get(self, url, **kwargs):
            return self._request("GET", url, headers=kwargs.get("headers"))

        def post(self, url, json=None, **kwargs):
            headers = dict(kwargs.get("headers") or {})
            data = None
            if json is not None:
                data = _json.dumps(json).encode("utf-8")
                headers.setdefault("Content-Type", "application/json")
            return self._request("POST", url, data=data, headers=headers)

        def put(self, url, json=None, **kwargs):
            headers = dict(kwargs.get("headers") or {})
            data = None
            if json is not None:
                data = _json.dumps(json).encode("utf-8")
                headers.setdefault("Content-Type", "application/json")
            return self._request("PUT", url, data=data, headers=headers)

    session = _SimpleSession()
else:
    session = requests.Session()

BASE_URL = "http://localhost:8000"  # change to your API base URL


def _handle_response(response):
    try:
        response.raise_for_status()
    except Exception as e:
        # try to return JSON error details if available
        try:
            error_data = response.json()
        except ValueError:
            error_data = response.text
        raise Exception(error_data) from e
    try:
        return response.json()
    except ValueError:
        return response.text


def login(email, password):
    resp = session.post(f"{BASE_URL}/login", json={"email": email, "password": password})
    return _handle_response(resp)


def register(user_data):
    resp = session.post(f"{BASE_URL}/register", json=user_data)
    return _handle_response(resp)


def get_profile():
    resp = session.get(f"{BASE_URL}/profile")
    return _handle_response(resp)


def update_profile(user_data):
    resp = session.put(f"{BASE_URL}/profile", json=user_data)
    return _handle_response(resp)