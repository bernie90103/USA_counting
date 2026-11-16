"""Build an allowlisted deployment and native web directory, never copy ledger data."""
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = ("index.html", "styles.css", "app.js", "cloud.js", "config.js", "vendor/supabase.js", "vendor/native.js", "vendor/LICENSES.txt")


def build(destination):
    # Only clean generated output at these two exact locations.
    if destination not in (ROOT / "dist", ROOT / "ios-app" / "www"):
        raise ValueError("Unexpected output directory")
    if destination.is_symlink():
        raise ValueError("Output must not be a symlink")
    if destination.exists():
        shutil.rmtree(destination)
    for name in FILES:
        target = destination / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / name, target)
    print(f"Prepared {destination.relative_to(ROOT)}: {len(FILES)} public application files; no ledger data")


if __name__ == "__main__":
    build(ROOT / "dist")
    build(ROOT / "ios-app" / "www")
