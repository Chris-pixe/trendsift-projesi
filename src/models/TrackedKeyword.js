import mongoose from "mongoose";

const TrackedKeywordSchema = new mongoose.Schema({
  keyword: {
    type: String,
    required: [true, "Anahtar kelime gereklidir."],
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Bu alanın User modeline bir referans olduğunu belirtiyoruz.
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Bir kullanıcının aynı kelimeyi tekrar eklemesini engelliyoruz.
TrackedKeywordSchema.index({ userId: 1, keyword: 1 }, { unique: true });

export default mongoose.models.TrackedKeyword ||
  mongoose.model("TrackedKeyword", TrackedKeywordSchema);
