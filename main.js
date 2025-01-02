const EmojiPacks = new Map();
const Emojis = new Map();
const Users = new Map();
const Account = {
    nip_07: false,
    npub_converted: '',
    users_event_id: null,
    user_emojis_event_id: null,
    emojis_event_id: null,
    need_users: [],
    following_emoji_packs: []
};

const Pages = [
    {
        id:  'home',
        name: 'ホーム'
    },
    {
        id:  'myset',
        name: 'マイセット'
    },
    {
        id:  'mylist',
        name: 'マイリスト'
    }
];

window.addEventListener('error', (event) => {
    addConsoleContent({status: 'error', message: event.message});
});

document.addEventListener("DOMContentLoaded", (event) => {
    document.getElementById('dialog-login').showModal();
    for (let i = 0; i < Pages.length; i++) {
        document.getElementById('open-' + Pages[i].id).addEventListener('click', function() {
            for (let k = 0; k < Pages.length; k++) {
                document.getElementById('open-' + Pages[k].id).dataset.selected = false;
                document.getElementById('main-' + Pages[k].id).style.display = 'none';
            }
            document.getElementById('open-' + this.dataset.id).dataset.selected = true;
            document.getElementById('main-' + this.dataset.id).style.display = 'block';
        });
        document.getElementById('open-' + Pages[i].id).dataset.id = Pages[i].id;
    }
    document.getElementById('myset-create').addEventListener('click', function() {
        document.getElementById('dialog-create').show();
    });
    document.getElementById('dialog-login-btn').addEventListener('click', function() {
        if (window.nostr) {
            window.nostr.getPublicKey().then((pubkey) => {
                Account.nip_07 = true;
                Account.npub_converted = pubkey;
                EMOJI.getUser();
                document.getElementById('dialog-login').close();
            });
        } else {
            addConsoleContent({status: 'error', message:'NIP-07の拡張機能が認識できませんでした。'});
        }
    });
    document.getElementById('dialog-create-close').addEventListener('click', function() {
        document.getElementById('dialog-create').close();
    });
    document.getElementById('dialog-create-add').addEventListener('click', function() {
        document.getElementById('dialog-create').close();
        if (Account.nip_07) {
            var nowdate = Math.floor(new Date().getTime() / 1000);
            var tags = [];
            if (document.getElementById('dialog-create-id').value.length > 0) {
                tags.push(['d', document.getElementById('dialog-create-id').value]);
            }
            if (document.getElementById('dialog-create-name').value.length > 0) {
                tags.push(['title', document.getElementById('dialog-create-name').value]);
            }
            if (document.getElementById('dialog-create-icon-url').value.length > 0) {
                tags.push(['image', document.getElementById('dialog-create-icon-url').value]);
            }
            if (document.getElementById('dialog-create-description').innerText.length > 0) {
                tags.push(['description', document.getElementById('dialog-create-description').innerText]);
            }
            if (document.getElementById('dialog-create-emojis').children.length > 0) {
                for (let i = 0; i < document.getElementById('dialog-create-emojis').children.length; i++) {
                    tags.push(['emoji', document.getElementById('dialog-create-emojis').children[i].children[1].value, document.getElementById('dialog-create-emojis').children[i].children[0].value]);
                }
            } else {
                addConsoleContent({status: 'error', message:'このクライアントでは絵文字なしで絵文字セットを作成することはできません。'});
                return;
            }
            window.nostr.signEvent({
                created_at: nowdate,
                kind: 30030,
                tags: tags,
                content: ''
            }).then(function (event) {
                connection2.add({body: JSON.stringify(['EVENT', event])});
            });
        } else {
            addConsoleContent({status: 'error', message:'NIP-07の拡張機能が認識できませんでした。'});
        }
    });
    document.getElementById('dialog-create-icon-url').addEventListener('change', function() {
        document.getElementById('dialog-create-icon').src = document.getElementById('dialog-create-icon-url').innerText;
    });
    document.getElementById('dialog-create-emojis-add').addEventListener('click', function() {
        let block = createElement('div', null, 'dialog-create-emoji');
        let url = createElement('input', null, 'dialog-create-emoji-url');
        url.setAttribute('placeholder', '絵文字URL*');
        block.append(url);
        let code = createElement('input', null, 'dialog-create-emoji-code');
        code.setAttribute('placeholder', 'ショートコード*');
        block.append(code);
        let delbtn = createElement('button', 'この絵文字を消す', 'btn', function() {
            this.parentElement.remove();
        });
        block.append(delbtn);
        document.getElementById('dialog-create-emojis').append(block);
    });
    document.getElementById('dialog-pack_info-add').addEventListener('click', function() {
        document.getElementById('dialog-pack_info').close();
        if (this.dataset.status == 'unadded') {
            EMOJI.install(this.dataset.id);
        } else if (this.dataset.status == 'added') {
            EMOJI.uninstall(this.dataset.id);
        } else if (this.dataset.status == 'login') {
            if (window.nostr) {
                window.nostr.getPublicKey().then((pubkey) => {
                    Account.nip_07 = true;
                    Account.npub_converted = pubkey;
                    EMOJI.getUser();
                });
            } else {
                addConsoleContent({status: 'error', message:'NIP-07の拡張機能が認識できませんでした。'});
            }
        }
    });
    document.getElementById('dialog-pack_info-close').addEventListener('click', function() {
        document.getElementById('dialog-pack_info').close();
    });
    EMOJI.getAll();
});
setInterval(function() {
    if (Account.need_users.length > 0){
        connection2.add({
            body: JSON.stringify([
                'REQ',
                `${Account.users_event_id}`,
                {
                    authors: Account.need_users,
                    kinds: [0],
                    limit: 20
                }
            ])
        });
    }
}, 10000);

