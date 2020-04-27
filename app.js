var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session')
var helmet = require('helmet')

const expressSanitizer = require('express-sanitizer');

var indexRouter = require('./routes/index');
var apiRouter = require('./routes/api/apis');
var addRouter = require('./routes/add');
var digestRouter = require('./routes/digest');
var editRouter = require('./routes/edit');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('trust proxy', 1)

app.use(helmet())

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(expressSanitizer());
app.use(session({saveUninitialized: false, resave: true, secret: "There is no secret yet. "}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/node_modules'));

app.use('/', indexRouter);
app.use('/api', apiRouter);
app.use('/add', addRouter);
app.use('/edit', editRouter);
app.use('/digest', digestRouter);

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

module.exports = app;
