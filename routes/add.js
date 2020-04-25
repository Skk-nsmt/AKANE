var express = require('express');
var router = express.Router();

const jsonfile = require('jsonfile')

router.get('/', function (req, res) {
    const actorJsonObj = jsonfile.readFileSync('public/resources/actors.json')

    var ifErrorFromValidation = req.session.ifAddError
    var ifErrorUnexpected = req.session.ifUnexpectedError
    req.session.ifAddError = null;
    req.session.ifUnexpectedError = null;

    res.render('add', {
        title: 'A.K.A.N.E.',
        actors: actorJsonObj,
        ifError: ifErrorFromValidation,
        ifErrorUnexpected: ifErrorUnexpected
    })
});

module.exports = router;
