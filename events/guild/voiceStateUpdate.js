let db = require('../../handlers/database')

db = db.db

module.exports = async(oldMember, newMember) => {

    let newUserChannel = newMember.channel
    let oldUserChannel = oldMember.channel
    
    if (newMember.channelID === '756106437301633064' && oldUserChannel === undefined && newUserChannel !== undefined) {
        db.run(`DELETE FROM jono WHERE user = '${newMember.id}'`)
    }

    console.log(newMember.channelID)
}