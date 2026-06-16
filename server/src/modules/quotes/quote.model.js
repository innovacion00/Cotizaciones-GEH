import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    city: String,
    hotelId: String,
    hotelName: String,
    roomId: String,
    roomName: String,
    checkin: String,
    checkout: String,
    nights: Number,
    adults: Number,
    childrenAges: [Number],
    boardTypeDescription: String,
    refundable: String,
    cancellationPolicy: String,
    currency: String,
    trm: Number,
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    subtotal: { type: Number, required: true },
    booking: { type: bookingSchema, default: undefined },
  },
  { _id: true }
);

const totalsSchema = new mongoose.Schema(
  {
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const quoteSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    client: {
      name: { type: String, required: true },
      email: { type: String },
      phone: { type: String },
      company: { type: String },
    },
    publicToken: { type: String, unique: true, sparse: true, index: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'],
      default: 'draft',
    },
    items: [itemSchema],
    totals: { type: totalsSchema, default: () => ({}) },
    taxRate: { type: Number, default: 0.16 },
    notes: { type: String, default: '' },
    expiresAt: { type: Date },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

quoteSchema.index({ workspace: 1, status: 1 });
quoteSchema.index({ owner: 1 });

const Quote = mongoose.model('Quote', quoteSchema);
export default Quote;
