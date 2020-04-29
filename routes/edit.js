var express = require('express');
var router = express.Router();

const jsonfile = require('jsonfile')

const mongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const dotenv = require('dotenv');
dotenv.config();

router.get('/', function (req, res) {
    const actorJsonObj = jsonfile.readFileSync('public/resources/actors.json')

    var ifErrorFromValidation = req.session.ifEditError
    var ifErrorUnexpected = req.session.ifUnexpectedError
    req.session.ifEditError = null;
    req.session.ifUnexpectedError = null;

    mongoClient.connect(process.env.MONGODB_URI, function (err, client) {
        if (err) {
            res.render("error")
        } else {
            const db = client.db(process.env.DATABASE_NAME)
            db.collection(process.env.DATABASE_COLLECTION).find({_id: ObjectId(req.query.id)}).toArray(function (err, result) {
                if (err || result.length === 0) {
                    res.render("error")
                } else {
                    console.log(result)
                    res.render('editor', {
                        title: 'A.K.A.N.E.',
                        mode: "edit",
                        actors: actorJsonObj,
                        itemToEdit: result[0],
                        moment: require('moment-timezone'),
                        ifError: ifErrorFromValidation,
                        ifErrorUnexpected: ifErrorUnexpected
                    })
                }
            })
        }
    })
})

module.exports = router;