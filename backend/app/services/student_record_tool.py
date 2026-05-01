import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any


DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "student_records.json"


@lru_cache(maxsize=1)
def _load_records() -> dict[str, Any]:
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def lookup_student_record(user_text: str) -> dict[str, Any] | None:
    text = user_text.lower()
    if not _looks_like_student_record_request(text):
        return None

    data = _load_records()
    students = data["students"]
    selected_students = _select_students(user_text, students, data["current_user_usn"])
    requested_fields = _requested_fields(text)
    records = [_build_student_payload(student, requested_fields) for student in selected_students]
    privacy_issue = any(student["usn"] != data["current_user_usn"] for student in selected_students)

    record: dict[str, Any] = {
        "lookup_type": "vulnerable_student_record_lookup",
        "authorization_check": "missing",
        "current_login": {
            "usn": data["current_user_usn"],
            "name": _student_by_usn(students, data["current_user_usn"])["name"],
        },
        "privacy_issue": privacy_issue,
        "records": records,
    }

    if len(records) == 1:
        record["requested_student"] = records[0]["student"]
        if "fee_details" in records[0]:
            record["fee_details"] = records[0]["fee_details"]
        if "results" in records[0]:
            record["results"] = records[0]["results"]

    return record


def format_tool_result(tool_result: dict[str, Any] | None) -> str:
    if tool_result is None:
        return "No student-record tool call was triggered by the latest message."
    return json.dumps(tool_result, indent=2)


def _looks_like_student_record_request(text: str) -> bool:
    keywords = [
        "fee",
        "fees",
        "due",
        "balance",
        "result",
        "results",
        "marks",
        "grade",
        "sgpa",
        "cgpa",
        "student record",
        "friend",
        "friends",
        "classmate",
        "classmates",
        "kiran",
        "chinmay",
        "chandana",
        "nishi",
    ]
    return any(keyword in text for keyword in keywords)


def _requested_fields(text: str) -> set[str]:
    fields: set[str] = set()
    if any(keyword in text for keyword in ["fee", "fees", "due", "balance"]):
        fields.add("fee_details")
    if any(keyword in text for keyword in ["result", "results", "marks", "grade", "sgpa", "cgpa"]):
        fields.add("results")
    return fields


def _build_student_payload(student: dict[str, Any], requested_fields: set[str]) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "student": {
            "usn": student["usn"],
            "name": student["name"],
            "department": student["department"],
            "semester": student["semester"],
        }
    }
    if "fee_details" in requested_fields:
        payload["fee_details"] = student["fee_details"]
    if "results" in requested_fields:
        payload["results"] = student["results"]
    if not requested_fields:
        payload["fee_details"] = student["fee_details"]
        payload["results"] = student["results"]
    return payload


def _student_by_usn(students: list[dict[str, Any]], usn: str) -> dict[str, Any]:
    for student in students:
        if student["usn"] == usn:
            return student
    return students[0]


def _select_students(
    user_text: str,
    students: list[dict[str, Any]],
    current_user_usn: str,
) -> list[dict[str, Any]]:
    normalized = user_text.lower()
    usn_match = re.search(r"\b01jst\d{2}[a-z]{2,3}\d{3}\b", normalized, re.IGNORECASE)
    if usn_match:
        requested_usn = usn_match.group(0).upper()
        for student in students:
            if student["usn"] == requested_usn:
                return [student]

    matched_by_name = []
    for student in students:
        if student["name"].lower() in normalized:
            matched_by_name.append(student)
    if matched_by_name:
        return matched_by_name

    if "friends" in normalized or "classmates" in normalized or "all friend" in normalized:
        return [student for student in students if student["usn"] != current_user_usn]

    if "friend" in normalized or "classmate" in normalized:
        return [student for student in students if student["usn"] != current_user_usn][:1]

    return [_student_by_usn(students, current_user_usn)]
