const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const logger = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const database = require('./database');
const config = require('./config');
const MongoStore = require('connect-mongo')(session);

const apiRouter = require('./routers/api');
const router = require('./routers/router');

const app = express();
const server = require('http').createServer(app);  
const io = require('socket.io')(server);
// const fs = require('fs')

io.on('connection', (socket) => {
  socket.on('ROOM:JOIN', () => {
    console.log('Boo!')
    socket.to('roomId').broadcast.emit('ROOM:SET_USERS', 'users');
  });
});

//middleware for bodyparser, cookie, session
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(
  session({
    secret: config.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({
      mongooseConnection: mongoose.connection
    })
  })
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api', apiRouter);
app.use(express.static(path.join(__dirname, '../front/public')));
app.use(router);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.send(`<p1>Error</p1>,<p>${err.message}</p>`);
});


database()
  .then(info => {
    console.log(`Connected to ${info.host}:${info.port}/${info.name}`);
  })
  .catch(() => {
    console.error('Unable to connect to database');
    process.exit(1);
  });

module.exports = app;