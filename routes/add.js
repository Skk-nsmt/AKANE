var express = require('express');
var router = express.Router();

const jsonfile = require('jsonfile')

router.get('/', function (req, res) {
    const actorJsonObj = jsonfile.readFileSync('public/resources/actors.json')

    let ifErrorFromValidation = req.session.ifAddError
    let ifErrorUnexpected = req.session.ifUnexpectedError
    req.session.ifAddError = null;
    req.session.ifUnexpectedError = null;

    res.render('editor', {
        title: 'A.K.A.N.E.',
        mode: "add",
        actors: actorJsonObj,
        ifError: ifErrorFromValidation,
        ifErrorUnexpected: ifErrorUnexpected
    })
});

module.exports = router;
