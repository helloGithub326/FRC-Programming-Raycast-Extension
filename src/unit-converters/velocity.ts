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

function toMetersPerSecond(value: number, fromUnit: string, wheelRadius: number, gearRatio: number): [number, string[] | null] {
    switch (fromUnit) {
        case "rpm":
            return [(value / gearRatio) * ((2 * Math.PI * wheelRadius) / 60), null];
        
        case "m/s":
        case "mps":
            return [value, null];
        
        case "ft/s":
        case "fps":
            return [value * 0.3048, null];
        
        case "km/h":
        case "kph":
            return [value / 3.6, null];
        
        case "mph":
            return [value * 0.44704, null];
    }

    return [value, ["Wheel Radius", "Gear Ratio"]];
}

function fromMetersPerSecond(metersPerSecond: number, wheelRadius: number, gearRatio: number) {
    const rpmDenominator = 2 * Math.PI * wheelRadius;
    const rpm = (!isNaN(rpmDenominator) && rpmDenominator !== 0) ? (60 * metersPerSecond * gearRatio) / rpmDenominator : null;

    const feetPerSecond = metersPerSecond * 3.28084;
    const kph = metersPerSecond * 3.6;
    const mph = metersPerSecond * 2.23694;

    return [metersPerSecond, rpm, feetPerSecond, kph, mph];
}

export function convertVelocity(value: number, fromUnit: string, convertUnit: string, parameters: string[]): [number | null, string[] | null, any[] | null, string?] {
    var parametersSplit: any[][] = [];

    let wheelRadius = 0.0508;
    let gearRatio = 1;
    
    parameters.forEach((element) => {
        let fused = element.match(/^(\d+\.?\d*)([a-z]+)$/);
        if (fused) {
            parametersSplit.push([fused[1], fused[2]]);
        } else {
            parametersSplit.push(element.split(" "));
        }
    });

    if (parametersSplit.length >= 1 && parametersSplit[0][0] && parametersSplit[0][1]) {
        wheelRadius = toMeters(parametersSplit[0][0], parametersSplit[0][1]);
    }
    if (parametersSplit.length >= 2 && parametersSplit[1][0]) {
        gearRatio = toGearRatio(parametersSplit[1][0]);
    }

    let [msValue, parametersNeeded] = toMetersPerSecond(value, fromUnit, wheelRadius, gearRatio);
    let [metersPerSecond, rpm, feetPerSecond, kph, mph] = fromMetersPerSecond(msValue, wheelRadius, gearRatio);
    let parametersUsed = [((parametersSplit[0][0] == null) ? parametersSplit[0].join(" ") : (wheelRadius + " m")), gearRatio];

    if (!convertUnit || convertUnit.trim() === "") {
        return [value, parametersNeeded, parametersUsed];
    }

    switch (convertUnit) {
        case "rpm":
            return [rpm, parametersNeeded, parametersUsed];
        
        case "m/s":
        case "mps":
            return [metersPerSecond, parametersNeeded, parametersUsed];
        
        case "ft/s":
        case "fps":
            return [feetPerSecond, parametersNeeded, parametersUsed];
        
        case "km/h":
        case "kph":
            return [kph, parametersNeeded, parametersUsed];
        
        case "mph":
            return [mph, parametersNeeded, parametersUsed];
    }

    return [metersPerSecond, parametersNeeded, parametersUsed, "m/s"]
}