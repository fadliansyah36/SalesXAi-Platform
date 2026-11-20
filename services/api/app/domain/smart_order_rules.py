from decimal import Decimal, ROUND_HALF_UP

CENT = Decimal("0.01")

FULFILLMENT_TRANSITIONS = {
    "queued": frozenset({"picking", "cancelled"}),
    "picking": frozenset({"packed", "failed", "cancelled"}),
    "packed": frozenset({"handed_over", "failed", "cancelled"}),
    "handed_over": frozenset({"delivered", "failed"}),
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
