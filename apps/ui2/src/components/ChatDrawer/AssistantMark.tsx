interface AssistantMarkProps {
  /** Glyph size in px. */
  size?: number;
  /** Slow shimmer/pulse for the "thinking" state. */
  pulsing?: boolean;
}

/**
 * The assistant's signature identity — a gradient-filled sparkle (✦) rendered
 * with the shared `--chat-aurora` gradient. Replaces the generic robot avatar
 * across every chat surface.
 */
export const AssistantMark = ({ size = 18, pulsing = false }: AssistantMarkProps) => (
  <span
    aria-hidden
    className={`chat-aurora-text${pulsing ? ' chat-mark-pulse' : ''}`}
    style={{
      fontSize: size,
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      userSelect: 'none',
      flexShrink: 0,
    }}
  >
    ✦
  </span>
);
