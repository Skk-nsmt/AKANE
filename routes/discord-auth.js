const express = require('express');
const router = express.Router();

const dotenv = require('dotenv');
dotenv.config();

const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;

passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

passport.use(new DiscordStrategy({
        clientID: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        callbackURL: process.env.DISCORD_CALLBACK_URL,
        scope: ['identify', 'guilds']
    },
    function (accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            return done(null, profile);
        });
    }));

router.get('/auth/discord', passport.authenticate('discord'));

router.get('/auth/discord/callback', passport.authenticate('discord', {failureRedirect: '/?authFailed=true'}), function (req, res, next) {
    res.redirect("/?authSuccess=true");
});

router.get('/auth/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

module.exports = router;