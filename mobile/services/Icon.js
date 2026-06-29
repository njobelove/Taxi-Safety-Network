/**
 * TSN Universal Icon Component
 * No font files needed — works on web, Android, iOS, everywhere
 */
import React from 'react';
import { Text } from 'react-native';

const ICONS = {
  // Navigation
  'dashboard':             '⊞',
  'arrow-back':            '←',
  'chevron-right':         '›',
  'close':                 '✕',
  'menu':                  '☰',
  'open-in-new':           '↗',
  'apps':                  '⊞',
  'list':                  '≡',

  // Emergency / Safety
  'shield':                '🛡',
  'shield-checkmark':      '🛡',
  'sos':                   'SOS',
  'warning':               '⚠',
  'notifications-active':  '🔔',
  'notifications-off':     '🔕',
  'local-police':          '👮',
  'security':              '🔒',
  'personal-injury':       '🤕',
  'car-crash':             '💥',
  'medical-services':      '➕',
  'local-fire-department': '🚒',
  'emergency':             '🚨',

  // Communication
  'phone':                 '📞',
  'local-phone':           '📞',
  'sms':                   '💬',
  'chat':                  '💬',
  'chat-bubble-outline':   '💬',
  'send':                  '➤',
  'email':                 '✉',
  'call':                  '📞',

  // Location / Map
  'location-on':           '📍',
  'location-off':          '📍',
  'gps-fixed':             '◎',
  'gps-off':               '○',
  'map':                   '🗺',
  'my-location':           '◉',
  'social-distance':       '↔',

  // Audio / Voice
  'mic':                   '🎙',
  'mic-off':               '🎙',
  'volume-up':             '🔊',
  'volume-off':            '🔇',
  'graphic-eq':            '〰',
  'queue-music':           '♪',
  'play-arrow':            '▶',
  'pause':                 '⏸',
  'stop':                  '⏹',
  'fiber-manual-record':   '●',

  // Person / Account
  'person':                '👤',
  'person-add':            '👤',
  'person-remove':         '👤',
  'badge':                 '🪪',
  'account-circle':        '👤',
  'account-balance':       '🏛',
  'manage-accounts':       '⚙',
  'logout':                '🚪',
  'login':                 '→',

  // Actions
  'check':                 '✓',
  'check-circle':          '✅',
  'cancel':                '✕',
  'add':                   '+',
  'save':                  '💾',
  'delete':                '🗑',
  'refresh':               '↻',
  'settings':              '⚙',
  'history':               '🕐',
  'info':                  'ℹ',
  'info-outline':          'ℹ',
  'help-outline':          '?',
  'verified':              '✓',
  'done-all':              '✓✓',
  'inbox':                 '📥',
  'lock':                  '🔒',
  'description':           '📄',
  'bar-chart':             '📊',
  'search':                '🔍',

  // Vehicle
  'directions-car':        '🚗',
  'speed':                 '⚡',
  'wifi-tethering':        '📡',
  'wifi-tethering-off':    '○',
  'wifi-off':              '✕',

  // Misc
  'vibration':             '📳',
  'access-time':           '🕐',
  'signal-cellular-alt':   '📶',
  'location-city':         '🏙',
  'toggle-on':             '●',
  'toggle-off':            '○',
  'radio-button-unchecked':'○',
  'photo-camera':          '📷',
  'visibility':            '👁',
  'visibility-off':        '👁',
  'fiber-smart-record':    '●',
};

export function Icon({ name, size = 24, color = '#000', style }) {
  const symbol = ICONS[name] || '●';
  const isMultiChar = symbol.length > 2;
  return (
    <Text
      style={[{
        fontSize:           isMultiChar ? size * 0.55 : size * 0.85,
        color,
        textAlign:          'center',
        includeFontPadding: false,
        lineHeight:         size,
        width:              size,
        height:             size,
        fontWeight:         isMultiChar ? '900' : 'normal',
      }, style]}
      numberOfLines={1}
    >
      {symbol}
    </Text>
  );
}

// Drop-in replacements — same API as @expo/vector-icons
export const MaterialIcons = (props) => <Icon {...props} />;
export const Ionicons      = ({ name, ...rest }) => {
  const map = { 'shield-checkmark': 'shield', 'call': 'phone', 'alert-circle': 'warning' };
  return <Icon name={map[name] || name} {...rest} />;
};
export const FontAwesome5  = (props) => <Icon {...props} />;
export const Feather       = (props) => <Icon {...props} />;
export const AntDesign     = (props) => <Icon {...props} />;

export default Icon;