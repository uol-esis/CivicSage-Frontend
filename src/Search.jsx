import React, { useState, useEffect } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import * as CivicSage from 'civic_sage';
import { data } from 'react-router-dom';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [resultsIsChecked, setResultsIsChecked] = useState([]);
  const [resultsIsLocked, setResultsIsLocked] = useState([]);
  const [lockedResults, setLockedResults] = useState([]);
  const [prompt, setPrompt] = useState('Generiere eine kurze Zusammenfassung basierend auf den ausgewählten Ergebnissen!');
  const [textSummary, setTextSummary] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultCount, setResultCount] = useState(10); // Default result count

  


  {/* Searches the DB for results and display them in boxes */}
  const handleSearch = () => {
    if (!query || query.trim() === '') {
      return
    }
    setIsSearching(true);
    console.log('Searching for:', query);
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    let searchQuery = new CivicSage.SearchQuery(query); // SearchQuery | 
    let opts = {
      'pageNumber': 0, // Number | Page number
      'pageSize': resultCount // Number | Page size
    };
    apiInstance.searchFiles(searchQuery, opts, (error, data, response) => {
      setIsSearching(false);
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
        parsedResults = lockedResults.concat(parsedResults);
        setResults(parsedResults);
        const initialResultsIsChecked = Array(parsedResults.length).fill(true); // Initialize all results as checked
        setResultsIsChecked(initialResultsIsChecked);
        
        const initialResultsIsLocked = Array(parsedResults.length).fill(false); // Initialize all results as not locked
        lockedResults.forEach((_, idx) => {
          initialResultsIsLocked[idx] = true; // Initialize all locked results as locked
        });
        setResultsIsLocked(initialResultsIsLocked);
      }
    });
  };

  {/* Save all locked results, so they will still be displayed in the next search */}
  useEffect(() => {
    // Check if there are any locked results and keep them
    if (resultsIsLocked.length === 0) {
      return;
    }
    if (resultsIsLocked.some(isLocked => isLocked)) {
      const lockedResults = results.filter((_, idx) => resultsIsLocked[idx]);
      setLockedResults(lockedResults);
    }    
  } , [resultsIsLocked]);

  const handleCheckboxChange = (idx) => {
    setResultsIsChecked(prev => {
      const updated = [...prev];
      updated[idx] = !updated[idx];
      return updated;
    });
  };

  const handleLockToggle = (index) => {
    setResultsIsLocked(prev => {
      const updated = [...prev];
      updated[index] = !updated[index]
      return updated;
    });
  }

  const handleCheckAll = () => {
    const allChecked = Array(resultsIsChecked.length).fill(true); // Check all results
    setResultsIsChecked(allChecked);
  };

  const handleUncheckAll = () => {
    const allUnchecked = Array(resultsIsChecked.length).fill(false); // Uncheck all results
    setResultsIsChecked(allUnchecked);
  };

  const handleLockAllChecked = () => {
    const updatedResultsIsLocked = [...resultsIsLocked];
    resultsIsChecked.forEach((isChecked, idx) => {
      if (isChecked) {
        updatedResultsIsLocked[idx] = true; // Lock all checked results
      }
    });
    setResultsIsLocked(updatedResultsIsLocked);
  };

  const handleUnlockAll = () => {
    const updatedResultsIsLocked = [resultsIsLocked.length].fill(false); // Unlock all results
    setResultsIsLocked(updatedResultsIsLocked);
  };


  {/* Takes all checked boxes and tells the LLM to generate a summary based off of it*/}
  const handleGenerate = () => {
    const resultIds = []
    for (let i = 0; i < results.length; i++) {
      if (resultsIsChecked[i]) {
        resultIds.push(results[i].documentId);
      }
    }
    console.log('Selected result IDs:', resultIds);
    if (resultIds.length === 0) {
      alert('Please select at least one result to generate text.');
      return;
    }
    setIsGenerating(true);
    console.log('Generating text with prompt:', prompt, 'for results:', resultIds);
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    let systemPrompt = "Du bist ein KI-Textgenerator, der auf Basis von Dokumenten kurze Zusammenfassungen erstellt. Deine Aufgabe ist es, eine prägnante und informative Zusammenfassung zu generieren. Anschließend sind Textpassagen gegeben, die im Prompt als 'ausgewählte Ergebnisse' bezeichnet werden.";
    let summarizeEmbeddingsRequest = new CivicSage.SummarizeEmbeddingsRequest(resultIds, prompt, systemPrompt);
    apiInstance.summarizeEmbeddings(summarizeEmbeddingsRequest, (error, data, response) => {
      setIsGenerating(false);
      if (error) {
        console.error(error);
        setTextSummary("Ein Fehler ist aufgetreten: " + error)
      } else {
        console.log('API called successfully. Returned data: ' + data.summary);
        setTextSummary(data.summary)
      }
    });
  }


  return (
    <div className="h-screen flex flex-col">
      {/* Sticky Search Bar */}
      <div className="bg-white z-10 sticky top-0 p-4 shadow">
        <form
          className="flex flex-row items-center"
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="border border-gray-300 rounded px-4 py-2 w-full"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r"
            disabled={isSearching}
          >
            {isSearching ? (
              <div className="spinner-border animate-spin inline-block w-4 h-4 border-2 rounded-full"></div>
            ) : (
              'Search'
            )}
          </button>
        </form>
      </div>

      {/*bottom part */}
      <div className="flex-1 flex-row bg-gray-300 p-4 h-[calc(100vh-theme(spacing.14))]">
        <PanelGroup 
          direction="horizontal"
          className="flex-1" 
        >
          {/* Results Section */}
          <Panel defaultSize={70} minSize={30} className="flex flex-col h-full">
            <div className="bg-gray-50 shadow p-4 h-full overflow-y-auto">
            <div className="flex flex-row justify-between">
              <div className="pb-2 flex flex-row items-center justify-start">
                <label className="flex items-center">
                  <input
                    type="number"
                    value={resultCount}
                    
                    onChange={(e) => {
                      if (e.target.value > 0) {
                        setResultCount(e.target.value)
                      }
                    }}
                    className="border border-gray-300 rounded px-4 py-2 w-20"
                  ></input>
                  <span className="ml-2">Ergebnisse laden</span>
                </label>
              </div>
              <div className="pb-2 flex flex-row items-center justify-end">
                <button
                  onClick={handleLockAllChecked}
                  className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
                  disabled={isGenerating || results.length === 0}
                >
                  Sperre Ausgewählte
                </button>
                <button
                  onClick={handleUnlockAll}
                  className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                  disabled={isGenerating || results.length === 0}
                >
                  Alle entsperren
                </button>

                <button
                  onClick={handleCheckAll}
                  className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                  disabled={isGenerating || results.length === 0}
                >
                  Alle auswählen
                </button>
                <button
                  onClick={handleUncheckAll}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                  disabled={isGenerating || results.length === 0}
                >
                  Alle abwählen
                </button>
              </div>
            </div>

            {results.map((result, index) => {
              return(
                <div key={index} className="border border-gray-300 rounded p-2 relative">
                  <div
                    onClick={() => handleLockToggle(index)}
                    className={`absolute top-2 right-9 cursor-pointer ${resultsIsLocked[index] ? 'text-red-500' : 'text-green-500'}`}
                  >
                    {resultsIsLocked[index] ? (
                      <svg fill="#000000" width="20" height="20" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                      <title>locked</title>
                      <path d="M4 31v-16h3v-5c0-4.418 3.581-8 8-8h1c4.418 0 8 3.582 8 8v5h3v16h-23zM14.744 22.787l-0.744 5.213h3l-0.745-5.213c0.729-0.298 1.245-1.013 1.245-1.85 0-1.104-0.896-2-2-2-1.105 0-2 0.896-2 2 0 0.837 0.515 1.552 1.244 1.85zM21 10.5c0-3.038-2.463-5.5-5.5-5.5-3.038 0-5.5 2.462-5.5 5.5v4.5h11v-4.5z"></path>
                      </svg>
                    ) : (
                      <svg height="20" width="20" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
                        viewBox="0 0 445.186 445.186" xmlSpace="preserve">
                      <g>
                        <path style={{fill:'#010002'}} d="M329.622,185.348h-6.779H138.6v-1.097v-70.198V100.25c0-46.317,37.684-83.993,83.993-83.993
                          s83.993,37.684,83.993,83.993v13.802h16.257V100.25C322.843,44.967,277.875,0,222.593,0s-100.25,44.975-100.25,100.258v85.098
                          H55.957v259.83h333.272V185.348H329.622z M372.971,428.929H72.214V201.605h300.757V428.929z"/>
                      </g>
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={resultsIsChecked[index] ?? true}
                    onChange={() => handleCheckboxChange(index)}
                    className="absolute top-2 right-2 border bg-white w-5 h-5 rounded cursor-pointer"  
                  />
                  
                  <div className="text-xs text-gray-500 mb-1">
                    <span className="ml-2 text-lg font-bold">{result.title}</span>
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="ml-2 underline">
                      {result.url}
                    </a>
                    <span className="ml-2 text-lg font-bold">{result.fileName}</span>
                    <span className="ml-2 text-gray-400">Score: {result.score?.toFixed(2)}</span>
                  </div>
                  <div className="text-sm">{result.text}</div>
                </div>
              )
            })}
            </div>
          </Panel>
          <PanelResizeHandle className="w-4 bg-gray-300"/>
          
          <Panel defaultSize={30} minSize={30} className="flex flex-col">
          {/* Text Area */}

            <div className="bg-gray-50 shadow h-full p-4 flex flex-col">
              <textarea
                className="w-full h-full p-2 mb-1 resize-none border border-gray-300 rounded"
                placeholder="Generated text will be displayed here..."
                value={textSummary}
                readOnly>
              </textarea>
              <form
                className="flex flex-row items-center"
                onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}
              >
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Generiere einen Text basierend auf den ausgewählten Ergebnissen!"
                  className="border border-gray-300 rounded px-4 py-2 w-full h-[6.5rem] resize-none overflow-y-auto"
                  rows={1}
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 h-[6.5rem] rounded-r"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <div className="spinner-border animate-spin inline-block w-4 h-4 border-2 rounded-full"></div>
                  ) : (
                    'Los'
                  )}
                </button>
              </form>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}