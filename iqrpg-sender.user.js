// ==UserScript==
// @name         iqrpg-sender
// @version      0.0.1
// @description  一键发送物品给大号
// @author       ABang
// @match        https://test.iqrpg.com/game.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=iqrpg.com
// @updateURL    https://raw.githubusercontent.com/abangZ/iqrpg-scripts/main/iqrpg-sender.user.js
// @downloadURL  https://raw.githubusercontent.com/abangZ/iqrpg-scripts/main/iqrpg-sender.user.js
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// ==/UserScript==

const needItems= [
    'dungeon_key_1',
    'dungeon_key_2',
    'dungeon_key_3',
    'dungeon_key_4',
    'dungeon_key_5',
    'dungeon_key_101',
    'dungeon_key_102',
    'dungeon_key_103',

    'metal',
    'wood',
    'stone',

    'tree_sap',
    'spider_egg',
    'bone_meal',
    'alchemical_dust',
    'vial_of_orc_blood',

    'sandstone',
    'marble',
    'malachite',

    'gem_sapphire',
    'gem_ruby',
    'gem_emerald',
    'gem_diamond',
];

let mainAccount = GM_getValue('mainAccount', '');

function init(){
    initMenu();
    initMenuAction();
}
init();

function initMenu(){
    GM_registerMenuCommand(mainAccount?`接收者:${mainAccount}`: `设置接收者`, function () {
        const input = prompt("请输入大号名称：")

        if (input) {
            mainAccount= input;
            GM_setValue('mainAccount', input)
        }
        initMenu();
    }, {
        id: 'setting_main_account'
    });
}

function initMenuAction(){
    GM_registerMenuCommand(`发送物品给大号`, sendAllToMainAccount, {
        id: 'send_item_to_main_account'
    });
}


async function getItems(){
    const resp =await fetch(`/php/_load_initial_data.php`)
    return resp.json()
}

async function sendItem(itemId,amount){
    const formData = new URLSearchParams();
    formData.append('mod', 'sendItems');
    formData.append('username', mainAccount);
    formData.append('itemid', itemId);
    formData.append('amount', amount);

    const resp = await fetch(`/php/items.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
    })
    return resp.json()
}

function notice(str){
    GM_notification({
        title:'iqrpg-sender',
        text:str,
        tag:'iqrpg-sender',
        silent:true,
    })
}
function sleep(ms){
    return new Promise(resolve=>setTimeout(resolve,ms))
}
async function sendAllToMainAccount(){
    if(!mainAccount){
        notice('请先设置接收者')
        return
    }
    try {
        const {items} = await getItems();
        console.log(items)
        for (let i = 0; i < 5; i += 1) {
            notice(`${5 - i}秒后,发送物品给 ${mainAccount}. 想取消直接刷新页面`)
            await sleep(1000)
        }


        for (let i = 0; i < needItems.length; i += 1) {
            const itemId = needItems[i];

            const amount = items[itemId] || 0;
            if (amount > 0) {
                //     发送物品
                await sendItem(itemId, amount)
                notice(`已发送物品 ${itemNames[itemId]||itemId} ${amount}个`);
                await sleep(1000)
            }
        }
        notice(`发送完毕`)
    }catch (e) {
        console.error(e)
        notice(`发送失败`+e.message)
    }

}

const itemNames = {

     "dungeon_key_1":"哥布林洞窟钥匙",
     "dungeon_key_2":"山口钥匙",
     "dungeon_key_3":"荒凉坟场钥匙",
     "dungeon_key_4":"龙穴钥匙",
     "dungeon_key_5":"沉没废墟钥匙",

     "dungeon_key_101":"废弃塔楼钥匙",
     "dungeon_key_102":"闹鬼牢房钥匙",
     "dungeon_key_103":"龙厅钥匙",

     "dungeon_key_201":"金库钥匙",
     "dungeon_key_202":"宝藏钥匙",

     "credits":"信用点",

    "metal":"金属",
    "wood":"木头",
    "stone":"石头",

    "weapon_component":"武器组件",
    "armor_component":"护甲组件",
    "tool_component":"工具组件",
    "gem_fragments":"宝石碎片",

    "tree_sap":"树液",
    "spider_egg":"蜘蛛蛋",
    "bone_meal":"骨粉",
    "alchemical_dust":"炼金之尘",
    "vial_of_orc_blood":"一瓶半兽人的血",
    "undead_heart":"亡灵之心",
    "birds_nest":"鸟巢",

    "sandstone":"砂岩",
    "marble":"大理石",
    "malachite":"孔雀石",

    "gem_sapphire":"蓝宝石",
    "gem_ruby":"红宝石",
    "gem_emerald":"翡翠",
    "gem_diamond":"钻石",

}