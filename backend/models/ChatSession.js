const mongoose = require('mongoose');
const { CHAT_STATUS } = require('../constants/statuses');

const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ['PATIENT', 'AI', 'DOCTOR', 'SYSTEM'], required: true },
    text: { type: String, required: true },
    meta: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    channel: { type: String, enum: ['AI', 'DOCTOR'], default: 'AI' },
    assistantName: { type: String, default: 'AyuBot' },
    status: { type: String, enum: Object.values(CHAT_STATUS), default: CHAT_STATUS.OPEN },
    linkedAssessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SymptomHistory', default: null },
    messages: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatSession', chatSessionSchema);
