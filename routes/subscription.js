const express = require('express');
const router = express.Router();

const webpush = require('web-push');
const schedule = require('node-schedule');

const moment = require('moment')

const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

webpush.setVapidDetails('mailto:example@akane-web.herokuapp.com', publicVapidKey, privateVapidKey);

router.post('/test', function (req, res) {
    const subscription = JSON.parse(req.body.subscription);
    res.status(201).json({});
    const payload = JSON.stringify({title: 'test'});

    console.log(subscription);

    webpush.sendNotification(subscription, payload).catch(error => {
        console.error(error.stack);
    });
})

router.post('/subscribe', function (req, res) {
    const payload = JSON.stringify({title: req.body.title});

    // schedule a push
    // obtain the push object
    // save the object with the event id to session
    const eventTime = moment(req.body.time)
    const notifyTimeString = eventTime.subtract(5, 'm').toISOString()

    const date = new Date(notifyTimeString)

    let job = schedule.scheduleJob(req.body.id, date, function () {
        webpush.sendNotification(JSON.parse(req.body.subscription), payload).catch(error => {
            console.error(error.stack);
        });
    })

    // add the id to session
    if (req.session.subscribed) {
        req.session.subscribed.push(req.body.id)
    } else {
        req.session.subscribed = [];
        req.session.subscribed.push(req.body.id)
    }
    res.status(201).json({});
})

router.post('/unsubscribe', function (req, res) {
    // delete the id from session
    if (req.session.subscribed) {
        let job = schedule.scheduledJobs[req.body.id];
        job.cancel();
        let index = req.session.subscribed.indexOf(req.body.id);
        if (index !== -1) req.session.subscribed.splice(index, 1);
    }

    res.status(201).json({});
})

module.exports = router;