#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
cv_xlsx.py — ماژول مشترک خواندن فایل اکسل جدول Cv (بدون کتابخانهٔ خارجی).

xlsx یک بستهٔ ZIP است؛ این ماژول با کتابخانهٔ استاندارد پایتون
(zipfile + xml.etree) شیت‌ها را می‌خواند. مصرف‌کننده‌ها:
  - scripts/inspect-cv-xlsx.py  (بازبینی و تحلیل داده)
  - scripts/import-cv-xlsx.py   (ورود داده به data/valve-cv-catalog.json)
"""
import re
import zipfile
import xml.etree.ElementTree as ET

M = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"

# درصدهای بازشدگی که ستون‌های CV_xx به آن اشاره دارند
OPENINGS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

# نگاشت قطر نامی اینچ (NPS) به DN میلی‌متری
NPS_TO_DN = {
    0.125: 6, 0.25: 8, 0.375: 10, 0.5: 15, 0.75: 20, 1: 25, 1.25: 32, 1.5: 40,
    2: 50, 2.5: 65, 3: 80, 3.5: 90, 4: 100, 5: 125, 6: 150, 8: 200, 10: 250,
    12: 300, 14: 350, 16: 400, 18: 450, 20: 500, 24: 600, 28: 700, 30: 750,
    32: 800, 36: 900, 40: 1000, 48: 1200, 60: 1500,
}

# ترتیب ترجیح مشخصهٔ ذاتی در انتخاب شیر (ابزار سایزینگ)
CHARACTERISTIC_PREFERENCE = {"equal": 0, "modified": 1, "linear": 2, "quick": 3}


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


def read_workbook(path, sheet=None):
    """همهٔ شیت‌ها (یا فقط یک شیت) به شکل [(نام شیت, ردیف‌ها)]"""
    out = []
    with zipfile.ZipFile(path) as zf:
        strings = shared_strings(zf)
        for name, target in sheet_list(zf):
            if sheet and sheet not in (name or ""):
                continue
            out.append((name or "", read_sheet(zf, target, strings)))
    return out


def clean_number(value):
    """گِردکردن تمیزِ خروجی اکسل: 4.0000000000000002E-4 → 0.0004"""
    return float("%.6g" % float(value))


def nps_to_dn(nps):
    try:
        return NPS_TO_DN.get(float(nps))
    except (TypeError, ValueError):
        return None


def curve_numbers(row, first=2, count=10):
    """ستون‌های CV_xx یک ردیف؛ None اگر ناقص یا غیرعددی باشد"""
    if len(row) < first + count:
        return None
    try:
        return [clean_number(row[first + i]) for i in range(count)]
    except (TypeError, ValueError):
        return None


def classify(values):
    """
    تشخیص مشخصهٔ ذاتی بر پایهٔ «شکل» منحنی.

    - linear : انحراف از خط مستقیم ≤ ۳٪
    - equal  : نسبت Cv در ۵۰٪ به مقدار نامی ≤ ۳۵٪ (منحنی محدب = درصدی)
    - quick  : نسبت در ۵۰٪ ≥ ۷۲٪ (منحنی مقعر = بازشدگی سریع)
    - modified: بین این دو (درصدی اصلاح‌شده / سهمی)
    برگشت: (نوع, انحراف از خط, نسبت ۵۰٪, دامنه‌پذیری)
    """
    rated = values[-1]
    if rated <= 0:
        return "invalid", 1.0, 0.0, 0.0
    linear_dev = max(
        abs(v - rated * (index + 1) / 10.0) / rated for index, v in enumerate(values)
    )
    ratio50 = values[4] / rated
    rangeability = (rated / values[0]) if values[0] > 0 else 0.0
    if linear_dev <= 0.03:
        return "linear", linear_dev, ratio50, rangeability
    if ratio50 <= 0.35:
        return "equal", linear_dev, ratio50, rangeability
    if ratio50 >= 0.72:
        return "quick", linear_dev, ratio50, rangeability
    return "modified", linear_dev, ratio50, rangeability


def _violations(values):
    """اندیس‌هایی که روند صعودی را می‌شکنند (با مجاز بودن مقادیر برابر)"""
    return [
        index
        for index in range(1, len(values) - 1)
        if not (values[index - 1] <= values[index] < values[index + 1])
    ]


def repair_monotonic(values, max_rounds=5):
    """
    اصلاح مغایرت‌های واضح (تایپی) با درون‌یابی بین دو همسایه.

    برای اینکه مقدار سالم خراب نشود، در هر دور فقط «بدترین» نقطه انتخاب
    می‌شود: نقطه‌ای که بیشترین انحنای نسبی را دارد.

    مثال واقعی: 110,220,330,440,550,660,770,680,990,1100
      ⇒ به‌جای 770، مقدار 680 به 880 اصلاح می‌شود (نردبان خطی ×۱۱۰).
    """
    fixed = list(values)
    repairs = []
    rated = fixed[-1] if fixed else 0

    for _ in range(max_rounds):
        broken = _violations(fixed)
        if not broken:
            break
        index = max(
            broken,
            key=lambda i: abs(fixed[i - 1] - 2 * fixed[i] + fixed[i + 1]),
        )
        previous, current, following = fixed[index - 1], fixed[index], fixed[index + 1]
        repaired = round((previous + following) / 2.0, 6)
        if not (previous < repaired < following):
            break
        fixed[index] = repaired
        repairs.append({
            "opening": OPENINGS[index],
            "from": current,
            "to": repaired,
            "secondDifference": round(abs(previous - 2 * current + following), 6),
            "shareOfRated": round(abs(previous - 2 * current + following) / rated, 4) if rated else None,
        })

    return fixed, repairs


def is_ordered(values):
    """مقادیر نزولی نیستند؟ (مقادیر برابر مجاز است؛ رایج در گِردکردن کاتالوگ)"""
    return all(values[i] <= values[i + 1] for i in range(len(values) - 1))