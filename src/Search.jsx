import React, { useState, useEffect } from 'react';
import * as CivicSage from 'civic_sage';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [hiddenSources, setHiddenSources] = useState([]);
  const [showSettings, setShowSettings] = useState(false);


  const handleSearch = () => {
    console.log('Searching for:', query);
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    let searchQuery = new CivicSage.SearchQuery(query); // SearchQuery | 
    let opts = {
      'pageNumber': 0, // Number | Page number
      'pageSize': 10 // Number | Page size
    };
    console.log('Api Instance:', apiInstance);
    apiInstance.searchFiles(searchQuery, opts, (error, data, response) => {
      console.log('Response:', response);
      if (error) {
        console.error(error);
        alert('Error searching files. Please try agains.');
      } else {
        // Parse the JSON string from response.text
        let parsedResults = [];
        try {
          parsedResults = JSON.parse(response.text);
        } catch (e) {
          console.error('Failed to parse response:', e);
        }
        setResults(parsedResults);
      }
    });
  };


  {/* aktuell stumpfe Frontend Lösung, später: hiddenSources an Server schicken und neu suchen */}
  const hideSource = (source) => {
    if (!source || hiddenSources.includes(source)) return;
    const updatedHiddenSources = [...hiddenSources, source];
    setHiddenSources(updatedHiddenSources);
    setResults((prevResults) =>
      prevResults.filter(
        (result) =>
          !updatedHiddenSources.includes(result.url) &&
          !updatedHiddenSources.includes(result.fileName)
      )
    );
  };



  return (
    <div className="p-4">
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="border border-gray-300 rounded px-4 py-2 w-full"
        />
        <div className="flex flex-row justify-between items-center mt-2">
          <div className="flex-1 flex justify-center">
            <button
              onClick={handleSearch}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Suchen
            </button>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Filter
          </button>
        </div>
        {showSettings && (
          <div className="absolute right-0 mt-2 mr-4 w-[30vw] bg-white border border-gray-300 rounded shadow-lg z-10 p-4">
            <div className="font-semibold mb-2">Versteckte Quellen:</div>
            {hiddenSources.length === 0 ? (
              <div className="text-gray-400 text-sm">Keine Quellen versteckt.</div>
            ) : (
              <ul className="text-xs">
                {hiddenSources.map((src, idx) => (
                  <li key={idx} className={`flex justify-between items-center cursor-pointer p-1 rounded overflow-x-auto whitespace-nowrap text-sm text-gray-700 hover:bg-gray-200`}>
                    {src}
                    <div className="flex gap-2">
                      <button type ="button"
                        onClick={() => {handleDeleteFilter()}}
                        className="p-1 rounded hover:bg-gray-200 transform transition-transform duration-150 hover:scale-110">
                          🗑️
                        </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <div className="space-y-2">
        {results.map((result, index) => (
          <div key={index} className="border border-gray-300 rounded p-2">
            <div className="text-xs text-gray-500 mb-1">
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-500 cursor-pointer hover:text-blue-800">
                {result.url}
              </a>
              <span className="ml-2">{result.fileName}</span>
              <span className="ml-2 text-gray-400">Score: {result.score?.toFixed(2)}</span>
              <button
                type="button"
                className="ml-2 underline bg-transparent border-none p-0 cursor-pointer hover:text-blue-800"
                onClick={() => hideSource(result.url || result.fileName)}
              >
                Quelle ausblenden
              </button>
            </div>
            <div className="text-sm">{result.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}