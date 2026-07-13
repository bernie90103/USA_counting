import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


STORAGE_KEY = "us-ledger-transactions"
REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = REPO_ROOT / "data" / "transactions.json"
DATA_SCRIPT_FILE = REPO_ROOT / "data" / "transactions.js"
BACKUP_DIR = REPO_ROOT / "exports"
BACKUP_FILE = BACKUP_DIR / "latest-us-ledger.json"
PAYMENT_METHODS = {"台灣信用卡", "美國信用卡", "學生證", "現金"}


def main():
    parser = argparse.ArgumentParser(
        description="Publish local ledger changes to GitHub Pages.",
    )
    parser.add_argument(
        "--no-git",
        action="store_true",
        help="Only update data/transactions.json; do not commit or push.",
    )
    parser.add_argument(
        "--json",
        type=Path,
        help="Path to an exported us-ledger JSON file.",
    )
    parser.add_argument(
        "--message",
        default="Update public ledger data",
        help="Git commit message to use when publishing.",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Print detected browser storage candidates.",
    )
    args = parser.parse_args()

    transactions, source = load_transactions(args.json, debug=args.debug)
    if not transactions:
        raise SystemExit(
            "Could not find local ledger data. In the local page, click 匯出 JSON, then run this script again.",
        )

    write_transactions(transactions)
    print(f"Source: {source}")
    print(f"Updated {DATA_FILE.relative_to(REPO_ROOT)} with {len(transactions)} records.")
    print(f"Backed up the latest export to {BACKUP_FILE.relative_to(REPO_ROOT)}.")

    if args.no_git:
        return

    if not has_data_changes():
        print("No data changes to publish.")
        return

    run(["git", "add", "data/transactions.json", "data/transactions.js"])
    run(["git", "commit", "-m", args.message])
    run(["git", "push"])
    sync_gh_pages()
    print("Published: https://bernie90103.github.io/USA_counting/")


def load_transactions(json_path=None, debug=False):
    if json_path:
        return load_exported_json(json_path), str(json_path)

    browser_candidate = find_latest_transaction_candidate(debug=debug)
    export = find_latest_export()

    if browser_candidate and export:
        if export.stat().st_mtime > browser_candidate["mtime"]:
            return load_exported_json(export), str(export)

        return browser_candidate["transactions"], "browser localStorage"

    if browser_candidate:
        return browser_candidate["transactions"], "browser localStorage"

    if export:
        return load_exported_json(export), str(export)

    return [], "browser localStorage"


def load_exported_json(path):
    path = Path(path).expanduser().resolve()
    return normalize_transactions(json.loads(path.read_text(encoding="utf-8-sig")))


def find_latest_export():
    home = Path.home()
    search_dirs = [
        home / "Downloads",
        home / "Desktop",
        REPO_ROOT,
    ]
    exports = []

    for directory in search_dirs:
        if not directory.exists():
            continue

        exports.extend(directory.glob("us-ledger*.json"))

    if not exports:
        return None

    return max(exports, key=lambda path: path.stat().st_mtime)


def find_latest_transaction_candidate(debug=False):
    candidates = []

    with tempfile.TemporaryDirectory(prefix="us-ledger-leveldb-") as temp_dir:
        for leveldb_dir in find_leveldb_dirs():
            for source in leveldb_dir.glob("*"):
                if source.suffix.lower() not in {".log", ".ldb"}:
                    continue

                copied = copy_locked_file(source, Path(temp_dir))
                if not copied:
                    continue

                try:
                    data = copied.read_bytes()
                except OSError:
                    continue

                mtime = source.stat().st_mtime
                candidates.extend(extract_transaction_candidates(data, mtime, str(source)))

    if debug:
        for candidate in sorted(candidates, key=lambda item: (item["mtime"], item["offset"])):
            first = candidate["transactions"][0]
            print(
                "candidate "
                f"records={len(candidate['transactions'])} "
                f"mtime={candidate['mtime']:.0f} "
                f"offset={candidate['offset']} "
                f"key_distance={candidate['key_distance']} "
                f"origin={candidate['origin']} "
                f"source={candidate['source']} "
                f"first={first['date']} {first['category']} {first['note']} {first['amount']}",
            )

    if not candidates:
        return None

    candidates.sort(key=lambda item: (item["origin_score"], item["mtime"], item["offset"]))
    return candidates[-1]


def find_leveldb_dirs():
    local_app_data = Path(os.environ.get("LOCALAPPDATA", ""))
    roots = [
        local_app_data / "Google" / "Chrome" / "User Data",
        local_app_data / "Microsoft" / "Edge" / "User Data",
    ]

    dirs = []
    for root in roots:
        if not root.exists():
            continue

        for profile in root.iterdir():
            leveldb_dir = profile / "Local Storage" / "leveldb"
            if leveldb_dir.exists():
                dirs.append(leveldb_dir)

    return dirs


def copy_locked_file(source, temp_dir):
    destination = temp_dir / f"{source.parent.parent.parent.name}-{source.name}"

    if os.name == "nt":
        command = [
            "powershell",
            "-NoProfile",
            "-Command",
            "Copy-Item -LiteralPath $args[0] -Destination $args[1] -Force",
            str(source),
            str(destination),
        ]
        result = subprocess.run(command, cwd=REPO_ROOT, capture_output=True, text=True)
        if result.returncode == 0 and destination.exists():
            return destination

    try:
        shutil.copy2(source, destination)
        return destination
    except OSError:
        return None


