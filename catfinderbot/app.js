// This loads the environment variables from the .env file
require('dotenv-extended').load();

var restify = require('restify');
var builder = require('botbuilder');
var Promise = require('bluebird');
var request = require('request-promise').defaults({ encoding: null });

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

bot.dialog('Help', function (session) {
    session.endDialog('Hi! I\'m cat finder, you can  report missing cat , report found cat or see missing cats in your area.');
}).triggerAction({
    matches: 'Help'
});



bot.dialog('Found missing cat', [
    function (session) {
        session.endDialog("Found missing cat");
    }

]).triggerAction({
    matches: 'Found missing cat'
});


bot.dialog('UploadCatPhoto', [
    function (session, args, next) {
        var message = "please upload cat photo";
        builder.Prompts.attachment(session, message);
    },
    function (session, results, next) {

       
        var msg = session.message;

        if (msg != undefined && msg.attachments.length) {

            //todo move to service

            //get photo and store it in blob storage todo - refactor 
            session.send("msg.attachments.length:" + msg.attachments.length);
            // Message with attachment, proceed to download it.
            // Skype & MS Teams attachment URLs are secured by a JwtToken, so we need to pass the token from our bot.
            var attachment = msg.attachments[0];
          
          
            if (attachment != undefined) {
               
                var fileDownload = checkRequiresToken(msg)
                    ? requestWithToken(attachment.contentUrl)
                    : request(attachment.contentUrl);

                fileDownload.then(
                    function (response) {
                     
                        //upload image to blob storage  - get url 
                        session.dialogData.CatPhoto = {};
                        session.dialogData.CatPhoto.Image = "url of uploaded image";
                        session.dialogData.CatPhoto.ContentType = attachment.contentType;
                        session.dialogData.CatPhoto.Length = response.length;
                        // Send reply with attachment type & size
                        var reply = new builder.Message(session)
                            .text('Attachment of %s type and size of %s bytes received.', attachment.contentType, response.length);
                        session.send(reply);

                        session.endDialogWithResult({ response: session.dialogData.CatPhoto });
                    }).catch(function (err) {
                        console.log('Error downloading attachment:', { statusCode: err.statusCode, message: err.response.statusMessage });
                        session.send("error");
                    });
            }
else
    {
         session.send("error");
         session.endDialogWithResult({ response: null });
    }



        } else {
            // Echo back users text
            session.send("didn't receive image");
            session.endDialogWithResult({ response: null });
        }

    },

]);
/*
Bot user id
Suburb (long/Lat)
Name, Gender, Breed,
Other distinguishing marks
Image Url, Timestamp, Found
*/
bot.dialog('Report missing cat',
    [
        function (session) {
            session.dialogData.MissingCat = {};
            builder.Prompts.text(session, 'Please provide suburb or the last address your that cat has been there');
        },

        function (session, results) {
            session.dialogData.Address = results.response;
            var question = 'What\'s the cat name?';
            builder.Prompts.text(session, question);
        },
        function (session, results) {
            session.dialogData.MissingCat.Name = results.response;
            var question = 'What\'s ' + session.dialogData.MissingCat.Name + ' gender?';
            builder.Prompts.text(session, question);
        },
        function (session, results) {
            session.dialogData.MissingCat.Gender = results.response;
            var question = 'How old is ' + ((results.response !== null && results.response.toLowerCase() === "male") ? "he?" : "she?");
            builder.Prompts.text(session, question);
        },
        function (session, results) {
            session.dialogData.MissingCat.Age = results.response;
            var question = 'What\'s ' + session.dialogData.MissingCat.Name + '\'s breed?';
            builder.Prompts.text(session, question);
        },
        function (session, results) {
            session.dialogData.MissingCat.Breed = results.response;
            var question = 'Any specification that helps to identify ' + session.dialogData.MissingCat.Name + '?';
            builder.Prompts.text(session, question);
        },
        function (session, results) {
            session.dialogData.MissingCat.AdditionalInfo = results.response;
            session.beginDialog('UploadCatPhoto');
        },
        function (session, results) {



            if (results.response != null) {
                session.send("image received");
            }
            else {
                session.send("Seems we didn't get your cat's photo - please try again");
                session.endDialog();

            }
            //todo send missing cat info to comosdb collection
            session.send("hope you find your missing cat soon");
            session.endDialog();


        }]
).triggerAction({
    matches: 'Report missing cat'
});

bot.dialog('Show missing cats', function (session) {
    session.endDialog('Show missing cats');
}).triggerAction({
    matches: 'Show missing cats'
});

// Request file with Authentication Header
var requestWithToken = function (url) {
    return obtainToken().then(function (token) {
        return request({
            url: url,
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/octet-stream'
            }
        });
    });
};

// Promise for obtaining JWT Token (requested once)
var obtainToken = Promise.promisify(connector.getAccessToken.bind(connector));

var checkRequiresToken = function (message) {
    return message.source === 'skype' || message.source === 'msteams';
};