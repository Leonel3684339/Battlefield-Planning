import military_symbol as ms
from typing import Optional

def get_obstacle_svg(obstacle_name: str, style: str = 'unfilled') -> Optional[str]:
    """
    Return SVG string for an obstacle by natural language name.
    Example: "antitank ditch", "low wire fence", "minefield"
    """
    try:
        symbol = ms.get_symbol_class_from_name(obstacle_name)
        # Use unfilled style for obstacles (matches typical military maps)
        return symbol.get_svg(style=style, pixel_padding=4)
    except Exception as e:
        print(f"Failed to generate symbol for {obstacle_name}: {e}")
        return None

def get_unit_svg(unit_name: str, style: str = 'unfilled') -> Optional[str]:
    """Generate unit symbol by name, e.g. 'friendly infantry platoon'"""
    try:
        symbol = ms.get_symbol_class_from_name(unit_name)
        return symbol.get_svg(style=style, pixel_padding=4)
    except Exception as e:
        print(f"Failed to generate unit symbol for {unit_name}: {e}")
        return None