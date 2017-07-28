var builder = require('botbuilder');
var Promise = require('bluebird');
var request = require('request-promise').defaults({ encoding: null });
//var request = require('request').defaults({ encoding: null });



module.exports = [
    function (session, args, next) {
        if (args && args.reprompt) {
            builder.Prompts.text(session, "please upload valid photo")
        } else {
            var message = "please upload cat photo";
            builder.Prompts.attachment(session, message);
        }
    },
    function (session, results, next) {


        var msg = session.message;

        if (msg != undefined && msg.attachments.length) {

            //todo move to service

            //get photo and store it in blob storage todo - refactor 

            // Message with attachment, proceed to download it.
            // Skype & MS Teams attachment URLs are secured by a JwtToken, so we need to pass the token from our bot.
            var attachment = msg.attachments[0];


            if (attachment != undefined) {

                var fileDownload = checkRequiresToken(msg)
                    ? requestWithToken(attachment.contentUrl)
                    : request(attachment.contentUrl);

                fileDownload.then(
                    function (response) {

                        //console.log(response);
                        //upload image to blob storage  - get url 
                        session.dialogData.CatPhoto = {};
                        session.dialogData.CatPhoto.Image = "";
                        session.dialogData.CatPhoto.id = "";
                        session.dialogData.CatPhoto.ContentType = attachment.contentType;
                        session.dialogData.CatPhoto.Length = response.length;

                        var mime = require('mime-types');
                        var extension = mime.extension(attachment.contentType);
                        var Guid = require('guid');
                        var guid = Guid.create();
                        session.dialogData.CatPhoto.id = guid.value;

                        var filesize = response.length;
                        var type = attachment.contentType;
                        var filename = guid.value + '.' + extension;
                        var file = response;
                        console.log("filename: " + filename);
                        console.log("response.length: " + filesize);
                        //console.log("file: " + file);
                        console.log("type: " + type);



                        if (type == "image/jpeg" || type == "image/jpg" || type == "image/png") {




                            var azure = require('azure-storage');
                            var blobSvc = azure.createBlobService();
                            blobSvc.createContainerIfNotExists('missingcatsphotos', { publicAccessLevel: 'blob' }, function (error, result, response) {
                                console.log("createContainerIfNotExists");
                                if (!error) {

                                    console.log("!error");

                                    // setup photo meta data

                                    //var path = req.files.photo.path;

                                    // check if it has the right filetype


                                    var base64js = require('base64-js');

                                    imagebase64 = base64js.fromByteArray(file);
                                    var buffer = new Buffer(imagebase64, 'base64');

                                    blobSvc.createBlockBlobFromText('missingcatsphotos', filename, buffer, { "contentType": type }, function (error, result, response) {
                                        console.log("createBlockBlobFromStream ");
                                        if (error) {
                                            console.log(error);
                                        } else {
                                            console.log(result);
                                            var url = process.env.AZURE_STORAGE_ENDPOINT  + result.container + '/';
                                            session.dialogData.CatPhoto.Image = url + result.name;


                                            var reply = new builder.Message(session)
                                                .text('Attachment of %s type and size of %s bytes received.', attachment.contentType, response.length);
                                            session.send(reply);

                                            session.endDialogWithResult({
                                                response:
                                                session.dialogData.CatPhoto
                                            });
                                        }
                                    });




                                    // blobSvc.createBlockBlobFromStream('missingcatsphotos', filename, stream, filesize, function (error) {
                                    //     console.log("createBlockBlobFromStream ");
                                    //     if (!error) {
                                    //         console.log("!error");
                                    //         // file uploaded

                                    //     }
                                    //     // Send reply with attachment type & size

                                    // });




                                }

                            });
                        }

                    }).catch(function (err) {
                        console.log('Error downloading attachment:' + err);
                        session.send("error");
                    });
            }
            else {
                //session.replaceDialog('uploadcatphoto', { reprompt: true });
                session.send("error");
                session.endDialogWithResult({ response: null });
            }



        } else {

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