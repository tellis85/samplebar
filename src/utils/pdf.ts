/**
 * Handles PDF download with browser's native save dialog
 * @param pdfUrl URL of the PDF to download
 * @param suggestedFilename Default filename to suggest in save dialog
 */
export const handlePdfDownload = async (pdfUrl: string, suggestedFilename: string) => {
  try {
    const response = await fetch(pdfUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = suggestedFilename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
};