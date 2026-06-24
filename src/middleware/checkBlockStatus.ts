import storeModel from "../models/storeModel";

export const checkBlockStatus = async (req: any, res: any, next: any) => {
  const store = await storeModel.findOne({ vendorId: req.user._id });
  if (store && !store.isActive) {
    return res.status(403).json({ message: "Your store has been blocked by Admin." });
  }
  next();
};