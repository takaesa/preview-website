/* eslint-disable @typescript-eslint/no-unused-vars */
import "./App.css";
import { useState } from "react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";

import * as XLSX from "xlsx";
import * as mammoth from "mammoth";

function App() {
  const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
  const [docContent, setDocContent] = useState<string>("");

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

        const table = document.getElementById("table");
        if (table) {
          table.innerHTML = htmlString;
        }
      }
    };

    reader.readAsArrayBuffer(file);
    console.log("run convert xlsx to html");
  };

  // render Docx file
  // Convert DOCX to HTML using Mammoth
  const convertDocxToHtml = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = (e) => {
      const wordData = e.target?.result;

      if (wordData && wordData instanceof ArrayBuffer) {
        mammoth
          .convertToHtml({ arrayBuffer: wordData })
          .then((result) => {
            setDocContent(result.value);
          })
          .catch((error) => {
            console.error("Error parsing the Word document:", error);
            alert("Error processing the DOCX file.");
          });
      } else {
        console.error("Invalid file format, expected ArrayBuffer.");
      }
    };
    reader.readAsArrayBuffer(file);
    console.log("run convert doc to html");
  };

  // renderFile
  const renderFile = (file: File) => {
    const fileType = file.name.split(".").pop()?.toLowerCase();
    const fileUrl = window.URL.createObjectURL(file);

    if (
      fileType === "pdf" ||
      fileType === "jpeg" ||
      fileType === "png" ||
      fileType === "jpg"
    ) {
      return (
        <DocViewer
          documents={[{ uri: fileUrl, fileName: file.name }]}
          pluginRenderers={DocViewerRenderers}
        />
      );
    } else if (fileType === "docx") {
      convertDocxToHtml(file);
      return <div dangerouslySetInnerHTML={{ __html: docContent }} />;
    } else if (fileType === "xlsx") {
      renderExcelAsTable(file);
      return <table id="table" />;
    } else {
      return <div>Unsupported file type: {file.name}</div>;
    }
  };

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <input
        type="file"
        accept=".jpeg, .png, .jpg, .pdf, .docx, .xlsx"
        multiple
        onChange={handleFileChange}
      />
      <div>
        {selectedDocs.length > 0 &&
          selectedDocs.map((file, index) => (
            <div key={index} style={{ margin: "20px 0" }}>
              {renderFile(file)}
            </div>
          ))}
      </div>
    </div>
  );
}

export default App;
