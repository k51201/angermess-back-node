const User = require('./models/user');
const bcrypt = require('bcryptjs');
const mailer = require('./nodemailer');
const Dialog = require('./models/dialog-schema');

/**
 * @param {string} username - имя пользователя
 * @param {string} email - email
 * @param {string} password - пароль
 */
function authentication(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    res.json({
      Success: false,
      error: 'Все поля должны быть заполнены!',
    });
  } else {
    User.findOne({
      email
    })
      .then(user => {
        if (!user) {
          res.json({
            Success: false,
            error: 'Логин и пароль неверны!'
          });
        } else {
          bcrypt.compare(password, user.password, function (err, result) {
            if (!result) {
              res.json({
                Success: false,
                error: 'Логин и пароль неверны!'
              });
            } else {
              req.session.userId = user.id;
              req.session.useremail = user.email;
              console.log(req.session);
              res.json({
                Success: true
              });
            }
          });
        }
      })
      .catch(err => {
        console.log(err);
        res.json({
          Success: false,
          error: 'Ошибка, попробуйте позже!'
        });
      });
  }
};

function registration(req, res) {
  const { username, email, password, repeatpassword } = req.body;
  console.log(req.body);
  if (!username || !email || !password || !repeatpassword) {
    res.json({
      Success: false,
      error: 'Все поля должны быть заполнены!'
    });
  } else {
    User.findOne({
      email
    }).then(user => {
      if (!user) {
        bcrypt.hash(password, 8, function (err, hash) {
          User.create({
            username,
            email,
            password: hash
          })
            .then(user => {
              console.log(user);
              const message = {
                to: req.body.email,
                subject: 'Подтверждение регистрации на сайте angermess',
                text: `
                Здравствуте, ${req.body.username}
                Спасибо за то, что выбрали наш мессенджер!`
              }
              mailer(message);
              res.json({
                Success: true,
              });
            })
            .catch(err => {
              console.log(err);
              res.json({
                Success: false,
                error: 'Ошибка, попробуйте позже!'
              });
            });
        });

      } else {
        res.json({
          Success: false,
          error: 'Имя занято!',
        });
      }
    });
  };
}

function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.clearCookie('connect.sid', { path: '/' });
    res.redirect('/authpage');
  });
}

function getCurrentUserData(req, res) {
  req.session.reload((err) => {
    const userId = req.session.userId;
    User.findById(userId).exec((err, user) => {
      if (!err && user) {
        res.json({ email: user.email, username: user.username });
      } else {
        console.log(err);
        res.status(404).end();
      }
    })
  });
}

function getUserDialogs(req, res) {
  req.session.reload((err) => {
    const currentUserId = req.session.userId;
    const convertDialog = ({ _id, fromUser, toUser }) => {
      const user = fromUser.id === currentUserId ? toUser : fromUser;
      return {
        id: _id,
        user: convertUser(user)
      }
    };

    Dialog.find({}).or([{ fromUser: currentUserId }, { toUser: currentUserId }])
      .populate('fromUser')
      .populate('toUser')
      .then((dialogs) => {
        if (req.query.search) {
          const result = dialogs.map(convertDialog)
            .filter((dialog) => dialog.user.username.indexOf(req.query.search) > -1);
          return res.json(result);
        } else {
          return res.json(dialogs.map(convertDialog))
        }
      });
  })
}

const convertUser = (user) => {
  return {
    id: user._id,
    username: user.username,
    email: user.email
  }
}

function searchUsers(req, res) {
  if (req.query.search) {
    User.find({ username: new RegExp(req.query.search, "i") })
      .then((users) => res.json(users.map(convertUser)));
  } else {
    User.find({})
      .then((users) => res.json(users.map(convertUser)));
  }
}

function createDialog(req, res) {
  if (req.query.userId) {
    req.session.reload((err) => {
      const currentUserId = req.session.userId;
      const dialog = {
        fromUser: currentUserId,
        toUser: req.query.userId
      }
      Dialog.findOneAndUpdate(dialog, dialog, { upsert: true, fields: ['_id'] })
        .then(dialog => res.json(dialog))
    })
  } else {
    res.status(400).end();
  }
}

const getDialog = (req, res) => {
  const dialogId = req.params.id;
  req.session.reload((err) => {
    const currentUserId = req.session.userId;
    const convertDialog = ({ id, fromUser, toUser }) => {
      const user = fromUser.id === currentUserId ? toUser : fromUser;
      return {
        id: id,
        user: convertUser(user)
      }
    };

    Dialog.findById(dialogId)
      .populate('fromUser')
      .populate('toUser')
      .exec((err, dialog) => {
        if (!err && dialog) {
          res.json(convertDialog(dialog));
        } else {
          console.log(err);
          res.status(404).end();
        }
      })
  });
}

module.exports = {
  authentication,
  registration,
  logout,
  getCurrentUserData,
  searchUsers,
  createDialog,
  getUserDialogs,
  getDialog
}
