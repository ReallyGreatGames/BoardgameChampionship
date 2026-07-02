import { useMemo } from "react";
import { Linking, TextStyle } from "react-native";
import RNMarkdown from "react-native-markdown-display";
import { useTheme } from "@/lib/bootstrap/ThemeProvider";
import { fonts } from "@/lib/theme/typography";

type MarkdownProps = {
  children: string;
  textStyle: TextStyle;
};

export function Markdown({ children, textStyle }: MarkdownProps) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => makeMarkdownStyles(colors, textStyle),
    [colors, textStyle],
  );

  return (
    <RNMarkdown
      style={styles}
      onLinkPress={(url) => {
        Linking.openURL(url).catch(() => {});
        return false;
      }}
    >
      {children}
    </RNMarkdown>
  );
}

function makeMarkdownStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  textStyle: TextStyle,
) {
  const base = {
    ...textStyle,
    color: textStyle.color ?? colors.text,
  };

  return {
    body: base,
    paragraph: {
      marginTop: 0,
      marginBottom: 0,
    },
    strong: {
      fontFamily: fonts.bodyBold,
    },
    em: {
      fontStyle: "italic" as const,
    },
    bullet_list: {
      marginTop: 4,
      marginBottom: 4,
    },
    ordered_list: {
      marginTop: 4,
      marginBottom: 4,
    },
    list_item: {
      marginTop: 2,
      flexDirection: "row" as const,
    },
    link: {
      color: colors.accent,
      textDecorationLine: "underline" as const,
    },
    code_inline: {
      ...base,
      backgroundColor: colors.surfaceHigh,
      borderRadius: 4,
      paddingHorizontal: 4,
    },
    code_block: {
      ...base,
      backgroundColor: colors.surfaceHigh,
      borderRadius: 8,
      padding: 8,
    },
    fence: {
      ...base,
      backgroundColor: colors.surfaceHigh,
      borderRadius: 8,
      padding: 8,
    },
    blockquote: {
      backgroundColor: colors.surfaceHigh,
      borderLeftWidth: 3,
      borderLeftColor: colors.border,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginVertical: 4,
    },
    hr: {
      backgroundColor: colors.divider,
      height: 1,
      marginVertical: 8,
    },
  };
}
