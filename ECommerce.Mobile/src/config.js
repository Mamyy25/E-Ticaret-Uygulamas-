import { Platform } from 'react-native';

// Gerçek cihazda localhost çalışmaz — bilgisayarın IP'si gerekir.
// `npx expo start` terminalde IP'yi görebilirsin.
// Wi-Fi IP değişirse buradan güncellemen yeterli.
const DEV_MACHINE_IP = '172.20.10.2';
const PORT = '5133';

export const API_BASE = Platform.OS === 'web'
  ? `http://localhost:${PORT}`
  : `http://${DEV_MACHINE_IP}:${PORT}`;
