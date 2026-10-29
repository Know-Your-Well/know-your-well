import { useEffect, useState } from "react";
import Modal from "react-modal";
import {
  idbName,
  getFromDB,
  getFilteredRecordsFromDB,
} from "../../setupIndexedDB";

const EntryPrompt = ({ id, fieldTitle, required }) => {
  const [modalIsOpen, setIsOpen] = useState(false);
  const [tooltipText, setTooltipText] = useState();
  const [tooltipImages, setTooltipImages] = useState([]);

  const getIndicators = () => {
    return (
      <>
        {(tooltipText || tooltipImages.length !== 0) && (
          <>
            {/* Since we're effectively using a link as a button, it doesn't need an href attribute.*/}
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a
              className="tooltipButton"
              data-testid={`tooltipButton-${id}`}
              onClick={() => setIsOpen(true)}
              tabIndex="0"
            >
              {" "}
              ⓘ
            </a>
            <Modal
              appElement={document.getElementById("root") || undefined}
              isOpen={modalIsOpen}
              onRequestClose={() => setIsOpen(false)}
            >
              <div className="tooltipContent">
                <div className="titleBar">
                  {/* The regex pattern removes a ':' at the end of the title if one exists */}
                  <h2>{fieldTitle.replace(/:$/, "")}</h2>
                  <button data-testid={`tooltipClose-${id}`} onClick={() => setIsOpen(false)}>&#x2715;</button>
                </div>
                {tooltipImages}
                <p>{tooltipText}</p>
              </div>
            </Modal>
          </>
        )}
        {required && (
          <span
            className="requiredField"
            // TODO: Make the data-testid unique for each EntryPrompt, based on `id`.
            data-testid="requiredFieldIndicator"
          >
            {" "}
            *
          </span>
        )}
      </>
    );
  };

  useEffect(() => {
    getFromDB(idbName, "tblTooltip", id)
      .then((tooltip) => {
        if (tooltip.active) setTooltipText(tooltip.text);
      })
      .catch(() => {
        setTooltipText();
      });
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const tooltipImages = await getFilteredRecordsFromDB(
          idbName,
          "tblTooltipImage",
          (record) => {
            return record.prompt_id === id && record.active;
          },
        );
        const images = [];
        for (const [i, tooltipImage] of tooltipImages.entries()) {
          const image = await getFromDB(
            idbName,
            "tooltip-images",
            tooltipImage.im_filename,
          );
          images.push(
            <img
              key={`${tooltipImage.promptId}-img-${i}`}
              alt={`${tooltipImage.promptId} #${i}`}
              src={URL.createObjectURL(image.blob)}
            />,
          );
        }
        setTooltipImages(images);
      } catch (error) {
        console.log("knowyourwell/knowyourwell/ClientApp/src/components/reusable/entryprompt.js --> EntryPrompt --> useEffect , error: "+error);
        setTooltipImages([]);
      }
    };

    fetchImages();
  }, []);

  const insertLineBreaks = (fieldTitle) => {
    if (fieldTitle.length <= 60) {
      return (
        <div>
          {fieldTitle}
          {getIndicators()}
        </div>
      );
    }
    const wordsOrParts = fieldTitle.split(/(?<=\s)/);
    let currentLine = "";
    const lines = [];
    for (let wordOrPart of wordsOrParts) {
      if (currentLine.length + wordOrPart.length <= 40) {
        currentLine += wordOrPart;
      } else {
        lines.push(currentLine);
        currentLine = wordOrPart;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.map((line, index) => (
      <div key={index}>
        {line}
        {index === lines.length - 1 && getIndicators()}
      </div>
    ));
  };

  return (
    <label
      htmlFor={id}
      onClick={(e) => {
        if (e.target.nodeName === "A") e.preventDefault();
      }}
      style={{ marginBottom: 0 }}
    >
      {insertLineBreaks(fieldTitle)}
    </label>
  );
};

export default EntryPrompt;
