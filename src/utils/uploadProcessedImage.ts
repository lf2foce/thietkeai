export async function uploadProcessedImage(
    imageUrl: string,
    // userId: string,
    originalImageId: string
  ) {
    try {
      const response = await fetch('/api/uploadProcessedImage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl,  originalImageId }),//userId,
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || `Failed to upload processed image: ${response.status} ${response.statusText}`);
      }
  
      console.log('Processed image uploaded successfully:', data.url);
      return data.url;
    } catch (error) {
      console.error('Error uploading processed image:', error);
      throw error;
    }
  }