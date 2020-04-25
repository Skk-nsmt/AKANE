var express = require('express');
var router = express.Router();

const jsonfile = require('jsonfile')

const {check, validationResult} = require('express-validator');
var validator = require("validator");
var moment = require("moment-timezone");
var twitterParse = require('twitter-url-parser');

// double check for all / individual exclusion
member_participation_check = function (value) {
    return value === undefined || value === 'on';
}

router.get('/test', function () {
    console.log("This is a test. ");
});

router.get('/activityData', function (req, res) {
    const activityJsonObj = jsonfile.readFileSync('public/resources/activities.json');
    res.send(activityJsonObj);
});

router.post('/addActivity', [
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
        // if not checked, then must check if ISO8601
        if (req.body.isEndTimeUnknown !== undefined) { // checked
            return true;
        } else {
            return validator.isISO8601(value);
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
    check("eventTweetLink").optional({checkFalsy: true}).isURL()
], function (req, res) {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // must redirect with session data that says there are errors
        req.session.ifAddError = true
        res.redirect("/add")
    } else {
        // Need to sanitize data
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
        var startTime = req.body.eventStartTime // this time has user's timezone data

        var startTimeString
        if (req.body.isFullDayEvent !== undefined) {
            // if full day event, then the field is in UTC
            startTimeString = `${startTime.getUTCFullYear()}-${(startTime.getUTCMonth() < 10 ? '0' : '') + (startTime.getUTCMonth() + 1)}-${(startTime.getUTCDate() < 10 ? '0' : '') + startTime.getUTCDate()}T${(startTime.getUTCHours() < 10 ? '0' : '') + startTime.getUTCHours()}:${(startTime.getUTCMinutes() < 10 ? '0' : '') + startTime.getUTCMinutes()}:00`
        } else {
            startTimeString = `${startTime.getFullYear()}-${(startTime.getMonth() < 10 ? '0' : '') + (startTime.getMonth() + 1)}-${(startTime.getDate() < 10 ? '0' : '') + startTime.getDate()}T${(startTime.getHours() < 10 ? '0' : '') + startTime.getHours()}:${(startTime.getMinutes() < 10 ? '0' : '') + startTime.getMinutes()}:00`
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
                endTimeString = `${endTime.getUTCFullYear()}-${(endTime.getUTCMonth() < 10 ? '0' : '') + (endTime.getUTCMonth() + 1)}-${(endTime.getUTCDate() < 10 ? '0' : '') + endTime.getUTCDate()}T${(endTime.getUTCHours() < 10 ? '0' : '') + endTime.getUTCHours()}:${(endTime.getUTCMinutes() < 10 ? '0' : '') + endTime.getUTCMinutes()}:00`
            } else {
                endTimeString = `${endTime.getFullYear()}-${(endTime.getMonth() < 10 ? '0' : '') + (endTime.getMonth() + 1)}-${(endTime.getDate() < 10 ? '0' : '') + endTime.getDate()}T${(endTime.getHours() < 10 ? '0' : '') + endTime.getHours()}:${(endTime.getMinutes() < 10 ? '0' : '') + endTime.getMinutes()}:00`
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
            newActivity["relatedTweetId"] = twitterParse(sanitizedTweetURL);
        }

        // read the json file, then append to the object, then sort, then write back
        // need to upgrade to a mongodb later
        jsonfile.readFile("public/resources/activities.json", function (err, obj) {
            if (err) {
                // take the user back to add, display unexpected error
                req.session.ifUnexpectedError = true
                res.redirect("/add")
            } else {
                obj.push(newActivity)

                try {
                    jsonfile.writeFileSync("public/resources/activities.json", obj)
                    req.session.addSuccess = true
                    res.redirect("/")
                } catch {
                    req.session.ifUnexpectedError = true
                    res.redirect("/add")
                }
            }
        })
    }
})

module.exports = router;