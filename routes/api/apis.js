var express = require('express');
var router = express.Router();

var mongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const dotenv = require('dotenv');
dotenv.config();

const {check, validationResult} = require('express-validator');
var validator = require("validator");
var moment = require("moment-timezone");
var twitterParse = require('twitter-url-parser');

// double check for all / individual exclusion
member_participation_check = function (value) {
    return value === undefined || value === 'on';
}

router.get('/test', function (req) {
    console.log(req.originalUrl)
});

router.get('/activityData', function (req, res) {
    mongoClient.connect(process.env.MONGODB_URI, function (err, client) {
        if (err) {
            console.log(err)
        } else {
            const db = client.db(process.env.DATABASE_NAME)
            db.collection(process.env.DATABASE_COLLECTION).find({}).toArray(function (err, result) {
                if (err) console.log(err);
                res.send(result)
                client.close();
            })
        }
    })
});

checkArray = [
    check("eventNameEnglish", "Activity name must not be empty. ").notEmpty().trim(),
    check("all").custom(member_participation_check),
    check("amaki").custom(member_participation_check),
    check("umino").custom(member_participation_check),
    check("kawase").custom(member_participation_check),
    check("kuraoka").custom(member_participation_check),
    check("saijo").custom(member_participation_check),
    check("shirosawa").custom(member_participation_check),
    check("suzuhana").custom(member_participation_check),
    check("takatsuji").custom(member_participation_check),
    check("takeda").custom(member_participation_check),
    check("hokaze").custom(member_participation_check),
    check("miyase").custom(member_participation_check),
    check("hanakawa").custom(member_participation_check),
    check("eventStartTime").isISO8601().toDate(),
    check("eventEndTime").custom(function (value, {req}) {
        // if checkbox checked, then this field does not exist, simply return true
        // if not checked, then must check if ISO8601, then check if end time is after start time
        if (req.body.isEndTimeUnknown !== undefined) { // checked
            return true;
        } else {
            return validator.isISO8601(value) && new Date(value) - new Date(req.body.eventStartTime) >= 0;
        }
    }),
    check("numRelatedLinks").isInt({min: 1}).custom(function (value, {req}) {
        for (var i = 0; i < req.body.numRelatedLinks; i++) {
            var attribute = "eventLink" + i;
            if (!(req.body[attribute] === undefined || validator.isEmpty(req.body[attribute]) || validator.isURL(req.body[attribute]))) {
                return false;
            }
        }
        return true;
    }).toInt(),
    check("eventTweetLink").optional({checkFalsy: true}).isURL()]

