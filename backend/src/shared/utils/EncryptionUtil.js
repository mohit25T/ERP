import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

class EncryptionUtil {
    /**
     * Encrypt sensitive text
     */
    static encrypt(text) {
        if (!text) return null;
        const masterKey = process.env.COMPLIANCE_VAULT_KEY;
        if (!masterKey) throw new Error("VAULT_SEAL_FAILURE: COMPLIANCE_VAULT_KEY missing in kernel environment.");

        const iv = crypto.randomBytes(IV_LENGTH);
        const salt = crypto.randomBytes(SALT_LENGTH);
        const key = crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha512');
        
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();

        return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
    }

    /**
     * Decrypt sensitive text
     */
    static decrypt(cipherText) {
        if (!cipherText) return null;
        const masterKey = process.env.COMPLIANCE_VAULT_KEY;
        if (!masterKey) throw new Error("VAULT_SEAL_FAILURE: COMPLIANCE_VAULT_KEY missing in kernel environment.");

        const bData = Buffer.from(cipherText, 'base64');
        
        const salt = bData.subarray(0, SALT_LENGTH);
        const iv = bData.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const tag = bData.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
        const encrypted = bData.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

        const key = crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha512');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        return decipher.update(encrypted) + decipher.final('utf8');
    }
}

export default EncryptionUtil;
