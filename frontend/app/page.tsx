"use client";
import React, { useState } from "react";

export default function Home() {
  const [fatherFile, setFatherFile] = useState<File | null>(null);
  const [motherFile, setMotherFile] = useState<File | null>(null);

  const [fatherPreview, setFatherPreview] = useState<string | null>(null);
  const [motherPreview, setMotherPreview] = useState<string | null>(null);

  const [status, setStatus] = useState("");

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
    const res = await fetch("http://localhost:8000/presigned-url/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  // Submit both images
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fatherFile || !motherFile) {
      alert("Select both images before uploading");
      return;
    }

    setStatus("Uploading to S3...");

    const fatherS3Url = await uploadToS3(fatherFile);
    const motherS3Url = await uploadToS3(motherFile);

    if (fatherS3Url && motherS3Url) {
      setStatus("Uploaded to S3 successfully!");
    } else {
      setStatus("Upload failed.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Father Image</h2>
      <input type="file" accept="image/*" onChange={handleFatherChange} />
      {fatherPreview && <img src={fatherPreview} alt="Father Preview" width={150} />}

      <h2>Mother Image</h2>
      <input type="file" accept="image/*" onChange={handleMotherChange} />
      {motherPreview && <img src={motherPreview} alt="Mother Preview" width={150} />}

      <button className="bg-blue-500 text-white px-8 py-3" type="submit">Upload</button>

      {status && <p>{status}</p>}
    </form>
  );
}
