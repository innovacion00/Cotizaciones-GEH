import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'manager', 'sales'], default: 'sales' },
  },
  { _id: false }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [memberSchema],
    settings: {
      currency: { type: String, default: 'MXN' },
      locale: { type: String, default: 'es-MX' },
      branding: {
        logo: String,
        primaryColor: { type: String, default: '#2563eb' },
        companyName: String,
      },
    },
  },
  { timestamps: true }
);

workspaceSchema.index({ owner: 1 });

const Workspace = mongoose.model('Workspace', workspaceSchema);
export default Workspace;
