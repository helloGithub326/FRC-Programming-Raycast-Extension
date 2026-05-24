function toMetersPerSecond(value: number, fromUnit: string, wheelRadius: number, gearRatio: number): number {
    switch (fromUnit) {
        case "rpm":
            return (value / gearRatio) * ((2 * Math.PI * wheelRadius) / 60);
        
        case "m/s":
        case "mps":
            return value;
        
        case "ft/s":
        case "fps":
            return value * 0.3048;
        
        case "km/h":
        case "kph":
            return value / 3.6;
        
        case "mph":
            return value * 0.44704;
    }

    return value;
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

    let hasWheelRadius = false;
    let hasGearRatio = false;
    
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
        hasWheelRadius = true;
    }
    if (parametersSplit.length >= 2 && parametersSplit[1][0]) {
        gearRatio = toGearRatio(parametersSplit[1][0]);
        hasGearRatio = true;
    }

    let msValue = toMetersPerSecond(value, fromUnit, wheelRadius, gearRatio);
    let [metersPerSecond, rpm, feetPerSecond, kph, mph] = fromMetersPerSecond(msValue, wheelRadius, gearRatio);
    let parametersUsed = [((parametersSplit[0][0] == null) ? parametersSplit[0].join(" ") : (wheelRadius + " m")), gearRatio];
    
    let parametersNeeded = [];
    if (!hasWheelRadius) parametersNeeded.push("wheel radius");
    if (!hasGearRatio) parametersNeeded.push("gear ratio");
    
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