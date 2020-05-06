const express = require('express');
const router = express.Router();

const mongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const dotenv = require('dotenv');
dotenv.config();

const {check, validationResult} = require('express-validator');
const validator = require("validator");
const moment = require("moment-timezone");
const twitterParse = require('twitter-url-parser');

const Discord = require('discord.js');
const discordClient = new Discord.Client();

discordClient.login(process.env.DISCORD_TOKEN);

const axios = require('axios');
const cheerio = require('cheerio');

const authMiddleware = require('../authMiddleware');

// double check for all / individual exclusion
let memberParticipationCheck = function (value) {
    return value === undefined || value === 'on';
};

router.get('/activityData', function (req, res) {
    mongoClient.connect(process.env.MONGODB_URI, {useUnifiedTopology: true}, function (err, client) {
        if (err) {
            console.log(err);
        } else {
            const db = client.db(process.env.DATABASE_NAME);
            db.collection(process.env.DATABASE_COLLECTION).find({}).toArray(function (err, result) {
                if (err) console.log(err);
                res.send(result);
                client.close();
            });
        }
    });
});

checkArray = [
    check("eventNameEnglish", "Activity name must not be empty. ").notEmpty().trim(),
    check("all").custom(memberParticipationCheck),
    check("amaki").custom(memberParticipationCheck),
    check("umino").custom(memberParticipationCheck),
    check("kawase").custom(memberParticipationCheck),
    check("kuraoka").custom(memberParticipationCheck),
    check("saijo").custom(memberParticipationCheck),
    check("shirosawa").custom(memberParticipationCheck),
    check("suzuhana").custom(memberParticipationCheck),
    check("takatsuji").custom(memberParticipationCheck),
    check("takeda").custom(memberParticipationCheck),
    check("hokaze").custom(memberParticipationCheck),
    check("miyase").custom(memberParticipationCheck),
    check("hanakawa").custom(memberParticipationCheck),
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
        for (let i = 0; i < req.body.numRelatedLinks; i++) {
            let attribute = "eventLink" + i;
            if (!(req.body[attribute] === undefined || validator.isEmpty(req.body[attribute]) || validator.isURL(req.body[attribute]))) {
                return false;
            }
        }
        return true;
    }).toInt(),
    check("eventTweetLink").optional({checkFalsy: true}).isURL()];

