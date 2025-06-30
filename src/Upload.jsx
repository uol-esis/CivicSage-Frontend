import React, { useState, useEffect } from 'react';
import UploadComponent from './components/UploadComponent';
import * as CivicSage from 'civic_sage';

export default function Upload() {
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isValidFile, setIsValidFile] = useState(false);
  const [fileUID, setFileUID] = useState('');
  const [resetUpload, setResetUpload] = useState(false);
  const [isWebsiteButtonDisabled, setIsWebsiteButtonDisabled] = useState(false);
  const [isUploadButtonDisabled, setIsUploadButtonDisabled] = useState(false);

  /**
   * Uploads the website to the DB and indexes it
   */
  const handleConfirmWebsite = () => {
    setIsWebsiteButtonDisabled(true); // Disable the button
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    let indexWebsiteRequest = new CivicSage.IndexWebsiteRequest(inputValue, ""); // IndexWebsiteRequest | 
    apiInstance.indexWebsite(indexWebsiteRequest, (error, data, response) => {
      if (error) {
        console.error(error);
        alert('Error adding website to the database.');
      } else {
        console.log('API called successfully.');
        alert(`${inputValue} added to the database.`);
        setInputValue(''); // Clear the input field after successful submission
      }
      setIsWebsiteButtonDisabled(false); // Re-enable the button
    });
  };

  {/*
  const handleConfirmUpload = () => {
    let filesToUpload = []; 
    
    if (selectedUpload && selectedUpload.isFile()) {
      setSelectedFiles([selectedUpload]);
      handleConfirmFiles();
    } else if (selectedUpload && selectedUpload.isDirectory()) {
      for (const file of selectedUpload.files) {
        if (file.isFile()) {
          setSelectedFiles(prevFiles => [...prevFiles, file]);
        }
      }
      handleConfirmFiles();
    } else {
      alert('Please select a valid file or directory.');
    }
    return;
  };  



  const handleConfirmFiles = () => {
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    let files = selectedFiles; // File | 
      apiInstance.indexFiles(files, (error, data, response) => {
        if (error) {
          console.error(error);
          alert('Error adding website to the database.');
        } else {
          console.log('API called successfully.');
          alert(`SUCCESS! ${files.map(file => file.name).join(', ')} added to the database.`);
          setSelectedFiles([]); // Clear the selected files after successful submission
          setResetUpload(r => !r); // Toggle reset state to re-render UploadComponent
        }
      });
  };
  */}

  /**
   *Uploads a single File and gets the UID from the server. (This later leads to indexing of the file) 
   */
  const handleUploadFile = () => {
    setIsUploadButtonDisabled(true); // Disable the upload button
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    let file = selectedFile; // File |
    apiInstance.uploadFile(file, (error, data, response) => {
      if (error) {
        console.error(error);
        alert('Error adding file to the database.');
      } else {
        console.log('API called successfully. UID: }' + data);
        setFileUID(data);        
      }
    });
  };

  useEffect(() => {
    if (fileUID) {
      indexFile();
    }
  }, [fileUID]);

  /**
   * When the UID is set, tells the server to index the file
   */
  const indexFile = () => {
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    let indexFilesRequestInner = [new indexFilesRequestInner(fileUID, selectedFile.name)];
    apiInstance.indexFiles(indexFilesRequestInner,  (error, data, response) => {
      if (error) {
        console.error(error);
        alert('Error indexing files.');
      } else {
        console.log('Files indexed successfully.');
        alert('Files indexed successfully.');
        setSelectedFile(null); // Clear the selected files after successful submission
        setResetUpload(r => !r); // Toggle reset state to re-render UploadComponent
      }
    setIsUploadButtonDisabled(false); // Re-enable the upload button
    });

  }


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
        disabled={isWebsiteButtonDisabled}
        className={`py-2 my-4 rounded-md text-sm font-semibold text-white shadow-sm ${isWebsiteButtonDisabled ? 'bg-gray-400' : 'bg-gray-600 hover:bg-indigo-500'}`}
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
        onClick={handleUploadFile}
        disabled={isUploadButtonDisabled}
        className={`py-2 mt-4 rounded-md text-sm font-semibold text-white shadow-sm ${isUploadButtonDisabled ? 'bg-gray-400' : 'bg-gray-600 hover:bg-indigo-500'}`}
      >
        Bestätigen
      </button>
    </div>

  </div>
);}