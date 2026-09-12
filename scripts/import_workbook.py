"""Generate the assessment item bank from the V0.2 source workbook.

Usage:
  python scripts/import_workbook.py /path/to/workbook.xlsx data/assessment.ts
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import openpyxl


DIMENSIONS = {
    "Interest 兴趣": "interest",
    "Strengths 优势": "strengths",
    "Preferences 偏好": "preferences",
    "Values 价值": "values",
    "Self-efficacy 能力信心": "selfEfficacy",
}

PREFERENCE_POLES = {
    "Q39": "left",
    "Q40": "right",
    "Q41": "right",
    "Q42": "left",
    "Q43": "right",
    "Q44": "left",
    "Q45": "left",
    "Q46": "right",
    "Q47": "right",
    "Q48": "left",
    "Q49": "right",
    "Q50": "left",
}


def main() -> None:
    source = Path(sys.argv[1])
    destination = Path(sys.argv[2])
    workbook = openpyxl.load_workbook(source, data_only=True)
    sheet = workbook["V02_镜像题库"]
    rows = list(sheet.iter_rows(min_row=2, values_only=True))
    items = []
    for row in rows:
        item_id, dimension, subdimension, self_text, other_text, _, reverse, reason, status = row
        if not item_id:
            continue
        item = {
            "id": item_id,
            "dimension": DIMENSIONS[dimension],
            "subdimension": subdimension,
            "selfText": self_text,
            "otherText": other_text,
            "reverse": reverse == "是",
            "designReason": reason,
            "status": status,
        }
        if item_id in PREFERENCE_POLES:
            item["preferencePole"] = PREFERENCE_POLES[item_id]
        items.append(item)

    if len(items) != 72:
        raise ValueError(f"Expected 72 items, found {len(items)}")
    if [item["id"] for item in items] != [f"Q{i:02d}" for i in range(1, 73)]:
        raise ValueError("Item IDs are not the expected stable Q01-Q72 sequence")

    encoded = json.dumps(items, ensure_ascii=False, indent=2)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(
        "import type { AssessmentItem } from '@/types/assessment';\n\n"
        "// Generated faithfully from V02_镜像题库. Do not edit item wording here.\n"
        f"export const assessmentItems: AssessmentItem[] = {encoded};\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
