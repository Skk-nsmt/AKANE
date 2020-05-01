const express = require('express');
const router = express.Router();

const authMiddleware = require('./authMiddleware');

router.get('/', authMiddleware.ifAuth, function (req, res) {
    let ifErrorFromValidation = req.session.ifAddError;
    let ifErrorUnexpected = req.session.ifUnexpectedError;
    req.session.ifAddError = null;
    req.session.ifUnexpectedError = null;

    res.render('editor', {
        mode: "add",
        ifError: ifErrorFromValidation,
        ifErrorUnexpected: ifErrorUnexpected,
        userInfo: (req.session.passport ? req.session.passport.user : null)
    });
});

module.exports = router;
