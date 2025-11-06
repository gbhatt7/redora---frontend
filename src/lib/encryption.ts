// Password encryption utility
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'geo-secret-password-encryption-key-rankers';
const SALT = 'georankers-salt-2024';

export const encryptPassword = (password: string): string => {
  try {
    // Create key from encryption key and salt
    const key = CryptoJS.PBKDF2(ENCRYPTION_KEY, SALT, {
      keySize: 256 / 32,
      iterations: 1000
    });
    
    // Encrypt the password
    const encrypted = CryptoJS.AES.encrypt(password, key.toString()).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
};
