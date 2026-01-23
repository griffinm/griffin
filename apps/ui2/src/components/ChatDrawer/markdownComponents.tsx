import { Text, Box } from '@mantine/core';
import { Components } from 'react-markdown';

export const markdownComponents: Components = {
  p: ({ children }) => (
    <Text size="sm" component="p" style={{ margin: '0 0 8px 0' }}>
      {children}
    </Text>
  ),
  h1: ({ children }) => (
    <Text size="xl" fw={700} component="h1" style={{ margin: '0 0 8px 0' }}>
      {children}
    </Text>
  ),
  h2: ({ children }) => (
    <Text size="lg" fw={700} component="h2" style={{ margin: '0 0 8px 0' }}>
      {children}
    </Text>
  ),
  h3: ({ children }) => (
    <Text size="md" fw={700} component="h3" style={{ margin: '0 0 8px 0' }}>
      {children}
    </Text>
  ),
  h4: ({ children }) => (
    <Text size="sm" fw={700} component="h4" style={{ margin: '0 0 8px 0' }}>
      {children}
    </Text>
  ),
  h5: ({ children }) => (
    <Text size="sm" fw={600} component="h5" style={{ margin: '0 0 8px 0' }}>
      {children}
    </Text>
  ),
  h6: ({ children }) => (
    <Text size="sm" fw={600} component="h6" style={{ margin: '0 0 8px 0' }}>
      {children}
    </Text>
  ),
  ul: ({ children }) => (
    <Box component="ul" style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>
      {children}
    </Box>
  ),
  ol: ({ children }) => (
    <Box component="ol" style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>
      {children}
    </Box>
  ),
  li: ({ children }) => (
    <Text size="sm" component="li" style={{ marginBottom: '4px' }}>
      {children}
    </Text>
  ),
  code: ({ children, className }) => {
    const isInline = !className;
    return isInline ? (
      <Text
        size="sm"
        component="code"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          padding: '2px 4px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '13px',
        }}
      >
        {children}
      </Text>
    ) : (
      <Box
        component="pre"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          padding: '12px',
          borderRadius: '6px',
          overflow: 'auto',
          margin: '8px 0',
          fontSize: '13px',
          fontFamily: 'monospace',
        }}
      >
        <Text size="sm" component="code" style={{ fontFamily: 'monospace' }}>
          {children}
        </Text>
      </Box>
    );
  },
  blockquote: ({ children }) => (
    <Box
      component="blockquote"
      style={{
        borderLeft: '3px solid #dee2e6',
        paddingLeft: '12px',
        margin: '8px 0',
        fontStyle: 'italic',
        color: '#868e96',
      }}
    >
      <Text size="sm">{children}</Text>
    </Box>
  ),
  a: ({ href, children }) => (
    <Text
      size="sm"
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: '#228be6',
        textDecoration: 'underline',
        cursor: 'pointer',
      }}
    >
      {children}
    </Text>
  ),
  table: ({ children }) => (
    <Box
      component="table"
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        margin: '8px 0',
        fontSize: '14px',
      }}
    >
      {children}
    </Box>
  ),
  thead: ({ children }) => (
    <Box component="thead" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
      {children}
    </Box>
  ),
  tbody: ({ children }) => <Box component="tbody">{children}</Box>,
  tr: ({ children }) => (
    <Box component="tr" style={{ borderBottom: '1px solid #dee2e6' }}>
      {children}
    </Box>
  ),
  th: ({ children }) => (
    <Text
      size="sm"
      component="th"
      fw={600}
      style={{
        padding: '8px',
        textAlign: 'left',
        borderRight: '1px solid #dee2e6',
      }}
    >
      {children}
    </Text>
  ),
  td: ({ children }) => (
    <Text
      size="sm"
      component="td"
      style={{
        padding: '8px',
        borderRight: '1px solid #dee2e6',
      }}
    >
      {children}
    </Text>
  ),
  hr: () => (
    <Box
      component="hr"
      style={{
        border: 'none',
        borderTop: '1px solid #dee2e6',
        margin: '12px 0',
      }}
    />
  ),
  strong: ({ children }) => (
    <Text size="sm" fw={700} component="strong">
      {children}
    </Text>
  ),
  em: ({ children }) => (
    <Text size="sm" component="em" style={{ fontStyle: 'italic' }}>
      {children}
    </Text>
  ),
};
