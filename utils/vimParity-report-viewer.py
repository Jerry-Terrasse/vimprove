#!/usr/bin/python
import argparse
import json
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional


def load_report(path: Path) -> Dict[str, Any]:
    if not path.exists():
        print(f"Report not found: {path}", file=sys.stderr)
        sys.exit(2)
    try:
        return json.loads(path.read_text())
    except Exception as e:
        print(f"Failed to load {path}: {e}", file=sys.stderr)
        sys.exit(1)


def collect_failures(report: Dict[str, Any]) -> List[Dict[str, Any]]:
    results = report.get("testResults") or []
    fails: List[Dict[str, Any]] = []
    for file_result in results:
        for assertion in file_result.get("assertionResults", []):
            if assertion.get("status") == "failed":
                fails.append(
                    {
                        "fullName": assertion.get("fullName", ""),
                        "title": assertion.get("title", ""),
                        "ancestorTitles": assertion.get("ancestorTitles", []),
                        "failureMessages": assertion.get("failureMessages", []),
                        "location": assertion.get("location"),
                        "status": assertion.get("status"),
                    }
                )
    return fails


def guess_feature(name: str) -> str:
  lowered = name.lower()
  if 'dot' in lowered or "'." in lowered:
    return 'dot-repeat'
  if '<esc>' in lowered:
    return 'insert-exit'
  if 'p' in lowered and ('d' in lowered or 'c' in lowered):
    return 'paste-after-op'
  if 'p' in lowered:
    return 'paste'
  if 'y' in lowered and 'w' in lowered:
    return 'yank'
  if 'd' in lowered:
    return 'delete'
  if 'c' in lowered:
    return 'change'
  if 'f' in lowered or 't' in lowered:
    return 'find'
  if 'w' in lowered or 'b' in lowered or 'e' in lowered:
    return 'motion-word'
  if 'u' in lowered or '<c-r>' in lowered:
    return 'undo-redo'
  return 'other'


def print_aggregate(fails: List[Dict[str, Any]]) -> None:
  buckets: Dict[str, int] = {}
  for fail in fails:
    name = fail.get("fullName", "") or " ".join(fail.get("ancestorTitles", []) + [fail.get("title", "")])
    feature = guess_feature(name)
    buckets[feature] = buckets.get(feature, 0) + 1
  print("Aggregate by feature:")
  for feature, count in sorted(buckets.items(), key=lambda x: x[1], reverse=True):
    print(f"- {feature}: {count}")


def format_name(fail: Dict[str, Any]) -> str:
    return fail.get("fullName") or " ".join(fail.get("ancestorTitles", []) + [fail.get("title", "")])


def print_summary(fails: List[Dict[str, Any]], limit: int = 10) -> None:
    total = len(fails)
    print(f"Failed cases: {total}")
    for idx, fail in enumerate(fails[:limit], 1):
        name = format_name(fail)
        loc = fail.get("location")
        loc_str = f" (line {loc.get('line')}, col {loc.get('column')})" if loc else ""
        print(f"{idx}. {name}{loc_str}")
    if total > limit:
        print(f"... ({total - limit} more)")


def filter_by_query(fails: List[Dict[str, Any]], query: List[str]) -> List[Dict[str, Any]]:
    if not query:
        return fails
    matched = []
    for fail in fails:
        name = format_name(fail)
        if all(q.lower() in name.lower() for q in query):
            matched.append(fail)
    return matched


def filter_by_feature(fails: List[Dict[str, Any]], feature: Optional[str]) -> List[Dict[str, Any]]:
    if not feature:
        return fails
    feature_lower = feature.lower()
    return [f for f in fails if guess_feature(format_name(f)).lower() == feature_lower]


def sort_fails(fails: List[Dict[str, Any]], key: str) -> List[Dict[str, Any]]:
    if key == "name":
        return sorted(fails, key=lambda f: format_name(f))
    if key == "feature":
        return sorted(fails, key=lambda f: guess_feature(format_name(f)))
    if key == "line":
        return sorted(fails, key=lambda f: (f.get("location", {}) or {}).get("line") or 0)
    return fails


def print_detail(fails: List[Dict[str, Any]]) -> None:
    if not fails:
        print("No failures matched the given filters.")
        return
    for fail in fails:
        name = format_name(fail)
        print("=" * 60)
        print(name)
        loc = fail.get("location")
        if loc:
            print(f"Location: line {loc.get('line')}, column {loc.get('column')}")
        for msg in fail.get("failureMessages", []):
            print("-" * 40)
            print(msg)
    print("=" * 60)
    print(f"Matched {len(fails)} failure(s).")


def main():
    parser = argparse.ArgumentParser(description="Summarize Vim parity JSON report.")
    parser.add_argument("report", type=Path, help="Path to JSON report (Vitest --reporter=json).")
    parser.add_argument("keyword", nargs="*", help="Substring(s) to filter test names (case-insensitive).")
    parser.add_argument("--feature", help="Filter by inferred feature bucket (e.g., paste-after-op).")
    parser.add_argument("--limit", type=int, default=10, help="How many failures to show in summary (default: 10).")
    parser.add_argument("--sort", choices=["name", "feature", "line"], help="Sort failures when showing details.")
    parser.add_argument("--details", action="store_true", help="Show full failure details instead of summary.")
    args = parser.parse_args()

    report = load_report(args.report)
    fails = collect_failures(report)
    if not fails:
        print("No failures found in report.")
        sys.exit(0)

    filtered = filter_by_query(fails, args.keyword)
    filtered = filter_by_feature(filtered, args.feature)
    if args.sort:
        filtered = sort_fails(filtered, args.sort)

    if args.details:
        print_detail(filtered)
    else:
        print_summary(filtered, limit=args.limit)
        print_aggregate(filtered)


if __name__ == "__main__":
    main()
