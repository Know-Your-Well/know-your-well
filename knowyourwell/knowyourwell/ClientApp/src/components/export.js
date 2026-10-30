import React from "react";
import { List } from "semantic-ui-react";
import Axios from "axios";
import {jsPDF} from "jspdf";
import autoTable from "jspdf-autotable";
import csvKey from "./resources/csvkey";
import EntryPrompt from "./reusable/entryprompt";

const openDownloadDialog = (file) => {
  const link = document.createElement("a");
  const url = URL.createObjectURL(file);
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const sendExportEvent = (type) => {
  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-9SVHGVZ6R2');
  gtag('event', type);
}

const exportCSV = () => {
  sendExportEvent('detailed_export');
  Axios.get("/csvqueries", {
    responseType: "json",
  })
    .then(function (response) {
      let csv = [""];
      let headerRow = 1;
      for (let i = 0; i < response.data.Data.length; i++) {
        csv[i + 1] = "";
        for (const [key, value] of Object.entries(response.data.Data[i])) {
          if (headerRow) {
            csv[0] += csvKey[key] + ",";
          }
          csv[i + 1] += value + ",";
        }
        csv[i + 1] += "\n";
        headerRow = 0;
      }
      csv[0] += "\n";
      const file = new File(csv, `welldata_${Date().slice(0, 24).replaceAll(" ", "_")}.csv`, {
        type: "text/csv",
      });

        openDownloadDialog(file);
        exportPDF();   //export pdf file

    })
    .catch(function (error) {
      console.error("Error fetching data:", error);
    });
};

const exportImagePDF = () => {
  Axios.get("/allImageMetadata", {
    responseType: "json",
  })
    .then(function (response) {
      const data = response.data.Data;
      if (!data.length) {
        return;
      }
      const keys = Object.keys(data[0]);
      const head = keys.map((k) => csvKey[k] ?? k);
      const body = data.map((row) => keys.map((k) => String(row[k] ?? "")));

      const pageWidth = Math.max(297, head.length * 20);
      const doc = new jsPDF({ orientation: "landscape", format: [pageWidth, 210] });
      autoTable(doc, {
        head: [head],
        body: body,
        styles: { fontSize: 6, cellPadding: 1, overflow: "linebreak" },
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      });

      const file = new File(
        [doc.output("blob")],
        `imagedata_${Date().slice(0, 24).replaceAll(" ", "_")}.pdf`,
        { type: "application/pdf" }
      );
      openDownloadDialog(file);
    })
    .catch(function (error) {
      console.error("Error exporting image PDF:", error);
    });
};

const exportImageMetadata = () => {
  sendExportEvent('image_export');
  Axios.get('/allImageMetadata', {
    responseType: "json",
  }).then((response) => {
    const dataArray = response.data.Data;
    let csv = [""];
    let headerRow = 1;
    for (let i = 0; i < dataArray.length; i++) {
      csv[i + 1] = "";
      const finalKey = Object.keys(dataArray[i]).at(-1);
      for (const [key, value] of Object.entries(dataArray[i])) {
        if (headerRow) {
          csv[0] += csvKey[key] + ",";
          if (key === finalKey) {
            csv[0] += "\n";
          }
        }
        csv[i + 1] += value + ",";
      }
      csv[i + 1] += "\n";
      headerRow = 0;
    }
    const file = new File(csv, `imagedata_${Date().slice(0, 24).replaceAll(" ", "_")}.csv`, {
      type: "text/csv",
    });
    openDownloadDialog(file);
    exportImagePDF();   //export pdf file
  }).catch((error) => {
    console.log(error);
  });
};

const exportPDF = () => {
  Axios.get("/csvqueries", {
    responseType: "json",
  })
    .then(function (response) {
      const data = response.data.Data;
      if (!data.length) {
        alert("No data to export.");
        return;
      }
      const keys = Object.keys(data[0]);
      const head = keys.map((k) => csvKey[k] ?? k);
      const body = data.map((row) => keys.map((k) => String(row[k] ?? "")));

      const pageWidth = Math.max(297, head.length * 20);
      const doc = new jsPDF({ orientation: "landscape", format: [pageWidth, 210] });
      autoTable(doc, {
        head: [head],
        body: body,
        styles: { fontSize: 6, cellPadding: 1, overflow: "linebreak" },
        headStyles: { fillColor: [41, 128, 185] },
      });

      const file = new File(
        [doc.output("blob")],
        `welldata_${Date().slice(0, 24).replaceAll(" ", "_")}.pdf`,
        { type: "application/pdf" }
      );
      openDownloadDialog(file);
    })
    .catch(function (error) {
      console.error("Error exporting PDF:", error);
    });
};



export default function ExportPage() {
  return (
    <form
      style={{
        display: "block",
        textAlign: "center",
        margin: "20px",
        fontSize: 16,
      }}
    >
      <List style={{ textAlign: "center" }}>
        <h2>
          Export Data
        </h2>
        <br />
        <List.Item>
          <List.Content>
            <EntryPrompt id='ex_all' fieldTitle={"Well, Field, Class & Water Science Lab"} />
            <p>All data for School separated by commas</p>
            <button
              type="button"
              onClick={exportCSV}
              className="btn btn-primary"
              style={{ width: "12em" }}
            >
              Download Data
            </button>
          </List.Content>
        </List.Item>
        <br />
        <List.Item>
          <List.Content>
            <EntryPrompt id='ex_image' fieldTitle={"Well & Image"} />
            <p>Selected well data and all image data; no actual images</p>
            <button
              type="button"
              onClick={exportImageMetadata}
              className="btn btn-primary"
              style={{ width: "12em" }}
            >
              Download Data
            </button>
          </List.Content>
        </List.Item>
        <br />
      </List>
    </form>
  );
}