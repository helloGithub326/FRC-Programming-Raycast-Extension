import { Detail, List, Cache } from "@raycast/api";
import { useState, useEffect } from "react";
import { convertVelocity } from "./unit-converters/velocity";
import { ParameterDisplay } from "./unit-converters/general";
import { convertAngularVelocity } from "./unit-converters/angular-velocity";

var helpMarkdown = `
*Currently working units (aliases work too)*

## Velocity:
- rpm
- m/s or mps
- ft/s or fps
- km/h or kph
- mph

## Angular Velocity:
- rpm
- rps
- rad/s
- deg/s

## Current & Torque:

## Gear Ratio:

## Mechanism Physics:
`;

function getMarkdown(conversionType: string, termsStr: string) {
    let syntaxHelp = "";
    switch(conversionType) {
        case "Help": return helpMarkdown
        case "Velocity":
            syntaxHelp = "*Syntax: value unit to unit (parameter, parameter)*";
            break;
        case "Angular Velocity":
            syntaxHelp = "*Syntax: value unit to unit*";
            break;
        case "Current & Torque":
            syntaxHelp = "NOT DONE"; 
            break;
        case "Gear Ratio":
            syntaxHelp = "NOT DONE"; 
            break;
        case "Mechanism Physics":
            syntaxHelp = "NOT DONE"; 
            break;
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

    if (mainTerms.length >= 4) {
        if (conversionType === "Velocity") {
            value = Number.parseFloat(mainTerms[0]);
            fromUnit = mainTerms[1];
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
        } else if (conversionType === "Angular Velocity") {
            value = Number.parseFloat(mainTerms[0]);
            fromUnit = mainTerms[1];
            convertUnit = mainTerms[3];
            
            if (!isNaN(value) && fromUnit && convertUnit) {
                const conversionResult = convertAngularVelocity(value, fromUnit, convertUnit, parametersTerms);
                
                convertedValue = conversionResult.result;
                parametersUsed = conversionResult.parametersUsed;
                parametersNeeded = conversionResult.parametersNeeded;
                
                if (conversionResult.parametersNeeded.length > 0) {
                    parametersNeededStr = conversionResult.parametersNeeded.join(", ");
                }
            }
        }
    }

    var markdown = ``;

    markdown += `${syntaxHelp}\n\n`;

    if (value && convertedValue) {
        markdown += `# ${value} → ${convertedValue != null ? parseFloat(convertedValue.toFixed(4)).toString() : "N/A"}\n\n`;
    } else {
        markdown += `# Enter a value to convert...\n\n`;
    }

    if (fromUnit && convertUnit) {
        markdown += `## ${parametersNeededStr.includes("unrecognized input unit") ? "unrecognized" : fromUnit} → ${parametersNeededStr.includes("unrecognized output unit") ? "unrecognized" : convertUnit}\n\n`;
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

const cache = new Cache();
const SEARCH_TEXT_KEY = "searchText";
const SELECTED_TYPE_KEY = "selectedConversionType";

export default function Command() {
    const [searchText, setSearchText] = useState("");
    const [selectedType, setSelectedType] = useState("Velocity");

    useEffect(() => {
        const cachedSearchText = cache.get(SEARCH_TEXT_KEY);
        const cachedType = cache.get(SELECTED_TYPE_KEY);
        
        if (cachedSearchText) {
            setSearchText(cachedSearchText);
        }
        if (cachedType) {
            setSelectedType(cachedType);
        }
    }, []);

    const handleSearchChange = (text: string) => {
        setSearchText(text);
        cache.set(SEARCH_TEXT_KEY, text);
    };

    const handleSelectType = (type: string) => {
        setSelectedType(type);
        cache.set(SELECTED_TYPE_KEY, type);
    };

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

    return (
        <List
            searchText={searchText}
            onSearchTextChange={handleSearchChange}
            filtering={false}
            searchBarPlaceholder="Enter a value with a unit to convert, e.g. 5400 rpm"
            isShowingDetail
            selectedItemId={selectedType}
            onSelectionChange={(id) => id && handleSelectType(id)}
        >
            {convertTypes.map((conversionType) => (
                <List.Item 
                    key={conversionType} 
                    id={conversionType}
                    title={conversionType} 
                    detail={<List.Item.Detail markdown={getMarkdown(conversionType, termsStr)} />}
                />
            ))}
        </List>
    );
}