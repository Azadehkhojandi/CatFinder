var builder = require('botbuilder');

module.exports =  [

function (session) {
    session.endDialog('found missing cat');
}
];