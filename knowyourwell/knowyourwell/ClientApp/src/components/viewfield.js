import React, { useEffect, useState } from "react";
import "./css/forms.css";
import Axios from "axios";
import moment from "moment";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { useUser } from "./usercontext";

let formElements = [];

const nameMap = {
  "fa_weather": "Conditions: Weather, temperature, or anything note-worthy the well:",
  "fa_wellcovercondition": "Condition of the well cover:",
  "fa_wellcoverdescription": "Well Cover Description:",
  "fa_topography": "Topography of the well location:",
  "fa_surfacerunoff": "Evidence of surface run-off entry to the well:",
  "fa_pooling": "Evidence of pooling or puddles within 12 ft of the well:",
  "fa_groundwatertemp": "Groundwater Temperature [Degrees Celsius]:",
  "fa_ph": "pH [0-14]:",
  "fa_conductivity": "Conductivity [uS/cm]:",
  "fa_datacollector": "Data Collector’s Name:",
  "fa_latitude": "Latitude:",
  "fa_longitude": "Longitude:",
  "fa_observation": "Observations:",
}

const fieldInfo = [
  "fa_weather",
  "fa_wellcovercondition",
  "fa_wellcoverdescription",
  "fa_topography",
  "fa_surfacerunoff",
  "fa_pooling",
  "fa_groundwatertemp",
  "fa_ph",
  "fa_conductivity",
  "fa_datacollector",
  "fa_latitude",
  "fa_longitude",
  "fa_observation",
];

export default function ViewField() {
  const [searchParams] = useSearchParams();
  const fieldactivity_id = parseInt(searchParams.get("fieldactivity_id"));
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
    window.location.href = `/PreviousEntries?id=${well_id}&wellName=${wellName}&wellcode=${wellcode}`;
  };

  const [isLoading, setLoading] = useState(true);
  useEffect(() => {
    Axios.get("/GetFieldEntry", {
      responseType: "json",
      params: {
        fieldactivity_id: fieldactivity_id,
      },
    }).then(function (response) {
      formElements = response.data.FieldActivity[0];
      setLoading(false);
    });
  }, [fieldactivity_id]);

  const fieldInfoList = [];
  for (const key of fieldInfo) {
    fieldInfoList.push([key, formElements[key]]);
  }

  let columnList = [];

  console.log(columnList);
  if (formElements) {
    const fields = fieldInfoList;
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
        <h2>{wellName}: Field Activity</h2>
        <br />
        <div className="container" style={{ textAlign: "center" }}>
          {columnList}
          <div key="dateentered" className="row">
            <div className="col">
              <p style={{ textAlign: "left" }}>
                <b>Date Entered:</b>{" "}
                {moment
                  .utc(formElements["fa_datecollected"])
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
    return <h1>Loading</h1>;
  }
}
