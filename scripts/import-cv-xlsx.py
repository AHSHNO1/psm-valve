#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
import-cv-xlsx.py — ورود جدول Cv کاتالوگ از فایل اکسل به دادهٔ مرجع سایت.

    python scripts/import-cv-xlsx.py                      # VALVE_CV.xlsx → data/valve-cv-catalog.json
    python scripts/import-cv-xlsx.py --dry-run            # فقط گزارش، بدون نوشتن
    python scripts/import-cv-xlsx.py --in "other.xlsx" --sheet VALVE_SPECS

کارهایی که انجام می‌دهد:
  ۱) خواندن ستون‌های series / Size / CV_10..CV_100 (بدون کتابخانهٔ خارجی)
  ۲) نگاشت قطر اینچ (NPS) به DN میلی‌متری
  ۳) حذف ردیف‌های عیناً تکراری
  ۴) اصلاح مغایرت‌های تایپی با درون‌یابی + ثبت در بخش repairs (قابل ردگیری)
  ۵) تشخیص مشخصهٔ ذاتی (linear / equal% / modified)
  ۶) نوشتن اتمیک با بکاپ قبلی

این فایل «دادهٔ مرجع» است و در پنل ادمین ویرایش نمی‌شود؛ جدول دست‌نویس ادمین
در data/valve-cv-tables.json جدا می‌ماند و همیشه بر دادهٔ مرجع اولویت دارد.
"""
import argparse
import json
import os
import shutil
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cv_xlsx as cx  # noqa: E402

DEFAULT_IN = "VALVE_CV.xlsx"
DEFAULT_OUT = os.path.join("data", "valve-cv-catalog.json")
SERIES_HEADER = "series"
SIZE_HEADER = "Size"

# سری‌های شناخته‌شدهٔ کاتالوگ محصولات PSM (برای هشدار روی شمارهٔ سری ناشناس)
KNOWN_VALVE_SERIES = {
    "10000", "31000", "35000", "38000", "45000", "46000", "51000", "53000",
    "57000", "62000", "65000", "66000", "70000", "90000",
}


def build(rows):
    """ساخت دادهٔ مرجع از ردیف‌های شیت"""
    body = rows[1:]
    series = {}
    repairs = []
    warnings = []
    seen = set()
    duplicates = 0

    for index, row in enumerate(body, start=2):
        if len(row) < 2:
            warnings.append({"row": index, "reason": "ردیف ناقص"})
            continue
        series_id = str(row[0]).strip()
        size_token = str(row[1]).strip()
        values = cx.curve_numbers(row)
        if values is None:
            warnings.append({"row": index, "series": series_id, "size": size_token, "reason": "ستون‌های CV ناقص یا غیرعددی"})
            continue

        dn = cx.nps_to_dn(size_token)
        if dn is None:
            warnings.append({"row": index, "series": series_id, "size": size_token, "reason": "نگاشت NPS به DN ندارد"})
            continue
        if series_id not in KNOWN_VALVE_SERIES:
            warnings.append({"row": index, "series": series_id, "size": size_token, "reason": "شمارهٔ سری در فهرست محصولات شناخته‌شده نیست"})

        key = (series_id, size_token, tuple(values))
        if key in seen:
            duplicates += 1
            continue
        seen.add(key)

        fixed, fixes = cx.repair_monotonic(values)
        for fix in fixes:
            repairs.append({
                "row": index,
                "series": series_id,
                "nps": size_token,
                "cv": values[-1],
                "opening": fix["opening"],
                "from": fix["from"],
                "to": fix["to"],
            })
        if not cx.is_ordered(fixed):
            warnings.append({
                "row": index,
                "series": series_id,
                "size": size_token,
                "cv": fixed[-1],
                "reason": "CV صعودی نیست و اصلاح خودکار ممکن نشد",
                "curve": fixed,
            })
            continue

        characteristic, deviation, ratio50, rangeability = cx.classify(fixed)
        bucket = series.setdefault(series_id, {})
        size_entry = bucket.setdefault(size_token, {"sizes": []})
        size_entry["sizes"].append({
            "curve": fixed,
            "characteristic": characteristic,
            "deviation": round(deviation, 4),
            "ratio50": round(ratio50, 4),
            "rangeability": round(rangeability, 2),
        })

    return series, repairs, warnings, duplicates, len(body)


def normalise(series):
    """تبدیل ساختار داخلی به ساختار نهایی JSON (مرتب و بدون فیلد اضافه)"""
    out = {}
    for series_id in sorted(series):
        sizes = []
        for size_token in sorted(series[series_id], key=lambda token: float(token)):
            entries = series[series_id][size_token]["sizes"]
            trims = []
            for entry in entries:
                trims.append({
                    "cv": entry["curve"][-1],
                    "characteristic": entry["characteristic"],
                    "ratio50": entry["ratio50"],
                    "rangeability": entry["rangeability"],
                    "curve": entry["curve"],
                })
            trims.sort(key=lambda trim: (
                trim["cv"],
                cx.CHARACTERISTIC_PREFERENCE.get(trim["characteristic"], 9),
            ))
            dn = cx.nps_to_dn(size_token)
            sizes.append({
                "nps": float(size_token),
                "dn": "DN%d" % dn,
                "dnMm": dn,
                "cvMax": max(trim["cv"] for trim in trims),
                "trims": trims,
            })
        out[series_id] = {"sizes": sizes}
    return out


def summarise(payload):
    """گزارش کوتاه ورود داده"""
    lines = ["سری | سایز | ترم | محدودهٔ Cv نامی | مشخصه‌ها", "-" * 74]
    for series_id, entry in payload["series"].items():
        trims = [trim for size in entry["sizes"] for trim in size["trims"]]
        by_kind = {}
        for trim in trims:
            by_kind[trim["characteristic"]] = by_kind.get(trim["characteristic"], 0) + 1
        kinds = " · ".join("%s %d" % (kind, count) for kind, count in sorted(by_kind.items()))
        cvs = [trim["cv"] for trim in trims]
        lines.append("%s | %d | %d | %.4g … %.4g | %s" % (
            series_id, len(entry["sizes"]), len(trims), min(cvs), max(cvs), kinds
        ))
    return "\n".join(lines)


def write_catalog(out_path, payload, backup=True):
    """نوشتن اتمیک با بکاپ نسخهٔ قبلی"""
    directory = os.path.dirname(os.path.abspath(out_path))
    os.makedirs(directory, exist_ok=True)
    if backup and os.path.exists(out_path):
        stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%S")
        shutil.copy2(out_path, "%s.backup-%s.json" % (out_path, stamp))
    tmp = "%s.%d.tmp" % (out_path, os.getpid())
    with open(tmp, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    os.replace(tmp, out_path)


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    parser = argparse.ArgumentParser(description="ورود جدول Cv از xlsx به دادهٔ مرجع")
    parser.add_argument("--in", dest="source", default=DEFAULT_IN, help="فایل اکسل ورودی")
    parser.add_argument("--sheet", default="VALVE_SPECS", help="نام شیت")
    parser.add_argument("--out", dest="target", default=DEFAULT_OUT, help="فایل JSON خروجی")
    parser.add_argument("--dry-run", action="store_true", help="فقط گزارش، بدون نوشتن")
    parser.add_argument("--no-backup", action="store_true", help="بکاپ نگیر")
    args = parser.parse_args()

    if not os.path.exists(args.source):
        print("✖ فایل ورودی پیدا نشد: %s" % args.source)
        return 1

    books = cx.read_workbook(args.source, args.sheet)
    if not books:
        available = " · ".join(name for name, _ in cx.read_workbook(args.source))
        print("✖ شیت «%s» در فایل نیست. شیت‌های موجود: %s" % (args.sheet, available))
        return 1

    sheet_name, rows = books[0]
    if not rows or len(rows[0]) < 3:
        print("✖ شیت خالی یا بدون سرستون است: %s" % sheet_name)
        return 1
    if rows[0][0].strip().lower() != SERIES_HEADER or rows[0][1].strip().lower() != SIZE_HEADER.lower():
        print("✖ سرستون غیرمنتظره: %s" % " · ".join(rows[0]))
        return 1

    series, repairs, warnings, duplicates, data_rows = build(rows)
    payload_series = normalise(series)

    trims_total = sum(len(size["trims"]) for entry in payload_series.values() for size in entry["sizes"])
    size_total = sum(len(entry["sizes"]) for entry in payload_series.values())
    payload = {
        "schemaVersion": 1,
        "openings": cx.OPENINGS,
        "unit": "inch (NPS)",
        "cvDefinition": "Cv بر پایهٔ آب (gpm، ۶۰°F، افت ۱ psi) در ۱۰۰٪ بازشدگی",
        "source": {
            "file": os.path.basename(args.source),
            "sheet": sheet_name,
            "header": " · ".join(rows[0]),
            "dataRows": data_rows,
            "importedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
        "stats": {
            "series": len(payload_series),
            "sizes": size_total,
            "trims": trims_total,
            "duplicateRowsRemoved": duplicates,
            "repairedValues": len(repairs),
            "warnings": len(warnings),
        },
        "repairs": repairs,
        "warnings": warnings,
        "series": payload_series,
    }

    print("PSM Valve — ورود جدول Cv از اکسل\n" + "=" * 74)
    print("ورودی: %s · شیت «%s»" % (args.source, sheet_name))
    print("ردیف داده: %d · تکراری حذف‌شده: %d · مقدار اصلاح‌شده: %d · هشدار: %d" % (
        data_rows, duplicates, len(repairs), len(warnings)
    ))
    print("سری: %d · سایز: %d · ترم: %d" % (len(payload_series), size_total, trims_total))
    print("-" * 74)
    print(summarise(payload))

    if repairs:
        print("\nاصلاح‌های خودکار (به‌صورت قابل ردگیری در بخش repairs ثبت می‌شوند):")
        for fix in repairs:
            print("  سری %s · %s inch · Cv %.4g · CV_%d: %.4g → %.4g" % (
                fix["series"], fix["nps"], fix["cv"], fix["opening"], fix["from"], fix["to"]
            ))
    if warnings:
        print("\nهشدارها:")
        for warning in warnings[:10]:
            print("  ردیف %s: %s" % (warning.get("row", "?"), warning.get("reason", "")))
        if len(warnings) > 10:
            print("  ... (%d هشدار دیگر)" % (len(warnings) - 10))

    if args.dry_run:
        print("\n(dry-run) هیچ فایلی نوشته نشد.")
        return 0

    write_catalog(args.target, payload, backup=not args.no_backup)
    print("\n✔ نوشته شد: %s" % args.target)
    return 0


if __name__ == "__main__":
    sys.exit(main())