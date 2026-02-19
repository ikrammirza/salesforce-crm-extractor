import { useEffect, useState } from "react";

export default function App() {
  const [data, setData] = useState({});

  useEffect(() => {
    chrome.storage.local.get(["salesforce_data"], (res) => {
      setData(res.salesforce_data || {});
    });

    chrome.storage.onChanged.addListener(() => {
      chrome.storage.local.get(["salesforce_data"], (res) => {
        setData(res.salesforce_data || {});
      });
    });
  }, []);

  const extract = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id) return;

    chrome.tabs.sendMessage(tab.id, { type: "EXTRACT" }, (resp) => {
      // If you see an error here, it helps debug quickly
      if (chrome.runtime.lastError) {
        console.log("sendMessage error:", chrome.runtime.lastError.message);
      } else {
        console.log("EXTRACT sent:", resp);
      }
    });
  });
};

  return (
    <div className="p-4 w-80 text-sm">
      <h1 className="font-bold mb-2">Salesforce Extractor</h1>

      <button
        onClick={extract}
        className="bg-blue-600 text-white px-3 py-1 rounded"
      >
        Extract Current Object
      </button>

      <pre className="mt-3 bg-gray-100 p-2 rounded text-xs overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

