var service = require('../service');
var express = require('express');
var router = express.Router();

router.post('/auth', service.authentication);
router.post('/reg', service.registration);
router.get('/logout', service.logout);

router.get('/currentuser', service.getCurrentUserData);
router.get('/users', service.searchUsers);

router.post('/dialogs', service.createDialog);
router.get('/dialogs', service.getUserDialogs);
router.get('/dialogs/:id', service.getDialog);

module.exports = router;