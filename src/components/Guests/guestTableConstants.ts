import { Gender } from '../../types';

// Column indices — shared between GuestList and GuestTableRow
export const COL_NAME = 0;
export const COL_SURNAME = 1;
export const COL_GENDER = 2;
export const COL_AGE = 3;
export const COL_REL = 4;
export const COL_PARTNER = 5;
export const COL_NOTES = 6;
export const NUM_DATA_COLS = 7;

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'M', female: 'F', other: 'O', unspecified: '—',
};
