/* eslint-disable @typescript-eslint/no-unused-vars */
import "./App.css";
import { Suspense, useState, useRef, useEffect } from "react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";

import HtmlDocx from "html-docx-ts";
import { saveAs } from "file-saver";

import * as XLSX from "xlsx";
import * as mammoth from "mammoth";

import CustomDialog from "./components/Dialog";

function App() {
  // state for uploaded file
  const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
  const [fileType, setFileType] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // state for edit the content of docx file
  const editorRef = useRef<HTMLDivElement>(null);
  const [editedContent, setEditedContent] = useState<string>("");

  // state for URL input
  const [urlLink, setUrlLink] = useState<string>("");

  // lazy loading
  const renderLoader = () => <p>Loading</p>;

  // handle edit
  const handleEditorInput = () => {
    if (editorRef.current) {
      setEditedContent(editorRef.current.innerHTML);
    }
  };

  useEffect(() => {
    if (editorRef.current && fileType === "docx") {
      editorRef.current.innerHTML = editedContent;
    }
  }, [editedContent, fileType]);

  // handle export docx after edit
  const handleExportDocx = async () => {
    const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Document</title>
  </head>
  <body>
    ${editedContent}
  </body>
</html>
`;

    const buffer = await HtmlDocx?.asBlob(html);

    const arrayBuffer = await (buffer as Blob)?.arrayBuffer();
    const blob = new Blob([arrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    saveAs(blob, "edited.docx");
  };

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
            setEditedContent(result.value);
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
      <h1 id="header">Upload file, preview them easily</h1>
      <h3 id="sub-header">
        File and url upload made easy. Upload file/url to have a preview easily.
      </h3>
      <div className="upload-button-container">
        <input
          type="file"
          accept=".jpeg, .png, .jpg, .pdf, .docx, .xlsx"
          onChange={handleFileChange}
          hidden
          id="upload-button"
        />
        <label htmlFor="upload-button" id="upload-btn-label">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            id="upload-file-icon"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              {" "}
              <path
                d="M17 17H17.01M15.6 14H18C18.9319 14 19.3978 14 19.7654 14.1522C20.2554 14.3552 20.6448 14.7446 20.8478 15.2346C21 15.6022 21 16.0681 21 17C21 17.9319 21 18.3978 20.8478 18.7654C20.6448 19.2554 20.2554 19.6448 19.7654 19.8478C19.3978 20 18.9319 20 18 20H6C5.06812 20 4.60218 20 4.23463 19.8478C3.74458 19.6448 3.35523 19.2554 3.15224 18.7654C3 18.3978 3 17.9319 3 17C3 16.0681 3 15.6022 3.15224 15.2346C3.35523 14.7446 3.74458 14.3552 4.23463 14.1522C4.60218 14 5.06812 14 6 14H8.4M12 15V4M12 4L15 7M12 4L9 7"
                stroke="#ffbc3f"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>{" "}
            </g>
          </svg>
          <h3>Click here to upload and render your file</h3>
          <p id="Mime-type">Supported files: .pdf .docx .xlsx .jpeg and .jpg</p>
        </label>
      </div>
      <div className="separated-section-text">OR</div>
      <div id="url-input-container">
        <input
          type="text"
          placeholder="Enter file url"
          value={urlLink}
          onChange={handleUrlChange}
          id="URL-input"
        />
        <CustomDialog></CustomDialog>
        {/* <button onClick={handleFetchContent} id="render-url-btn">
          Submit
        </button> */}
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
            </div>
          )}

          {fileType === "docx" && fileContent && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "transparent",
                border: "1px solid white",
              }}
            >
              <div
                ref={editorRef}
                contentEditable
                onChange={handleEditorInput}
                // {...(editorRef.current === null && {
                //   dangerouslySetInnerHTML: { __html: editedContent },
                // })}
                style={{
                  padding: "1rem",
                  backgroundColor: "white",
                  border: "1px solid white",
                }}
              ></div>

              <button
                onClick={handleExportDocx}
                style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
              >
                Export to DOCX
              </button>
            </div>
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
