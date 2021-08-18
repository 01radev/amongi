module.exports.db = require('sqlite3');

this.db = new this.db.Database('./data/database.db', (err) => {
if(err) {
console.log(err)
} else {
console.log(`Connected to the database!`)
}
})