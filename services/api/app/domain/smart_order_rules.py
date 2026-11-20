from decimal import Decimal, ROUND_HALF_UP

CENT = Decimal("0.01")

FULFILLMENT_TRANSITIONS = {
    "queued": frozenset({"picking", "cancelled"}),
    "picking": frozenset({"packed", "failed", "cancelled"}),
    "packed": frozenset({"handed_over", "failed", "cancelled"}),
    "handed_over": frozenset({"failed"}),
    "failed": frozenset({"picking"}),
    "cancelled": frozenset(),
    "delivered": frozenset(),
}

CANCELLABLE_ORDER_STATUSES = frozenset({"draft", "pending_approval", "revision_requested", "approved"})


def money(value: Decimal | int | float | str) -> Decimal:
    return Decimal(str(value)).quantize(CENT, rounding=ROUND_HALF_UP)


def line_totals(unit_price: Decimal | int | float | str, quantity: Decimal | int | float | str, tax_rate: Decimal | int | float | str) -> dict[str, Decimal]:
    price, qty, rate = Decimal(str(unit_price)), Decimal(str(quantity)), Decimal(str(tax_rate))
    if price < 0 or qty <= 0 or rate < 0 or rate > 100:
        raise ValueError("Invalid price, quantity or tax rate.")
    subtotal = money(price * qty)
    tax = money(subtotal * rate / Decimal("100"))
    return {"unit_price": money(price), "quantity": qty, "subtotal": subtotal, "tax": tax, "total": money(subtotal + tax)}


def percentage_discount(base: Decimal | int | float | str, percent: Decimal | int | float | str) -> Decimal:
    amount, rate = Decimal(str(base)), Decimal(str(percent))
    if amount < 0:
        raise ValueError("Discount base cannot be negative.")
    return money(amount * min(max(rate, Decimal("0")), Decimal("100")) / Decimal("100"))


def fixed_discount(base: Decimal | int | float | str, amount: Decimal | int | float | str) -> Decimal:
    subtotal, discount = Decimal(str(base)), Decimal(str(amount))
    if subtotal < 0 or discount < 0:
        raise ValueError("Discount values cannot be negative.")
    return min(money(subtotal), money(discount))


def available_stock(on_hand: Decimal | int | float | str, reserved: Decimal | int | float | str, committed: Decimal | int | float | str) -> Decimal:
    on_hand_value, reserved_value, committed_value = map(Decimal, map(str, (on_hand, reserved, committed)))
    if min(on_hand_value, reserved_value, committed_value) < 0 or reserved_value + committed_value > on_hand_value:
        raise ValueError("Inventory allocation invariant is violated.")
    return on_hand_value - reserved_value - committed_value


def can_transition_fulfillment(current: str, target: str) -> bool:
    return target in FULFILLMENT_TRANSITIONS.get(current, frozenset())


def can_cancel_order(status: str) -> bool:
    return status in CANCELLABLE_ORDER_STATUSES


def evaluate_promotion_candidates(
    promotions: list[dict],
    subtotal: Decimal | int | float | str,
    quantity: Decimal | int | float | str,
    customer_organization_id: str | None,
    lines: list[dict],
) -> tuple[list[dict], Decimal]:
    """Evaluate ordered, pre-filtered promotion candidates deterministically.

    Product/category selectors are evaluated before discount rules so JSON
    aggregation order cannot accidentally turn a targeted discount into a
    whole-cart discount.
    """
    cart_subtotal = money(subtotal)
    cart_quantity = Decimal(str(quantity))
    applied: list[dict] = []
    discount_total = Decimal("0")
    used_stacking_groups: set[str] = set()

    for promotion in promotions:
        group = promotion.get("stacking_group")
        if group and group in used_stacking_groups:
            continue
        rules = promotion.get("rules") or []
        eligible = True
        selected_line_indexes: set[int] | None = None

        for rule in rules:
            kind = rule.get("rule_type")
            config = rule.get("rule_config") or {}
            if kind == "minimum_value" and cart_subtotal < Decimal(str(config.get("amount", 0))):
                eligible = False
            elif kind == "minimum_quantity" and cart_quantity < Decimal(str(config.get("quantity", 0))):
                eligible = False
            elif kind == "customer" and config.get("organization_id") and str(customer_organization_id) != str(config["organization_id"]):
                eligible = False
            elif kind == "organization_type":
                allowed_audiences = set(config.get("organization_types") or ([config.get("organization_type")] if config.get("organization_type") else []))
                if promotion.get("consumer_relationship_type") not in allowed_audiences:
                    eligible = False
            elif kind == "voucher" and config.get("code") and str(config["code"]).upper() != str(promotion.get("code", "")).upper():
                eligible = False
            elif kind in {"product", "category"}:
                field = "product_id" if kind == "product" else "category_id"
                singular = config.get(field)
                plural = config.get(f"{field}s")
                allowed = {str(singular)} if singular else {str(value) for value in (plural or [])}
                matched = {
                    index for index, line in enumerate(lines)
                    if str(line.get(field) or "") in allowed
                }
                selected_line_indexes = matched if selected_line_indexes is None else selected_line_indexes & matched
                if not matched or not selected_line_indexes:
                    eligible = False

        if not eligible:
            continue

        eligible_subtotal = cart_subtotal
        if selected_line_indexes is not None:
            eligible_subtotal = money(sum(
                (Decimal(str(lines[index].get("subtotal", 0))) for index in selected_line_indexes),
                Decimal("0"),
            ))
        if eligible_subtotal <= 0:
            continue

        discount = Decimal("0")
        for rule in rules:
            kind = rule.get("rule_type")
            config = rule.get("rule_config") or {}
            if kind == "discount_percent":
                discount = max(discount, percentage_discount(eligible_subtotal, config.get("percent", 0)))
            elif kind == "discount_amount":
                discount = max(discount, fixed_discount(eligible_subtotal, config.get("amount", 0)))

        if discount <= 0:
            continue
        applied.append({
            "promotion_id": str(promotion["id"]),
            "promotion_owner_organization_id": str(promotion["organization_id"]),
            "code": promotion["code"],
            "name": promotion.get("name"),
            "discount_amount": str(discount),
            "priority": promotion.get("priority", 100),
            "stackable": bool(promotion.get("stackable", False)),
            "stacking_group": promotion.get("stacking_group"),
            "max_redemptions": promotion.get("max_redemptions"),
            "max_per_customer": promotion.get("max_per_customer"),
            "rules_snapshot": rules,
        })
        discount_total += discount
        if group:
            used_stacking_groups.add(str(group))
        if not promotion.get("stackable", False):
            break

    return applied, min(money(discount_total), cart_subtotal)
