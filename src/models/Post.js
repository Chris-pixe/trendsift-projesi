import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: ["reddit", "eksi"],
  },
  postId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
  },
  content: {
    type: String,
  },
  author: {
    type: String,
  },
  score: {
    type: Number,
  },
  sentiment_score: {
    type: Number,
  },
  url: {
    type: String,
    required: true,
  },
  searchKeyword: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Veritabanında aynı post'un aynı arama kelimesi için tekrar tekrar kaydedilmesini engellemek için birleşik bir index oluşturuyoruz.
PostSchema.index({ postId: 1, searchKeyword: 1 }, { unique: true });

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
