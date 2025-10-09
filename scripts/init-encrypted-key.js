const crypto = require('crypto');

function generateEncryptionKey() {
    try {
        const key = crypto.randomBytes(32).toString('hex');
        
        console.log('🔐 Сгенерирован новый ключ шифрования:');
        console.log('='.repeat(50));
        console.log(key);
        console.log('='.repeat(50));
        console.log('\n📋 Скопируйте этот ключ и добавьте в ваш .env файл:');
        console.log('ENCRYPTION_KEY=' + key);
        console.log('\n⚠️  Сохраните ключ в безопасном месте!');
        console.log('❌ Если вы потеряете ключ, все зашифрованные данные будут недоступны!');
    } catch(error) {
        console.error("Ключ не удалось сгенерировать: ", error);
    }
    
}

generateEncryptionKey()