function addConsoleContent(data) {
    document.getElementById('console').append(createElement('div', `${data.status}:${data.message}`));
    setTimeout(() => {
        document.getElementById('console').children[0].remove();
    }, 3000);
}

function createElement(type, innerText, className, onclick, id) {
    let item = document.createElement(type);
    if (type == 'img') {
        item.src = 'img/NotFound.png';
        item.addEventListener('error', function() {
            this.src = 'img/NotFound.png';
        });
    }
    if (innerText && type == 'img') {
        item.src = innerText;
    } else if (innerText) {
        item.innerText = innerText;
    }
    if (className) {
        item.className = className;
    }
    if (id) {
        item.id = id;
    }
    if (onclick) {
        item.addEventListener('click', onclick);
    }
    return item;
}

function createPackElement(pack, list) {
    let element = createElement('div', null, 'list-pack', function() {
        let selected_pack = EmojiPacks.get(this.dataset.id);
        document.getElementById('dialog-pack_info-add').dataset.id = this.dataset.id;
        if (Account.following_emoji_packs.includes(this.dataset.id)) {
            document.getElementById('dialog-pack_info-add').src = 'img/added.svg';
            document.getElementById('dialog-pack_info-add').dataset.status = 'added';
        } else if(Account.nip_07) {
            document.getElementById('dialog-pack_info-add').src = 'img/add.svg';
            document.getElementById('dialog-pack_info-add').dataset.status = 'unadded';
        } else {
            document.getElementById('dialog-pack_info-add').src = 'img/login.svg';
            document.getElementById('dialog-pack_info-add').dataset.status = 'login';
        }
        document.getElementById('dialog-pack_info-icon').src = selected_pack.icon;
        document.getElementById('dialog-pack_info-name').innerText = selected_pack.name;
        document.getElementById('dialog-pack_info-author').innerText = selected_pack.author.name;
        document.getElementById('dialog-pack_info-description').innerText = selected_pack.description;
        let emoji_elements = [];
        for (let i = 0; i < selected_pack.emojis.length; i++) {
            emoji_elements.push(createElement('img', selected_pack.emojis[i].url, 'list-pack-icon'));
        }
        document.getElementById('dialog-pack_info-emojis').replaceChildren(...emoji_elements);
        document.getElementById('dialog-pack_info').scroll(0,0);
        document.getElementById('dialog-pack_info').show();
    }, `${pack.id}-${list}`);
    element.dataset.id = pack.id;
    element.append(createElement('img', pack.icon, 'list-pack-icon'));
    element.append(createElement('p', pack.name, 'list-pack-name'));
    element.append(createElement('small', pack.author.name, 'list-pack-author'));
    return element;
}

function setEmojiPack(pack) {
    EmojiPacks.set(pack.id, pack);
    if (document.getElementById(`${pack.id}-new`)) {
        document.getElementById(`${pack.id}-new`).replaceWith(createPackElement(pack, 'new'));
    } else {
        document.getElementById('pack-list-new').append(createPackElement(pack, 'new'));
    }
    if (
        Account.npub_converted == pack.author.id &&
        document.getElementById(`${pack.id}-mypack`)
    ) {
        document.getElementById(`${pack.id}-mypack`).replaceWith(createPackElement(pack, 'mypack'));
    } else if (Account.npub_converted == pack.author.id) {
        document.getElementById('pack-list-mypack').append(createPackElement(pack, 'mypack'));
    }
    if (
        Account.following_emoji_packs.includes(pack.id) &&
        document.getElementById(`${pack.id}-mylist`)
    ) {
        document.getElementById(`${pack.id}-mylist`).replaceWith(createPackElement(pack, 'mylist'));
    } else if (Account.following_emoji_packs.includes(pack.id)) {
        document.getElementById('pack-list-mylist').append(createPackElement(pack, 'mylist'));
    }
    
    if (document.getElementById('pack-list-new').children.length == 0) {
        document.getElementById('pack-list-new-status').innerText = 'このリストに対応するアイテムは0個です。';
    } else {
        document.getElementById('pack-list-new-status').innerText = '';
    }
    if (document.getElementById('pack-list-mypack').children.length == 0) {
        document.getElementById('pack-list-mypack-status').innerText = 'このリストに対応するアイテムは0個です。';
    } else {
        document.getElementById('pack-list-mypack-status').innerText = '';
    }
    if (document.getElementById('pack-list-mylist').children.length == 0) {
        document.getElementById('pack-list-mylist-status').innerText = 'このリストに対応するアイテムは0個です。';
    } else {
        document.getElementById('pack-list-mylist-status').innerText = '';
    }
}

