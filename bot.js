const async = require('async');

const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config/config.json');

const ms = require('ms');
const sqlite3 = require('sqlite3');
require('./handlers/database')

let db = require('./handlers/database')

db = db.db

new sqlite3.Database('./data/database.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error(err.message);
    }
});


db.run("CREATE TABLE IF NOT EXISTS lobbies (streamerID text, messageID TEXT)");
db.run(`CREATE TABLE IF NOT EXISTS jono (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT NOT NULL, streamer TEXT NOT NULL)`);


const PREFIX = '!au';

var version = ('Version 1.0.1');


async function list(u, i) {
    return new Promise((resolve, reject) => {
        let list = new Array();
        db.all(`SELECT user FROM jono WHERE streamer = '${u}' ORDER BY id ASC LIMIT ${i}`, (e, r) => {
            r.forEach((p) => {
                list.push(p.user);
                db.run(`DELETE FROM jono WHERE user = '${p.user}'`);
            });
            resolve(list);
        })
    })
}


["event"].forEach(x => require(`./handlers/${x}`)(client));

client.on('ready', () => {
    console.log('This bot is online!');
    client.user.setStatus('available');
    client.user.setPresence({ activity: { name: 'Among Us with WillUShare' }, status: 'available' })
})



client.on("messageReactionAdd", (reaction, user) => {
    if (reaction.message.channel.id !== config.CHANNEL) { return false; }
    console.log('1')
    if (user.bot) { return false; }
    console.log('2')
    if (reaction.message.guild.members.cache.get(user.id).voice.channelID !== config.LINECHANNEL) {
        let reagoija = client.users.cache.get(user.id)
        return reagoija.send('Sinun täytyy olla Jonotus Aula kanavalla liittyäksesi jonoon. Jos koet tämän olevan virhe, ota yhteyttä WillUShare#0019'); 
    }
    console.log('3')
    if (reaction.emoji.id !== config.ReactionEmoji) { return false; }
    db.get(`SELECT * FROM jono WHERE user ='${user.id}'`, (err, row) => {
        if(row) {
            return user.send(`Et voi olla monessa jonossa samaan aikaan.`)
        }
        console.log('4')
    })
    db.each(`SELECT streamerID FROM lobbies WHERE messageID = '${reaction.message.id}'`, (e, r) => {
        db.run(`INSERT INTO jono (user, streamer) VALUES (?, ?)`, [user.id, r.streamerID]);
    }); 
});



