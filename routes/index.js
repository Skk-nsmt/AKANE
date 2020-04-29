var express = require('express');
var router = express.Router();

const jsonfile = require('jsonfile')

var mongoClient = require('mongodb').MongoClient;
const dotenv = require('dotenv');
dotenv.config();

/* GET home page. */
router.get('/', function (req, res) {
    const actorJsonObj = jsonfile.readFileSync('public/resources/actors.json')

    let ifOpSuccess = req.session.opSuccess
    req.session.opSuccess = null

    mongoClient.connect(process.env.MONGODB_URI, function (err, client) {
        if (err) {
            res.render("error")
        } else {
            const db = client.db(process.env.DATABASE_NAME)
            db.collection(process.env.DATABASE_COLLECTION).find({}).toArray(function (err, result) {
                if (err) {
                    res.render("error")
                }
                result = result.sort((a, b) => new Date(b["startDate"]) - new Date(a["startDate"]))
                res.render('index', {
                        title: 'A.K.A.N.E.',
                        activities: result,
                        actors: actorJsonObj,
                        moment: require('moment-timezone'),
                        addSuccess: ifOpSuccess
                    }
                )
                client.close();
            })
        }
    })
});

module.exports = router;
