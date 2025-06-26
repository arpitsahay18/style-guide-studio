
// Utility function to convert image URLs to base64
export const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    // If it's already base64, return as is
    if (imageUrl.startsWith('data:image/')) {
      return imageUrl;
    }
    
    // Fetch the image and convert to base64
    const response = await fetch(imageUrl, { mode: 'cors' });
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return imageUrl; // Fallback to original URL
  }
};

// CSS for better PDF page breaks
export const pdfStyles = `
  .pdf-page-break {
    page-break-before: always;
    break-before: page;
  }
  
  .pdf-no-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  .pdf-section {
    page-break-inside: avoid;
    break-inside: avoid;
    margin-bottom: 2rem;
  }
  
  .pdf-color-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  .pdf-typography-sample {
    page-break-inside: avoid;
    break-inside: avoid;
    margin-bottom: 1rem;
  }
`;
