var builder = require('botbuilder');
var catservice = require('./../services/catsservice.js');

module.exports = [
    function (session) {

        builder.Prompts.text(session, 'What\'s your suburb?');
    },
    function (session, results) {
        var query = 'SELECT VALUE r.cat FROM root r where  r.cat.Address="' + results.response + '"'
        catservice.queryCollection('catfinder', 'missingcats', query)
            .then(function (result) {
                console.log("result")
                console.log(result); // "Stuff worked!"


                var cards = [];
                for (var cat of result) {
                    var card = new builder.HeroCard(session)
                        .title(cat.Name)
                        .subtitle("reported:" + cat.Timestamp) //todo convert to local time zone
                        .text(
                         'Gender:' + cat.Gender + '\n\r ' +
                         'Age:' + cat.Age + '\n\r '+
                         'Breed:' + cat.Breed + '\n\r '+
                         'Additional Information:' + cat.AdditionalInfo + '\n\r '
                    )
                        .images([
                            builder.CardImage.create(session, cat.CatPhoto.Image)
                        ])
                        ;
                    cards.push(card);
                }






                // create reply with Carousel AttachmentLayout
                var reply = new builder.Message(session)
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(cards);

                session.endDialog(reply);

            }, function (err) {
                console.log(err); // Error: "It broke"
            });
    }
    //,
    // function (session) {
    //     session.endDialog('show missing cats');

    // }
];