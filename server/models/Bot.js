import mongoose from 'mongoose';

const botSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['telegram', 'whatsapp'], required: true },
    name: { type: String, required: true },
    telegramToken: { type: String },
    whatsappSession: { type: Object },
    status: { type: String, enum: ['online', 'offline', 'error'], default: 'offline' },
    lastError: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model('Bot', botSchema);
