import { Detail, List } from "@raycast/api";
import { useState } from "react";
import { convertVelocity } from "./unit-converters/velocity";

var helpMarkdown = `
*Currently working units*

## Velocity:
- rpm
- m/s or mps
- ft/s or fps
- km/h or kph
- mph

## Angular Velocity:

## Current & Torque:

## Gear Ratio:

## Mechanism Physics:
`;

function getMarkdown(conversionType: string, termsStr: string) {
    let syntaxHelp = "*Syntax: value unit to unit (parameter, parameter)*";
    switch(conversionType) {
        case "Help": return helpMarkdown;
        case "Mechanism Physics": syntaxHelp = "OTHER"
    }

    const parametersMatch = termsStr.match(/\(([^)]+)\)/);
    const parametersStr = parametersMatch ? parametersMatch[1] : "";
    const parametersTerms = parametersStr.split(",").map((term) => term.trim());

    const mainPart = termsStr.replace(/\(([^)]+)\)/, "");
    const mainTerms = mainPart.split(" ");

    let value = null;
    let fromUnit = null;
    let convertUnit = null;
    let parametersNames = null;

    var convertedValue: number | null = null;
    var parametersNeeded: string[] | null = null;
    var parametersUsed: any[] | null = null;
    let convertedTo: string | null = null;

    let parametersNeededStr = "";

    if (mainTerms.length > 1) {
        value = Number.parseFloat(mainTerms[0]);
        fromUnit = mainTerms[1];
        convertUnit = mainTerms[3];
        
        [convertedValue, parametersNeeded, parametersUsed, convertedTo = convertUnit] = convertVelocity(value, fromUnit, convertUnit, parametersTerms);
        parametersNames = ["Wheel radius", "Gear ratio"];

        if (parametersNeeded) {
            parametersNeededStr += parametersNeeded[0];
            parametersNeeded.forEach((element: string, index: number) => {
                if (index !== 0) {
                    parametersNeededStr += ", " + element;
                }
            });
        }
    }

    var markdown = ``;

    markdown += `${syntaxHelp}\n\n`;

    if (value && convertedValue) {
        markdown += `# ${value} → ${convertedValue?.toFixed(4) ?? "N/A"}\n\n`;
    } else {
        markdown += `# Enter a value to convert...\n\n`;
    }

    if (fromUnit && convertUnit) {
        markdown += `## ${fromUnit} → ${convertedTo}\n\n`;
    }

    if (parametersNames && parametersUsed) {
        parametersUsed.forEach((element, index) => {
            markdown += `${parametersNames[index]}: ${element}\n\n`;
        });
    }

    markdown += (parametersNeededStr != "undefined") ? `Parameters Needed: ${parametersNeededStr}` : `Parameters Needed: `;

    return markdown;
}

export default function Command() {
    const [searchText, setSearchText] = useState("");
    const termsStr = searchText.toLowerCase();

    const convertTypes = [
        "Velocity",
        "Angular Velocity",
        "Current & Torque",
        "Gear Ratio",
        "Mechanism Physics",
        "Help"
    ]

    let conversionType: string = "Velocity";

    return (
        <List
        searchText={searchText}
        onSearchTextChange={setSearchText}
        filtering={false}
        searchBarPlaceholder="Enter a value with a unit to convert, e.g. 5400 rpm"
        isShowingDetail
        >
            {convertTypes.map((conversionType) => (
                <List.Item key={conversionType} title={conversionType} detail={
                        <List.Item.Detail markdown={getMarkdown(conversionType, termsStr)} />
                    } 
                />
            ))}
        </List>
        /*<Detail
            markdown={markdown}
        />*/
    );
}