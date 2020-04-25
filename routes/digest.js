var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    res.render('digest', {
        title: 'A.K.A.N.E.'
    })
})

module.exports = router;
