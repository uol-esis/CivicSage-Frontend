import React, {useState, useEffect} from 'react';
import * as CivicSage from 'civic_sage';

export default function Overview() {
  const [content, setContent] = useState([]);
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [errorNotifications, setErrorNotifications] = useState([]);  

  useEffect(() => {
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);

    apiInstance.getAllIndexedSources({}, (error, data, response) => {
      if (error) {
        console.error(error);
        showErrorNotification('Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.');
        setContent([]);
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
        showErrorNotification('Der Eintrag konnte nicht gelöscht werden. Bitte versuche es später erneut.');
      } else {
        showNotification('Eintrag erfolgreich gelöscht.');
        setContent(prevContent => ({
          ...prevContent,
          files: prevContent.files.filter(file => file.fileId !== id),
          websites: prevContent.websites.filter(website => website.websiteId !== id)
        }));
      }
    });
  }

  const handleUpdateWebsite = (ids) => {
    //showErrorNotification('Update functionality is not implemented yet. IDS: ' + ids.join(', '));
    console.log('Update functionality is not implemented yet. IDS:', ids);
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    let updateIndexedWebsiteRequest = new CivicSage.UpdateIndexedWebsiteRequest(); 
    updateIndexedWebsiteRequest.ids = ids;
    apiInstance.updateIndexedWebsite(updateIndexedWebsiteRequest, (error, data, response) => {
      apiInstance.getAllIndexedSources({}, (error, data, response) => {
        if (error) {
          console.error(error);
          showErrorNotification('Es gab einen Fehler beim Anzeigen der Websites. Bitte lade die Seite neu.');
        } else {
          setContent(data);
        }
      });
      if (error) {
        console.error(error);
        showErrorNotification('Ups, da ist etwas schief gelaufen. Bitte versuche es später erneut. Alternativ, versuche weniger Websites auf einmal zu aktualisieren oder lösche die Seite manuell und lade sie erneut hoch.');
      } else {
        showNotification('Die Webseite wird gerade aktualisiert. Es kann eine Weile dauern, bis sie in der Suche verfügbar ist.', 'bg-yellow-600', 8000);
        console.log('API called successfully.');
      }
    });
  }


  const filteredFiles = content.files?.filter(
    file =>
      (file.fileName && file.fileName.toLowerCase().includes(search.toLowerCase())) ||
      (file.title && file.title.toLowerCase().includes(search.toLowerCase())) ||
      (file.uploadDate &&
        (new Date(file.uploadDate).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).toLowerCase().includes(search.toLowerCase())
        )
      )
  ) || [];

  const filteredWebsites = content.websites?.filter(
    website =>
      (website.title && website.title.toLowerCase().includes(search.toLowerCase())) ||
      (website.url && website.url.toLowerCase().includes(search.toLowerCase())) ||
      (website.uploadDate &&
        (new Date(website.uploadDate).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).toLowerCase().includes(search.toLowerCase())
        )
      )
  ) || [];

  function showNotification(message, color = 'bg-green-500', timer = 5000) {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, color }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, timer);
  }

  function showErrorNotification(message) {
    const id = Date.now() + Math.random();
    setErrorNotifications(prev => [...prev, { id, message, color: 'bg-red-500' }]);
    // Do not auto-hide error notifications
  }

  return (
  <div className="flex flex-col justify-between m-4 p-4 h-full bg-white shadow rounded-[10px]">
    <h1 className="sr-only">CivicSage – Übersichtsseite</h1>
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {errorNotifications.map(n => (
        <div key={n.id} className={`${n.color} text-white px-6 py-3 rounded shadow-lg relative w-full`}>
          {n.message}
          <button
            className="absolute top-1 right-2 text-white text-lg font-bold"
            onClick={() => setErrorNotifications(prev => prev.filter(e => e.id !== n.id))}
            aria-label="Schließen"
            type="button"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      ))}
      {notifications.map(n => (
        <div key={n.id} className={`${n.color} text-white px-6 py-3 rounded shadow-lg relative w-full`}>
          {n.message}
          <button
            className="absolute top-1 right-2 text-white text-lg font-bold"
            onClick={() => setNotifications(prev => prev.filter(e => e.id !== n.id))}
            aria-label="Schließen"
            type="button"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
    <div className="flex flex-row items-center justify-between">
      <div />
      <h2 className="text-xl font-bold text-center">
        Übersicht aller Inhalte
      </h2>
      <div>
      <button
        className="flex-shrink-0 mr-4 text-blue-700 hover:underline"
        onClick={() => handleUpdateWebsite(filteredWebsites.map(item => item.websiteId))}
      >
        Aktualisiere angezeigte Websites
      </button>
      <input
        type="text"
        placeholder="Suche nach Inhalten..."
        className="justify-self-end p-2 border rounded w-64 outline-none focus:ring-2 ring-blue-500"
        onChange={(e) => {setSearch(e.target.value)}}
        aria-label='Nach Inhalten suchen'
      />
      </div>
    </div>
    <div className="overflow-y-auto h-full">
      {filteredFiles.length > 0 || filteredWebsites.length > 0 ? (
        <>
          {filteredFiles.map((item, index) => (
            <div
              key={`file-${index}`}
              className="relative flex items-center mb-2 p-2 border-b"
            >
              <div className="flex-1 min-w-0 flex flex-row">
                <span className="font-semibold basis-[40%] min-w-0 pr-4 truncate block whitespace-nowrap overflow-x-auto text-left"
                  tabIndex={0} 
                >
                  {item.title}
                </span>
                <span className="text-gray-600 basis-[45%] min-w-0 block whitespace-nowrap overflow-x-auto text-left mr-4"
                  tabIndex={0}
                >
                  {item.fileName}
                </span>
                <span className="text-gray-600 basis-[15%] min-w-0 block whitespace-nowrap overflow-x-auto text-left mr-2">
                  {item.uploadDate ? new Date(item.uploadDate).toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Unbekannt'}
                </span>
              </div>
              <span
                className="flex-shrink-0 ml-4 opacity-0"
                tabIndex={-1}
                aria-hidden="true"
              >
                Aktualisieren
              </span>
              <button
                className="flex-shrink-0 ml-4 text-blue-700 hover:underline"
                onClick={() => handleDeleteEntry(item.fileId)}
              >
                Löschen
              </button>
            </div>
          ))}
          {filteredWebsites.map((item, index) => (
            <div
              key={`website-${index}`}
              className="relative flex items-center mb-2 p-2 border-b"
            >
              <div className="flex-1 min-w-0 flex flex-row">
                <span className="font-semibold basis-[40%] min-w-0 pr-4 truncate block whitespace-nowrap overflow-x-auto text-left"
                  tabIndex={0} 
                >  
                  {item.title}
                </span>
                <a
                  className="text-gray-600 basis-[45%] min-w-0 block whitespace-nowrap overflow-x-auto text-left mr-4"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={0}
                >
                  {item.url}
                </a>
                <span className="text-gray-600 basis-[15%] min-w-0 block whitespace-nowrap overflow-x-auto text-left mr-2"
                  tabIndex={0}
                >
                  {item.uploadDate ? new Date(item.uploadDate).toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Unbekannt'}
                </span>
              </div>
              <button
                className="flex-shrink-0 ml-4 text-blue-700 hover:underline"
                onClick={() => handleUpdateWebsite([item.websiteId])}
              >
                Aktualisieren
              </button>
              <button
                className="flex-shrink-0 ml-4 text-blue-700 hover:underline"
                onClick={() => handleDeleteEntry(item.websiteId)}
              >
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