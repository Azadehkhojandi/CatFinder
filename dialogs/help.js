var builder = require('botbuilder');

module.exports =  [

function (session) {
    session.endDialog('Hi! I\'m cat finder, you can  report missing cat , report found cat or see missing cats in your area.');
}
];