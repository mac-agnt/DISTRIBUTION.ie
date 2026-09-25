import type { ComponentType } from "react";
import { Page } from "../ui";

function Placeholder() {
  return <Page eyebrow="Finance" title="Finance"><div /></Page>;
}

export const PAGES: Record<string, ComponentType> = { overview: Placeholder };
