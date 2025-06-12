import React, { useState } from 'react';
import * as CivicSage from 'civic_sage';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

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
        alert('Error searching files. Please try again.');
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
        <button
          onClick={handleSearch}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Search
        </button>
      </div>
      <div className="space-y-2">
        {results.map((result, index) => (
          <div key={index} className="border border-gray-300 rounded p-2">
            <div className="text-xs text-gray-500 mb-1">
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="underline">
                {result.url}
              </a>
              <span className="ml-2">{result.fileName}</span>
              <span className="ml-2 text-gray-400">Score: {result.score?.toFixed(2)}</span>
            </div>
            <div className="text-sm">{result.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}