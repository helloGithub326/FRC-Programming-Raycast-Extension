import { List, Cache, ActionPanel, Action } from "@raycast/api";
import { useState, useRef } from "react";

const cache = new Cache();
const SEARCH_TEXT_KEY = "searchTextPython";
