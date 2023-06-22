const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dialogSchema = new Schema({

  fromUser: {
    type: mongoose.Types.ObjectId,
    ref: 'User'
  },
  toUser: {
    type: mongoose.Types.ObjectId,
    ref: 'User'
  },
});

dialogSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Dialog', dialogSchema, "dialogs");