class Server {
    constructor(url) {
        this.url = url;
        this.connect();
    }
    connect() {
        this.ws = new WebSocket(this.url);
        var classData = this;
        this.status = 'connecting';
        this.ws.addEventListener("open", function() {
            classData.status = 'ready';
            EMOJI.getAll(classData);
        });
        this.ws.addEventListener("message", (event) => {
            var data = JSON.parse(event.data);
            if (data[0] == 'EVENT') {
                if (data[2].kind == 0) {
                    var user = USER.toHYB(data[2]);
                    if (Account.need_users.indexOf(user.id) > -1) {
                        Account.need_users.splice(Account.need_users.indexOf(user.id), 1);
                    }
                } else if (data[2].kind == 10030) {
                    var emojis = tagSearch(data[2].tags, 'a');
                    var emoji_authors = [];
                    var emoji_names = [];
                    Account.following_emoji_packs = [];
                    if (emojis.length > 0) {
                        for (var i = 0; i < emojis.length; i++) {
                            Account.following_emoji_packs.push(emojis[i][1]);
                            if (EmojiPacks.has(emojis[i][1])) {
                                setEmojiPack(EmojiPacks.get(emojis[i][1]));
                            } else {
                                emoji_authors.push(emojis[i][1].split(':')[1]);
                                emoji_names.push(emojis[i][1].split(':')[2]);
                            }
                        }
                    }
                    connection2.add({
                        body: JSON.stringify([
                            'REQ',
                            `${Account.emojis_event_id}`,
                            {
                                authors: emoji_authors,
                                '#d': emoji_names,
                                kinds: [30030],
                                limit: 100
                            }
                        ])
                    });
                } else if (data[2].kind == 30030) {
                    let pack = {
                        id: '',
                        icon: null,
                        name:  '未設定',
                        author: {
                            id: data[2].pubkey,
                            name: data[2].pubkey
                        },
                        description: 'このセットには説明文が用意されていません。',
                        emojis: []
                    };
                    if (Users.has(pack.author.id)) {
                        pack.author = Users.get(pack.author.id);
                    } else {
                        USER.get(pack.author.id);
                    }
                    var d = tagSearch(data[2].tags, 'd');
                    if (d.length > 0) {
                        pack.id = d[0][1];
                    }
                    var titles = tagSearch(data[2].tags, 'title');
                    if (titles.length > 0) {
                        pack.name = titles[0][1];
                    }
                    if (pack.name == '未設定') {
                        pack.name = pack.id;
                    }
                    pack.id = `30030:${pack.author.id}:${pack.id}`;
                    var imageS = tagSearch(data[2].tags, 'image');
                    if (imageS.length > 0) {
                        pack.icon = imageS[0][1];
                    }
                    var descriptions = tagSearch(data[2].tags, 'description');
                    if (descriptions.length > 0) {
                        pack.description = descriptions[0][1];
                    }
                    var emojis = tagSearch(data[2].tags, 'emoji');
                    for (var i = 0; i < emojis.length; i++) {
                        emojis[i][3] = pack.name;
                        pack.emojis.push(EMOJI.toHYB(emojis[i]));
                    }
                    if (pack.emojis.length > 0) {
                        if (!pack.icon) {
                            pack.icon = pack.emojis[0].url;
                        }
                        setEmojiPack(pack);
                    }
                }
            } else if (data[0] == 'NOTICE') {
                addConsoleContent({status: 'error', message: data[1]});
            }
        });
        this.ws.addEventListener("close", (event) => {
            classData.connect();
        });
    }
}

const Servers = [
    new Server('wss://nos.lol/'),
    new Server('wss://relay-jp.shino3.net/'),
    new Server('wss://relay.damus.io/')
];

