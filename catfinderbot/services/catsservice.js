module.exports = function()
{
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


function queryCollection(databasename, collectionid,query) {
    var documentClient = require("documentdb").DocumentClient;
    var url = require('url');
    var client = new documentClient(process.env.cosmosDB_Endpoint, { "masterKey": process.env.cosmosDB_PrimaryKey });
    var HttpStatusCodes = { NOTFOUND: 404 };
    var databaseUrl = 'dbs/' + databasename;

    var collectionUrl = databaseUrl + '/colls/' + collectionid;



    

    console.log('Querying collection:'+collectionid);

    return new Promise((resolve, reject) => {
        client.queryDocuments(
            collectionUrl,
            query
        ).toArray((err, results) => {
            if (err) 
                {
                    reject(err)}
            else {
                
                console.log("found");
                resolve(results);
            }
        });
    });
}

    return {
        getDatabase: getDatabase,
        getCollection:getCollection,
        getDocument:getDocument,
        queryCollection:queryCollection

    };
}();



