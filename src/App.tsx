/* eslint-disable @typescript-eslint/no-unused-vars */
import "./App.css";
import { Suspense, useState } from "react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";

import * as XLSX from "xlsx";
import * as mammoth from "mammoth";

function App() {
  // state for uploaded file
  const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
  const [fileType, setFileType] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // state for URL input
  const [urlLink, setUrlLink] = useState<string>("");

  // lazy loading
  const renderLoader = () => <p>Loading</p>;

  // file change handler
  const handleFileChange = (el: React.ChangeEvent<HTMLInputElement>) => {
    setFileContent(null);
    if (el.target.files?.length) {
      const file = el.target.files[0];
      setSelectedDocs([file]);

      setError(null);
      renderFile(file);
    }
  };

  // url change handler
  const handleUrlChange = (el: React.ChangeEvent<HTMLInputElement>) => {
    setUrlLink(el.target.value);
  };

  // URL RENDERING -----------------------

  // fetch url link
  const handleFetchContent = async () => {
    setError(null);
    setFileType(null);
    setFileContent(null);

    const extension = urlLink.split(".").pop()?.toLowerCase();
    if (!extension) {
      alert("Invalid URL format.");
      return;
    }

    if (
      extension === "pdf" ||
      extension === "jpeg" ||
      extension === "jpg" ||
      extension === "png"
    ) {
      fetchUrlContent(urlLink, "file");
    } else if (extension === "docx") {
      fetchUrlContent(urlLink, "docx");
    } else if (extension === "xlsx") {
      fetchUrlContent(urlLink, "xlsx");
    } else {
      alert("Unsupported file type");
    }
  };

  // fetch content from URL
  const fetchUrlContent = async (url: string, type: string) => {
    // const proxyURL = "https://cors-anywhere.herokuapp.com/";
    try {
      const response = await fetch(url);
      if (!response) throw new Error("Failed to fetch file.");

      const content = await response.blob();

      if (
        type === "file" &&
        ["pdf", "jpeg", "jpg", "png"].includes(
          // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
          url.split(".").pop()?.toLowerCase()!
        )
      ) {
        const urlContent = URL.createObjectURL(content);
        setFileType(type);
        setFileContent(urlContent);
      } else if (type === "docx") {
        const arrayBuffer = await content.arrayBuffer();

        mammoth
          .convertToHtml({ arrayBuffer })
          .then((result) => {
            setFileType("docx");
            setFileContent(result.value);
          })
          .catch((err) => {
            setError(`Error processing Docx: ${err.message}`);
          });
      } else if (type === "xlsx") {
        const arrayBuffer = await content.arrayBuffer();

        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const htmlString = XLSX.utils.sheet_to_html(worksheet);

        setFileType("xlsx");
        setFileContent(htmlString);

        const table = document.getElementById("table");
        if (table) {
          table.innerHTML = htmlString;
        }
      }
    } catch (error) {
      setError(`Error fetching or processing the file:`);
    }
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
      // setFileType("file");
      // setFileContent(fileUrl);
      return (
        <DocViewer
          documents={[{ uri: fileUrl, fileName: file.name }]}
          pluginRenderers={DocViewerRenderers}
        />
      );
    } else if (fileType === "docx") {
      convertDocxToHtml(file);
      return null;
    } else if (fileType === "xlsx") {
      renderExcelAsTable(file);
      return null;
    } else {
      setError(`Unsupported file type: ${file.name}`);
      return null;
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

        setFileType("xlsx");
        setFileContent(htmlString);
        const table = document.getElementById("table");
        if (table) {
          table.innerHTML = htmlString;
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Convert DOCX to HTML using Mammoth
  const convertDocxToHtml = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = (e) => {
      const wordData = e.target?.result;

      if (wordData && wordData instanceof ArrayBuffer) {
        mammoth
          .convertToHtml({ arrayBuffer: wordData })
          .then((result) => {
            setFileType("docx");
            setFileContent(result.value);
          })
          .catch((error) => {
            setError(`Error processing docx file: ${error.message}`);
          });
      } else {
        console.error("Invalid file format, expected ArrayBuffer.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-evenly",
          alignItems: "center",
        }}
      >
        {/* upload section area */}
        <input
          type="file"
          accept=".jpeg, .png, .jpg, .pdf, .docx, .xlsx"
          multiple
          onChange={handleFileChange}
          hidden
          id="upload-button"
        />
        <label htmlFor="upload-button">Choose File</label>
        <input
          type="text"
          placeholder="Enter file url"
          value={urlLink}
          onChange={handleUrlChange}
          id="URL-input"
        />
        <button onClick={handleFetchContent} id="render-url-btn">
          Render URL
        </button>
      </div>
      <div>
        <Suspense fallback={renderLoader()}>
          {selectedDocs.length > 0 &&
            selectedDocs.map((file, index) => (
              <div key={index} style={{ marginTop: "20px" }}>
                {renderFile(file)}
              </div>
            ))}
        </Suspense>

        {/* URL section area */}

        {/* Render content base on fileType */}
        {error && <p style={{ color: "red" }}>{error}</p>}

        <Suspense fallback={renderLoader()}>
          {fileType === "file" && fileContent && (
            <div>
              <DocViewer
                documents={[{ uri: fileContent }]}
                pluginRenderers={DocViewerRenderers}
              />

              <div>clg</div>
            </div>
          )}

          {fileType === "docx" && fileContent && (
            <div
              style={{
                marginTop: "1rem",
                padding: ".75rem",
                border: "1px solid #ccc",
              }}
              dangerouslySetInnerHTML={{ __html: fileContent }}
            ></div>
          )}

          {fileType === "xlsx" && fileContent && (
            <div
              style={{
                marginTop: "20px",
                padding: "10px",
                border: "1px solid #ccc",
                overflowY: "scroll",
                height: "400px",
              }}
              dangerouslySetInnerHTML={{ __html: fileContent }}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}

export default App;
