
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import re

HOST = "127.0.0.1"
PORT = 8001

TOKENS = {
    "token-user-a": "user-a",
    "token-user-b": "user-b",
}

DOCUMENTS = {
    "101": {"owner": "user-a", "title": "Private document A"},
    "202": {"owner": "user-b", "title": "Private document B"},
}


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/":
            return self.send_json(200, {
                "name": "ChainShield IDOR Test Target",
                "endpoints": ["/api/documents/101", "/api/documents/202"]
            })

        match = re.fullmatch(r"/api/documents/(\d+)", self.path)
        if not match:
            return self.send_json(404, {"error": "Not found"})

        token = self.headers.get("Authorization", "").removeprefix("Bearer ")
        user = TOKENS.get(token)

        if not user:
            return self.send_json(401, {"error": "Unauthorized"})

        document_id = match.group(1)
        document = DOCUMENTS.get(document_id)

        if not document:
            return self.send_json(404, {"error": "Document not found"})

        if document["owner"] != user:
            return self.send_json(403, {"error": "Forbidden"})

        return self.send_json(200, {
            "id": document_id,
            "title": document["title"],
            "owner": document["owner"]
        })

    def log_message(self, format, *args):
        print("%s - %s" % (self.address_string(), format % args))


if __name__ == "__main__":
    print(f"ChainShield IDOR Test Target: http://{HOST}:{PORT}")
    HTTPServer((HOST, PORT), Handler).serve_forever()
