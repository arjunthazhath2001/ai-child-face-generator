"use client";

import React, { useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function Home() {
  const { getToken } = useAuth();
  const [fatherFile, setFatherFile] = useState<File | null>(null);
  const [motherFile, setMotherFile] = useState<File | null>(null);
  const [fatherPreview, setFatherPreview] = useState<string | null>(null);
  const [motherPreview, setMotherPreview] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Helper function to get headers with auth token
  const getAuthHeaders = async () => {
    const token = await getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // When father image is selected
  const handleFatherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFatherFile(file);

    if (file) {
      const previewUrl = URL.createObjectURL(file); // creates temporary local preview
      setFatherPreview(previewUrl);
    }
  };

  // When mother image is selected
  const handleMotherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setMotherFile(file);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setMotherPreview(previewUrl);
    }
  };

  // Upload file to S3 using presigned URL
  const uploadToS3 = async (file: File): Promise<string | null> => {
    const headers = await getAuthHeaders();
    const res = await fetch("http://localhost:8000/presigned-url/", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        filename: file.name,
        filetype: file.type,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Failed to get presigned URL");
      return null;
    }

    const upload = await fetch(data.upload_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!upload.ok) {
      console.error("Failed to upload to S3");
      return null;
    }

    return data.file_url;
  };

  const pollForResult = async(fatherId: number, motherId: number) => {
    setIsGenerating(true);
    setProgress(0);
    let attempts = 0;
    const maxAttempts = 20;

    const interval = setInterval(async() => {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `http://localhost:8000/check-image/${fatherId}/${motherId}/`,
        { headers }
      );
      const data = await res.json();
      attempts++;

      setProgress(Math.min((attempts / maxAttempts) * 100, 95));

      if(data.status == "ready") {
        clearInterval(interval);
        setGeneratedImageUrl(data.url);
        setShowModal(true);
        setStatus("Image ready");
        setIsGenerating(false);
        setProgress(100);
      } else {
        console.log("still processing");
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setStatus("Generation took too long. Please try again.");
          setIsGenerating(false);
        }
      }
    }, 5000);
  };

  const handleDownload = async () => {
    if (!generatedImageUrl) return;
    
    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated-child-image.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  // Submit both images
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fatherFile || !motherFile) {
      setStatus("Please select both images before uploading");
      return;
    }

    setStatus("Uploading to S3...");

    const fatherS3Url = await uploadToS3(fatherFile);
    const motherS3Url = await uploadToS3(motherFile);

    if (fatherS3Url && motherS3Url) {
      setStatus("Uploaded to S3 successfully!");
      const headers = await getAuthHeaders();
      
      const momInDB = await fetch("http://localhost:8000/uploadmother/", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          file_url: motherS3Url,
        }),
      });

      const dadInDB = await fetch("http://localhost:8000/uploadfather/", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          file_url: fatherS3Url,
        }),
      });

      const mom = await momInDB.json();
      const dad = await dadInDB.json();
      
      if (mom && dad) {
        const outputInDB = await fetch("http://localhost:8000/generate/", {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            father_id: dad.message,
            mother_id: mom.message
          }),
        });

        pollForResult(dad.message, mom.message);
      }
    } else {
      setStatus("Upload failed.");
    }
  };

  return (
    <main className="bg-gradient-to-b from-purple-100 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 pt-8 pb-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="relative mb-2">
            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 animate-pulse">
              ✨ AI FaceSwap ✨
            </div>
            <span className="absolute -top-2 right-1/4 text-yellow-400 text-2xl">★</span>
          </div>
          <p className="text-xl text-gray-600 font-medium">Face swap any image that you want</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          {/* Upload Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Template Image Upload */}
            <div className="bg-white/80 backdrop-blur-sm border-2 border-purple-200 rounded-3xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4 flex items-center">
                <span className="text-2xl mr-2">🎭</span> Template Image
              </h2>
              <div className={`border-3 border-dashed rounded-2xl p-6 text-center relative overflow-hidden
                ${fatherPreview ? 'border-green-400 bg-green-50/50' : 'border-purple-300 hover:border-blue-400 hover:bg-blue-50/30'}
                transition-all duration-300`}>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-pink-100/20"></div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFatherChange}
                  className="hidden"
                  id="template-upload"
                />
                <label htmlFor="template-upload" className="cursor-pointer block relative z-10">
                  {fatherPreview ? (
                    <img src={fatherPreview} alt="Template Preview" className="mx-auto max-h-48 rounded-xl shadow-lg" />
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto h-16 w-16 text-purple-500 animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <div className="text-purple-700">
                        <span className="text-blue-600 font-bold">Click to upload</span> or drag and drop
                        <p className="text-sm text-purple-500 mt-2">PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Target Image Upload */}
            <div className="bg-white/80 backdrop-blur-sm border-2 border-pink-200 rounded-3xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-blue-600 mb-4 flex items-center">
                <span className="text-2xl mr-2">🎨</span> Target Image
              </h2>
              <div className={`border-3 border-dashed rounded-2xl p-6 text-center relative overflow-hidden
                ${motherPreview ? 'border-green-400 bg-green-50/50' : 'border-pink-300 hover:border-blue-400 hover:bg-blue-50/30'}
                transition-all duration-300`}>
                <div className="absolute inset-0 bg-gradient-to-br from-pink-100/20 to-blue-100/20"></div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMotherChange}
                  className="hidden"
                  id="target-upload"
                />
                <label htmlFor="target-upload" className="cursor-pointer block relative z-10">
                  {motherPreview ? (
                    <img src={motherPreview} alt="Target Preview" className="mx-auto max-h-48 rounded-xl shadow-lg" />
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto h-16 w-16 text-pink-500 animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <div className="text-pink-700">
                        <span className="text-blue-600 font-bold">Click to upload</span> or drag and drop
                        <p className="text-sm text-pink-500 mt-2">PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="text-center pb-4">
            <button
              type="submit"
              disabled={!fatherFile || !motherFile}
              className="relative px-12 py-4 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-white font-bold text-lg transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
            >
              <span className="relative z-10 flex items-center space-x-3">
                <span>✨ Generate Magic ✨</span>
                {status === "Uploading to S3..." && (
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
            </button>
            
            {status && (
              <div className={`mt-6 p-4 rounded-2xl max-w-lg mx-auto backdrop-blur-sm border-2 ${
                status.includes("failed") ? "bg-red-50/50 text-red-700 border-red-200" : 
                status.includes("success") ? "bg-green-50/50 text-green-700 border-green-200" : 
                "bg-blue-50/50 text-blue-700 border-blue-200"
              }`}>
                {status}
              </div>
            )}
          </div>
    </form>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/90 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border-2 border-purple-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                  ✨ Generating Magic ✨
                </h3>
                <p className="text-gray-600">Please wait while we create your image...</p>
              </div>

              {/* Progress Bar Container */}
              <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 animate-shimmer"></div>
                
                {/* Progress Bar */}
                <div 
                  className="relative h-full bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                </div>
              </div>

              {/* Progress Percentage */}
              <div className="text-center mt-4 text-gray-700 font-medium">
                {Math.round(progress)}%
              </div>

              {/* Loading Animation */}
              <div className="flex justify-center mt-6 space-x-1">
                <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-3 h-3 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && generatedImageUrl && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 max-w-3xl w-full shadow-2xl border-2 border-purple-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">✨ Generated Image</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
              >
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="relative">
              <img
                src={generatedImageUrl}
                alt="Generated Image"
                className="w-full rounded-2xl shadow-xl"
              />
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleDownload}
                className="relative px-8 py-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold text-lg transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center space-x-3"
              >
                <span className="relative z-10 flex items-center space-x-3">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>✨ Download Image ✨</span>
                </span>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-blue-500 blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </main>
  );
}