function sanitizeData(req) {
    let newActivity = {
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

    newActivity["activityName"] = req.body.eventNameEnglish;
    newActivity["activityNameJpn"] = validator.trim(req.body.eventNameJapanese);

    if (req.body.all !== undefined) {
        newActivity["participants"].push("all");
    }

    let idNames = ["amaki", "umino", "kawase", "kuraoka", "saijo", "shirosawa", "suzuhana", "takatsuji",
        "takeda", "hokaze", "miyase", "hanakawa"];

    for (let name of idNames) {
        if (req.body[name] !== undefined) {
            newActivity["participants"].push(name);
        }
    }

    // user input date is in JST, must convert it to UTC to store
    let startTimeString;
    if (req.body.isFullDayEvent !== undefined) {
        // if full day event, then the field is converted to UTC, need to get the JST string
        startTimeString = moment(req.body.eventStartTime).tz('UTC').format("YYYY-MM-DD[T]HH:mm:00");
    } else {
        startTimeString = moment(req.body.eventStartTime).format("YYYY-MM-DD[T]HH:mm:00");
    }

    let eventStartJST = moment.tz(startTimeString, "Asia/Tokyo");
    newActivity["startDate"] = eventStartJST.clone().tz("UTC").format();

    if (req.body.isFullDayEvent !== undefined) {
        newActivity["isFullDay"] = true;
    }

    if (req.body.isEndTimeUnknown !== undefined) {
        newActivity["isEndTimeUnknown"] = true;
        newActivity["endDate"] = "";
    } else {
        let endTime = validator.toDate(req.body.eventEndTime);

        let endTimeString
        if (req.body.isFullDayEvent !== undefined) {
            // if full day event, then the field is in UTC
            endTimeString = moment(endTime).tz('UTC').format("YYYY-MM-DD[T]HH:mm:00");
        } else {
            endTimeString = moment(endTime).format("YYYY-MM-DD[T]HH:mm:00");
        }
        let eventEndJST = moment.tz(endTimeString, "Asia/Tokyo");
        newActivity["endDate"] = eventEndJST.clone().tz("UTC").format();
    }

    for (let i = 0; i < req.body.numRelatedLinks; i++) {
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

    return newActivity;
}

router.post('/addActivity', checkArray, authMiddleware.ifAuth, function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // must redirect with session data that says there are errors
        console.log(errors);
        req.session.ifAddError = true;
        res.redirect("/add");
    } else {
        // Need to sanitize data
        let newActivity = sanitizeData(req);

        mongoClient.connect(process.env.MONGODB_URI, {useUnifiedTopology: true}, function (err, client) {
            if (err) {
                req.session.ifUnexpectedError = true;
                res.redirect("/add");
            } else {
                const db = client.db(process.env.DATABASE_NAME);
                db.collection(process.env.DATABASE_COLLECTION).insertOne(newActivity, function (err) {
                    if (err) {
                        req.session.ifUnexpectedError = true;
                        res.redirect("/add");
                    }
                    client.close();

                    // send a discord message if it is a showroom stream
                    if (req.body.isShowroomStream) {
                        const botSpamChannel = discordClient.channels.cache.get("336287198510841856");

                        const stream_links = {
                            hokaze: ['Hokaze Chiharu', 'https://www.showroom-live.com/digital_idol_2', "RED"],
                            umino: ['Umino Ruri', 'https://www.showroom-live.com/digital_idol_4', "GREEN"],
                            hanakawa: ['Hanakawa Mei', 'https://www.showroom-live.com/digital_idol_7', "BLUE"],
                            kawase: ['Kawase Uta', 'https://www.showroom-live.com/kawaseuta', "BLUE"],
                            miyase: ['Miyase Reina', 'https://www.showroom-live.com/digital_idol_9', "DARK_VIVID_PINK"],
                            amaki: ['Amaki Sally', 'https://www.showroom-live.com/digital_idol_11', "GOLD"],
                            takeda: ['Takeda Aina', 'https://www.showroom-live.com/digital_idol_15', "AQUA"],
                            shirosawa: ['Shirosawa Kanae', 'https://www.showroom-live.com/digital_idol_18', "PURPLE"],
                            takatsuji: ['Takatsuji Urara', 'https://www.showroom-live.com/digital_idol_19', [230, 136, 242]],
                            suzuhana: ['Suzuhana Moe', 'https://www.showroom-live.com/digital_idol_20', "LUMINOUS_VIVID_PINK"],
                            kuraoka: ['Kuraoka Mizuha', 'https://www.showroom-live.com/digital_idol_21', "ORANGE"],
                            saijo: ['Saijo Nagomi', 'https://www.showroom-live.com/digital_idol_22', "DARK_GREY"],
                            all: ['Group Stream', 'https://www.showroom-live.com/nanabunno', "BLUE"]
                        }

                        // get person, name, link
                        const streamer_key = newActivity["participants"][0];
                        const name = stream_links[streamer_key][0];
                        const link = stream_links[streamer_key][1];
                        const color = stream_links[streamer_key][2];

                        // get time
                        let startTimeString;
                        if (req.body.isFullDayEvent !== undefined) {
                            // if full day event, then the field is converted to UTC, need to get the JST string
                            startTimeString = moment(req.body.eventStartTime).tz('UTC').format("YYYY-MM-DD[T]HH:mm:00");
                        } else {
                            startTimeString = moment(req.body.eventStartTime).format("YYYY-MM-DD[T]HH:mm:00");
                        }

                        const eventStartJST = moment.tz(startTimeString, "Asia/Tokyo");

                        // convert time
                        const jstTime = eventStartJST.format("YYYY-MM-DD LT");
                        const utcTime = eventStartJST.tz('UTC').format("YYYY-MM-DD LT");
                        const pstTime = eventStartJST.tz("America/Los_Angeles").format("YYYY-MM-DD LT");
                        const ctTime = eventStartJST.tz("America/Chicago").format("YYYY-MM-DD LT");
                        const etTime = eventStartJST.tz("America/New_York").format("YYYY-MM-DD LT");

                        // get image
                        const headers = {
                            'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.62 Safari/537.36",
                            'Referer': "https://www.showroom-live.com"
                        }

                        axios.get(link, {headers})
                            .then(response => {
                                const $ = cheerio.load(response.data)
                                const imageUrl = $('meta[property="og:image"]').attr("content")

                                // make embed
                                const newEmbed = new Discord.MessageEmbed()
                                    .setColor(color)
                                    .setTitle(`**${name}**`)
                                    .setDescription(link)
                                    .addFields(
                                        {name: 'Japan Time', value: jstTime},
                                        {name: 'Universal Time', value: utcTime},
                                        {name: 'Eastern Time', value: etTime},
                                        {name: 'Central Time', value: ctTime},
                                        {name: 'Pacific Time', value: pstTime}
                                    )
                                    .setAuthor('Upcoming Stream', 'https://www.showroom-live.com/assets/img/v3/apple-touch-icon.png')
                                    .setFooter('Sent by A.K.A.N.E. (This is a test)')
                                    .setImage(imageUrl)

                                // send
                                botSpamChannel.send(newEmbed);
                            })
                    }

                    req.session.opSuccess = true;
                    res.redirect("/");
                })
            }
        })
    }
});

router.post('/editActivity', checkArray, authMiddleware.ifAuth, function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // must take user back and display an error
        req.session.ifEditError = true;
        res.redirect("/edit?id" + req.query.id);
    } else {
        // Need to sanitize data
        const newActivity = sanitizeData(req);

        mongoClient.connect(process.env.MONGODB_URI, {useUnifiedTopology: true}, function (err, client) {
            if (err) {
                req.session.ifUnexpectedError = true;
                res.redirect("/edit?id" + req.query.id);
            } else {
                const db = client.db(process.env.DATABASE_NAME);
                db.collection(process.env.DATABASE_COLLECTION).replaceOne({_id: ObjectId(req.query.id)}, newActivity, function (err) {
                    if (err) {
                        req.session.ifUnexpectedError = true;
                        res.redirect("/edit?id" + req.query.id);
                    }
                    client.close();
                    req.session.opSuccess = true;
                    res.redirect("/");
                });
            }
        });
    }
});

router.get('/delete', authMiddleware.ifAuth, function (req, res) {
    mongoClient.connect(process.env.MONGODB_URI, {useUnifiedTopology: true}, function (err, client) {
        if (err) {
            res.render("error");
        } else {
            const db = client.db(process.env.DATABASE_NAME);
            db.collection(process.env.DATABASE_COLLECTION).deleteOne({_id: ObjectId(req.query.id)}, function (err, result) {
                if (err) {
                    res.render("error");
                } else {
                    client.close();
                    req.session.opSuccess = true;
                    res.redirect("/");
                }
            });
        }
    });
});

module.exports = router;