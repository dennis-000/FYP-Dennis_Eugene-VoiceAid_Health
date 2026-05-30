import { Platform } from 'react-native';

function getAlphaColor(color: string, opacity: number): string {
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        let r = 0, g = 0, b = 0;
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.slice(0, 2), 16);
            g = parseInt(hex.slice(2, 4), 16);
            b = parseInt(hex.slice(4, 6), 16);
        } else {
            return color;
        }
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
}

export function createShadow(
    color: string,
    offsetX: number,
    offsetY: number,
    opacity: number,
    radius: number,
    elevation: number
) {
    return Platform.select({
        ios: {
            shadowColor: color,
            shadowOffset: { width: offsetX, height: offsetY },
            shadowOpacity: opacity,
            shadowRadius: radius,
        },
        android: {
            elevation,
            // android can support shadowColor in API 28+
            shadowColor: color,
        },
        web: {
            boxShadow: `${offsetX}px ${offsetY}px ${radius}px ${getAlphaColor(color, opacity)}`,
        },
        default: {}
    });
}
