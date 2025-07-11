import React, { useState, useEffect } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import * as CivicSage from 'civic_sage';
import { data } from 'react-router-dom';
import { Menu, MenuItem, MenuItems, MenuButton } from '@headlessui/react';


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
  const [resultPage, setResultPage] = useState(0); // Default result page
  const [searchHistory, setSearchHistory] = useState([]);
  const [pendingSearch, setPendingSearch] = useState(false);
  const [viewHistory, setViewHistory] = useState([]);
  const [filterTitle, setFilterTitle] = useState('');
  const [filterUrl, setFilterUrl] = useState('');


  {/* Searches the DB for results and display them in boxes */}
  const handleSearch = (page = 0) => {
    if (!query || query.trim() === '') {
      return
    }
    setIsSearching(true);
    console.log('Searching for:', query);
    // Add query to localStorage "search history"
    const history = JSON.parse(localStorage.getItem('searchHistory')) || []; // Retrieve existing history or initialize as an empty array
    if (!history.includes(query)) { // Avoid duplicates
      history.push(query);
      localStorage.setItem('searchHistory', JSON.stringify(history)); // Save updated history
    }
    let filters = [];
    if (filterTitle.trim() !== '') {
      filters.push(`title == '${filterTitle}'`);
    }
    if (filterUrl.trim() !== '') {
      filters.push(`url == '${filterUrl}'`);
    }
    let searchString = filters.join(' AND ');

    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    let searchQuery = new CivicSage.SearchQuery(query);  
    if (searchString !== '') {
      searchQuery.filterExpression = searchString;
    }
    let opts = {
      'pageNumber': page, // Number | Page number
      'pageSize': resultCount // Number | Page size
    };
    apiInstance.searchFiles(searchQuery, opts, (error, data, response) => {
      console.log(JSON.stringify(searchQuery))
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
        let allResults = [];
        if (page === 0) {
          allResults = lockedResults.concat(parsedResults);
        } else {
          allResults = results.concat(parsedResults);
        }
        setResults(allResults);
        let initialResultsIsChecked = Array(parsedResults.length).fill(true); // Initialize all results as checked
        if (page > 0) {
          initialResultsIsChecked = resultsIsChecked.concat(initialResultsIsChecked);
        }
        setResultsIsChecked(initialResultsIsChecked);
        
        let initialResultsIsLocked = Array(parsedResults.length).fill(false); // Initialize all results as not locked
        if (page === 0) {
          lockedResults.forEach((_, idx) => {
            initialResultsIsLocked[idx] = true; // Initialize all locked results as locked
          });
        } else {
          initialResultsIsLocked = resultsIsLocked.concat(initialResultsIsLocked);
        }
        setResultsIsLocked(initialResultsIsLocked);
      }
    });
  };

  {/* Save all locked results, so they will still be displayed in the next search */}
  useEffect(() => {
    const lockedResults = results.filter((_, idx) => resultsIsLocked[idx]);
    setLockedResults(lockedResults);
  } , [resultsIsLocked]);

  useEffect(() => {
    if (resultPage >= 1) {
      handleSearch(resultPage);
    }
  }, [resultPage]);

  useEffect(() => {
    if (pendingSearch) {
      handleSearch(0);
      setPendingSearch(false);
    }
  }, [query, pendingSearch]);

  const handleShowHistory = () => {
    const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    setSearchHistory(history);
  };

  const handleHistoryItemClick = (item) => {
    setQuery(item);
    setPendingSearch(true);
  };

  const handleShowViews = () => {
    const savedViews = JSON.parse(localStorage.getItem('savedViews')) || [];
    setViewHistory(savedViews);
  };

  const handleViewItemClick = (view) => {
    setQuery(view.query);
    setResults(view.results);
    setResultsIsChecked(view.resultsIsChecked);
    setResultsIsLocked(view.resultsIsLocked);
    setPrompt(view.prompt);
    setTextSummary(view.textSummary);
  }

  const handleSaveView = () => {
    const view = {
      query: query,
      results: results,
      resultsIsChecked: resultsIsChecked,
      resultsIsLocked: resultsIsLocked,
      prompt: prompt,
      textSummary: textSummary
    };
    const viewList = JSON.parse(localStorage.getItem('savedViews')) || [];
    viewList.push(view);
    localStorage.setItem('savedViews', JSON.stringify(viewList));
    alert('View saved successfully!');
  }

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
          onSubmit={(e) => { e.preventDefault(); handleSearch(0); }}
        >
          {/* Search History */}
          <Menu as="div" className="relative inline-block text-left">
            {/* Dropdown Button */}
            <MenuButton
              className="bg-gray-500 text-white px-2 py-2 rounded"
              onClick={handleShowHistory}
              title="Suchverlauf"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </MenuButton>

            {/* Dropdown Content */}
            <MenuItems className="absolute mt-2 bg-white border border-gray-300 rounded shadow-lg p-4 w-64">
              <h3 className="text-lg font-bold mb-2">Suchverlauf:</h3>
              {searchHistory.length > 0 ? (
                <ul className="list-disc pl-5">
                  {searchHistory.map((item, index) => (
                    <MenuItem key={index}>
                      {({ active }) => (
                        <li
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } text-gray-700 cursor-pointer`}
                          onClick={() => handleHistoryItemClick(item)}
                        >
                          {item}
                        </li>
                      )}
                    </MenuItem>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Noch kein Suchverlauf vorhanden.</p>
              )}
            </MenuItems>
          </Menu>
          {/* Lesezeichen */}
          <Menu as="div" className="relative inline-block text-left">
            {/* Dropdown Button */}
            <MenuButton
              className="bg-gray-500 text-white p-2 ml-2 rounded"
              onClick={handleShowViews}
              title="Lesezeichen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v14l7-7 7 7V5a2 2 0 00-2-2H7a2 2 0 00-2 2z" />
              </svg>
            </MenuButton>

            {/* Dropdown Content */}
            <MenuItems className="absolute mt-2 bg-white border border-gray-300 rounded shadow-lg p-4 w-64">
              <h3 className="text-lg font-bold mb-2">Lesezeichen:</h3>
              {viewHistory.length > 0 ? (
                <ul className="list-disc pl-5">
                  {viewHistory.map((item, index) => (
                    <MenuItem key={index}>
                      {({ active }) => (
                        <li
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } text-gray-700 cursor-pointer`}
                          onClick={() => handleViewItemClick(item)}
                        >
                          {item.query}
                        </li>
                      )}
                    </MenuItem>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Noch keine Lesezeichen gesetzt.</p>
              )}
            </MenuItems>
          </Menu>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="border border-gray-300 px-4 py-2 ml-2 w-full"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white pl-4 py-2"
            disabled={isSearching}
          >
            {isSearching ? (
              <div className="spinner-border animate-spin inline-block w-4 h-4 border-2 rounded-full"></div>
            ) : (
              'Suchen'
            )}
          </button>
          {/* Dropdown with search filter */}
          <Menu as="div" className="relative inline-block text-left">
            <MenuButton
              className="bg-blue-500 text-white px-2 py-2 rounded-r"
              title="Filter"
            >
              ▼
            </MenuButton>
            <MenuItems className="absolute right-0 mt-2 bg-white border border-gray-300 rounded shadow-lg p-4 w-72 z-50">
              <div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">Titel</label>
                  <input
                    type="submit"
                    className="border border-gray-300 rounded px-2 py-1 w-full"
                    value={filterTitle}
                    onChange={e => setFilterTitle(e.target.value)}
                    disabled={filterUrl.trim() !== ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Webseite</label>
                  <input
                    className="border border-gray-300 rounded px-2 pt-1 w-full"
                    value={filterUrl}
                    onChange={e => setFilterUrl(e.target.value)}
                    disabled={filterTitle.trim() !== ''}
                  >
                  </input>
                </div>
              </div>
            </MenuItems>
          </Menu>
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
                  onClick={handleSaveView}
                  className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                  disabled={isGenerating || results.length === 0}
                >
                  Speichere Auswahl
                </button>
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
                    <span className="ml-2 text-gray-400">Score: {result.score?.toFixed(2)}</span>
                  </div>
                  <div className="text-sm">{result.text}</div>
                </div>
              )
            })}
            <button
              onClick={() => setResultPage(resultPage + 1)}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
              hidden={results.length === 0}
              disabled={isGenerating || isSearching}
            >+</button>
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