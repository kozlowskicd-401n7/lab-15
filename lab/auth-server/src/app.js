'use strict';

import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './auth/router.js';
import auth from './auth/middleware.js';
import errorHandler from './middleware/error.js';
import notFound from './middleware/404.js';
var secured = require('./middleware/secured.js');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const session = require('express-session');
// Configure Passport to use Auth0
var strategy = new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL:
    process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/callback',
  },
  function (accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  }
);

passport.use(strategy);

// You can use this section to keep a smaller payload
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});
let app = express();

// config express-session
var sess = {
  secret: 'CHANGE THIS SECRET',
  cookie: {},
  resave: false,
  saveUninitialized: true,
};

if (app.get('env') === 'production') {
  sess.cookie.secure = true; // serve secure cookies, requires https
}

app.use(session(sess));
app.set('view engine', 'ejs');

app.use(passport.initialize());
app.use(passport.session());

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());  // => req.body
app.use(express.urlencoded({extended:true})); // req.body => from a form's key value pairs
app.use(cookieParser());

app.use(authRouter);

app.get('/', auth(), (req,res) => {
  res.send('You Got In');
});

// Perform the login, after login Auth0 will redirect to callback
app.get('/login', passport.authenticate('auth0', {
  scope: 'openid email profile',
}), function (req, res) {
  res.redirect('/');
});

// Perform the final stage of authentication and redirect to previously requested URL or '/user'
app.get('/callback', function (req, res, next) {
  passport.authenticate('auth0', function (err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }
    req.logIn(user, function (err) {
      if (err) { return next(err); }
      const returnTo = req.session.returnTo;
      delete req.session.returnTo;
      res.redirect(returnTo || '/user');
    });
  })(req, res, next);
});

// Perform session logout and redirect to homepage
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('http://localhost:8080');
});

/* GET home page. */
app.get('/', function (req, res, next) {
  res.render('index', { title: 'Auth0 Webapp sample Nodejs' });
});

/* GET user profile. */
app.get('/user', secured(), function (req, res, next) {
  const { _raw, _json, ...userProfile } = req.user;
  console.log('userProfile: ', userProfile);
  res.render('user', {
    userProfile: userProfile,
    title: 'Profile page',
  });
});

app.use(notFound);
app.use(errorHandler);

let server = false;

module.exports = {
  start: (port) => {
    if(!server) {
      server = app.listen(port, (err) => {
        if(err) { throw err; }
        console.log('Server running on', port);
      });
    }
    else {
      console.log('Server is already running');
    }
  },

  stop: () => {
    server.close( () => {
      console.log('Server is now off');
    });
  },
};


