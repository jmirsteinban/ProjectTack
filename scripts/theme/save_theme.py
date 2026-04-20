from __future__ import annotations

import argparse
import sys

from theme_io import ThemeIoError, save_theme


def main() -> int:
    parser = argparse.ArgumentParser(description="Safely save Theme Manager tokens into Chrome/styles/projecttrack.css.")
    parser.add_argument("css_file", nargs="?", help="File containing a :root { ... } block. If omitted, stdin is used.")
    parser.add_argument("--create-block", action="store_true", help="Create the marked Theme Manager block if it is missing.")
    args = parser.parse_args()

    if args.css_file:
        with open(args.css_file, "r", encoding="utf-8") as handle:
            root_block = handle.read()
    else:
        root_block = sys.stdin.read()

    try:
        result = save_theme(root_block, create_if_missing=args.create_block)
    except ThemeIoError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print("Theme saved successfully.")
    print(f"CSS: {result['css_path']}")
    print(f"Backup: {result['backup']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
