export const LABEL_SPECS = {
  labelsPerRow: 4, // Number of labels per row
  labelsPerSheet: 8, // Total labels per sheet
  labelWidth: 2, // Label width in inches
  labelHeight: 3, // Label height in inches
  pageWidth: 11, // Width of the page
  pageHeight: 8.5, // Height of the page
  horizontalGap: 0.35, // Gap between columns
  verticalGap: 0.8, // Gap between rows

  // Dynamic margins
  get leftMargin() {
    const totalLabelWidth =
      this.labelsPerRow * this.labelWidth +
      (this.labelsPerRow - 1) * this.horizontalGap;
    return (this.pageWidth - totalLabelWidth) / 2; // Center horizontally
  },
  get topMargin() {
    const totalLabelHeight =
      (this.labelsPerSheet / this.labelsPerRow) * this.labelHeight +
      (this.labelsPerSheet / this.labelsPerRow - 1) * this.verticalGap;
    return (this.pageHeight - totalLabelHeight) / 2; // Center vertically
  },
};
