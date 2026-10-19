#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
inspect-cv-xlsx.py — خواندن فایل اکسل (xlsx) بدون هیچ کتابخانهٔ خارجی.

xlsx یک بستهٔ ZIP است؛ این اسکریپت با کتابخانهٔ استاندارد پایتون
(zipfile + xml.etree) شیت‌ها را می‌خواند و به شکل TSV چاپ می‌کند.

استفاده:
    python scripts/inspect-cv-xlsx.py VALVE_CV.xlsx
    python scripts/inspect-cv-xlsx.py VALVE_CV.xlsx --sheet 51000
    python scripts/inspect-cv-xlsx.py VALVE_CV.xlsx --limit 40

خروجی برای بازبینی سریع جدول Cv است؛ هیچ فایلی را تغییر نمی‌دهد.
"""
import argparse
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

M = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
PR = "{http://schemas.openxmlformats.org/package/2006/relationships}"


def relationships(zf, path):
    """نقشهٔ rId → target برای یک بخش از بستهٔ xlsx"""
    try:
        root = ET.fromstring(zf.read(path))
    except KeyError:
        return {}
    return {node.get("Id"): node.get("Target") for node in root}


def sheet_list(zf):
    """فهرست (نام شیت, مسیر فایل xml) به ترتیب ورک‌بوک"""
    root = ET.fromstring(zf.read("xl/workbook.xml"))
    rel_map = relationships(zf, "xl/_rels/workbook.xml.rels")
    sheets = []
    for node in root.find(M + "sheets"):
        target = (rel_map.get(node.get(R + "id"), "") or "").lstrip("/")
        if target and not target.startswith("xl/"):
            target = "xl/" + target
        sheets.append((node.get("name"), target))
    return sheets


def shared_strings(zf):
    try:
        root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    return ["".join(t.text or "" for t in si.iter(M + "t")) for si in root]


def column_index(ref):
    match = re.match(r"([A-Z]+)", ref or "")
    if not match:
        return 0
    index = 0
    for ch in match.group(1):
        index = index * 26 + (ord(ch) - 64)
    return index - 1


def read_sheet(zf, path, strings):
    """ردیف‌های یک شیت به شکل لیستی از سلول‌های متنی"""
    try:
        root = ET.fromstring(zf.read(path))
    except KeyError:
        return []
    rows = []
    for row in root.iter(M + "row"):
        cells = {}
        for cell in row:
            ctype = cell.get("t")
            value = None
            if ctype == "s":
                node = cell.find(M + "v")
                if node is not None and node.text is not None:
                    value = strings[int(node.text)]
            elif ctype == "inlineStr":
                node = cell.find(M + "is")
                if node is not None:
                    value = "".join(t.text or "" for t in node.iter(M + "t"))
            else:
                node = cell.find(M + "v")
                if node is not None:
                    value = node.text
            if value is not None and str(value).strip() != "":
                cells[column_index(cell.get("r"))] = str(value).strip()
        if cells:
            width = max(cells) + 1
            rows.append([cells.get(i, "") for i in range(width)])
    return rows


def summarise(rows):
    """خلاصهٔ ساختاری: هر سری، سایزهای تکراری و مقادیر Cv صددرصد"""
    header = rows[0]
    body = rows[1:]
    groups = {}
    order = []
    for row in body:
        series = row[0] if row else ""
        size = row[1] if len(row) > 1 else ""
        key = (series, size)
        if key not in groups:
            groups[key] = 0
            order.append(key)
        groups[key] += 1

    print("ردیف سرستون: " + " | ".join(header))
    print("تعداد ردیف داده: %d" % len(body))

    series_order = []
    per_series = {}
    for series, size in order:
        if series not in per_series:
            per_series[series] = []
            series_order.append(series)
        per_series[series].append((size, groups[(series, size)]))

    for series in series_order:
        items = per_series[series]
        sizes = [size for size, _ in items]
        duplicated = [(size, count) for size, count in items if count > 1]
        rows_count = sum(count for _, count in items)
        print("\nسری %s — %d ردیف · %d سایز یکتا" % (series, rows_count, len(sizes)))
        print("   سایزها: " + ", ".join(sizes))
        if duplicated:
            print("   ⚠ سایزهای تکراری: " + ", ".join("%s×%d" % (s, c) for s, c in duplicated))
        else:
            print("   ✔ هیچ سایز تکراری نیست")


def profile(rows):
    """تحلیل شکل منحنی‌ها: برای هر سری/سایز، Cv صددرصد و نسبت میانه به آن"""
    header = rows[0]
    width = len(header)
    body = rows[1:]

    anomalies = [index + 2 for index, row in enumerate(body) if len(row) != width]
    print("عرض سرستون: %d ستون" % width)
    if anomalies:
        print("⚠ ردیف‌هایی با تعداد ستون متفاوت: " + ", ".join(str(n) for n in anomalies[:20]))
    else:
        print("✔ همهٔ ردیف‌ها دقیقاً %d ستون دارند (ستون پنهانی وجود ندارد)" % width)

    try:
        cv50 = header.index("CV_50")
        cv100 = header.index("CV_100")
    except ValueError:
        print("ستون CV_50 یا CV_100 پیدا نشد.")
        return

    current = None
    for row in body:
        series = row[0] if row else ""
        size = row[1] if len(row) > 1 else ""
        if (series, size) != current:
            current = (series, size)
            print("\n— سری %s · سایز %s" % (series, size))
            print("      CV_100   CV_50/CV_100   شکل")
        rated = float(row[cv100]) if len(row) > cv100 and row[cv100] else 0
        mid = float(row[cv50]) if len(row) > cv50 and row[cv50] else 0
        ratio = (mid / rated) if rated else 0
        shape = "صعودی تند (Equal%)" if ratio < 0.45 else ("نزدیک خطی" if ratio < 0.62 else "مقعر (Linear/Quick)")
        print("      %7.0f  %11.2f   %s" % (rated, ratio, shape))


def classify(values):
    """تشخیص مشخصهٔ ذاتی: linear یا equal% یا سایر، با انحراف نسبی"""
    rated = values[-1]
    if rated <= 0:
        return "نامعتبر", 0, 0
    linear_dev = max(abs(v - rated * (index + 1) / 10.0) / rated for index, v in enumerate(values))
    rangeability = (rated / values[0]) if values[0] > 0 else 0
    if linear_dev <= 0.03:
        return "linear", linear_dev, rangeability
    if 15 <= rangeability <= 120:
        equal_dev = max(
            abs(v - rated * (rangeability ** ((index + 1) / 10.0 - 1))) / rated
            for index, v in enumerate(values)
        )
        if equal_dev <= 0.06:
            return "equal%", equal_dev, rangeability
    return "other", linear_dev, rangeability


def analyse(rows):
    """تحلیل مهندسی: تعداد Cv نامی هر سایز، مشخصهٔ منحنی‌ها و ردیف‌های تکراری"""
    header = rows[0]
    body = rows[1:]
    first_cv = 2
    series_order = []
    groups = {}
    seen_curves = {}

    for row in body:
        series = row[0]
        size = row[1]
        if series not in groups:
            groups[series] = {}
            series_order.append(series)
        if size not in groups[series]:
            groups[series][size] = []
        values = [float(v) for v in row[first_cv:first_cv + 10]] if len(row) >= first_cv + 10 else []
        groups[series][size].append(values)
        seen_curves.setdefault((series, size, tuple(values)), 0)
        seen_curves[(series, size, tuple(values))] += 1

    for series in series_order:
        sizes = groups[series]
        total = sum(len(v) for v in sizes.values())
        print("\n######## سری %s — %d ردیف، %d سایز" % (series, total, len(sizes)))
        for size, curves in sizes.items():
            rated = [c[-1] for c in curves if c]
            kinds = {"linear": 0, "equal%": 0, "other": 0, "نامعتبر": 0}
            for curve in curves:
                kind, _, _ = classify(curve)
                kinds[kind] = kinds.get(kind, 0) + 1
            duplicates = sum(1 for c in curves if seen_curves[(series, size, tuple(c))] > 1)
            print(
                "  سایز %-5s ردیف %3d | Cv نامی یکتا %3d | linear %2d · equal%% %2d · other %2d | "
                "کمینه %.4g · بیشینه %.4g | ردیف تکراری %d"
                % (
                    size, len(curves), len(set(rated)),
                    kinds["linear"], kinds["equal%"], kinds["other"] + kinds["نامعتبر"],
                    min(rated) if rated else 0, max(rated) if rated else 0, duplicates,
                )
            )


def pairs(rows):
    """کشف بُعد دوم: برای هر (سری، سایز، Cv نامی) چند منحنی متمایز وجود دارد؟"""
    body = rows[1:]
    groups = {}
    order = []
    for row in body:
        series, size = row[0], row[1]
        values = tuple(float(v) for v in row[2:12]) if len(row) >= 12 else ()
        if not values:
            continue
        rated = values[-1]
        key = (series, size, rated)
        if key not in groups:
            groups[key] = []
            order.append(key)
        groups[key].append(values)

    series_order = []
    per_series = {}
    for key in order:
        per_series.setdefault(key[0], []).append(key)
        if key[0] not in series_order:
            series_order.append(key[0])

    for series in series_order:
        keys = per_series[series]
        by_size = {}
        for key in keys:
            by_size.setdefault(key[1], []).append(key)
        print("\n######## سری %s" % series)
        for size, size_keys in by_size.items():
            counts = {}
            for key in size_keys:
                distinct = len(set(groups[key]))
                counts[distinct] = counts.get(distinct, 0) + 1
            shape = ", ".join("%d Cv نامی با %d منحنی متمایز" % (value, key_) for key_, value in sorted(counts.items()))
            print("  سایز %-5s → %s" % (size, shape))
            # نمونه: نخستین Cv نامی که چند منحنی متمایز دارد
            for key in size_keys:
                distinct = sorted(set(groups[key]))
                if len(distinct) > 1:
                    print("      مثال Cv نامی %.4g: %d منحنی" % (key[2], len(distinct)))
                    for curve in distinct[:4]:
                        kind, dev, rangeability = classify(list(curve))
                        print("        %-8s انحراف %.3f · R=%.1f · %s" % (kind, dev, rangeability, " → ".join("%.4g" % v for v in curve)))
                    break
            else:
                sample = groups[size_keys[0]][0]
                kind, dev, rangeability = classify(list(sample))
                print("      تک‌منحنی: %-8s انحراف %.3f · R=%.1f" % (kind, dev, rangeability))


NPS_TO_DN = {
    0.125: 6, 0.25: 8, 0.375: 10, 0.5: 15, 0.75: 20, 1: 25, 1.25: 32, 1.5: 40,
    2: 50, 2.5: 65, 3: 80, 3.5: 90, 4: 100, 5: 125, 6: 150, 8: 200, 10: 250,
    12: 300, 14: 350, 16: 400, 18: 450, 20: 500, 24: 600, 28: 700, 30: 750,
    32: 800, 36: 900, 40: 1000, 48: 1200, 60: 1500,
}


def validate(rows):
    """بازبینی کیفیت داده پیش از ورود: قالب، یکنوایی، صفر، نگاشت اینچ→DN"""
    body = rows[1:]
    issues = []
    sizes_seen = {}
    unknown_sizes = set()

    for index, row in enumerate(body, start=2):
        if len(row) < 12:
            issues.append("ردیف %d: ستون‌های کمتر از ۱۲" % index)
            continue
        series, size = row[0], row[1]
        try:
            values = [float(v) for v in row[2:12]]
        except ValueError:
            issues.append("ردیف %d: مقدار غیرعددی" % index)
            continue
        if any(v <= 0 for v in values):
            issues.append("ردیف %d: مقدار صفر یا منفی" % index)
        if any(values[i] > values[i + 1] for i in range(len(values) - 1)):
            issues.append("ردیف %d: CV صعودی نیست (%s)" % (index, " → ".join("%.4g" % v for v in values)))
        if values[-1] < values[0]:
            issues.append("ردیف %d: CV_100 کوچکتر از CV_10" % index)

        try:
            nps = float(size)
        except ValueError:
            unknown_sizes.add(size)
            continue
        if nps not in NPS_TO_DN:
            unknown_sizes.add(size)
        sizes_seen.setdefault(series, set()).add(size)

    print("ردیف داده: %d" % len(body))
    print("مشکلات: %d" % len(issues))
    for text in issues[:15]:
        print("   ⚠ " + text)

    print("\nنگاشت اینچ → DN برای سری‌ها:")
    for series in sorted(sizes_seen):
        ordered = sorted(sizes_seen[series], key=float)
        mapped = []
        for size in ordered:
            nps = float(size)
            dn = NPS_TO_DN.get(nps)
            mapped.append("%s→%s" % (size, "DN%d" % dn if dn else "؟"))
        print("   %s (%d سایز): %s" % (series, len(ordered), " · ".join(mapped)))

    if unknown_sizes:
        print("\n⚠ سایزهای بدون نگاشت DN: " + ", ".join(sorted(unknown_sizes)))
    else:
        print("\n✔ همهٔ سایزها نگاشت DN دارند")


def main():
    # ویندوز: خروجی همیشه UTF-8 باشد (وگرنه در pipe با cp1252 کرش می‌کند)
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    parser = argparse.ArgumentParser(description="چاپ محتوای یک فایل xlsx به شکل TSV")
    parser.add_argument("file", help="مسیر فایل xlsx")
    parser.add_argument("--sheet", help="فقط شیت با این نام")
    parser.add_argument("--row", help="فقط ردیف‌های همین سری (مثال: 51000)")
    parser.add_argument("--limit", type=int, default=0, help="حداکثر تعداد ردیف هر شیت (۰ = همه)")
    parser.add_argument("--summary", action="store_true", help="فقط خلاصهٔ ساختاری، بدون چاپ همهٔ ردیف‌ها")
    parser.add_argument("--profile", action="store_true", help="تحلیل شکل منحنی‌ها برای هر سری/سایز")
    parser.add_argument("--analyse", action="store_true", help="تحلیل مهندسی: مشخصهٔ منحنی‌ها و تعداد Cv نامی هر سایز")
    parser.add_argument("--pairs", action="store_true", help="کشف بُعد دوم (چند منحنی برای یک Cv نامی)")
    parser.add_argument("--validate", action="store_true", help="بازبینی کیفیت داده پیش از ورود")
    args = parser.parse_args()

    with zipfile.ZipFile(args.file) as zf:
        sheets = sheet_list(zf)
        strings = shared_strings(zf)
        print("شیت‌ها: " + " | ".join(name or "(بدون نام)" for name, _ in sheets))
        print("=" * 78)

        for name, path in sheets:
            if args.sheet and args.sheet not in (name or ""):
                continue
            rows = read_sheet(zf, path, strings)
            print("\n### شیت «%s» — %d ردیف" % (name, len(rows)))

            if args.summary:
                summarise(rows)
                continue
            if args.profile:
                profile(rows)
                continue
            if args.analyse:
                analyse(rows)
                continue
            if args.pairs:
                pairs(rows)
                continue
            if args.validate:
                validate(rows)
                continue

            for index, row in enumerate(rows):
                if args.row and not (len(row) > 0 and row[0] == args.row):
                    continue
                if args.limit and index >= args.limit:
                    print("... (%d ردیف دیگر)" % (len(rows) - args.limit))
                    break
                print("%4d | %s" % (index + 1, "\t".join(row)))

    return 0


if __name__ == "__main__":
    sys.exit(main())