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
  const [notification, setNotification] = useState(null);

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
        console.log("Response:", response);
        let errorMsg = `Die Website "${inputValue}" konnte nicht zur Datenbank hinzugefügt werden.`;
        try {
          const errObj = typeof error === 'string' ? JSON.parse(error) : error;
          if (errObj && (errObj.statusCode === 409 || errObj.status === 409)) {
            errorMsg = `Die Website "${inputValue}" ist bereits in der Datenbank.`;
          }
          if (errObj && (errObj.statusCode === 413 || errObj.status === 413)) {
            errorMsg = `Die angegebene Webseite ist zu groß und konnte nicht verarbeitet werden.`;
          }
        } catch (e) {
          // If parsing fails, keep the default error message
        }
        alert(errorMsg);
      } else {
        console.log('API called successfully.');
        showNotification(`${inputValue} wurde erfolgreich zur Datenbank hinzugefügt.`);
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
          let errorMsg = `Die Datei "${file.name}" konnte nicht zur Datenbank hinzugefügt werden.`;
          try {
            const errObj = typeof error === 'string' ? JSON.parse(error) : error;
            if (errObj && (errObj.statusCode === 409 || errObj.status === 409)) {
              errorMsg = `Die Datei "${file.name}" ist bereits in der Datenbank.`;
            }
            if (errObj && (errObj.statusCode === 413 || errObj.status === 413)) {
            errorMsg = `Die hochgeladene Datei ist zu groß und konnte nicht verarbeitet werden.`;
          }
          } catch (e) {
            // If parsing fails, keep the default error message
          }
          alert(errorMsg);
          uids[index] = undefined; // Mark this index as failed
        } else {
          console.log(`File ${file.name} uploaded successfully. UID: ${data.id}`);
          uids[index] = data.id;    
        }
        // Check if all UIDs are filled
        if (uids.length === selectedFiles.length) {
          console.log("All files uploaded. Proceeding to indexing...");
          setFileUIDs(uids);
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
        indexFilesRequest.push(new CivicSage.IndexFilesRequestInner(fileUIDs[i], selectedFiles[i].filename));
      }
    }
    if (indexFilesRequest.length === 0) {
      setSelectedFiles([]); 
      setResetUpload(r => !r);
      setIsUploadButtonDisabled(false);
      return;
    }
    apiInstance.indexFiles(indexFilesRequest,  (error, data, response) => {
      if (error) {
        console.error(error);
        alert('Error indexing files.');
      } else {
        console.log('Files indexed successfully.');
        showNotification('Die Dateien wurden erfolgreich zur Datenbank hinzugefügt.');
      }
      setSelectedFiles([]); // Clear the selected files after successful submission
      setResetUpload(r => !r); // Toggle reset state to re-render UploadComponent
      setIsUploadButtonDisabled(false); // Re-enable the upload button
    });
  }

  function showNotification(message) {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000); // Hide after 3 seconds
  }

  return (
  <div className="h-screen flex-1 flex-col overflow-y-auto">
    {notification && (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded shadow-lg z-50 transition-all">
        {notification}
      </div>
    )}
    {/* Input Field */}
    <div className="flex flex-col justify-between mt-[3vh] mx-4 p-4 min-h-[30vh] bg-white shadow rounded-[10px]">
      <h2 className="text-xl font-bold mb-4">
        Geben Sie einen Link ein, um den Inhalt der Webseite zur Datenbank hinzuzufügen:
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleConfirmWebsite();
        }}
        className="flex flex-col justify-between h-full flex-1"
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
          className={`flex justify-center items-center py-2 mt-4 rounded-md text-sm font-semibold text-white shadow-sm ${isWebsiteButtonDisabled ? 'bg-gray-400' : 'bg-gray-600 hover:bg-indigo-500'}`}
        >
          {isWebsiteButtonDisabled ? (
            <div className="spinner-border animate-spin inline-block w-4 h-4 border-2 rounded-full"></div>
          ) : (
            'Bestätigen'
          )}
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
    <div className="flex flex-1 mx-4 min-h-[50vh] bg-white shadow rounded-[10px] p-4">
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleUploadFiles();
        }}
        className="flex flex-col flex-1 justify-between"
      >
        <UploadComponent setFiles={setSelectedFiles} setValid={setIsValidFile} reset={resetUpload} />  
        <button
          onClick={handleUploadFiles}
          disabled={isUploadButtonDisabled}
          className={`flex justify-center items-center py-2 mt-4 rounded-md text-sm font-semibold text-white shadow-sm ${isUploadButtonDisabled ? 'bg-gray-400' : 'bg-gray-600 hover:bg-indigo-500'}`}
        >
          {isUploadButtonDisabled ? (
            <div className="spinner-border animate-spin inline-block w-4 h-4 border-2 rounded-full"></div>
          ) : (
            'Bestätigen'
          )}
        </button>
      </form>
</div>

  </div>
);}