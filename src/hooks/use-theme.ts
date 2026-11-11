import { useThemeContext } from "@/contexts/theme-context";
import { useMemo } from "react";

type ThemeColors = ReturnType<typeof useThemeContext>["colors"];
type StyleMap = Record<string, object>;

function themedColor(
  property: string,
  value: unknown,
  colors: ThemeColors,
): unknown {
  if (typeof value !== "string") return value;

  const color = value.toUpperCase();

  if (property === "backgroundColor") {
    if (["#F7F3E8", "#F8F6F1", "#F8F7F2", "#F7F5EF", "#F7F6F1"].includes(color)) {
      return colors.background;
    }
    if (["#FFFFFF", "#F1F0EB"].includes(color)) return colors.backgroundElement;
    if (["#DCE9E8", "#E0E1E6", "#E8E5DD", "#EAE7DE", "#EAE7DF", "#EAE9E2"].includes(color)) {
      return colors.backgroundSelected;
    }
    if (["#E5EFE4", "#E5F1E8", "#E8EEE8", "#EDF3EE", "#E5EEE8", "#F0F3EC", "#D5E2D3", "#E7EFE9"].includes(color)) {
      return colors.successBackground;
    }
    if (["#2F7F8F", "#28745A", "#315C49", "#285943", "#253A32", "#294C3D"].includes(color)) {
      return colors.primary;
    }
    if (["#FCE8E6", "#FCE4E2", "#F9ECE9"].includes(color)) return colors.dangerBackground;
    if (["#F8EBD6", "#FFF4D6", "#F8F0DF"].includes(color)) return colors.warningBackground;
    return value;
  }

  if (["borderColor", "borderTopColor", "borderBottomColor", "borderLeftColor", "borderRightColor"].includes(property)) {
    if (["#D8E4E2", "#D8D2C4", "#D8C9C3"].includes(color)) {
      return colors.inputBorder;
    }
    if (["#2F7F8F", "#28745A", "#315C49", "#253A32", "#294C3D"].includes(color)) {
      return colors.primary;
    }
    if (["#FFFFFF", "#E5E1D8", "#E3E1D8", "#EAE8E0", "#D8D6CD", "#ECE8DF", "#E5E2D9", "#EEECE6"].includes(color)) {
      return colors.border;
    }
    return value;
  }

  if (property === "color" || property === "tintColor") {
    if (["#253A32", "#30352F", "#454B45", "#243D32", "#294C3D", "#343A34", "#4D5149"].includes(color)) {
      return colors.text;
    }
    if (["#77736B", "#99968E", "#99958C", "#66635D", "#5D625B", "#55584F", "#555B55", "#66665F", "#5E625B", "#5F5C55", "#64756C", "#6E756F", "#716F68", "#777777", "#777D78", "#AAA59C", "#80602D"].includes(color)) {
      return colors.textSecondary;
    }
    if (["#2F7F8F", "#28745A", "#315C49", "#285943", "#294C3D"].includes(color)) {
      return colors.primary;
    }
    if (["#6B8E5A", "#557448", "#61756A", "#2E7D32"].includes(color)) return colors.success;
    if (["#A34A3A", "#B04444", "#A13A32"].includes(color)) return colors.danger;
    if (["#A36B20", "#625F58"].includes(color)) return colors.warning;
    if (color === "#FFFFFF") return colors.onPrimary;
  }

  return value;
}

function recolorStyle(style: object, colors: ThemeColors): object {
  const themed = { ...style } as Record<string, unknown>;

  for (const property of [
    "backgroundColor",
    "borderColor",
    "borderTopColor",
    "borderBottomColor",
    "borderLeftColor",
    "borderRightColor",
    "color",
    "tintColor",
  ]) {
    themed[property] = themedColor(property, themed[property], colors);
  }

  return themed;
}

export function useThemedStyles<T extends StyleMap>(styles: T): T {
  const { colors } = useThemeContext();

  return useMemo(
    () =>
      Object.fromEntries(
        Object.entries(styles).map(([name, style]) => [
          name,
          recolorStyle(style, colors),
        ]),
      ) as T,
    [colors, styles],
  );
}

export function useTheme() {
  const { colors } = useThemeContext();

  return colors;
}
