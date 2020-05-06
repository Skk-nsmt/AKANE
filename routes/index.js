const express = require('express');
const router = express.Router();

const mongoClient = require('mongodb').MongoClient;
const dotenv = require('dotenv');
dotenv.config();

const Discord = require('discord.js');

const discordClient = new Discord.Client();
discordClient.login(process.env.DISCORD_TOKEN);

/* GET home page. */
router.get('/', function (req, res) {
    let ifOpSuccess = req.session.opSuccess;
    req.session.opSuccess = null;

    mongoClient.connect(process.env.MONGODB_URI, {useUnifiedTopology: true}, function (err, client) {
        if (err) {
            res.render("error");
        } else {
            const db = client.db(process.env.DATABASE_NAME);
            db.collection(process.env.DATABASE_COLLECTION).find({}).toArray(function (err, result) {
                if (err) {
                    res.render("error");
                }

                result = result.sort((a, b) => new Date(b["startDate"]) - new Date(a["startDate"]))

                // check discord privilege here
                let isDiscordPrivileged = false;
                if (req.isAuthenticated()) {
                    // check via discord bot if the user is:
                    // 1. in the server
                    // 2. has the admin role
                    const discordID = req.session.passport.user.id;
                    const nananijiGuild = discordClient.guilds.cache.get("336277820684763148");

                    const guildMember = nananijiGuild.member(discordID);
                    if (guildMember) {
                        const roles = guildMember.roles.cache;

                        if (roles.has("336284663142416391") || roles.has("663571000088068143")) {
                            isDiscordPrivileged = true;
                        }
                    }
                }

                res.render('index', {
                        activities: result,
                        addSuccess: ifOpSuccess,
                        authSuccess: req.query.authSuccess,
                        authFailed: req.query.authFailed,
                        permission: req.query.permission,
                        discordPrivilege: isDiscordPrivileged,
                        userInfo: (req.session.passport ? req.session.passport.user : null),
                        subscribed: (req.session.subscribed ? req.session.subscribed : [])
                    }
                );

                client.close();
            });
        }
    });
});

module.exports = router;
