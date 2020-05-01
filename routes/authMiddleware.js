const Discord = require('discord.js');
const discordClient = new Discord.Client();

discordClient.login(process.env.DISCORD_TOKEN);

const auth = function (req, res, next) {
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
                return next();
            }
        }
    }
    res.redirect("/?permission=false");
};

module.exports = {
    ifAuth: auth
};