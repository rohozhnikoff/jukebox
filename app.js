var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
var server = http.createServer(app).listen(3000);
var io = require('socket.io').listen(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

// Chat logic

var usernames = {};
var numUsers = 0;

io.on('connection', function (socket) {
    // when the client emits 'new message' this listens and executes
    socket.on('new message', function (data) {
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        }) ;
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (username) {
        // we store user in socket session
        socket.username = username;

        usernames[username] = username;
        numUsers = numUsers + 1;
        console.log('usernames', usernames);
        console.log('numUsers', numUsers);

//        socket.emit('login', {
//            numUsers: numUsers
//        });

        // echo globally that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    // when user disconnects
    socket.on('disconnect', function () {
        delete usernames[socket.username];
        --numUsers;

        socket.broadcast.emit('user left', {
            username: socket.username,
            numUsers: numUsers
        });
    });
});


module.exports = app;