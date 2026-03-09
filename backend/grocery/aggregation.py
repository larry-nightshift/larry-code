"""
Unit conversion and ingredient aggregation logic for grocery lists.
"""
from decimal import Decimal
from typing import Dict, List, Tuple


# Conversion table: (from_unit, to_unit) -> ratio
# ratio means: 1 from_unit = ratio to_unit
UNIT_CONVERSIONS = {
    # Metric volume
    ('ml', 'l'): Decimal('0.001'),
    ('l', 'ml'): Decimal('1000'),

    # US volume
    ('tsp', 'tbsp'): Decimal('0.333333'),
    ('tbsp', 'tsp'): Decimal('3'),
    ('cup', 'tbsp'): Decimal('16'),
    ('tbsp', 'cup'): Decimal('0.0625'),
    ('cup', 'ml'): Decimal('236.588'),
    ('ml', 'cup'): Decimal('0.004227'),

    # Metric weight
    ('g', 'kg'): Decimal('0.001'),
    ('kg', 'g'): Decimal('1000'),

    # Approximations for common baking ingredients
    # (These are rough conversions and flagged in the UI)
    ('cup', 'g'): Decimal('120'),  # All-purpose flour approx
    ('g', 'cup'): Decimal('0.00833'),
}


def get_canonical_unit(unit: str) -> str:
    """Normalize unit names to canonical forms."""
    unit_lower = unit.lower().strip()

    # Teaspoon variants
    if unit_lower in ['tsp', 'teaspoon', 'teaspoons']:
        return 'tsp'

    # Tablespoon variants
    if unit_lower in ['tbsp', 'tablespoon', 'tablespoons']:
        return 'tbsp'

    # Cup variants
    if unit_lower in ['cup', 'cups', 'c']:
        return 'cup'

    # Gram variants
    if unit_lower in ['g', 'gram', 'grams']:
        return 'g'

    # Kilogram variants
    if unit_lower in ['kg', 'kilogram', 'kilograms']:
        return 'kg'

    # Milliliter variants
    if unit_lower in ['ml', 'milliliter', 'milliliters']:
        return 'ml'

    # Liter variants
    if unit_lower in ['l', 'liter', 'liters']:
        return 'l'

    # Whole/count
    if unit_lower in ['whole', 'count', 'piece', 'pieces', 'item', 'items']:
        return 'whole'

    # Return original if no match
    return unit_lower


def convert_amount(
    amount: Decimal, from_unit: str, to_unit: str
) -> Tuple[Decimal, bool]:
    """
    Convert amount from one unit to another.

    Returns:
        (converted_amount, is_approximate) - is_approximate is True if the
        conversion is an approximation (e.g., cup to grams for flour)
    """
    from_unit = get_canonical_unit(from_unit)
    to_unit = get_canonical_unit(to_unit)

    if from_unit == to_unit:
        return amount, False

    # Check if conversion exists
    if (from_unit, to_unit) in UNIT_CONVERSIONS:
        ratio = UNIT_CONVERSIONS[(from_unit, to_unit)]
        is_approx = from_unit == 'cup' and to_unit == 'g'
        is_approx = is_approx or (from_unit == 'g' and to_unit == 'cup')
        return amount * ratio, is_approx

    # Try reverse conversion
    if (to_unit, from_unit) in UNIT_CONVERSIONS:
        ratio = UNIT_CONVERSIONS[(to_unit, from_unit)]
        is_approx = from_unit == 'cup' and to_unit == 'g'
        is_approx = is_approx or (from_unit == 'g' and to_unit == 'cup')
        return amount / ratio, is_approx

    # No conversion possible
    return amount, False


def aggregate_ingredients(
    scaled_ingredients: List[Dict]
) -> List[Dict]:
    """
    Aggregate a list of scaled ingredients by name and unit.

    Input:
        [
            {'name': 'flour', 'amount': Decimal('200'), 'unit': 'g', 'source_recipes': [...]},
            {'name': 'flour', 'amount': Decimal('1'), 'unit': 'cup', 'source_recipes': [...]},
        ]

    Returns:
        Aggregated list with deduplicated ingredients where possible.
    """
    # Group by normalized name
    by_name: Dict[str, List[Dict]] = {}

    for ingredient in scaled_ingredients:
        name = ingredient['name'].lower().strip()
        if name not in by_name:
            by_name[name] = []
        by_name[name].append(ingredient)

    # Aggregate each group
    result = []

    for name, ingredients_group in by_name.items():
        if len(ingredients_group) == 1:
            # Single ingredient, keep as-is
            result.append(ingredients_group[0])
        else:
            # Multiple entries with same name; try to consolidate
            # Pick the unit of the first entry as "target"
            target_unit = ingredients_group[0]['unit']
            total_amount = Decimal('0')
            all_sources = []

            can_consolidate = True

            for ing in ingredients_group:
                unit = ing['unit']
                amount = ing['amount']

                if unit != target_unit:
                    # Try to convert
                    converted, is_approx = convert_amount(amount, unit, target_unit)
                    if is_approx or unit == 'whole' or target_unit == 'whole':
                        # Can't safely consolidate; keep separate
                        can_consolidate = False
                        break
                    amount = converted

                total_amount += amount
                all_sources.extend(ing.get('source_recipes', []))

            if can_consolidate:
                result.append({
                    'name': ingredients_group[0]['name'],  # Use original casing
                    'amount': total_amount,
                    'unit': target_unit,
                    'source_recipes': all_sources,
                })
            else:
                # Keep separate
                for ing in ingredients_group:
                    result.append(ing)

    # Sort by name
    result.sort(key=lambda x: x['name'])
    return result
