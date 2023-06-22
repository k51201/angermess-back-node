const mongoose = require('mongoose');

const messageSchema = new Schema({
    dialog: {
      type: mongoose.Types.ObjectId,
      ref: "Dialog",
      require: true
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      require: true
    },
    text: {
      type: String,
      require: Boolean
    },
    sendDate: Date,
  });

schema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Message',  messageSchema, 'messages');