import mongoose, { Document, Schema } from 'mongoose';

interface ITrafficViolation extends Document {
    Date: Date;
    ViolationType: string;
    Description: string;
    FineAmount: boolean;
}

const TrafficViolationSchema: Schema = new Schema({
    Date: { type: Date, required: true },
    ViolationType: { type: String, required: true },
    Description: { type: String, required: true },
    FineAmount: { type: Boolean, required: true }
});

const TrafficViolation = mongoose.model<ITrafficViolation>('TrafficViolation', TrafficViolationSchema);

export { TrafficViolation, ITrafficViolation };
