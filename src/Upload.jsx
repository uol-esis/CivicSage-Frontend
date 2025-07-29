import React, { useState, useEffect } from 'react';
import UploadComponent from './components/UploadComponent';
import * as CivicSage from 'civic_sage';

export default function Upload() {
  const [inputValue, setInputValue] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isValidFile, setIsValidFile] = useState(false);
  const [fileUIDs, setFileUIDs] = useState([]);
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


  /**
   *Uploads a single File and gets the UID from the server. (This later leads to indexing of the file) 
   */
  const handleUploadFiles = () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file to upload.');
      return;
    }

    setIsUploadButtonDisabled(true); // Disable the upload button
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);

    const uids = new Array(selectedFiles.length);

    selectedFiles.forEach((file, index) => {
      apiInstance.uploadFile(file, (error, data, response) => {
        if (error) {
          console.error(error);
          alert('Error adding file to the database.');

          setSelectedFiles([]); // Clear the selected files after successful submission
          setResetUpload(r => !r); // Toggle reset state to re-render UploadComponent
          setIsUploadButtonDisabled(false); // Re-enable the upload button
          return;
        } else {
          console.log(`File ${file.name} uploaded successfully. UID: ${data.id}`);
          uids[index] = data.id; // Store the UID at the correct index

          // Check if all UIDs are filled
          if (uids.filter(uid => uid !== undefined).length === selectedFiles.length) {
            console.log("All files uploaded. Proceeding to indexing...");
            setFileUIDs(uids);
          }      
        }
      });
    });
  };

  useEffect(() => {
    if (fileUIDs.length > 0) {
      indexFiles();
    }
  }, [fileUIDs]);

  /**
   * When the UID is set, tells the server to index the file
   */
  const indexFiles = () => {
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    let indexFilesRequest = [];
    for (let i = 0; i < fileUIDs.length; i++) {
      if (fileUIDs[i] !== undefined) {
        indexFilesRequest.push(new CivicSage.IndexFilesRequestInner(fileUIDs[i], selectedFiles[i].name));
      }
    }
    apiInstance.indexFiles(indexFilesRequest,  (error, data, response) => {
      if (error) {
        console.error(error);
        alert('Error indexing files.');
      } else {
        console.log('Files indexed successfully.');
        alert('Files indexed successfully.');
      }
    setSelectedFiles([]); // Clear the selected files after successful submission
    setResetUpload(r => !r); // Toggle reset state to re-render UploadComponent
    setIsUploadButtonDisabled(false); // Re-enable the upload button
    });

  }


  return (
  <div className="h-screen">
    {/* Input Field */}
    <div className="flex flex-col justify-between mt-[3vh] mx-4 p-4 h-[30vh] bg-white shadow rounded-[10px]">
      <h2 className="text-xl font-bold mb-4">
        Geben Sie einen Link ein, um den Inhalt der Webseite zur Datenbank hinzuzufügen:
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleConfirmWebsite();
        }}
        className="flex flex-col justify-between h-full"
      >
        <div />
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
          className={`py-2 mt-4 rounded-md text-sm font-semibold text-white shadow-sm ${isWebsiteButtonDisabled ? 'bg-gray-400' : 'bg-gray-600 hover:bg-indigo-500'}`}
        >
          Bestätigen
        </button>
      </form>
    </div>

    {/* Divider */}
    <div className="flex items-center mx-4 h-[14vh]">
      <div className="flex-grow border-t border-gray-300"></div>
      <span className="mx-4 text-gray-500 font-semibold">ODER</span>
      <div className="flex-grow border-t border-gray-300"></div>
    </div>

    {/* Drag-and-Drop Upload */}
    <div className="flex flex-col mx-4 h-[50vh] bg-white shadow rounded-[10px] p-4">
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleUploadFiles();
        }}
        className="flex flex-col h-full"
      >
        <div className="flex-1 flex flex-col">
          <UploadComponent setFiles={setSelectedFiles} setValid={setIsValidFile} reset={resetUpload} />  
        </div>
        <button
          onClick={handleUploadFiles}
          disabled={isUploadButtonDisabled}
          className={`py-2 mt-4 rounded-md text-sm font-semibold text-white shadow-sm ${isUploadButtonDisabled ? 'bg-gray-400' : 'bg-gray-600 hover:bg-indigo-500'}`}
        >
          Bestätigen
        </button>
      </form>
    </div>

  </div>
);}