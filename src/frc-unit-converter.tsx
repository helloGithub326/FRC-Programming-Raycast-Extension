import { Detail, List } from "@raycast/api";
import { useState } from "react";
import { convertVelocity } from "./unit-converters/velocity";
import { ParameterDisplay } from "./unit-converters/general";

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

    var convertedValue: number | null = null;
    var parametersUsed: ParameterDisplay[] | null = null;
    var parametersNeeded: string[] = [];

    let parametersNeededStr = "";

    if (conversionType === "Velocity" && mainTerms.length >= 4) {
        value = Number.parseFloat(mainTerms[0]);
        fromUnit = mainTerms[1];
        // mainTerms[2] should be "to"
        convertUnit = mainTerms[3];
        
        if (!isNaN(value) && fromUnit && convertUnit) {
                const conversionResult = convertVelocity(value, fromUnit, convertUnit, parametersTerms);
            
            convertedValue = conversionResult.result;
            parametersUsed = conversionResult.parametersUsed;
            parametersNeeded = conversionResult.parametersNeeded;
            
            if (conversionResult.parametersNeeded.length > 0) {
                parametersNeededStr = conversionResult.parametersNeeded.join(", ");
            }
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
        markdown += `## ${fromUnit} → ${convertUnit}\n\n`;
    }

    if (parametersUsed && parametersUsed.length > 0) {
        parametersUsed.forEach((param) => {
            const defaultLabel = param.isDefault ? " (default)" : "";
            markdown += `*${param.name}: ${param.value}${defaultLabel}*\n\n`;
        });
    }

    if (parametersNeededStr) {
        markdown += `**Parameters Needed: ${parametersNeededStr}**`;
    }

    return markdown;
}

export default function Command() {
    const [searchText, setSearchText] = useState("");

    let termsStr = "";
    if (searchText) {
        termsStr = searchText.toLowerCase();
    }

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