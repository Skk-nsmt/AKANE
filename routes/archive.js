const express = require('express');
const router = express.Router();

const authMiddleware = require('./authMiddleware');

router.get('/', authMiddleware.ifAuth, function (req, res) {
    res.render("archive", {userInfo: (req.session.passport ? req.session.passport.user : null)});
})

module.exports = router;
