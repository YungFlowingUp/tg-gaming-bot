const adminMainKeyboard = {
    reply_markup: {
        keyboard: [
            ['➕ Добавить админа', '👑 Добавить суперадмина'],
            ['➖ Удалить админа / Убрать права Супер!'],
            ['👥 Список админов'],
            ['🔙 В главное меню']            
        ],
        resize_keyboard: true,
        input_field_placeholder: "Выберите действие из списка...",
        one_time_keyboard: true 
    }
};

const adminCancelKeyboard = {
    reply_markup: {
        keyboard: [['❌ Отмена']],
        resize_keyboard: true,
        one_time_keyboard: true
    }
};

function createSuperAdminConfirmKeyboard(adminId) {      
    return {
        reply_markup: {         
            inline_keyboard: [  
                [
                    { text: '✅ Удалить полностью', callback_data: `confirm_remove:${adminId}:full` },
                    { text: '🔽 Оставить как админа', callback_data: `confirm_remove:${adminId}:demote` }
                ],
                [
                    { text: '❌ Отмена', callback_data: 'admin_cancel' }
                ]
            ]
        }
    }
};

//* Creating inline keyboard with super and regular admins
function createAdminsListKeyboard(admins) {
    const buttons = [];
    
    //* Adding 👑 & callback_data to super admins
    const superAdminButtons = admins.superAdmins.map(adminId => ({
        text: `👑👥 ${adminId}`,
        callback_data: `remove_admin:${adminId}:super`
    }));
        
    //* Group by 2
    for (let i = 0; i < superAdminButtons.length; i += 2) {
        buttons.push(superAdminButtons.slice(i, i + 2));
    }

    //* Adding a separator
    buttons.push([{ 
        text: '────────────', 
        callback_data: 'separator' 
    }]);

    //* Removing duplicates! Cause super admins already include regular ones
    const regularAdmins = admins.admins.filter(id => !admins.superAdmins.includes(id));

    //* Adding 👥 & callback_data to regular admins        
    const adminButtons = regularAdmins.map(adminId => ({     
        text: `👥 ${adminId}`,    
        callback_data: `remove_admin:${adminId}:admin`
    }));
        
    //* Group by 2
    for (let i = 0; i < adminButtons.length; i += 2) {
        buttons.push(adminButtons.slice(i, i + 2));
    }
    
    //* Adding the cancel button
    buttons.push([{
        text: '❌ Отмена',
        callback_data: 'admin_cancel'
    }]);
    
    return {
        reply_markup: {
            inline_keyboard: buttons
        }
    };
}

module.exports = {
    adminMainKeyboard,
    adminCancelKeyboard,
    createSuperAdminConfirmKeyboard,
    createAdminsListKeyboard    
};