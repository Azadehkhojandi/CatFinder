require('dotenv-extended').load();
var builder = require('botbuilder');

/*
Bot user id
Suburb (long/Lat)
Name, Gender, Breed,
Other distinguishing marks
Image Url, Timestamp, Found
*/



module.exports = [

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
            session.dialogData.MissingCat.CatPhoto = results.response;
            console.log(results.response);
        }
        else {
            session.send("Seems we didn't get your cat's photo - please try again");
            session.endDialog();

        }




session.dialogData.MissingCat.Timestamp= new Date().toUTCString();
        var missingcatdocument = {};
        // var Guid = require('guid');
        // var guid = Guid.create();
        // missingcatdocument.id = guid.value;
        missingcatdocument.cat = session.dialogData.MissingCat;



        getDatabase('catfinder')
            .then(() => getCollection('catfinder', 'missingcats'))

            // ADD THIS PART TO YOUR CODE
            .then(() => getDocument('catfinder', 'missingcats', missingcatdocument))

            .then(
            () => {
                session.send('Completed successfully');

            })
            .catch(

            (error) => {
                session.send('error ' + JSON.stringify(error));
                session.endDialog();
            });

        session.send("hope you find your missing cat soon");

        session.endDialog();


    }];




// todo move to seperate service
function getDatabase(databasename) {
    var documentClient = require("documentdb").DocumentClient;
    var url = require('url');
    var client = new documentClient(process.env.cosmosDB_Endpoint, { "masterKey": process.env.cosmosDB_PrimaryKey });
    var HttpStatusCodes = { NOTFOUND: 404 };
    var databaseUrl = 'dbs/' + databasename;


    console.log('Getting database:\n' + databasename);

    return new Promise((resolve, reject) => {

        client.readDatabase(databaseUrl, (err, result) => {
            console.log("promise result");

            if (err) {
                console.log("err ->" + err);
                console.log(err);
                reject(err);

            } else {
                resolve(result);
            }
        });
    });
}

function getCollection(databasename, collectionid) {
    var documentClient = require("documentdb").DocumentClient;
    var url = require('url');
    var client = new documentClient(process.env.cosmosDB_Endpoint, { "masterKey": process.env.cosmosDB_PrimaryKey });
    var HttpStatusCodes = { NOTFOUND: 404 };
    var databaseUrl = 'dbs/' + databasename;

    var collectionUrl = databaseUrl + '/colls/' + collectionid;



    console.log('Getting collection:\n' + collectionid);

    return new Promise((resolve, reject) => {
        client.readCollection(collectionUrl, (err, result) => {
            if (err) {
                if (err.code == HttpStatusCodes.NOTFOUND) {
                    client.createCollection(databaseUrl, config.collection, { offerThroughput: 400 }, (err, created) => {
                        if (err) {
                            reject(err)
                        }
                        else {
                            resolve(created);
                        }
                    });
                } else {
                    reject(err);
                }
            } else {
                resolve(result);
            }
        });
    });
}

function getDocument(databasename, collectionid, document) {
    var documentClient = require("documentdb").DocumentClient;
    var url = require('url');
    var client = new documentClient(process.env.cosmosDB_Endpoint, { "masterKey": process.env.cosmosDB_PrimaryKey });
    var HttpStatusCodes = { NOTFOUND: 404 };
    var databaseUrl = 'dbs/' + databasename;

    var collectionUrl = databaseUrl + '/colls/' + collectionid;
    let documentUrl = collectionUrl + '/docs/' + document.id;
    console.log('Getting document:\n' + document.id + '\n');

    return new Promise((resolve, reject) => {
        client.readDocument(documentUrl, { partitionKey: document.district }, (err, result) => {
            if (err) {
                if (err.code == HttpStatusCodes.NOTFOUND) {
                    client.createDocument(collectionUrl, document, (err, created) => {
                        if (err)
                        { reject(err) }
                        else
                        { resolve(created) };
                    });
                } else {
                    reject(err);
                }
            } else {
                resolve(result);
            }
        });
    });
}