var connection2 = {
    status: 'waiting',
    queue: [],
    last_time: new Date(),
    add: function(content) {
        for (var i = 0; i < this.queue.length; i++) {
            if (content.body == this.queue[i].body) {
                return;
            }
        }
        this.queue.push(content);
    },
    run: function() {
        if (connection2.queue && connection2.queue.length > 0 && connection2.status == 'waiting') {// && connection2.last_time < limit_time
            connection2.status = 'running';
            connection2.last_time = new Date();
            var data = connection2.queue[0];
            for (var i = 0; i < Servers.length; i++) {
                if (Servers[i].status == 'ready') {
                    Servers[i].ws.send(data.body);
                }
            }
            connection2.queue.shift();
            connection2.status = 'waiting';
        }
    },
    interval: null
};
connection2.interval = setInterval(connection2.run, 1000);

const EMOJI = {
    toHYB: function(old_emoji) {
        var new_emoji = {
            id: `${old_emoji[1]}@${old_emoji[3]}`,
            name: old_emoji[1],
            type: 'nostr',
            category: old_emoji[3],
            url: old_emoji[2],
            keywords: old_emoji[1]
        };
        Emojis.set(`${new_emoji.id}@${new_emoji.type}`, new_emoji);
        return new_emoji;
    },
    getAll: function(classData) {
        if (!Account.emojis_event_id) {
            Account.emojis_event_id = Math.floor(Math.random() * 9999999999);
        }
        if (classData) {
            classData.ws.send(JSON.stringify([
                'REQ',
                `${Account.emojis_event_id}`,
                {
                    kinds: [30030],
                    limit: 100
                }
            ]));
        } else {
            connection2.add({
                body: JSON.stringify([
                    'REQ',
                    `${Account.emojis_event_id}`,
                    {
                        kinds: [30030],
                        limit: 100
                    }
                ])
            });
        }
    },
    getUser: function() {
        if (!Account.user_emojis_event_id) {
            Account.user_emojis_event_id = Math.floor(Math.random() * 9999999999);
        }
        connection2.add({
            body: JSON.stringify([
                'REQ',
                `${Account.user_emojis_event_id}`,
                {
                    authors: [Account.npub_converted],
                    kinds: [10030],
                    limit: 20
                }
            ])
        });
    },
    install(emoji) {
        if (Account.nip_07) {
            var nowdate = Math.floor(new Date().getTime() / 1000);
            var tags = [];
            for (let i = 0; i < Account.following_emoji_packs.length; i++) {
                tags.push(['a', Account.following_emoji_packs[i]]);
            }
            tags.push(['a', emoji]);
            window.nostr.signEvent({
                created_at: nowdate,
                kind: 10030,
                tags: tags,
                content: ''
            }).then(function (event) {
                connection2.add({body: JSON.stringify(['EVENT', event])});
            });
        } else {
            addConsoleContent({status: 'error', message:'NIP-07の拡張機能が認識できませんでした。'});
        }
    },
    uninstall(emoji) {
        if (Account.nip_07) {
            var nowdate = Math.floor(new Date().getTime() / 1000);
            var tags = [];
            for (let i = 0; i < Account.following_emoji_packs.length; i++) {
                if (emoji != Account.following_emoji_packs[i]) {
                    tags.push(['a', Account.following_emoji_packs[i]]);
                }
            }
            window.nostr.signEvent({
                created_at: nowdate,
                kind: 10030,
                tags: tags,
                content: ''
            }).then(function (event) {
                connection2.add({body: JSON.stringify(['EVENT', event])});
            });
        } else {
            addConsoleContent({status: 'error', message:'NIP-07の拡張機能が認識できませんでした。'});
        }
    }
};

const USER = {
    toHYB: function(old_user) {
        old_user.content = JSON.parse(old_user.content);
        var new_user = {
            id: old_user.pubkey,
            name: old_user.content.name,
            avatar: old_user.content.picture,
            timestamp: old_user.created_at * 1000
        };
        if (!new_user.name) {
            new_user.name = `${old_user.pubkey.slice(0, 7)}…`;
        }
        if (
            Users.has(new_user.id) &&
            Users.get(new_user.id).timestamp &&
            new Date(Users.get(new_user.id).timestamp) > new Date(new_user.timestamp)
        ) {
            new_user = Users.get(new_user.id);
        }
        Users.set(new_user.id, new_user);
        EmojiPacks.forEach((pack) => {
            if (pack.author.id == new_user.id) {
                pack.author = new_user;
                setEmojiPack(pack);
            }
        });
        return new_user;
    },
    get(id) {
         if (!Account.need_users.includes(id)) {
            Account.need_users.push(id);
         }
         return true;
    }
};

function tagSearch(tags, type) {
    var result = [];
    for (var i = 0; i < tags.length; i++) {
        if (tags[i][0] == type) {
            result.push(tags[i]);
        }
    }
    return result;
}