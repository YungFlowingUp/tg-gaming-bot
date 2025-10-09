require('dotenv').config();
const CryptoJS = require('crypto-js');
const fs = require('fs').promises;
const path = require('path');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

function encryptId(userId) {
    return CryptoJS.AES.encrypt(userId.toString(), ENCRYPTION_KEY).toString();
}

function decryptId(encryptedId) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedId, ENCRYPTION_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        return null;
    }
}

//* Path to the admins.json folder
const ADMINS_FILE = path.join(__dirname, '../configs/encrypted/admins.json');

async function loadAdmins() {
    try {
        await fs.access(ADMINS_FILE);
        const data = await fs.readFile(ADMINS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        //* If there is no admins.json (path = ADMINS_FILE)
        return { superAdmins: [], admins: [] };
    }
}

async function saveAdmins(adminsConfig) {
    await fs.mkdir(path.dirname(ADMINS_FILE), { recursive: true });
    await fs.writeFile(ADMINS_FILE, JSON.stringify(adminsConfig, null, 2));
}

async function isAdmin(userId) {   
    const adminsConfig = await loadAdmins();
    
    for (const encryptedId of adminsConfig.admins) {       
        const decryptedId = decryptId(encryptedId);
        if (decryptedId == userId) 
            return true;
    }
    return false;
}

async function isSuperAdmin(userId) {
    const adminsConfig = await loadAdmins();
    
    for (const encryptedId of adminsConfig.superAdmins) {
        const decryptedId = decryptId(encryptedId);
        if (decryptedId == userId) 
            return true;
    }
    return false;
}

module.exports = {
    isAdmin,
    isSuperAdmin
}