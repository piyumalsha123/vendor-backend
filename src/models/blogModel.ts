import mongoose, { Document, Schema } from "mongoose"

export interface IBlog extends Document {
  title: string
  content: string
  author: mongoose.Types.ObjectId
  imageURL?: string
  createdAt?: Date
  updateAt?: Date
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "user_details"
    },
    imageURL: { type: String }
  },
  { timestamps: true }
)

export const BlogModel = mongoose.model<IBlog>("blogs", BlogSchema)
