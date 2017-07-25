var builder = require('botbuilder');

/*
Bot user id
Suburb (long/Lat)
Name, Gender, Breed,
Other distinguishing marks
Image Url, Timestamp, Found
*/

module.exports =  [
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
               
            }
            else {
                session.send("Seems we didn't get your cat's photo - please try again");
                session.endDialog();

            }
            //todo send missing cat info to comosdb collection
            session.send("hope you find your missing cat soon");
            session.endDialog();


        }];