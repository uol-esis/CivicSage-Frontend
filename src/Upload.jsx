import React, { useState } from 'react';
import UploadComponent from './components/UploadComponent';
import * as CivicSage from 'civic_sage';

export default function Upload() {
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isValidFile, setIsValidFile] = useState(false);
  const [resetUpload, setResetUpload] = useState(false);

  const handleConfirmWebsite = () => {
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    let indexWebsiteRequest = new CivicSage.IndexWebsiteRequest(inputValue); // IndexWebsiteRequest | 
    apiInstance.indexWebsite(indexWebsiteRequest, (error, data, response) => {
      if (error) {
        console.error(error);
        alert('Error adding website to the database.');
      } else {
        console.log('API called successfully.');
        alert(`${inputValue} added to the database.`);
        setInputValue(''); // Clear the input field after successful submission
      }
    });
  };

  const handleConfirmFile = () => {
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    let file = selectedFile; // File | 
      apiInstance.indexFiles(file, (error, data, response) => {
        if (error) {
          console.error(error);
          alert('Error adding website to the database.');
        } else {
          console.log('API called successfully.');
          alert(`${selectedFile.name} added to the database.`);
          setSelectedFile(null); // Clear the selected file after successful submission
          setResetUpload(r => !r); // Toggle reset state to re-render UploadComponent
        }
      });
  };

  return (
  <div className="h-screen">
    {/* Input Field */}
    <div className="flex flex-col mt-[3vh] mx-4 p-4 h-[30vh] bg-white shadow rounded-[10px]">
      <h2 className="text-xl font-bold mb-4">
        Geben Sie einen Link ein, um den Inhalt der Webseite zur Datenbank hinzuzufügen:
      </h2>
      <input
        id="textInput"
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="www.beispiel.de..."
        className="border border-gray-300 rounded px-4 py-2 w-full mt-2"
      />
      <button
        onClick={handleConfirmWebsite}
        className="py-2 my-4 rounded-md bg-gray-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
      >
        Bestätigen
      </button>
    </div>

    {/* Divider */}
    <div className="flex items-center mx-4 h-[14vh]">
      <div className="flex-grow border-t border-gray-300"></div>
      <span className="mx-4 text-gray-500 font-semibold">ODER</span>
      <div className="flex-grow border-t border-gray-300"></div>
    </div>

    {/* Drag-and-Drop Upload */}
    <div className="flex flex-col mx-4 h-[50vh] bg-white shadow rounded-[10px] p-4">
      <div className="flex-1 flex flex-col">
        <UploadComponent setFile={setSelectedFile} setValid={setIsValidFile} reset={resetUpload} />  
      </div>
      <button
        onClick={handleConfirmFile}
        className="py-2 mt-4 rounded-md bg-gray-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
      >
        Bestätigen
      </button>
    </div>

  </div>
);}