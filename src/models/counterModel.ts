import { Schema, model, Document } from "mongoose"

interface ICounter extends Document {
  id: string; 
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  id: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 }
})

export const CounterModel = model<ICounter>("counters", counterSchema)