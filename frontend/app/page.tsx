"use client"
import React, { useState } from "react";

export default function Home() {

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if(!file){
      alert("Please select a file first")
      return;
    }

    setStatusMessage("Requesting upload URL")

    const res= await fetch("http://localhost:8000/api/get-presigned-url/",{
      method: "POST",
      headers: {
        "Content-Type":"application/json",
      },
      body: JSON.stringify({
        filename:file.name,
        filetype: file.type,
      }),
    })

    const data= res.json()

    if (!res.ok){
      setStatusMessage("Error");
      return
    }

    const {upload_url,file_url}= data;

    const uploadRes= await fetch(upload_url,{
      method:"PUT",
      headers:{
        "Content-Type": file.type,
      },

      body:file,
    })

    if (uploadRes.ok){
      set
    }



    }

  };


  function handleFatherUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFile(file);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null)
    }

  };



  return (
    <>

    <form
    className="border border-neutral-500 rounded-lg px-6 py-4"
    onSubmit={handleSubmit}
  >

      <input type="file" name="media" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" onChange={handleFatherUpload} />

      {previewUrl && file && (
      <div className="mt-4">
        {file.type.startsWith("image/") ? (
          <img className="max-w-40" src={previewUrl} alt="Selected file" />
        ) : null}
      </div>
      )
    }
      <button type="submit" className="border rounded-xl px-4 py-2 disabled">
            Post
      </button>
    </form>
    </>  
  );
}
