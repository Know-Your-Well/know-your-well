import React from "react";
import "./css/forms.css";
import { useState, useEffect } from "react";
import Axios from "axios";
import DatePicker from "react-datetime";
import "react-datetime/css/react-datetime.css";
import { useContext } from "react";
import devWellInfo from "./resources/devwellinfo";
import prodWellInfo from "./resources/prodwellinfo";
import wellInfoPrompts from "./resources/wellinfoprompts";
import renderField from "./reusable/renderfield";
import WellFieldLabContext from "./reusable/WellFieldLabContext";
import { useUser } from "./usercontext";
import { useNavigate } from "react-router-dom";

export default function WellInfo() {
  const { coords, wellInfoQueue, setLocalWellInfoQueue } =
  useContext(WellFieldLabContext);
  const navigate = useNavigate();
  const { user } = useUser();
  let initialWellInfo;
  
  if (
    window.location.href.indexOf("kywtest") > -1 ||
    process.env.NODE_ENV !== "production"
  ) {
    initialWellInfo = devWellInfo;
  } else {
    initialWellInfo = prodWellInfo;
  }
  if (coords?.latitude) {
    initialWellInfo.estlatitude = coords.latitude;
  }
  if (coords?.longitude){
    initialWellInfo.estlongitude = coords.longitude;
  }
  
  useEffect(() => {
    if (user?.displayn === "") {
      alert("You are not yet logged in. Please log in.");
      navigate("/");
    }
  }, [navigate, user]);
  
  const [wellInfo, setWellInfo] = useState(initialWellInfo);
  function updateWellInfo(fieldName, value) {
    setWellInfo((prevData) => ({
      ...prevData,
      [fieldName]: value,
    }));
  }

  const handleChange = (fieldName, value) => {
    const emailPattern = /\S+@\S+\.\S+/;
    const phonePattern = /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/;
    if (fieldName === "smelltaste" && (value === "No" || value === "Unknown")) {
      updateWellInfo("smelltastedescription", "");
    } else if (
      fieldName === "welldry" &&
      (value === "No" || value === "Unknown")
    ) {
      updateWellInfo("welldrydescription", "");
    } else if (fieldName === "phone") {
      updateWellInfo("isValidPhone", phonePattern.test(value));
    } else if (fieldName === "email") {
      updateWellInfo("isValidEmail", emailPattern.test(value));
    }
    updateWellInfo(fieldName, value);
  };

  useEffect(() => {
    const savedWellInfo = localStorage.getItem("wellInfo");
    if (savedWellInfo) {
      const confirmContinue = window.confirm("Continue with saved data?");
      if (confirmContinue) {
        const parsedWellInfo = JSON.parse(savedWellInfo);
        setWellInfo(parsedWellInfo);
      } else {
        localStorage.removeItem("wellInfo");
      }
    }
  }, []);

  function cacheWellInfo() {
    localStorage.setItem("wellInfo", JSON.stringify(wellInfo));
    alert("Wellselection information has been saved! You can return to edit this later, or can keep working on it.");
  }

  function clearLocalStorage() {
    localStorage.removeItem("wellInfo");
  }

  async function addWellInfo() {
    const updatedQueue = [
      ...wellInfoQueue,
      { ...wellInfo, schoolid: user?.kywmem },
    ];

    // Checking to see if user is offline - if so then we cache the data that would have been submitted
    await Axios.get(`/heartbeat?timestamp=${Date.now()}`)
      .then(async () => {
        const wellcode = await generateWellcode();
        await Axios.post("/createwellinfo", {
          address: wellInfo.address,
          aquiferclass: wellInfo.aquiferclass,
          aquifertype: wellInfo.aquifertype,
          boreholediameter: Number(wellInfo.boreholediameter),
          city: wellInfo.city,
          countyid: wellInfo.county,
          datacollector: wellInfo.datacollector,
          dateentered: wellInfo.dateentered,
          dnrId: wellInfo.dnrId,
          email: wellInfo.email,
          estlatitude: wellInfo.estlatitude,
          estlongitude: wellInfo.estlongitude,
          installyear: parseInt(wellInfo.installyear),
          landuse5yr: wellInfo.landuse5yr,
          maintenance5yr: wellInfo.maintenance5yr,
          nrdid: wellInfo.nrd,
          numberwelluser: wellInfo.numberwelluser,
          observation: wellInfo.observation,
          pestmanure: wellInfo.pestmanure,
          phone: wellInfo.phone,
          registNum: wellInfo.registNum,
          school_id: user?.kywmem,
          smelltaste: wellInfo.smelltaste,
          smelltastedescription: wellInfo.smelltastedescription,
          state: wellInfo.state,
          totaldepth: Number(wellInfo.totaldepth),
          wellwaterleveldepth: Number(wellInfo.wellwaterleveldepth),
          wellcasematerial: wellInfo.wellcasematerial,
          wellcode: wellcode,
          welldry: wellInfo.welldry,
          welldrydescription: wellInfo.welldrydescription,
          wellname: wellInfo.wellname,
          wellowner: wellInfo.wellowner,
          welltype: wellInfo.welltype,
          welluser: wellInfo.welluser,
          zipcode: wellInfo.zipcode,
        }).then(() => {
          alert("The well info form has been submitted!");
        });
      })
      // If the request fails, we can't connect to the server
      .catch(() => {
        setLocalWellInfoQueue(updatedQueue);
        alert("The application cannot connect to the server. This form will automatically be submitted when the connection to the server is restored.");
      });
  }

  const validForm = () => {
    var form = document.getElementById("submissionAlert");
    if (form.checkValidity()) {
      return true;
    } else {
      form.reportValidity();
      return (
        window.location.href.indexOf("kywtest") > -1 ||
        process.env.NODE_ENV !== "production"
      );
    }
  };

  const backButton = () => {
    if (
      window.confirm(
        "Any unsaved data will be lost.\nWould you like to continue?",
      )
    ) {
      window.location.href = `/well`;
    }
  };

  async function submitForm() {
    if (
      validForm() &&
      window.confirm(
        "Submitted data is final and can only be edited by Nebraska Water Center Staff.\nWould you like to continue?",
      )
    ) {
      await addWellInfo();
      clearLocalStorage();

      window.location.href = `/well`;
    }
  }
  function checkDepthValidation(totaldepth, wellwaterleveldepth) {
    if (totaldepth === "" && wellwaterleveldepth >= 0) {
      return true;
    } else {
      return Number(totaldepth) >= Number(wellwaterleveldepth);
    }
  }

  return (
    <form action="/editwell" id="submissionAlert">
      <h2>Well Info</h2>
      <div className="requiredField">
        <br />
        <p>* = Required Field</p>
        <p>
          No punctuation or special characters, such as ,.[]();’/\!@#) in text
          fields.
        </p>
      </div>
      {wellInfoPrompts.map((prompt) => (
        <div key={prompt.id}>{renderField(prompt, wellInfo, handleChange)}</div>
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
            value={wellInfo.dateentered}
            dateFormat="MM-DD-YYYY"
            timeFormat="hh:mm A"
            onChange={(value) => updateWellInfo("dateentered", value)}
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
      <br />
      <button
        type="button"
        style={{ width: "180px", height: "17%" }}
        className="btn btn-primary btn-lg"
        onClick={backButton}
      >
        Back
      </button>
      <button
        type="button"
        style={{ width: "180px", height: "17%", margin: "15px" }}
        className="btn btn-secondary btn-lg"
        onClick={cacheWellInfo}
      >
        Save
      </button>
      <button
        type="button"
        style={{ width: "180px", height: "17%" }}
        className="btn btn-primary btn-lg"
        onClick={() => {
          if (
            checkDepthValidation(
              wellInfo.totaldepth,
              wellInfo.wellwaterleveldepth,
            )
          ) {
            submitForm();
          } else {
            updateWellInfo("waterleveldepth", "");
            alert(
              "Wellselection water depth cannot be greater than total well depth.",
            );
          }
        }}
      >
        Submit
      </button>
    </form>
  );
}


export async function generateWellcode() {
  try {
    const response = await Axios.get("/newwellcode", {});
    return response.data.wellcode;
  }
  catch (error) {
    console.error("Failed to generate well code:", error);
  };
}