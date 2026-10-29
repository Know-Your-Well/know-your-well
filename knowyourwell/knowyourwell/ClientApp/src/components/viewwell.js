import React, { useEffect, useState } from "react";
import "./css/forms.css";
import moment from "moment";
import Axios from "axios";
import { useSearchParams } from "react-router-dom";
import countyOptions from "./resources/counties";
import nrdOptions from "./resources/nrds";
import { useNavigate } from "react-router-dom";

import { useUser } from "./usercontext";
import axios from "axios";

const nameMap = {
  "wi_wellcode": "Wellselection Code:",
  "wi_datacollector": "Data Collector:",
  "wi_dnr_well_id": "DNR Wellselection ID:",
  "wi_address": "Address:",
  "wi_state": "State:",
  "county_id": "County:",
  "wi_phone_well_user": "Phone # (of well user):",
  "wi_well_owner": "Wellselection owner (if different from resident):",
  "wi_smelltaste": "Complaints about smell or taste of water?:",
  "wi_welldry": "Does the well ever go dry?:",
  "wi_maintenance5yr": "Maintenance done to the well itself within the last five years:",
  "wi_numberwelluser": "Number of Wellselection Users:",
  "wi_estlatitude": "Estimated Latitude:",
  "wi_boreholediameter": "Bore hole diameter (inches):",
  "wi_waterleveldepth": "Water level (feet):",
  "wi_aquiferclass": "Aquifer Class:",
  "wi_wellcasematerial": "Wellselection Casing Material:",
  "wi_wellname": "Wellselection Name:",
  "wi_registration_number": "Wellselection Registration Number:",
  "wi_well_user": "Name of Resident Wellselection User:",
  "wi_city": "Village, Town, or City:",
  "wi_zipcode": "Zip code:",
  "nrd_id": "NRD:",
  "wi_email_well_user": "Email (of well user):",
  "wi_installyear": "Wellselection construction completion year:",
  "wi_smelltaste_description": "Smell or taste of water desciption:",
  "wi_welldry_description": "When well goes dry:",
  "wi_landuse5yr": "Major land use / development changes around the well within the last five years?:",
  "wi_pestmanure": "Manure, fertilizer, or pesticides been applied the well within the last five years:",
  "wi_estlongitude": "Estimated Longitude:",
  "wi_totaldepth": "Total depth of well (feet):",
  "wi_aquifertype": "Aquifer Type:",
  "wi_welltype": "Wellselection Type (Construction Method):",
  "wi_observation": "Observations:"
};

