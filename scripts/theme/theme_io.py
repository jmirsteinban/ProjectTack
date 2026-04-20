from __future__ import annotations

import re
import shutil
from datetime import datetime
from pathlib import Path


START_MARKER = "/* THEME MANAGER TOKENS START */"
END_MARKER = "/* THEME MANAGER TOKENS END */"
ROOT_BLOCK_RE = re.compile(r":root\s*\{[\s\S]*?\}", re.MULTILINE)


class ThemeIoError(Exception):
    pass


def project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def project_css_path(root: Path | None = None) -> Path:
    base = root or project_root()
    return (base / "Chrome" / "styles" / "projecttrack.css").resolve()


def backups_dir(root: Path | None = None) -> Path:
    base = root or project_root()
    return (base / "Chrome" / "styles" / "backups").resolve()


def read_project_css(root: Path | None = None) -> str:
    css_path = project_css_path(root)
    return css_path.read_text(encoding="utf-8")


def normalize_root_block(css: str) -> str:
    text = css.strip()
    match = ROOT_BLOCK_RE.search(text)
    if not match:
        raise ThemeIoError("The submitted CSS must contain a :root { ... } block.")
    return match.group(0).strip()


def marked_block(root_block: str) -> str:
    return f"{START_MARKER}\n{normalize_root_block(root_block)}\n{END_MARKER}"


def validate_target(root: Path | None = None) -> Path:
    base = (root or project_root()).resolve()
    css_path = project_css_path(base)
    expected = (base / "Chrome" / "styles" / "projecttrack.css").resolve()
    if css_path != expected:
        raise ThemeIoError("Invalid CSS target.")
    if not css_path.exists():
        raise ThemeIoError("Chrome/styles/projecttrack.css was not found.")
    return css_path


def create_backup(root: Path | None = None) -> Path:
    css_path = validate_target(root)
    backup_dir = backups_dir(root)
    backup_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y-%m-%d-%H%M")
    target = backup_dir / f"projecttrack.{stamp}.css"
    counter = 2
    while target.exists():
        target = backup_dir / f"projecttrack.{stamp}-{counter}.css"
        counter += 1
    shutil.copy2(css_path, target)
    return target


def replace_theme_block(file_css: str, root_block: str, create_if_missing: bool = False) -> str:
    start_count = file_css.count(START_MARKER)
    end_count = file_css.count(END_MARKER)
    replacement = marked_block(root_block)

    if start_count != end_count:
        raise ThemeIoError("Theme Manager markers are unbalanced.")

    if start_count > 1:
        raise ThemeIoError("Multiple Theme Manager token blocks were found.")

    if start_count == 0:
        if not create_if_missing:
            raise ThemeIoError("Theme Manager token block was not found.")
        return f"{replacement}\n\n{file_css}"

    start = file_css.index(START_MARKER)
    end = file_css.index(END_MARKER, start) + len(END_MARKER)
    return f"{file_css[:start]}{replacement}{file_css[end:]}"


def save_theme(root_block: str, create_if_missing: bool = False, root: Path | None = None) -> dict:
    css_path = validate_target(root)
    current_css = css_path.read_text(encoding="utf-8")
    next_css = replace_theme_block(current_css, root_block, create_if_missing=create_if_missing)
    backup_path = create_backup(root)
    css_path.write_text(next_css, encoding="utf-8", newline="\n")
    return {
        "css_path": str(css_path),
        "backup": backup_path.name,
        "backup_path": str(backup_path),
    }


def restore_backup(name: str, root: Path | None = None) -> dict:
    css_path = validate_target(root)
    backup_dir = backups_dir(root)
    backup_path = (backup_dir / name).resolve()
    if backup_path.parent != backup_dir:
        raise ThemeIoError("Invalid backup name.")
    if not backup_path.exists() or backup_path.suffix != ".css":
        raise ThemeIoError("Backup was not found.")
    current_backup = create_backup(root)
    shutil.copy2(backup_path, css_path)
    return {
        "css_path": str(css_path),
        "restored": backup_path.name,
        "backup": current_backup.name,
    }


def list_backups(root: Path | None = None) -> list[dict]:
    backup_dir = backups_dir(root)
    if not backup_dir.exists():
        return []
    items = []
    for path in sorted(backup_dir.glob("projecttrack.*.css"), reverse=True):
        stat = path.stat()
        items.append({
            "name": path.name,
            "size": stat.st_size,
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(timespec="seconds"),
        })
    return items
