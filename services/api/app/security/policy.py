import json
from collections.abc import Mapping
from typing import Any


def abac_conditions_match(
    assignment_attributes: Mapping[str, Any] | str | None,
    resource_attributes: Mapping[str, Any],
) -> bool:
    """Evaluate server-derived ABAC equality conditions; missing conditions are non-restrictive."""
    if isinstance(assignment_attributes, str):
        try:
            attributes = json.loads(assignment_attributes)
        except json.JSONDecodeError:
            return False
    else:
        attributes = assignment_attributes or {}
    if not isinstance(attributes, Mapping):
        return False
    conditions = attributes.get("conditions", {})
    if not isinstance(conditions, Mapping):
        return False
    return all(resource_attributes.get(key) == value for key, value in conditions.items())
