import { Types } from 'mongoose';

export type PopulatedOrId =
  | Types.ObjectId
  | string
  | { _id?: Types.ObjectId | string; toString?: () => string }
  | null
  | undefined;

export function extractIdString(field: PopulatedOrId): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && '_id' in field && field._id) {
    return field._id.toString();
  }
  if (typeof field.toString === 'function') {
    return field.toString();
  }
  return String(field);
}
