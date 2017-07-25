var builder = require('botbuilder');
var Promise = require('bluebird');
var request = require('request-promise').defaults({ encoding: null });

module.exports = [
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
];

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
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
// Promise for obtaining JWT Token (requested once)
var obtainToken = Promise.promisify(connector.getAccessToken.bind(connector));

var checkRequiresToken = function (message) {
    return message.source === 'skype' || message.source === 'msteams';
};