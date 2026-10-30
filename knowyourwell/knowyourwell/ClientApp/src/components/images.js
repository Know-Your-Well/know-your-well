import { useContext, useEffect, useState } from "react";
import Axios from "axios";
import { useSearchParams } from "react-router-dom";
import DatePicker from "react-datetime";
import NumberEntry from "./reusable/numberentry";
import FormFooterReactElement from "./reusable/formFooterReactElement";
import uploadPhoto from "./reusable/photoUpload";
import imagePrompts from "./resources/imageprompts";
import renderField from "./reusable/renderfield";
import prodImageData from "./resources/prodimagedata";
import devImageData from "./resources/devimagedata";
import EntryPrompt from "./reusable/entryprompt";
import WellFieldLabContext from "./reusable/WellFieldLabContext";
import { idbName, putInDB } from "../setupIndexedDB";

const checkFieldType = {
  "Well Owner Consent Form": false,
  "Image Release Consent Form": false,
  "Well Head": true,
  "Nearest Surface Water": true,
  "Nearest Cropland": true,
  "Nearest Barnyard or Pasture": true,
  "Nearest Septic System": true,
  "Uncategorized Item": true,
};

export default function Images() {
  const [images, setImages] = useState([]);
  const [searchParams] = useSearchParams();
  const well_id = parseInt(searchParams.get("id"));
  const wellName = searchParams.get("wellName");
  const wellcode = searchParams.get("wellcode");
  const { coords, imageDataQueue, setLocalImageDataQueue } =
    useContext(WellFieldLabContext);

  let initialImageData;

  if (
    window.location.href.indexOf("kywtest") > -1 ||
    process.env.NODE_ENV !== "production"
  ) {
    initialImageData = devImageData;
  } else {
    initialImageData = prodImageData;
  }
  if (coords?.latitude) {
    initialImageData.im_latitude = coords.latitude;
  }
  if (coords?.longitude){
    initialImageData.im_longitude = coords.longitude;
  }

  const [imageData, setImageData] = useState(initialImageData);
  function updateImageData(fieldName, value) {
    setImageData((prevData) => ({
      ...prevData,
      [fieldName]: value,
    }));
  }

  const handleFileChange = (event) => {
    setImages(Array.from(event.target.files));
  };

  const validForm = () => {
    var form = document.getElementById("submissionAlert");
    if (form.checkValidity()) {
      return true;
    } else {
      form.reportValidity();
      return false;
    }
  };

  async function submitForm() {
    if (
      validForm() &&
      imageData.type &&
      window.confirm(
        `Submitted data is final and can only be edited by Nebraska Water Center Staff.\n\nSubmit this photo as an image of ${imageData.type}?`
      )
    ) {
      try {
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          const containerName = `well-images-${well_id}`;
          const dateObj = new Date(imageData.dateentered);

          const year = dateObj.getFullYear().toString();
          const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
          const day = dateObj.getDate().toString().padStart(2, '0');
          const hour = dateObj.getHours().toString().padStart(2, '0');
          const minute = dateObj.getMinutes().toString().padStart(2, '0');
          const second = dateObj.getSeconds().toString().padStart(2, '0');

          function sanitizeFilename(name) {
            return name.replace(/[\\/#?%*:|"<> ]/g, '-');
          }
          const sanitizedType = sanitizeFilename(imageData.type.toLowerCase());
          const fileExtension = image.name.split('.').pop();
          const blobName = `well-${well_id}-${sanitizedType}-${year}-${month}-${day}-${hour}-${minute}-${second}.${fileExtension}`;

          imageData.blobName = blobName;

          const metadata = {
            observations: imageData.observations || '',
            latitude: imageData.im_latitude?.toString() || '',
            longitude: imageData.im_longitude?.toString() || '',
            dateTaken: dateObj.toISOString(),
            photoType: imageData.type,
          };

          imageData.well_id = well_id;
          const updatedQueue = [
            ...imageDataQueue,
            { ...imageData },
          ];

          await Axios.get(`/heartbeat?timestamp=${Date.now()}`)
            .then(async () => {
              await uploadPhoto(
                image,
                containerName,
                blobName,
                metadata,
              );
              await Axios.post("/createimage", {
                well_id: imageData.well_id,
                im_type: imageData.type,
                im_latitude: imageData.im_latitude ?? 0,
                im_longitude: imageData.im_longitude ?? 0,
                im_genlatitude: imageData.im_latitude ?? 0,
                im_genlongitude: imageData.im_longitude ?? 0,
                name: imageData.name,
                observations: imageData.observations,
                im_filename: imageData.blobName,
                datecollected: imageData.dateentered,
              });
              alert(`Photos submitted! You can upload more by selecting another category, or you can press 'back' to return to ${wellName}.`);
            })
            // If the request fails, we can't connect to the server
            .catch(async () => {
              await putInDB(idbName, "imageUploadQueue", { file: image, containerName: containerName, blobName: blobName, metadata: metadata });
              setLocalImageDataQueue(updatedQueue);
              alert("The application cannot connect to the server. This form will automatically be submitted when the connection to the server is restored.");
            });
        }
        window.location.reload();
      } catch (err) {
        console.log(`Error uploading photos: ${err.message}`);
      }
    }
  }

  const backButton = () => {
    if (
      //If no type has been specified, the user hasn't interacted with the page and has no data to lose.
      imageData.type
        ? window.confirm(
          "Any unsaved data will be lost.\nWould you like to continue?"
        )
        : true
    ) {
      if (well_id != null) {
        window.location.href = `/EditWell?id=${well_id}&wellName=${wellName}&wellcode=${wellcode}`;
      } else {
        window.location.href = `/Well`;
      }
    }
  };

  return (
    <form id="submissionAlert">
      <h2>{wellName}: Upload Images</h2>
      <div className="requiredField">
        <br></br>
        <p>* = Required Field</p>
        <p>
          No punctuation or special characters, such as ,.[]();’/\!@#) in text
          fields.
        </p>
      </div>
      {renderField(
        imagePrompts.find(prompt => {
          return prompt.id === "im_type";
        }),
        imageData,
        updateImageData)}
      {imageData.type ? (
        <div>
          <br />
          <EntryPrompt id='im_image' fieldTitle={`Upload or Take a Photo of the ${imageData.type}`} required={true} />
          <input
            type="file"
            id="cropLand"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            required
          />
          {images.length > 0 && (
            <div>
              <h4>Preview:</h4>
              <div style={{ textAlign: 'center' }}>
                {images.map((img, index) => (
                  <img
                    key={index}
                    src={URL.createObjectURL(img)}
                    alt={`Preview ${index + 1}`}
                    style={{
                      width: "100%",
                      maxWidth: "300px",
                      height: "auto",
                      margin: "5px",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          {checkFieldType[imageData.type] && (
            <div>
              <NumberEntry
                fieldTitle="Latitude (use 4-12 decimals):"
                value={imageData.im_latitude}
                min="40"
                max="43"
                id="im_latitude"
                label="Degrees"
                setValue={(value) => updateImageData("im_latitude", value)}
                required={true}
              />
              <NumberEntry
                fieldTitle="Longitude (use 4-12 decimals):"
                value={imageData.im_longitude}
                min="-104"
                max="-95.417"
                id="im_longitude"
                label="Degrees"
                setValue={(value) => updateImageData("im_longitude", value)}
                required={true}
              />
            </div>
          )}
          {imagePrompts.map((prompt) => (
            prompt.id !== "im_type" &&
            <div key={prompt.id}>
              {renderField(prompt, imageData, updateImageData)}
            </div>
          ))}
          <div className="css">
            <label htmlFor="dateentered">
              Date Entered:
              <span className="requiredField" data-testid="requiredFieldIndicator">
                {" "}
                *
              </span>
            </label>
            <div id="dateentered">
              <DatePicker
                required
                value={imageData.dateentered}
                dateFormat="MM-DD-YYYY"
                timeFormat="hh:mm A"
                onChange={(value) => updateImageData("dateentered", value)}
                inputProps={{
                  style: {
                    width: 300,
                    textAlign: "center",
                    border: "1px solid black",
                  },
                }}
              />{" "}
              {"  "}
            </div>
          </div>
          <FormFooterReactElement submitForm={submitForm} backButton={backButton} saveEnabled={false} />
        </div>
      ) : (
        <div>
          <br />
          <FormFooterReactElement backButton={backButton} saveEnabled={false} submitEnabled={false} />
        </div>
      )}
    </form>
  );
}
