var express = require('express');
var router = express.Router();

const jsonfile = require('jsonfile')

/* GET home page. */
router.get('/', function (req, res) {
    const activityJsonObj = jsonfile.readFileSync('public/resources/activities.json')
    const actorJsonObj = jsonfile.readFileSync('public/resources/actors.json')

    var ifAddSuccess = req.session.addSuccess
    req.session.addSuccess = null

    res.render('index', {
            title: 'A.K.A.N.E.',
            activities: activityJsonObj,
            actors: actorJsonObj,
            moment: require('moment-timezone'),
            addSuccess: ifAddSuccess
        }
    )
});

module.exports = router;
