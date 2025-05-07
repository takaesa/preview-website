/* eslint-disable @typescript-eslint/no-unused-vars */
import "./App.css";
import { useState } from "react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";

import * as XLSX from "xlsx";

function App() {
  const [selectedDocs, setSelectedDocs] = useState<File[]>([]);

  const handleFileChange = (el: React.ChangeEvent<HTMLInputElement>) => {
    if (el.target.files?.length) {
      setSelectedDocs(Array.from(el.target.files));
    }
  };

  // render Excel file
  const renderExcelAsTable = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;
      if (data) {
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const htmlString = XLSX.utils.sheet_to_html(worksheet);

        return htmlString;
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // render Docx file
  const parseWordDocxFile = (file: File) => {};

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <input
        type="file"
        accept=".jpeg, .png, .jpg, .pdf, .docx, .xlsx"
        multiple
        onChange={handleFileChange}
      />
      <DocViewer
        documents={selectedDocs.map((file) => ({
          uri: window.URL.createObjectURL(file),
          fileName: file.name,
        }))}
        pluginRenderers={DocViewerRenderers}
        prefetchMethod="GET"
      />
      ;
    </div>
  );
}

export default App;