export default function ViewWell() {
  const [searchParams] = useSearchParams();
  const well_id = parseInt(searchParams.get("id"));
  const wellName = searchParams.get("wellName");
  const wellcode = searchParams.get("wellcode");
  const navigate = useNavigate();
  const [landFeatures, setLandFeatures] = useState();
  const { user } = useUser();

  useEffect(() => {
    if (user?.displayn === "") {
      alert("You are not yet logged in. Please log in.");
      navigate("/");
    }
  }, [navigate, user]);

  const backButton = () => {
    window.location.href = `/EditWell?id=${well_id}&wellcode=${wellcode}&wellName=${wellName}`;
  };

  const backToWellsButton = () => {
    window.location.href = "/well";
  };

  const [isLoading, setLoading] = useState(true);

  let formElements = [];

  useEffect(() => {
    Axios.get("/GetWellInfo", {
      responseType: "json",
      params: {
        well_id: well_id,
      },
    }).then(function (response) {
      formElements = response.data.WellInfo[0];
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    Axios.get("/LandFeatures", {
      responseType: "json",
      params: {
        well_id: well_id,
      },
    }).then(function (response) {
      setLandFeatures(response.data.LandFeatures);
    });
  }, [well_id]);

  const renderLandFeatures = () => {
    // Check if landFeatures is undefined or null
    if (!landFeatures) {
      return <div></div>; // or return <div>No data available</div> if you want to display a message
    }

    return (
      <div className="row">
        {landFeatures.map((feature, index) => {
          // Determine column class based on the number of features
          let colClass = "col-6";
          if (
            landFeatures.length % 2 !== 0 &&
            index === landFeatures.length - 1
          ) {
            colClass = "col-12"; // Last single feature takes full width
          }

          return (
            <div
              key={index}
              className={colClass}
              style={{ marginBottom: "20px" }}
            >
              <h3>{`${feature.lf_type} on ${moment.utc(feature.lf_datecollected).local().format("MM/DD/YYYY")}`}</h3>
              <p>
                <b>Comments:</b> {feature.lf_comments}
              </p>
              <p>
                <b>Data Collector:</b> {feature.lf_datacollector}
              </p>
              <p>
                <b>Latitude:</b> {feature.lf_latitude}
              </p>
              <p>
                <b>Longitude:</b> {feature.lf_longitude}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  if (formElements.length === 0) {
    const wellCookie = localStorage.getItem("wellData");
    let wells = null;
    if (wellCookie) {
      try {
        wells = JSON.parse(wellCookie).Wells;
        formElements = wells.filter((well) => well.well_id === well_id)[0];
      } catch (e) {
        console.log("wellCookie is inValid JSON, fetching from API");
        axios.get('/Wells').then((response) => {
          wells = response.data.Wells;
          formElements = wells.filter((well) => well.well_id === well_id)[0];
          localStorage.setItem("wellData", JSON.stringify(response.data));
          window.location.reload();
        }
        );
      }
    }
  }

  let columnList = [];

  if (formElements) {
    formElements["county_id"] = countyOptions.find(
      (option) => option.key === formElements["county_id"].toString(),
    ).value;
    formElements["nrd_id"] = nrdOptions.find(
      (option) => option.key === formElements["nrd_id"].toString(),
    ).value;


    const basicInfo = [
      "wi_wellcode",
      "wi_wellname",
      "wi_registration_number",
    ];

    const locationInfo = [
      "wi_address",
      "wi_city",
      "wi_zipcode",
      "wi_state",
      "county_id",
      "nrd_id",
      "wi_estlatitude",
      "wi_estlongitude",
    ];

    const contactInfo = [
      "wi_well_owner",
      "wi_well_user",
      "wi_phone_well_user",
      "wi_email_well_user",
    ];

    const wellInfo = [
      "wi_dnr_well_id",
      "wi_installyear",
      "wi_totaldepth",
      "wi_boreholediameter",
      "wi_waterleveldepth",
      "wi_aquiferclass",
      "wi_aquifertype",
      "wi_welltype",
      "wi_wellcasematerial",
      "wi_numberwelluser",
      "wi_landuse5yr",
      "wi_maintenance5yr",
      "wi_pestmanure",
      "wi_smelltaste",
      "wi_smelltaste_description",
      "wi_welldry",
      "wi_welldry_description",
      "wi_observation",
    ];
    const basicInfoList = ['Basic Info', ...basicInfo.map((key) => [key, formElements[key]])];
    const locationInfoList = ['Location Info', ...locationInfo.map((key) => [key, formElements[key]])];
    const contactInfoList = ['Contact Info', ...contactInfo.map((key) => [key, formElements[key]])];
    const wellInfoList = ['Wellselection Info', ...wellInfo.map((key) => [key, formElements[key]])];

    for (const i of [basicInfoList, locationInfoList, contactInfoList, wellInfoList]) {
      const summaryName = i[0];
      const fields = i.slice(1);
      columnList.push(
        <>
          <details key={summaryName} style={{ marginTop: "2px", alignItems: "center" }}>
            <summary style={{ textAlign: "left", fontSize: "1.25em", background: "#686868", padding: "2px 8px", color: "white" }}><b>{summaryName}</b></summary>
            {
              // map through fields and separate into two columns
              fields.map((field, index) => {
                if (index % 2 === 0) {
                  return (
                    <div key={index} className="row" style={{ paddingTop: "8px" }}>
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
                // return so map is happy
                return null;
              })
            }
          </details>
          <br />
        </>,
      );
    }

    return (
      <div className="css">
        <h2>
          {" "}
          {wellcode}: {wellName}: Well Info
        </h2>
        <br />
        <div className="container" style={{ textAlign: "center" }}>
          {columnList}
          <div key="datacollector" className="row">
            <div className="col">
              <p style={{ textAlign: "center" }}>
                <b>Data Collector:</b>{" "}
                {formElements["wi_datacollector"]}
              </p>
            </div>
          </div>
          <div key="dateentered" className="row">
            <div className="col">
              <p style={{ textAlign: "center" }}>
                <b>Date Entered:</b>{" "}
                {moment
                  .utc(formElements["wi_datecollected"])
                  .local()
                  .format("MM-DD-YYYY hh:mm A")}
              </p>
            </div>
          </div>
          {renderLandFeatures()}
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1>The well you're looking for does not exist</h1>
        <button
          type="button"
          style={{ width: "180px", height: "17%" }}
          className="btn btn-primary btn-lg"
          onClick={backToWellsButton}
        >
          Back
        </button>
      </div>
    );
  }
}
