import React, { useState } from 'react';
import UploadComponent from './components/UploadComponent';

export default function Upload() {
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isValidFile, setIsValidFile] = useState(false);

  const handleConfirm = () => {
    alert(`Input: ${inputValue}`);
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
        onClick={handleConfirm}
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
        <UploadComponent setFile={setSelectedFile} setValid={setIsValidFile} />  
      </div>
      <button
        onClick={handleConfirm}
        className="py-2 mt-4 rounded-md bg-gray-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
      >
        Bestätigen
      </button>
    </div>

  </div>
);}