"use client";
import { SignInButton, useAuth } from "@clerk/clerk-react";
import { SignOutButton } from "@clerk/nextjs";
import React, { useState } from "react";
import LoginPage from "./login/[[...rest]]/page";

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


  const pollForResult= async(fatherId:number,motherId:number)=>{
    const interval= setInterval(async()=>{
      const res= await fetch(`http://localhost:8000/check-image/${fatherId}/${motherId}/`);
      const data= await res.json();

      if(data.status=="ready"){
        clearInterval(interval);
        alert("Child image ready:" + data.url);
        setStatus("IMage ready")
      } else{
        console.log("still processing")
      }
    },5000)
  }

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
      
      const momInDB = await fetch("http://localhost:8000/uploadmother/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_url: motherS3Url,
        }),
      });
      

      const dadInDB = await fetch("http://localhost:8000/uploadfather/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_url: fatherS3Url,
        }),
      });

      const mom= await momInDB.json()
      const dad= await dadInDB.json()
      
      if (mom && dad){
        const ouputInDB = await fetch("http://localhost:8000/generate/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            father_id: dad.message,
            mother_id: mom.message
          }),
        });

        pollForResult(dad.message,mom.message)
      
      }

    } else {
      setStatus("Upload failed.");
    }
  };

  const { sessionId } = useAuth()
  if (!sessionId) {
    return <LoginPage/>
  }

  return (
    <>
    <form onSubmit={handleSubmit}>
      <h2>Template Image</h2>
      <input type="file" accept="image/*" onChange={handleFatherChange} />
      {fatherPreview && <img src={fatherPreview} alt="Father Preview" width={150} />}

      <h2>Target Image</h2>
      <input type="file" accept="image/*" onChange={handleMotherChange} />
      {motherPreview && <img src={motherPreview} alt="Mother Preview" width={150} />}

      
      

      <button className="bg-blue-500 text-white px-8 py-3" type="submit">Upload</button>

      {status && <p>{status}</p>}
    </form>

    <SignOutButton signOutOptions={{ sessionId }}>
    <button className="mt-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
      Sign Out
    </button>
  </SignOutButton>

    </>
  );
}
