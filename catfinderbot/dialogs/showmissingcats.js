var builder = require('botbuilder');

module.exports =  [

function (session) {
    session.endDialog('show missing cats');
}
];