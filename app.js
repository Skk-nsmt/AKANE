const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const helmet = require('helmet');
const passport = require('passport');
const jsonfile = require('jsonfile')

const expressSanitizer = require('express-sanitizer');

const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api/apis');
const addRouter = require('./routes/add');
const editRouter = require('./routes/edit');
const discordAuthRouter = require('./routes/discord-auth');
const archiveRouter = require('./routes/archive')

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('trust proxy', 1)

app.use(helmet());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(expressSanitizer());
app.use(session({saveUninitialized: false, resave: false, secret: process.env.SESSION_SECRET}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/node_modules'));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/', discordAuthRouter);
app.use('/api', apiRouter);
app.use('/add', addRouter);
app.use('/edit', editRouter);
app.use('/archive', archiveRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

const actorJsonObj = jsonfile.readFileSync('public/resources/actors.json')

app.locals = {
    title: "A.K.A.N.E.",
    version: "0.5.0-alpha",
    moment: require('moment-timezone'),
    actors: actorJsonObj
}

module.exports = app;