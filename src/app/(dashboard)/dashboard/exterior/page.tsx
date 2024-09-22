'use client';

import { useState } from 'react';
import { useUser } from "@clerk/nextjs";

async function uploadProcessedImage(
    imageUrl: string,
    userId: string,
    originalImageId: string
  ) {
    try {
      const response = await fetch('/api/uploadProcessedImage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl, userId, originalImageId }), //userId, 
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

export default function ExteriorTestPage() {
    const [testResult, setTestResult] = useState<string>('Test not started');
    const [error, setError] = useState<string | null>(null);
    const { user, isLoaded } = useUser();

    async function runTest() {
        if (!isLoaded) {
            setError('User data is still loading');
            return;
        }

        if (!user) {
            setError('User not logged in');
            return;
        }

        // const testImageUrl = 'https://utfs.io/f/58Au0cDLsjupzPYObtlxcsRYa0oCAmgGJHnpvrK6bMViBStN';
        const testImageUrl = 'https://replicate.delivery/pbxt/jlwQGZl8MAqXMN3t1EZWd2PGE5qTxwOV8Y1W8fAmsi5sEtvJA/out.png';
        const testOriginalId = 'test-original-id-' + Date.now();

        try {
            setTestResult('Test started...');
            console.log("Starting test with URL:", testImageUrl);
            
            // const result = await uploadProcessedImage(testImageUrl, user.id, testOriginalId);
            const result = await uploadProcessedImage(testImageUrl, '1', '2'); // '2'

            console.log("Test completed. Result:", result);
            setTestResult(`Test completed successfully. Uploaded URL: ${result}`);
        } catch (err) {
            console.error("Test failed:", err);
            setError(err instanceof Error ? err.message : String(err));
            setTestResult('Test failed. Check console for details.');
        }
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Exterior Upload Test Page</h1>
            <button 
                onClick={runTest} 
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
            >
                Run Test
            </button>
            <div className="mb-4">
                <strong>Test Result:</strong> {testResult}
            </div>
            {error && (
                <div className="text-red-500 mb-4">
                    <strong>Error:</strong> {error}
                </div>
            )}
            <div className="mt-4">
                <h2 className="text-xl font-semibold mb-2">Test Details:</h2>
                <p>Click the "Run Test" button to test the uploadProcessedImage function.</p>
                <p>Check the browser console and server logs for more detailed information.</p>
            </div>
        </div>
    );
}