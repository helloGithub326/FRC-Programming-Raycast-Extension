function toMeters(value: number, unit: string) {
    const factors: Record<string, number> = {
        "mm": 0.001,
        "millimeter": 0.001,
        "millimeters": 0.001,
        "cm": 0.01,
        "centimeter": 0.01,
        "centimeters": 0.01,
        "dm": 0.1,
        "decimeter": 0.1,
        "decimeters": 0.1,
        "m": 1,
        "meter": 1,
        "meters": 1,
        "km": 1000,
        "kilometer": 1000,
        "kilometers": 1000,
        "in": 0.0254,
        "inch": 0.0254,
        "inches": 0.0254,
        "ft": 0.3048,
        "foot": 0.3048,
        "feet": 0.3048,
        "yd": 0.9144,
        "yard": 0.9144,
        "yards": 0.9144,
    };

    return (factors[unit] ?? 1) * value;
}

function toGearRatio(gearRatioStr: string): number {
    const parts = gearRatioStr.split(":");
    if (parts.length !== 2) return Number.parseFloat(gearRatioStr);
    
    const numerator = parseFloat(parts[0]);
    const denominator = parseFloat(parts[1]);
    
    if (isNaN(numerator) || isNaN(denominator) || denominator === 0) return 1;
    
    return numerator / denominator;
}