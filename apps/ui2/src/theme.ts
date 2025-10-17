// theme.ts
import { Card, Container, createTheme, MantineTheme, MantineThemeOverride, Paper, rem, Select } from "@mantine/core";

const fontSize = {
  h1: '1.75rem',
  h2: '1.5rem',
  h3: '1.25rem',
  p: '1rem',
  small: '0.875rem',
}


const CONTAINER_SIZES: Record<string, string> = {
  xxs: rem("200px"),
  xs: rem("300px"),
  sm: rem("400px"),
  md: rem("500px"),
  lg: rem("600px"),
  xl: rem("1400px"),
  xxl: rem("1600px"),
};

export const theme: MantineThemeOverride = createTheme({
  /** Put your mantine theme override here */
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  headings: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  },
  fontSizes: {
    xs: rem("12px"),
    sm: rem("14px"),
    md: rem("16px"),
    lg: rem("18px"),
    xl: rem("20px"),
    "2xl": rem("24px"),
    "3xl": rem("30px"),
    "4xl": rem("36px"),
    "5xl": rem("48px"),
  },
  spacing: {
    "3xs": rem("4px"),
    "2xs": rem("8px"),
    xs: rem("10px"),
    sm: rem("12px"),
    md: rem("16px"),
    lg: rem("20px"),
    xl: rem("24px"),
    "2xl": rem("28px"),
    "3xl": rem("32px"),
  },
  primaryColor: "teal",
  components: {
    Text: {
      styles: (theme: MantineTheme, params: { component: string }) => {
        const { component } = params;

        return {
          root: {
            ...(component === 'h1' && {
              fontSize: fontSize.h1,
              fontWeight: 400,
              lineHeight: 1.2,
              marginBottom: theme.spacing.md,
            }),
            ...(component === 'h2' && {
              fontSize: fontSize.h2,
              fontWeight: 600,
              lineHeight: 1.25,
              marginBottom: theme.spacing.sm,
            }),
            ...(component === 'h3' && {
              fontSize: fontSize.h3,
              fontWeight: 500,
              lineHeight: 1.3,
              marginBottom: theme.spacing.xs as any,
            }),
            ...(component === 'p' && {
              fontSize: fontSize.p,
              fontWeight: 400,
              lineHeight: 1.7,
              marginBottom: theme.spacing.xs as any,
            }),
            ...(component === 'small' && {
              fontSize: fontSize.small,
              padding: 0,
              fontWeight: 300,
              color: theme.colors.gray[100],
              lineHeight: '1.5rem',
              marginBottom: theme.spacing.xs as any,
            }),
          },
        };
      },
    },
    /** Put your mantine component override here */
    Container: Container.extend({
      vars: (_, { size, fluid }) => ({
        root: {
          "--container-size": fluid
            ? "100%"
            : size !== undefined && size in CONTAINER_SIZES
              ? CONTAINER_SIZES[size]
              : rem(size),
        },
      }),
    }),
    Paper: Paper.extend({
      defaultProps: {
        p: "md",
        shadow: "xl",
        radius: "md",
        withBorder: true,
      },
    }),

    Card: Card.extend({
      defaultProps: {
        p: "xl",
        shadow: "xl",
        radius: "var(--mantine-radius-default)",
        withBorder: true,
      },
    }),
    Select: Select.extend({
      defaultProps: {
        checkIconPosition: "right",
      },
    }),
  },
  other: {
    style: "mantine",
  },
});
