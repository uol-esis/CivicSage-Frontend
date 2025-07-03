import { useState, useRef, useEffect } from "react";

export default function UploadComponent({setFiles, setValid, reset}) {

    const [selectedFiles, setSelectedFiles] = useState([]); // Store multiple files
    const fileInputRef = useRef(null); // Reference for the hidden input element
    const directoryInputRef = useRef(null);
    const [isValid, setIsValid] = useState(false);



    useEffect(() => {
      console.log("Selected files:", selectedFiles);
        if (selectedFiles && isValid){
            setFiles(selectedFiles);
            setValid(true);
        }
    }, [isValid]);

    useEffect(() => {
      const isValid = selectedFiles.some(file => 
        file.name.endsWith(".pdf") || 
        file.name.endsWith(".txt") || 
        file.name.endsWith(".docx") || 
        file.name.endsWith(".odt")
      );
      setIsValid(isValid);
    }, [selectedFiles]);


    useEffect(() => {
      setSelectedFiles([]);
      setIsValid(false);
      // reset other internal state if needed
    }, [reset]);

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
      const files = event.target.files; // FileList object
      console.log("Files selected:", files);
      let fileArray = [];
      for (const file of files) {
        if (
          file.name.endsWith(".pdf") ||            
          file.name.endsWith(".txt") || 
          file.name.endsWith(".docx") || 
          file.name.endsWith(".odt")
        ) {
          fileArray.push(file);
        }
      }

      if (fileArray.length > 0) { 
        setSelectedFiles(fileArray);
        console.log("Valid files selected:", fileArray);
      }
    };

    return (
      <div className="flex flex-col h-full w-full bg-white rounded-[10px]">
        <h2 className="text-xl font-bold mb-4">
          Wählen Sie eine Datei oder einen Ordner zum Hochladen aus
        </h2>
        <div className="flex flex-row h-full gap-4">
          {/* Button for selecting individual files */}
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="relative flex-1 w-full h-full rounded-lg bg-white border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {selectedFiles.length === 1 ? (
              <>
                {isValid ? (
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
                <span className="mt-2 block text-sm font-semibold text-gray-900">{selectedFiles[0].name}</span>
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
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          

        {/* Button for selecting directories */}
        <button
          type="button"
          onClick={() => directoryInputRef.current.click()}
          className="relative flex-1 w-full h-full rounded-lg bg-white border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {selectedFiles.length > 1 ? (
            <>
              {isValid ? (
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
              <span className="mt-2 block text-sm font-semibold text-gray-900">{selectedFiles.length} Dateien</span>
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
              <span className="mt-2 block text-sm font-semibold text-gray-900">Ordner hochladen</span>
            </>
          )}
        </button>
        <input 
          type="file" 
          ref={directoryInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          webkitdirectory="true" // Enable folder selection
          multiple // Allow multiple files from the folder
        />
        </div>
        

        {selectedFiles.length === 1 && (
          <p className="mt-2 text-sm text-gray-700">Ausgewählte Datei: {selectedFiles[0].name}</p>
        )}
        {selectedFiles.length > 1 && (
          <p className="mt-2 text-sm text-gray-700">{selectedFiles.length} Dateien ausgewählt</p>
        )}
      </div>
    );
}