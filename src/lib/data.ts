import path from 'path';
import fs from 'fs';
import Papa from 'papaparse';
import { Label } from '@/types';

export async function loadLabelData(): Promise<Label[]> {
  try {
    // Read the CSV file
    const csvPath = path.join(process.cwd(), 'data', 'prepoptest.csv');
    const csvFile = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV data
    const { data } = Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true
    });

    return data as Label[];
  } catch (error) {
    console.error('Error loading label data:', error);
    return [];
  }
}

export function getPdfUrl(filename: string): string {
  return `/labels/pdfs/${filename}`;
}