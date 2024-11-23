import { Label, FilterState } from '@/types';

export function getUniqueValues(data: Label[], key: keyof Label): string[] {
  const values = [...new Set(data.map(item => item[key]))];
  return values.filter(Boolean).sort();
}

export function filterLabels(
  labels: Label[],
  filters: FilterState,
  searchTerm: string
): Label[] {
  return labels.filter(label => {
    // Search term filter
    const matchesSearch = !searchTerm || 
      Object.values(label).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Brand filter
    const matchesBrand = !filters.brand || label.Brand === filters.brand;

    // Collection filter
    const matchesCollection = !filters.collection || label.Collection === filters.collection;

    // Product Series filter
    const matchesProductSeries = !filters.productSeries || label["Product Series"] === filters.productSeries;

    // Finish filter
    const matchesFinish = !filters.finish || label.Finish === filters.finish;

    return matchesSearch && matchesBrand && matchesCollection && matchesProductSeries && matchesFinish;
  });
}