def extract_transaction_candidates(data, mtime, source_name):
    candidates = []

    for encoding, marker in (
        ("utf-16-le", '[{"id"'.encode("utf-16-le")),
        ("utf-8", b'[{"id"'),
    ):
        start = 0
        while True:
            offset = data.find(marker, start)
            if offset == -1:
                break

            storage_context = get_storage_context(data, offset)
            if storage_context is None:
                start = offset + len(marker)
                continue

            transaction_json = extract_json_array(data, offset, encoding)
            if transaction_json:
                try:
                    transactions = normalize_transactions(json.loads(transaction_json))
                except (json.JSONDecodeError, TypeError, ValueError):
                    transactions = []

                if transactions:
                    candidates.append(
                        {
                            "mtime": mtime,
                            "offset": offset,
                            "key_distance": storage_context["key_distance"],
                            "origin_score": storage_context["origin_score"],
                            "origin": storage_context["origin"],
                            "source": source_name,
                            "transactions": transactions,
                        },
                    )

            start = offset + len(marker)

    return candidates


def get_storage_context(data, offset):
    key = STORAGE_KEY.encode("utf-8")
    context_start = max(0, offset - 1000)
    key_offset = data.rfind(key, context_start, offset)
    if key_offset == -1:
        return None

    context = data[max(0, key_offset - 240) : key_offset].decode("latin-1", errors="ignore")
    origins = [
        (context.rfind("_file://"), "file://", 3),
        (context.rfind("localhost"), "local-server", 3),
        (context.rfind("127.0.0.1"), "local-server", 3),
        (context.rfind("::1"), "local-server", 3),
        (context.rfind("bernie90103.github.io"), "github-pages", 1),
    ]
    origin_offset, origin, origin_score = max(origins, key=lambda item: item[0])
    if origin_offset == -1:
        origin = "unknown"
        origin_score = 0

    return {
        "key_distance": offset - key_offset,
        "origin_score": origin_score,
        "origin": origin,
    }


def extract_json_array(data, offset, encoding):
    step = 2 if encoding == "utf-16-le" else 1
    close = b"]\x00" if encoding == "utf-16-le" else b"]"

    index = offset + step
    while index <= len(data) - len(close):
        if data[index : index + len(close)] == close:
            raw = data[offset : index + len(close)]
            try:
                return raw.decode(encoding)
            except UnicodeDecodeError:
                return None

        index += step

    return None


def normalize_transactions(items):
    if not isinstance(items, list):
        return []

    normalized = []
    for item in items:
        if not isinstance(item, dict):
            return []

        date = str(item.get("date", ""))[:10]
        amount = item.get("amount", 0)
        try:
            amount = float(amount)
        except (TypeError, ValueError):
            amount = 0

        if not date or amount <= 0:
            continue

        normalized.append(
            {
                "id": str(item.get("id") or f"txn-{date}-{len(normalized) + 1}"),
                "date": date,
                "type": "income" if item.get("type") == "income" else "expense",
                "category": str(item.get("category") or "其他"),
                "merchant": str(item.get("merchant") or ""),
                "paymentMethod": normalize_payment_method(item),
                "note": str(item.get("note") or ""),
                "amount": int(amount) if amount.is_integer() else amount,
            },
        )

    return normalized


def normalize_payment_method(item):
    method = str(item.get("paymentMethod") or item.get("payment") or item.get("method") or "").strip()
    if method in PAYMENT_METHODS:
        return method

    if is_known_campus_card_transaction(item):
        return "學生證"

    text = f"{item.get('note', '')} {item.get('category', '')}".lower()
    if "學生證" in text or "campuscard" in text or "campus card" in text:
        return "學生證"
    if "永豐" in text or "台灣信用卡" in text:
        return "台灣信用卡"
    if "美國信用卡" in text:
        return "美國信用卡"
    if "cash" in text or "現金" in text:
        return "現金"

    return "現金"


def is_known_campus_card_transaction(item):
    try:
        amount = float(item.get("amount") or 0)
    except (TypeError, ValueError):
        amount = 0

    note = str(item.get("note") or "")
    if str(item.get("date") or "")[:10] != "2026-05-13" or item.get("type") == "income":
        return False

    return (
        (amount == 6.88 and "星巴克" in note)
        or (amount == 9 and ("午餐" in note or "三明治" in note))
    )


def write_transactions(transactions):
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    content = json.dumps(transactions, ensure_ascii=False, indent=2) + "\n"
    DATA_FILE.write_text(content, encoding="utf-8")
    DATA_SCRIPT_FILE.write_text(
        f"window.PUBLIC_TRANSACTIONS = {content};\n",
        encoding="utf-8",
    )
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    BACKUP_FILE.write_text(content, encoding="utf-8")


def has_data_changes():
    result = run(
        ["git", "status", "--short", "data/transactions.json", "data/transactions.js"],
        capture=True,
    )
    return bool(result.stdout.strip())


def sync_gh_pages():
    run(["git", "fetch", "origin", "gh-pages:refs/remotes/origin/gh-pages"])
    lease = run(["git", "rev-parse", "origin/gh-pages"], capture=True).stdout.strip()
    run(
        [
            "git",
            "push",
            "origin",
            "main:gh-pages",
            f"--force-with-lease=refs/heads/gh-pages:{lease}",
        ],
    )


def run(command, capture=False):
    result = subprocess.run(
        command,
        cwd=REPO_ROOT,
        text=True,
        capture_output=capture,
    )
    if result.returncode != 0:
        if capture:
            sys.stderr.write(result.stdout)
            sys.stderr.write(result.stderr)
        raise SystemExit(f"Command failed: {' '.join(command)}")

    return result


if __name__ == "__main__":
    main()
