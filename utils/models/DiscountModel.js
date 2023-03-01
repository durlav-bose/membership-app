import mongoose from "mongoose";

const discountSchema = new mongoose.Schema({
  priceRuleId: {
    type: String,
    required: true,
  },
  customerSelection: {
    type: String,
    required: true,
  },
  prerequisiteCustomerSegmentIds: {
    type: Array,
    required: true,
  },
});

const DiscountModel = mongoose.model("discount", discountSchema);

export default DiscountModel;
