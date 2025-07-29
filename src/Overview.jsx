import React, {useState, useEffect} from 'react';
import * as CivicSage from 'civic_sage';

export default function Overview() {
  const [content, setContent] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);

    apiInstance.getAllIndexedSources({}, (error, data, response) => {
      if (error) {
        console.error(error);
      } else {
        setContent(data);
      }
    });
  }, []);

  const handleDeleteEntry = (id) => {
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);

    apiInstance.deleteIndexedSource(id, (error, data, response) => {
      if (error) {
        console.error(error);
        alert('Error deleting entry.');
      } else {
        alert('Entry deleted successfully.');
        setContent(prevContent => ({
          ...prevContent,
          files: prevContent.files.filter(file => file.fileId !== id),
          websites: prevContent.websites.filter(website => website.websiteId !== id)
        }));
      }
    });
  }

  const filteredFiles = content.files?.filter(
    file =>
      (file.fileName && file.fileName.toLowerCase().includes(search.toLowerCase())) ||
      (file.title && file.title.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  const filteredWebsites = content.websites?.filter(
    website =>
      (website.title && website.title.toLowerCase().includes(search.toLowerCase())) ||
      (website.url && website.url.toLowerCase().includes(search.toLowerCase()))
  ) || [];


  return (
  <div className="flex flex-col justify-between m-4 p-4 h-full bg-white shadow rounded-[10px]">
    <div className="flex flex-row items-center justify-between">
      <div />
      <h2 className="text-xl font-bold text-center">
        Übersicht aller Inhalte
      </h2>
      <input
        type="text"
        placeholder="Suche nach Inhalten..."
        className="justify-self-end p-2 border rounded w-64"
        onChange={(e) => {setSearch(e.target.value)}}
      />
    </div>
    <div className="overflow-y-auto h-full">
      {filteredFiles.length > 0 || filteredWebsites.length > 0 ? (
        <>
          {filteredFiles.map((item, index) => (
            <div key={`file-${index}`} className="flex mb-2 p-2 border-b">
              <span className="font-semibold pr-4">{item.fileName}</span>
              <span className="text-gray-600">{item.title}</span>
              <button className="absolute right-4 mr-4 text-blue-500 hover:underline" onClick={() => handleDeleteEntry(item.fileId)}>
                Löschen
              </button>
            </div>
          ))}
          {filteredWebsites.map((item, index) => (
            <div key={`website-${index}`} className="flex mb-2 p-2 border-b">
              <span className="font-semibold pr-4">{item.title}</span>
              <a className="text-gray-600" href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>
              <button className="absolute right-4 mr-4 text-blue-500 hover:underline" onClick={() => handleDeleteEntry(item.websiteId)}>
                Löschen
              </button>
            </div>
          ))}
        </>
      ) : (
        <p className="text-gray-500">Keine Inhalte gefunden.</p>
      )}
    </div>
  </div>
  );
}