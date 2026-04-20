from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote

from theme_io import (
    ThemeIoError,
    backups_dir,
    list_backups,
    read_project_css,
    restore_backup,
    save_theme,
)


HOST = "127.0.0.1"
PORT = 4177


class ThemeManagerHandler(BaseHTTPRequestHandler):
    server_version = "ProjectTrackThemeManager/1.0"

    def log_message(self, format, *args):
        print(f"[theme-manager] {self.address_string()} - {format % args}")

    def _send_json(self, payload, status=200):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(data)

    def _read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8")
        return json.loads(raw or "{}")

    def do_OPTIONS(self):
        self._send_json({"ok": True})

    def do_GET(self):
        try:
            if self.path == "/api/health":
                self._send_json({"ok": True, "mode": "python-server", "port": PORT})
                return

            if self.path == "/api/theme":
                self._send_json({
                    "ok": True,
                    "css": read_project_css(),
                    "backups": list_backups(),
                })
                return

            if self.path == "/api/backups":
                self._send_json({"ok": True, "backups": list_backups()})
                return

            if self.path.startswith("/api/backups/"):
                name = unquote(self.path.removeprefix("/api/backups/"))
                backup_path = (backups_dir() / name).resolve()
                if backup_path.parent != backups_dir() or not backup_path.exists():
                    raise ThemeIoError("Backup was not found.")
                self._send_json({"ok": True, "name": backup_path.name, "css": backup_path.read_text(encoding="utf-8")})
                return

            self._send_json({"ok": False, "error": "Not found."}, status=404)
        except (ThemeIoError, OSError, json.JSONDecodeError) as error:
            self._send_json({"ok": False, "error": str(error)}, status=400)

    def do_POST(self):
        try:
            payload = self._read_json()

            if self.path == "/api/theme":
                result = save_theme(
                    payload.get("css", ""),
                    create_if_missing=bool(payload.get("createBlock")),
                )
                self._send_json({"ok": True, **result, "css": read_project_css(), "backups": list_backups()})
                return

            if self.path == "/api/restore":
                result = restore_backup(payload.get("name", ""))
                self._send_json({"ok": True, **result, "css": read_project_css(), "backups": list_backups()})
                return

            self._send_json({"ok": False, "error": "Not found."}, status=404)
        except (ThemeIoError, OSError, json.JSONDecodeError) as error:
            self._send_json({"ok": False, "error": str(error)}, status=400)


def main():
    server = ThreadingHTTPServer((HOST, PORT), ThemeManagerHandler)
    print(f"ProjectTrack Theme Manager server running at http://{HOST}:{PORT}")
    print("Press Ctrl+C to stop.")
    server.serve_forever()


if __name__ == "__main__":
    main()
