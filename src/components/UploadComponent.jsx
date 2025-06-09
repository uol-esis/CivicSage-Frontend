import { useState, useRef, useEffect } from "react";

export default function UploadComponent({setFile, setValid}){

    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null); // Reference for the hidden input element
    const fileNameDialogRef = useRef(null);
    const [modifiedFileName, setModifiedFileName] = useState(selectedFile?.name || "");
    const [showNamePopup, setShowNamePopup] = useState(false);
    const [isValidFile, setIsValidFile] = useState(false);

    useEffect(() => {
        if (selectedFile && isValidFile){
            setFile(selectedFile);
            setValid(true);
        }
    }, [isValidFile]);
   
    
    useEffect(() => {
      if (selectedFile) {
        const isValid = selectedFile.name.endsWith(".pdf") || selectedFile.name.endsWith(".txt") || selectedFile.name.endsWith(".docx") || selectedFile.name.endsWith(".odt");
        setIsValidFile(isValid);
      } else {
        setIsValidFile(false);
      }
    }, [selectedFile]);

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        setSelectedFile(file);
    };

    {/* helper functions */ }
    const handleFileChange = (event) => {
        console.log("change file");
        setSelectedFile(event.target.files[0]);
    }

    const handleFileInputClick = () => {
        fileInputRef.current.click();
    };



    return(
        <div
          className="flex flex-col h-full w-full bg-white rounded-[10px]"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <h2 className="text-xl font-bold mb-4">
            Wählen Sie eine Textdatei (pdf, word, ...) zum hochladen aus
          </h2>
          <button
            type="button"
            onClick={handleFileInputClick}
            className="relative flex-1 w-full h-full rounded-lg bg-white border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {selectedFile ? (
              <>
                {isValidFile ? (
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                    className="mx-auto h-12 w-12 text-green-500"
                  >
                    <path d="M14 24l8 8 12-12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                    className="mx-auto h-12 w-12 text-red-500"
                  >
                    <line x1="12" y1="12" x2="36" y2="36" strokeWidth={2} strokeLinecap="round" />
                    <line x1="36" y1="12" x2="12" y2="36" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                )}
                <span className="mt-2 block text-sm font-semibold text-gray-900">{selectedFile.name}</span>
              </>
            ) : (
              <>
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                  className="mx-auto h-12 w-12 text-gray-400"
                >
                  <path
                    d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24m32 10v6m0 0v6m0-6h6m-6 0h-6"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="mt-2 block text-sm font-semibold text-gray-900">Datei hochladen</span>
              </>
            )}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          {selectedFile && (
            <p className="mt-2 text-sm text-gray-700">Ausgewählte Datei: {selectedFile.name}</p>
          )}
        </div>
    );
}