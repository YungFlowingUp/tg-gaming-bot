require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const CryptoJS = require('crypto-js');
const readline = require('readline');
const { program } = require('commander');

//* Checking .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
    console.error('❌  ENCRYPTION_KEY not found in .env');
    console.log('💡  Запустите сначала: npm run init-encrypted-key');
    console.log('💡  Затем добавьте ключ в ваш .env файл');
    process.exit(1);
}

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

//* Decrypting the whole admin file 
async function decryptWholeAdminFile() {
    const adminsConfing = await loadAdmins();
    const decryptedAdminsConfig = {};
    decryptedAdminsConfig.superAdmins = adminsConfing.superAdmins.map(id => decryptId(id));
    decryptedAdminsConfig.admins = adminsConfing.admins.map(id => decryptId(id));
    return decryptedAdminsConfig
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

function askQuestion(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.toLowerCase().trim());
        });
    });
}

//* Adding an admin or a super-admin
async function addAdmin(userId, isSuperAdmin = false) {
    const adminsConfig = await loadAdmins();
    const decryptedAdminsConfig = await decryptWholeAdminFile();   
    const encryptedId = encryptId(userId);

    if (isSuperAdmin) { //* Adding a super-admin
        if (!decryptedAdminsConfig.superAdmins.includes(userId)) {
            adminsConfig.superAdmins.push(encryptedId);
            console.log(`✅  Добавлен СУПЕР-админ: ${userId}`);
        } else {
            console.log(`ℹ️  СУПЕР-админ ${userId} уже существует`);
        }
        
        //! Super-admin automatically duplicates into the admins pull (regular)
        if (!decryptedAdminsConfig.admins.includes(userId)) { //* If this admin wasn't already created as regular admin
            adminsConfig.admins.push(encryptedId);
            console.log(`✅  СУПЕР-админ ${userId} также добавлен как админ`);
        }
    } else { //* Adding an admin (regular)
        if (!decryptedAdminsConfig.admins.includes(userId)) {
            adminsConfig.admins.push(encryptedId);
            console.log(`✅  Добавлен админ: ${userId}`);
        } else {
            console.log(`ℹ️  Админ ${userId} уже существует`);
        }
    }

    await saveAdmins(adminsConfig);
    return adminsConfig;
}

async function removeAdmin(userId, isSuperAdmin = false) {
    const adminsConfig = await loadAdmins();
    const decryptedAdminsConfig = await decryptWholeAdminFile();

    const isIDSuperAdmin = decryptedAdminsConfig.superAdmins.includes(userId);
    const isIDAdmin = decryptedAdminsConfig.admins.includes(userId);
    
    if (!isIDAdmin) {
        console.log(`❌  Такой ID: ${userId} не найден среди админов`);
        return adminsConfig;
    }

    if (isSuperAdmin) {  //* Super-admin actions
        if (!isIDSuperAdmin) {
            console.log(`❌  Такой ID: ${userId} не найден среди СУПЕР-админов`);
            return adminsConfig;
        }

        //* Deleting from super-admins
        adminsConfig.superAdmins = adminsConfig.superAdmins.filter(id => decryptId(id) !== userId);
        console.log(`🗑️  Удален из суперадминов: ${userId}`);

        //* Asking if this super-admin should be also deleted from regular admin
        const response = await askQuestion(
            `❓ Удалить ${userId} также из обычных админов? (y/N): `
        );            
        if (response === 'y' || response === 'yes' || response === 'н') {
            adminsConfig.admins = adminsConfig.admins.filter(id => decryptId(id) !== userId);
            console.log(`🗑️  Также удален из админов: ${userId}`);
        } else {
            console.log(`ℹ️  Пользователь ${userId} остался обычным админом`);
        }
    } else { //* Regular admin actions
        if (isIDSuperAdmin) { //* If a refular admin is also an super-admin
            console.log(`⚠️  Пользователь ${userId} является СУПЕР-админом!`);
            const response = await askQuestion(
                `❓ ID также будет удален из супер-админов! Продолжить? (y/N): `
            );            
            if (response === 'y' || response === 'yes' || response === 'н') {
                adminsConfig.superAdmins = adminsConfig.superAdmins.filter(id => decryptId(id) !== userId);
                console.log(`🗑️  Удален из СУПЕР-админов: ${userId}`);

                adminsConfig.admins = adminsConfig.admins.filter(id => decryptId(id) !== userId);
                console.log(`🗑️  Удален из админов: ${userId}`);
            } else {
                console.log(`⚠️  Пользователь ${userId} сохранил свои роли!`);
            }
        } else {
            adminsConfig.admins = adminsConfig.admins.filter(id => decryptId(id) !== userId);
            console.log(`🗑️  Удален из админов: ${userId}`);
        }     
    }
    await saveAdmins(adminsConfig);
    return adminsConfig;
}

