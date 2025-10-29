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

async function addAdmin(userId, superAdmin = false) {
    const adminsConfig = await loadAdmins();
    const encryptedId = encryptId(userId);
    
    const isUserAdmin = await  isAdmin(userId);
    const isUserSuperAdmin = await isSuperAdmin(userId); 

    if (superAdmin) { //* If adding a super-admin        
        if (isUserSuperAdmin) { //* Checking if there is the super-admin created yet
            return { 
                success: false,
                type: 'superadmin_already_exists',
                message: `❌ Пользователь ${userId.toString()} уже является 👑СУПЕР-админом` 
            };
        }
        adminsConfig.superAdmins.push(encryptedId);     

        let text = `✅ Пользователь ${userId.toString()} добавлен как 👑СУПЕР-админ`;

        if (isUserAdmin) { //* If there was a regular admin already
            saveAdmins(adminsConfig);
            return {
                    success: true,
                    type: 'admin_promoted_to_superadmin',
                    message: text + "!"
                }
        } //* If added super admin and regular admin together
        else {
            adminsConfig.admins.push(encryptedId);
            saveAdmins(adminsConfig);
            return { 
                success: true,
                type: 'admin_and_superadmin_added',
                message: text + " и админ!" 
            };
        }        
    } 
    else { //* if adding a regular admin
        if (isUserAdmin) { //* Checking if there is the admin created yet
            return { 
                success: false,
                type: 'admin_already_exists',
                message: `❌ Пользователь ${userId.toString()} уже является админом` 
            };
        }
        adminsConfig.admins.push(encryptedId);
        saveAdmins(adminsConfig);
        return {
            success: true,
            type: 'admin_added',
            message: `✅ Пользователь ${userId.toString()} добавлен как админ!` 
        };
    }       
}

async function removeAdmin(userId, superAdmin = false) {
    const adminsConfig = await loadAdmins();
    const userIdStr = userId.toString();

    //* Additional checks
    const isUserAdmin = await isAdmin(userId);

    if (!isUserAdmin) {
        return { 
            success: false,
            type: 'no_such_admin',
            message: `❌ Пользователь ${userIdStr} не является админом!` 
        };
    }

    if (superAdmin) { //* Deleting a super admin
        //* Additional checks
        const isUserSuperAdmin = await isSuperAdmin(userId);
        if (!isUserSuperAdmin) {
            return { 
                success: false,
                type: 'no_such_superadmin',
                message: `❌ Пользователь ${userIdStr} не является СУПЕР-админом!` 
            };
        }

        adminsConfig.superAdmins = adminsConfig.superAdmins.filter(id => {
            const decryptedId = decryptId(id);
            return decryptedId !== userIdStr;
        });        
        adminsConfig.admins = adminsConfig.admins.filter(id => {
            const decryptedId = decryptId(id);
            return decryptedId !== userIdStr;
        });

        await saveAdmins(adminsConfig);
        return { 
            success: true,
            type: 'superadmin_removed_with_confirmation',
            message: `✅ Пользователь ${userIdStr} удален из СУПЕР-админов и админов`,
            userId
        };
    } //* Deleting a regular admin
    else {
        adminsConfig.admins = adminsConfig.admins.filter(id => {
            const decryptedId = decryptId(id);
            return decryptedId !== userIdStr;
        });

        await saveAdmins(adminsConfig);
        return { 
            success: true,
            type: 'admin_removed',
            message: `✅ Пользователь ${userIdStr} удален из админов`,
            userId
        };
    }
}

//* Remove role 'super' from admin
async function demoteSuperAdmin(userId) {
    const adminsConfig = await loadAdmins();
    const userIdStr = userId.toString();

    //* Additional checks
    const isUserSuperAdmin = await isSuperAdmin(userId);
    if (!isUserSuperAdmin) {
        return { 
            success: false,
            type: 'no_such_superadmin',
            message: `❌ Пользователь ${userIdStr} не является администратором!` 
        };
    }

    adminsConfig.superAdmins = adminsConfig.superAdmins.filter(id => {
        const decryptedId = decryptId(id);
        return decryptedId !== userIdStr;
    }); 

    await saveAdmins(adminsConfig);
    return { 
            success: true,
            type: 'superadmin_demoted_to_admin',
            message: `⚠️ Пользователь ${userIdStr} удален из СУПЕР-админов, но остался обычным админом!`,
            userId
        };
}

async function getAllAdmins() {
    const adminsConfig = await loadAdmins();
    
    const decryptAndFilter = (ids) => 
        ids.map(decryptId).filter(id => id !== null);
    
    return {
        superAdmins: decryptAndFilter(adminsConfig.superAdmins),
        admins: decryptAndFilter(adminsConfig.admins)
    };
}

module.exports = {
    isAdmin,
    isSuperAdmin,
    getAllAdmins,
    addAdmin,
    removeAdmin,
    demoteSuperAdmin    
}