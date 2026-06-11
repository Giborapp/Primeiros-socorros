import React from 'react';
import FullBodyCharacter from './FullBodyCharacter';

export {
  SKIN_OPTIONS,
  HAIR_STYLES,
  HAIR_COLORS,
  EYE_COLORS,
  OUTFIT_COLORS,
  DEFAULT_CHARACTER,
} from './characterOptions';

export default function CharacterAvatar({
  options = {},
  size = 120,
  isFirefighter = false,
  expression = 'idle',
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}
    >
      <div style={{ marginTop: -size * 0.03 }}>
        <FullBodyCharacter
          options={options}
          size={size * 0.98}
          expression={expression}
          isFirefighter={isFirefighter}
          bust
        />
      </div>
    </div>
  );
}
