import { LabelManagementSystem } from '@/components/LabelManagementSystem';
import path from 'path';
import fs from 'fs';
import Papa from 'papaparse';
import { Label } from '@/types';

async function getLabelData() {
  const csvPath = path.join(process.cwd(), 'data', 'prepoptest.csv');
  const csvFile = fs.readFileSync(csvPath, 'utf-8');
  
  const { data } = Papa.parse(csvFile, {
    header: true,
    skipEmptyLines: true
  });

  return data as Label[];
}

export default async function Home() {
  const labelData = await getLabelData();

  return (
    <main>
      <LabelManagementSystem initialData={labelData} />
    </main>
  );
}