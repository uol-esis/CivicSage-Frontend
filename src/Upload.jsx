import React, { useState } from 'react';

export default function Upload() {
  const [inputValue, setInputValue] = useState('');

  const handleConfirm = () => {
    alert(`Input: ${inputValue}`);
  };

  return (
    <div className="p-4">
      {/* Input Field */}
      <div className="mb-4">
        <label htmlFor="textInput" className="block text-sm font-medium text-gray-700">
          Enter Text:
        </label>
        <input
          id="textInput"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type something..."
          className="border border-gray-300 rounded px-4 py-2 w-full"
        />
      </div>

      {/* Drag-and-Drop Placeholder */}
      <div className="mb-4 border-2 border-dashed border-gray-300 rounded h-32 flex items-center justify-center">
        <p className="text-gray-500">Drag and drop files here</p>
      </div>

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Confirm
      </button>
    </div>
  );
}