async function removeAdminForce(userId) {
    const adminsConfig = await loadAdmins();
    const decryptedAdminsConfig = await decryptWholeAdminFile();

    const isIDSuperAdmin = decryptedAdminsConfig.superAdmins.includes(userId);
    const isIDAdmin = decryptedAdminsConfig.admins.includes(userId);

    if (!isIDAdmin) {
        console.log(`❌  Такой ID: ${userId} не найден среди админов`);
        return adminsConfig;
    }
    
    if (isIDSuperAdmin) {
        adminsConfig.superAdmins = adminsConfig.superAdmins.filter(id => decryptId(id) !== userId);
        console.log(`🗑️  Удален из СУПЕР-админов: ${userId}`);
    }
    adminsConfig.admins = adminsConfig.admins.filter(id => decryptId(id) !== userId);
    console.log(`🗑️  Удален из обычных админов: ${userId}`);
    
    await saveAdmins(adminsConfig);
    return adminsConfig;
} 

async function showAdmins() {
    const adminsConfig = await loadAdmins();
    console.log('='.repeat(75));
    console.log('👑  СУПЕР-админы:');
    adminsConfig.superAdmins.forEach(encryptedId => {
        const decryptedId = decryptId(encryptedId);
        console.log(`   ${decryptedId} (encrypted: ${encryptedId})`);
    });

    console.log('\n👥  Админы:');
    adminsConfig.admins.forEach(encryptedId => {
        const decryptedId = decryptId(encryptedId);
        console.log(`   ${decryptedId} (encrypted: ${encryptedId})`);
    });

    console.log(`\n📊  Всего: ${adminsConfig.superAdmins.length} СУПЕР-админов, ${adminsConfig.admins.length} админов`);
    console.log('='.repeat(75));
}


program
    .name('admin-cli')
    .description('CLI для управления админами бота')
    .version('1.0.0');

//* Adding a super-admin
program
    .command('add-super <userId>')
    .description('Добавить суперадмина')
    .action(async (userId) => {
        await addAdmin(userId, true);
        await showAdmins();
    });

//* Adding an admin (regular)
program
    .command('add <userId>')
    .description('Добавить админа')
    .action(async (userId) => {
        await addAdmin(userId, false);
        await showAdmins();
    });

//* Removing a super-admin
program
    .command('remove-super <userId>')
    .description('Удалить суперадмина')
    .action(async (userId) => {
        await removeAdmin(userId, true);
        await showAdmins();
    });

//* Removing an admin (regular)
program
    .command('remove <userId>')
    .description('Удалить админа')
    .action(async (userId) => {
        await removeAdmin(userId, false);
        await showAdmins();
    });

//* Showing all the admins
program
    .command('list')
    .description('Показать всех админов')
    .action(async () => {            
        await showAdmins();
    });

//* Initializing (just for the record)
program
    .command('init <userId>')
    .description('Инициализировать первого суперадмина')
    .action(async (userId) => {
        const adminsConfig = await loadAdmins();
        
        if (adminsConfig.superAdmins.length > 0) {
            console.log('❌ Система уже инициализирована');
            await showAdmins();
            return;
        }

        await addAdmin(userId, true);
        console.log('🎉 Система инициализирована!');
        await showAdmins();
    });

//* Force removing id from all admins
program
    .command('remove-force <userId>')
    .description('Удалить админа из всех ролей')
    .action(async (userId) => {
       await removeAdminForce(userId);
       await showAdmins();
    });

program.parseAsync(process.argv).catch(console.error);