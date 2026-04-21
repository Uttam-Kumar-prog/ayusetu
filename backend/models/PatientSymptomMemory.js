const mongoose = require('mongoose');

const symptomEntrySchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ['CHAT', 'UPLOAD', 'ASSESSMENT'],
      default: 'CHAT',
    },
    assistantName: { type: String, default: 'AyuBot' },
    rawText: { type: String, default: '' },
    symptoms: [
      {
        name: { type: String, required: true },
        severity: { type: Number, min: 1, max: 3, default: 1 },
        confidence: { type: Number, min: 0, max: 1, default: 0.6 },
      },
    ],
    medications: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const patientSymptomMemorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    topSymptoms: { type: [String], default: [] },
    likelyCauses: { type: [String], default: [] },
    lastAssistantName: { type: String, default: 'AyuBot' },
    entries: { type: [symptomEntrySchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PatientSymptomMemory', patientSymptomMemorySchema);

