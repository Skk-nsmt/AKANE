const express = require('express');
const router = express.Router();

const mongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const dotenv = require('dotenv');
dotenv.config();

const authMiddleware = require('./authMiddleware');

router.get('/', authMiddleware.ifAuth, function (req, res) {
    const ifErrorFromValidation = req.session.ifEditError;
    const ifErrorUnexpected = req.session.ifUnexpectedError;
    req.session.ifEditError = null;
    req.session.ifUnexpectedError = null;

    mongoClient.connect(process.env.MONGODB_URI, function (err, client) {
        if (err) {
            res.render("error");
        } else {
            const db = client.db(process.env.DATABASE_NAME);
            db.collection(process.env.DATABASE_COLLECTION).find({_id: ObjectId(req.query.id)}).toArray(function (err, result) {
                if (err || result.length === 0) {
                    res.render("error");
                } else {
                    res.render('editor', {
                        mode: "edit",
                        itemToEdit: result[0],
                        ifError: ifErrorFromValidation,
                        ifErrorUnexpected: ifErrorUnexpected,
                        userInfo: (req.session.passport ? req.session.passport.user : null)
                    });
                }
            });
        }
    });
});

module.exports = router;