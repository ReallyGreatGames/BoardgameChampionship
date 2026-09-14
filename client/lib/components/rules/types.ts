import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { RuleType } from "@/lib/models/rule";

export type RuleFilter = "all" | RuleType;

export type RuleTypeConfig = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  labelKey: string;
  shortKey: string;
  filterKey: string;
};

export const RULE_TYPES: RuleType[] = ["change", "addition", "clarification"];

export const TYPE_CONFIGS: Record<RuleType, RuleTypeConfig> = {
  change: {
    icon: "swap-horizontal-outline",
    labelKey: "types.change",
    shortKey: "typeShort.change",
    filterKey: "filters.change",
  },
  addition: {
    icon: "add-circle-outline",
    labelKey: "types.addition",
    shortKey: "typeShort.addition",
    filterKey: "filters.addition",
  },
  clarification: {
    icon: "information-circle-outline",
    labelKey: "types.clarification",
    shortKey: "typeShort.clarification",
    filterKey: "filters.clarification",
  },
};

export function typeColor(
  ruleType: RuleType,
  colors: ReturnType<typeof useTheme>["colors"],
): string {
  switch (ruleType) {
    case "change":
      return colors.accent;
    case "addition":
      return colors.success;
    case "clarification":
      return colors.primary;
  }
}