client.on('message', async(message) => {
            let args = message.content.substring(PREFIX.length).split(" ");
            switch (args[1]) {
                case 'lobby':
                    if (message.channel.id !== config.CHANNEL) {
                        return await message.react('❌');
                    } else {
                        db.get(`SELECT messageID FROM lobbies WHERE streamerID = ${message.author.id}`, (e, r) => {
                                if (r) {
                                    return message.channel.send(`Sinulla on jo lobby, sulje edellinen jos haluat aloittaa uuden. <@!${message.author.id}>`).then(async msg => await msg.react('❌'))
                                } else {
                                    let streamerid = message.author.id
                                    let lobbynimi = message.content.replace(PREFIX + ' lobby ', '');
                                    let attachment = new Discord.MessageAttachment('./pictures/thumbnail.png', 'thumbnail.png');
                                    const reactionEmoji = message.guild.emojis.cache.find(emoji => emoji.name === 'amongus')
                                    const embedpelataan = new Discord.MessageEmbed()
                                        .setTitle("Striimaaja " + message.author.username + " hostaa lobbyä: \n " + lobbynimi +".")
                                            .addField('Aula on auki', 'Liity mukaan reagoimalla Among Us emoijiin.')
                                            .addField('!Muistutus!', 'Muista liittyä Jono kanavalle odottamaan siirtoa, muuten sinua ei siirretä')
                                            .setColor('#a83232')
                                            .setFooter('Jos ongelmia ilmenee ota yhteyttä botin kehittäjään WillUShare#0019')
                                            .attachFiles(attachment)
                                            .setThumbnail('attachment://thumbnail.png'); message.channel.send(embedpelataan).then(msg => {
                                                db.run(`
                                                INSERT INTO lobbies(streamerID, messageID) VALUES('${streamerid}', '${msg.id}')
                                                `);
                                                msg.react(reactionEmoji);
                                                msg.react('✅');
                                            });
                                        }
                                });
                        }
                        break;


                        case 'lopetetaan':
                            if (message.channel.id !== config.CHANNEL) {
                                return await message.react('❌');
                            } else {
                                db.get(`SELECT messageID FROM lobbies WHERE streamerID = ${message.author.id}`, (e, r) => {
                                    if (!r) {
                                        return message.channel.send(`Olet sulkenut jo kaikki lobbysi. Uusi lobby komennolla !au lobby <titteli lobbylle> <@!${message.author.id}>`).then(async msg => await msg.react('❌'))
                                    } else {
                                        let attachmentlopetetaan = new Discord.MessageAttachment('./pictures/thumbnail.png', 'thumbnail.png');
                                        client.channels.cache.get(config.CHANNEL).messages.fetch(db.run(`
                                                SELECT messageID FROM lobbies WHERE streamerID = '${message.author.id}'
                                                `)).then(msg => msg.delete({ timeout: 10000 }));
                                        console.log('TEST 1')

                                        db.run(`
                                                DELETE FROM lobbies WHERE streamerID = '${message.author.id}'
                                                `);
                                        console.log('TEST 2')
                                        db.run(`
                                        DELETE FROM jono WHERE streamer = '${message.author.id}'
                                        `);
                                        const embedlopetetaan = new Discord.MessageEmbed()
                                            .setTitle('Striimaaja ' + message.author.username + ' lopetti aikaisemman lobbyn.')
                                            .setDescription('Odota striimaajan seuraavaa lobbyä tai seuraavaa pelikertaa.')
                                            .setColor('#000000')
                                            .setFooter('Jos ongelmia ilmenee ota yhteyttä botin kehittäjään WillUShare#0019')
                                            .attachFiles(attachmentlopetetaan)
                                            .setThumbnail('attachment://thumbnail.png');
                                        message.channel.send(embedlopetetaan).then(async msg => await msg.react('✅'));
                                    }
                                });

                            }
                            break;


                        case 'perusinfo':
                            if (message.channel.id !== "754803875101540463") {
                                return await message.react('❌');
                            } else {
                                let attachmentperusinfo = new Discord.MessageAttachment('./pictures/thumbnail.png', 'thumbnail.png');
                                const embedstriimiinfo = new Discord.MessageEmbed()
                                    .setTitle('Amongi ohjeet striimaajille')
                                    .setDescription('Ylläpitäjä : WillUShare#0019')
                                    .addField('!au lobby <titteli huoneelle>', 'Luot lobbyn johon pelaajat voivat liittyä')
                                    .addField('!au lopetetaan', 'Lopettaa automaattisesti viimeisimmän lobbysi.')
                                    .addField('!au siirto <numero>', 'Komennolla tuot haluamasi määrän pelaajia puhekanavallesi.')
                                    .setFooter('Jos ongelmia ilmenee ota yhteyttä botin kehittäjään WillUShare#0019')
                                    .setColor('#a83232')
                                    .attachFiles(attachmentperusinfo)
                                    .setThumbnail('attachment://thumbnail.png');
                                message.channel.send(embedstriimiinfo);
                            }
                            break;

                        case 'pelaajainfo':
                            if (message.channel.id !== "757654283540758599") {
                                return await message.react('❌');
                            } else {
                                let attachmentpelaajainfo = new Discord.MessageAttachment('./pictures/thumbnail.png', 'thumbnail.png');
                                const embedpelaajainfo = new Discord.MessageEmbed()
                                    .setTitle('Amongi ohjeet pelaajille')
                                    .setDescription('Ylläpitäjä : WillUShare#0019')
                                    .addField('Miten liityn striimaajan aulaan?', 'Liityt striimaajan aulaan liittymällä Jonotus Aula kanavalle ja reagoimalla striimaajan aulaan #striimi_pelit kanavalla.')
                                    .addField('Miten lähden aulasta, jos haluan pelata toisen striimaajan kanssa?', 'Lähtemällä Jonotus Aula kanavalta tai odottamalla, että striimaajasi sulkee aulan.')
                                    .addField('Miten minut siirretään striimaajan kanavalle?', 'Jonoon liittymisen jälkeen pysyt vain Jonotus Aula kanavalla ja odotat, että striimaaja siirtää sinut komennolla.')
                                    .addField('Miten voin tehdä itse aulan?', 'Yksityiset aulat ovat vain striimaajille tällä hetkellä valitettavasti.')
                                    .addField('Pystynkö lähtemään Jonotus Aula kanavalta odottaakseni peliä toisaalla?', 'Amongi poistaa sinut jonosta, jos lähdet kanavalta Jonotus Aula.')
                                    .addField('Pystynkö liittymään useaan aulaan samaan aikaan?', 'Et pysty liittymään useaan aulaan samaan aikaan.')
                                    .addField('Minulla olisi kehitysidea, mitä teen?', 'Ota yhteys kehittäjään WillUShare#0019')
                                    .setFooter('Jos ongelmia ilmenee ota yhteyttä botin kehittäjään WillUShare#0019')
                                    .setColor('#a83232')
                                    .attachFiles(attachmentpelaajainfo)
                                    .setThumbnail('attachment://thumbnail.png');
                                message.channel.send(embedpelaajainfo);
                            }
                            break;
                        
                        
                        case 'perusinfo':
                            if (message.channel.id !== config.CHANNEL) {
                                return await message.react('❌');
                            } else {
                                let attachmentperusinfo = new Discord.MessageAttachment('./pictures/thumbnail.png', 'thumbnail.png');
                                const embedstriimiinfo = new Discord.MessageEmbed()
                                    .setTitle('Amongi ohjeet striimaajille')
                                    .setDescription('Ylläpitäjä : WillUShare#0019')
                                    .addField('!au lobby <titteli huoneelle>', 'Luot lobbyn johon pelaajat voivat liittyä')
                                    .addField('!au lopetetaan', 'Lopettaa automaattisesti viimeisimmän lobbysi.')
                                    .addField('!au siirto <numero>', 'Komennolla tuot haluamasi määrän pelaajia puhekanavallesi.')
                                    .setFooter('Jos ongelmia ilmenee ota yhteyttä botin kehittäjään WillUShare#0019')
                                    .setColor('#a83232')
                                    .attachFiles(attachmentperusinfo)
                                    .setThumbnail('attachment://thumbnail.png');
                                message.channel.send(embedstriimiinfo);
                            }
                            break;


                        case 'siirto':
                            if (message.channel.id !== config.CHANNEL) {
                                return await message.react('❌');
                            } else {
                                let attachmentsiirto = new Discord.MessageAttachment('./pictures/thumbnail.png', 'thumbnail.png');
                                list(message.author.id, args[2]).then((pelaajat) => {
                                    pelaajat.forEach((pelaaja) => {
                                        message.guild.members.fetch(pelaaja).then(member => {
                                            member.voice.setChannel(message.member.voice.channel)
                                            db.all(`SELECT messageID FROM lobbies WHERE streamerID = '${message.author.id}'`, (e, r) => {
                                                r.forEach((id) => {
                                                    let msg = client.channels.cache.get(config.CHANNEL).messages.cache.get(id.messageID);
                                                    msg.reactions.resolve(config.ReactionEmoji).users.remove(member.id);
                                                });
                                            });
                                        });
                                    });

                                    const siirtoembed = new Discord.MessageEmbed()
                                        .setTitle('Siirto ilmoitus')
                                        .setDescription(`
                                                Striimaaja ${message.author.username} lähetti puhekanavalleen pelaajia.`)
                                        .setFooter('Jos ongelmia ilmenee ota yhteyttä botin kehittäjään WillUShare#0019')
                                        .setColor('#34e1eb')
                                        .attachFiles(attachmentsiirto)
                                        .setThumbnail('attachment://thumbnail.png');
                                    message.channel.send(siirtoembed).then(async msg => await msg.react('✅'));
                                });
                            }
                            break;


                        case 'uusi':

                            if (message.channel.id !== config.CHANNEL) {
                                return await message.react('❌');
                            } else {
                                let attachmenttyhjennys = new Discord.MessageAttachment('./pictures/thumbnail.png', 'thumbnail.png');


                                const tyhjennysembed = new Discord.MessageEmbed()
                                    .setTitle('Puhekanavan tyhjennys ilmoitus')
                                    .setDescription(`
                                                Striimaaja $ { message.author.username }
                                                tyhjensi juuri puhekanavansa pelaajista.
                                                `)
                                    .setFooter('Jos ongelmia ilmenee ota yhteyttä botin kehittäjään WillUShare#0019')
                                    .setColor('#00ff3c')
                                    .attachFiles(attachmenttyhjennys)
                                    .setThumbnail('attachment://thumbnail.png');

                                message.channel.send(tyhjennysembed).then(async msg => await msg.react('✅'));

                            }
                            break;
                    }
            })


        client.login(config.TOKEN);