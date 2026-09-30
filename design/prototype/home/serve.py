# Serves the built site (dist/) with the home page design variants layered on top, for the owner to compare.
#   python design/prototype/home/serve.py      then open  http://127.0.0.1:8773/proto/view.html
# A page asked for with ?v=bigger,real,... gets those variants' CSS (and JS, if any) added to its <head>,
# so every variant is the real page plus one small change. Nothing here touches the site's own code.
import http.server
import os
import sys
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", "dist"))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8773
VARIANTS = ("bigger", "real", "intro", "motion", "closed", "pull", "sound")


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        parsed = urllib.parse.urlparse(path).path
        if parsed.startswith("/proto/"):
            return os.path.join(HERE, parsed[len("/proto/"):])
        return os.path.join(ROOT, parsed.lstrip("/"))

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        wanted = [v for v in urllib.parse.parse_qs(url.query).get("v", [""])[0].split(",") if v in VARIANTS]
        page = os.path.join(ROOT, url.path.lstrip("/"), "index.html") if url.path.endswith("/") else None
        if not wanted or not page or not os.path.isfile(page):
            return super().do_GET()
        with open(page, encoding="utf-8") as file:
            html = file.read()
        extra = ""
        for name in wanted:
            extra += f'<link rel="stylesheet" href="/proto/v-{name}.css">'
            if os.path.isfile(os.path.join(HERE, f"v-{name}.js")):
                extra += f'<script defer src="/proto/v-{name}.js"></script>'
        body = html.replace("</head>", extra + "</head>", 1).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler) as httpd:
    print(f"Variants on http://127.0.0.1:{PORT}/proto/view.html")
    httpd.serve_forever()
