import React, { useEffect, useState } from "react";
import "./css/forms.css";
import moment from "moment";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useUser } from "./usercontext";
import {getImageSrc, offlineGet} from "./offlineCache";

const nameMap = {
  "im_type": "Image Type:",
  "im_datacollector": "Data Collector’s Name:",
  "im_latitude": "Latitude:",
  "im_longitude": "Longitude:",
  "im_observation": "Observations:",
};

const imageInfo = [
  "im_type",
  "im_datacollector",
  "im_latitude",
  "im_longitude",
  "im_observation",
];

let formElements = [];

export default function ViewImage() {
  console.log("knowyourwell/knowyourwell/ClientApp/src/components/viewImage.js --> ViewImage")
  const [searchParams] = useSearchParams();
  const image_id = parseInt(searchParams.get("image_id"));
  const wellName = searchParams.get("wellName");
  const well_id = searchParams.get("well_id");
  const wellcode = searchParams.get("wellcode");
  const navigate = useNavigate();
  const { user } = useUser();

  useEffect(() => {
    if (user?.displayn === "") {
      alert("You are not yet logged in. Please log in.");
      navigate("/");
    }
  }, [navigate, user]);

  const backButton = () => {
    window.location.href = `/PreviousImages?id=${well_id}&wellName=${wellName}&wellcode=${wellcode}`;
  };

  const [isLoading, setLoading] = useState(true);
  useEffect(() => {
    offlineGet("/GetImage", { image_id }).then(async (response) => {
      const img = response.data.Image[0];
      const azureUrl = await getImageSrc(well_id, img.im_filename);
      formElements = { azureUrl, ...img };
      setLoading(false);
    });
  }, [well_id, image_id]);

  const imageInfoList = [];
  for (const key of imageInfo) {
    imageInfoList.push([key, formElements[key]]);
  }

  let columnList = [];

  if (formElements) {
    const fields = imageInfoList;
    columnList.push(
      fields.map((field, index) => {
        if (index % 2 === 0) {
          return (
            <div key={index} className="row">
              <div className="col">
                <p style={{ textAlign: "left" }}>
                  <b>{nameMap[field[0]]}</b> {field[1] || "None Provided"}
                </p>
              </div>
              <div className="col">
                {fields[index + 1] &&
                  <p style={{ textAlign: "left" }}>
                    <b>{nameMap[fields[index + 1][0]]}</b> {fields[index + 1][1] || "None Provided"}
                  </p>
                }
              </div>
            </div>
          );
        }
        return null;
      })
    );

    return (
      <div className="css">
        <h2>{wellName}: Image</h2>
        <br />
        <div className="container" style={{ textAlign: "center" }}>
          <div>
            <img
              src={formElements.azureUrl}
              alt="Previous Upload"
              style={{ width: "100%", maxWidth: "300px", height: "auto" }}
              required={true}
            />
          </div>
          <br />
          {columnList}
          <div key="dateentered" className="row">
            <div className="col">
              <p style={{ textAlign: "left" }}>
                <b>Date Entered:</b>{" "}
                {moment
                  .utc(formElements["fa_dateentered"])
                  .format("MM-DD-YYYY hh:mm A")}
              </p>
            </div>
          </div>
          <br />
          <button
            type="button"
            style={{ width: "130px", height: "17%" }}
            className="btn btn-primary btn-lg"
            onClick={backButton}
          >
            Back
          </button>
          <br />
          <br />
          <a href="mailto:knowyourwell@unl.edu" style={{ textAlign: "center" }}>
            If any data is incorrect email us at knowyourwell@unl.edu
          </a>
        </div>
      </div>
    );
  } else {
    return (
      <div className="container" style={{ textAlign: "center" }}>
        <h1>Loading</h1>
        <button
          type="button"
          style={{ width: "130px", height: "17%" }}
          className="btn btn-primary btn-lg"
          onClick={backButton}
        >
          Back
        </button>
      </div>
    );
  }
}
