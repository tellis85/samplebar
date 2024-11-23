export interface Label {
  "File Name": string;
  "Product Series": string;
  "Color Name": string;
  "Color Number": string;
  Brand: string;
  Collection: string;
  Finish: string;
}

export interface LabelCalibration {
  offsetX: number;
  offsetY: number;
  spacingX: number;
  spacingY: number;
}

export interface FilterState {
  brand: string | null;
  collection: string | null;
  productSeries: string | null;
  colorName: string | null;
  colorNumber: string | null;
  finish: string | null;
}