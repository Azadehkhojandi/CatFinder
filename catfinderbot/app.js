// This loads the environment variables from the .env file
require('dotenv-extended').load();

var restify = require('restify');
var builder = require('botbuilder');


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, function (session) {
    session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
});

var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
bot.recognizer(recognizer);

bot.dialog('Help',require('./dialogs/help') ).triggerAction({
    matches: 'Help'
});


bot.dialog('Found missing cat', require('./dialogs/foundmissingcat')).triggerAction({
    matches: 'Found missing cat'
});


bot.dialog('UploadCatPhoto', require('./dialogs/uploadcatphoto'));


bot.dialog('Report missing cat', require('./dialogs/reportmissingcat')).triggerAction({
    matches: 'Report missing cat'
});;


bot.dialog('Show missing cats', require('./dialogs/reportmissingcat')).triggerAction({
    matches: 'Show missing cats'
});

