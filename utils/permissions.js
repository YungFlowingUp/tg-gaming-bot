require('dotenv').config();
const CryptoJS = require('crypto-js');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

function encryptId(userId) {
    return CryptoJS.AES.encrypt(userId.toString(), ENCRYPTION_KEY).toString();
}

function decryptId(encryptedId) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedId, ENCRYPTION_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        logger.error(`Failed to decrypt ID (${encryptId}) with error ${error}`); //? Logging error
        return null;
    }
}

//* Path to the admins.json folder
const ADMINS_FILE = path.join(__dirname, '../configs/encrypted/admins.json');

async function loadAdmins() {
    try {
        await fs.access(ADMINS_FILE);
        const data = await fs.readFile(ADMINS_FILE, 'utf8');
        const adminsConfig = JSON.parse(data);

        //? Logging admin file loading successfully
        logger.debug(`Admins config loaded successfully. With ` +
            `superAdminsCount - ${adminsConfig.superAdmins.length} and ` +
            `adminsCount: - ${adminsConfig.admins.length}`
        );
        return adminsConfig;
    } catch (error) { //* If there is no admins.json (path = ADMINS_FILE)
        logger.error(`Admins file not found, creating default config. Error: ${error}`); //? Logging failure of loading the admin file

        return { superAdmins: [], admins: [] };
    }
}

async function saveAdmins(adminsConfig) {
    await fs.mkdir(path.dirname(ADMINS_FILE), { recursive: true });
    await fs.writeFile(ADMINS_FILE, JSON.stringify(adminsConfig, null, 2));

    //? Logging admin file saved successfully
    logger.debug(`Admins config saved successfully. With ` +
        `superAdminsCount - ${adminsConfig.superAdmins.length} and ` +
        `adminsCount: - ${adminsConfig.admins.length}`
    );
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
    
    const isUserAdmin = await isAdmin(userId);
    const isUserSuperAdmin = await isSuperAdmin(userId); 

    //? Logging adding procedure has started
    logger.info(`Attempting to add admin: user ${userId}. Is SUPER-admin - ${superAdmin}`);

    if (superAdmin) { //* If adding a super-admin        
        if (isUserSuperAdmin) { //* Checking if there is the super-admin created yet
            logger.warn(`Failed to add super admin id - ${userId} is already SUPER-admin`); //? Logging user is already a SUPER-admin
            return { 
                success: false,
                type: 'superadmin_already_exists',
                message: `❌ Пользователь ${userId.toString()} уже является 👑СУПЕР-админом` 
            };
        }
        adminsConfig.superAdmins.push(encryptedId);     

        let text = `✅ Пользователь ${userId.toString()} добавлен как 👑СУПЕР-админ`;

        if (isUserAdmin) { //* If there was a regular admin already
            await saveAdmins(adminsConfig);
            logger.info(`Admin promoted to SUPER-admin id - ${userId}`); //? Logging user promoted to a SUPER-admin
            return {
                    success: true,
                    type: 'admin_promoted_to_superadmin',
                    message: text + "!"
                }
        } //* If added super admin and regular admin together
        else {
            adminsConfig.admins.push(encryptedId);
            await saveAdmins(adminsConfig);
            logger.info(`New SUPER-admin added with regular admin role id - ${userId}`); //? Logging added SUPER and regular admin together
            return { 
                success: true,
                type: 'admin_and_superadmin_added',
                message: text + " и админ!" 
            };
        }        
    } 
    else { //* if adding a regular admin
        if (isUserAdmin) { //* Checking if there is the admin created yet
            logger.warn(`Failed to add admin id - ${userId} is already admin`); //? Logging user was already admin
            return { 
                success: false,
                type: 'admin_already_exists',
                message: `❌ Пользователь ${userId.toString()} уже является админом` 
            };
        }
        adminsConfig.admins.push(encryptedId);
        await saveAdmins(adminsConfig);
        logger.info(`New regular admin added id - ${userId}`); //? Logging regular admin was added
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

    //? Logging removing procedure has started
    logger.info(`Attempting to remove admin id - ${userId}. Is SUPER-admin - ${superAdmin}`);

    //* Additional checks
    const isUserAdmin = await isAdmin(userId);

    if (!isUserAdmin) {
        logger.warn(`Failed to remove admin id - ${userId} is not an admin`); //? Logging failure - user is not an admin
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
            logger.warn(`Failed to remove super admin id - ${userId} is not a super admin`); //? Logging failure - user is not a SUPER-admin
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
        logger.info(`SUPER and regular admin together completely removed id - ${userId}`); //? Logging SUPER and regular admin removed with success
        return { 
            success: true,
            type: 'superadmin_removed_with_confirmation',
            message: `✅ Пользователь ${userIdStr} удален из СУПЕР-админов и админов`
        };
    } //* Deleting a regular admin
    else {
        adminsConfig.admins = adminsConfig.admins.filter(id => {
            const decryptedId = decryptId(id);
            return decryptedId !== userIdStr;
        });

        await saveAdmins(adminsConfig);
        logger.info(`Admin removed id - ${userId}`); //? Logging regular admin removed with success 
        return { 
            success: true,
            type: 'admin_removed',
            message: `✅ Пользователь ${userIdStr} удален из админов`
        };
    }
}

//* Remove role 'super' from admin
async function demoteSuperAdmin(userId) {
    const adminsConfig = await loadAdmins();
    const userIdStr = userId.toString();

    //? Logging demoting procedure has started
    logger.info(`Attempting to demote admin id - ${userId}.`);

    //* Additional checks
    const isUserSuperAdmin = await isSuperAdmin(userId);
    if (!isUserSuperAdmin) {
        logger.warn(`Failed to demote super admin id - ${userId} is not a super admin`); //? Logging failure - user is not a SUPER-admin
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
    logger.info(`SUPER-admin demoted to regular admin id - ${userId}`); //? Logging SUPER-admin demoted with succes
    return { 
            success: true,
            type: 'superadmin_demoted_to_admin',
            message: `⚠️ Пользователь ${userIdStr} удален из СУПЕР-админов, но остался обычным админом!`
        };
}

async function getAllAdmins() {
    const adminsConfig = await loadAdmins();
    
    const decryptAndFilter = (ids) => 
        ids.map(decryptId).filter(id => id !== null);
    
    logger.debug(`Retrieved all admins: ${adminsConfig.superAdmins.length} super admins, ${adminsConfig.admins.length} admins`); //? Logging got all admins with success
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