function sanitizeData(req) {
    var newActivity = {
        "activityName": "",
        "activityNameJpn": "",
        "participants": [],
        "startDate": "",
        "isFullDay": false,
        "isEndTimeUnknown": false,
        "endDate": "",
        "links": [],
        "imgURL": [],
        "relatedTweetId": ""
    };

    newActivity["activityName"] = req.body.eventNameEnglish
    newActivity["activityNameJpn"] = validator.trim(req.body.eventNameJapanese)

    if (req.body.all !== undefined) {
        newActivity["participants"].push("all")
    }

    let idNames = ["amaki", "umino", "kawase", "kuraoka", "saijo", "shirosawa", "suzuhana", "takatsuji",
        "takeda", "hokaze", "miyase", "hanakawa"]

    for (var name of idNames) {
        if (req.body[name] !== undefined) {
            newActivity["participants"].push(name)
        }
    }

    // user input date is in JST, must convert it to UTC to store
    var startTimeString
    if (req.body.isFullDayEvent !== undefined) {
        // if full day event, then the field is converted to UTC, need to get the JST string
        startTimeString = moment(req.body.eventStartTime).tz('UTC').format("YYYY-MM-DD[T]HH:mm:00")
    } else {
        startTimeString = moment(req.body.eventStartTime).format("YYYY-MM-DD[T]HH:mm:00")
    }

    var eventStartJST = moment.tz(startTimeString, "Asia/Tokyo")
    newActivity["startDate"] = eventStartJST.clone().tz("UTC").format();

    if (req.body.isFullDayEvent !== undefined) {
        newActivity["isFullDay"] = true
    }

    if (req.body.isEndTimeUnknown !== undefined) {
        newActivity["isEndTimeUnknown"] = true
        newActivity["endDate"] = "";
    } else {
        var endTime = validator.toDate(req.body.eventEndTime)

        var endTimeString
        if (req.body.isFullDayEvent !== undefined) {
            // if full day event, then the field is in UTC
            endTimeString = moment(endTime).tz('UTC').format("YYYY-MM-DD[T]HH:mm:00")
        } else {
            endTimeString = moment(endTime).format("YYYY-MM-DD[T]HH:mm:00")
        }
        var eventEndJST = moment.tz(endTimeString, "Asia/Tokyo");
        newActivity["endDate"] = eventEndJST.clone().tz("UTC").format();
    }

    for (var i = 0; i < req.body.numRelatedLinks; i++) {
        if (!validator.isEmpty(req.body["eventLink" + i]) && validator.isURL(req.body["eventLink" + i])) {
            // must sanitize the url here
            const sanitizedURL = req.sanitize(req.body["eventLink" + i]);
            newActivity["links"].push(sanitizedURL);
        }
    }

    if (req.body.eventTweetLink !== undefined && req.body.eventTweetLink !== "") {
        const sanitizedTweetURL = req.sanitize(req.body.eventTweetLink);
        newActivity["relatedTweetId"] = twitterParse(sanitizedTweetURL)["id"];
    }

    return newActivity
}

router.post('/addActivity', checkArray, function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // must redirect with session data that says there are errors
        console.log(errors)
        req.session.ifAddError = true
        res.redirect("/add")
    } else {
        // Need to sanitize data
        var newActivity = sanitizeData(req)

        mongoClient.connect(process.env.MONGODB_URI, function (err, client) {
            if (err) {
                req.session.ifUnexpectedError = true
                res.redirect("/add")
            } else {
                const db = client.db(process.env.DATABASE_NAME)
                db.collection(process.env.DATABASE_COLLECTION).insertOne(newActivity, function (err) {
                    if (err) {
                        req.session.ifUnexpectedError = true
                        res.redirect("/add")
                    }
                    client.close()
                    req.session.opSuccess = true
                    res.redirect("/")
                })
            }
        })
    }
})

router.post('/editActivity', checkArray, function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // must take user back and display an error
        req.session.ifEditError = true
        res.redirect("/edit?id" + req.query.id)
    } else {
        // Need to sanitize data
        var newActivity = sanitizeData(req)

        mongoClient.connect(process.env.MONGODB_URI, function (err, client) {
            if (err) {
                req.session.ifUnexpectedError = true
                res.redirect("/edit?id" + req.query.id)
            } else {
                const db = client.db(process.env.DATABASE_NAME)
                db.collection(process.env.DATABASE_COLLECTION).replaceOne({_id: ObjectId(req.query.id)}, newActivity, function (err) {
                    if (err) {
                        req.session.ifUnexpectedError = true
                        res.redirect("/edit?id" + req.query.id)
                    }
                    client.close()
                    req.session.opSuccess = true
                    res.redirect("/")
                })
            }
        })
    }
})

router.get('/delete', function (req, res) {
    mongoClient.connect(process.env.MONGODB_URI, function (err, client) {
        if (err) {
            res.render("error")
        } else {
            const db = client.db(process.env.DATABASE_NAME)
            db.collection(process.env.DATABASE_COLLECTION).deleteOne({_id: ObjectId(req.query.id)}, function (err, result) {
                if (err) {
                    res.render("error")
                } else {
                    console.log(result)
                    client.close()
                    req.session.opSuccess = true
                    res.redirect("/")
                }
            })
        }
    })
})

module.exports = router;