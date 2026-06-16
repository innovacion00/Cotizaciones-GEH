import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  { name: String, priceDelta: { type: Number, default: 0 } },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    externalId: { type: String, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    sku: { type: String, trim: true },
    basePrice: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'pza' },
    variants: [variantSchema],
    stock: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    source: { type: String, enum: ['manual', 'autocore'], default: 'manual' },
    rawData: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

productSchema.index({ workspace: 1, active: 1 });
productSchema.index({ workspace: 1, externalId: 1 }, { unique: true, sparse: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
