import React, { useEffect, useState } from "react";
import Axios from "axios";
import "./css/forms.css";
import DatePicker from "react-datetime";
import "react-datetime/css/react-datetime.css";
import { useSearchParams } from "react-router-dom";
import FormFooterReactElement from "./reusable/formFooterReactElement";
import devClassLab from "./resources/devclasslab.js";
import prodClassLab from "./resources/prodclasslab.js";
import classLabPrompts from "./resources/classlabprompts.js";
import renderField from "./reusable/renderfield.js";

export default function ClassLab() {
  let initialClassLab;

  if (
    window.location.href.indexOf("kywtest") > -1 ||
    process.env.NODE_ENV !== "production"
  ) {
    initialClassLab = devClassLab;
  } else {
    initialClassLab = prodClassLab;
  }

  const [searchParams, setSearchParams] = useSearchParams();
  const fa_id = parseInt(searchParams.get("field_id"));
  const wellcode = searchParams.get("wellcode");

  // Checking for saved sessions
  const [sessionContinued, setSessionContinued] = useState(
    searchParams.get("sessionContinued"),
  );
  if (localStorage.getItem("labData" + fa_id)) {
    if (sessionContinued === null) {
      const continue_session = window.confirm("Continue last saved session?");
      if (continue_session) {
        setSessionContinued(true);
      } else {
        handleClearLocalStorage();
        setSessionContinued(false); // ends forever pop-up loop
        /* will need to be changed if sessionContinued is ever used elsewhere,
                potenitally add another var to set to true / false if question has already been asked? */
      }
    }
  }
  let pullCachedData = sessionContinued;

  const cachedData = pullCachedData
    ? JSON.parse(localStorage.getItem("labData" + fa_id))
    : null;

  const well_id = searchParams.get("well_id");
  const wellName = searchParams.get("wellName");
  const [classLab, setClassLab] = useState(
    pullCachedData ? cachedData : initialClassLab,
  );

  // Updating if user decides to load session
  useEffect(() => {
    setClassLab(sessionContinued ? cachedData : initialClassLab);
  }, [sessionContinued]);

  function updateClassLab(fieldName, value) {
    setClassLab((prevData) => ({
      ...prevData,
      [fieldName]: value,
    }));
  }

  async function addClassLab() {
    let dataSubmitted = false;
    await Axios.get(`/heartbeat?timestamp=${Date.now()}`)
      .then(async () => {
      await Axios.post("/createclasslab", {
        fa_id: fa_id,
        ammonia: classLab.ammonia,
        calciumhardness: classLab.calcium,
        chloride: classLab.chloride,
        copper: classLab.copper,
        bacteria: classLab.bacteria,
        iron: classLab.iron,
        manganese: classLab.manganese,
        nitrate: classLab.nitrate,
        observations: classLab.observation,
        datacollector: classLab.name,
        dateentered: classLab.dateentered,
      }).then(() => {
        dataSubmitted = true;
        console.log("Successfully submitted Class Lab Form!");
      });
    })
    // If the request fails, we can't connect to the server
    .catch(() => {
      alert("The application cannot connect to the server. Please save this form and try again once the connection to the server has been restored.");
    });
    return dataSubmitted;
  }

  const idList = [
    "cl_ammonia",
    "cl_calcium",
    "cl_chloride",
    "cl_bacteria",
    "cl_copper",
    "cl_iron",
    "cl_manganese",
    "cl_nitrate",
  ];
  // caching - local storage
  function cacheLabForm() {
    let elementsValid = true;
    // Checking if entered elements are valid.
    for (let i = 0; i < idList.length && elementsValid; i++) {
      const id = idList[i];
      const element = document.getElementById(id);
      elementsValid = element.value === "" || element.checkValidity();
      if (!elementsValid) {
        element.reportValidity();
      }
    }

    if (
      elementsValid &&
      window.confirm(
        "Any previously saved data will be overwritten.\nWould you like to continue?",
      )
    ) {
      // const labData = {
      //     Ammonia: ammonia,
      //     Calciumhardness: calcium,
      //     Chloride: chloride,
      //     Copper: copper,
      //     Bacteria: bacteria,
      //     Iron: iron,
      //     Manganese: manganese,
      //     Nitrate: nitrate,
      //     SampleID: wslSample,
      //     Observations: observations,
      //     Datacollector: name,
      //     Dateentered: dateentered,
      // };
      localStorage.setItem("labData" + fa_id, JSON.stringify(classLab));
      alert("Lab data information Saved!");
    }
  }

  function handleClearLocalStorage() {
    localStorage.clear();
  }

  const validForm = () => {
    var form = document.getElementById("submissionAlert");
    if (form.checkValidity()) {
      return true;
    } else {
      form.reportValidity();
      return false;
    }
  };

  const backButton = () => {
    if (
      window.confirm(
        "Any unsaved data will be lost.\nWould you like to continue?",
      )
    ) {
      window.location.href = `/fieldselection?id=${well_id}&wellcode=${wellcode}&wellName=${wellName}`;
    }
  };

  async function submitForm() {
    if (
      validForm() &&
      window.confirm(
        "Submitted data is final and Can only be edited by Nebraska Water Center Staff.\nWould you like to continue?",
      )
    ) {
      const dataSubmitted = await addClassLab();
      if (dataSubmitted) {
        handleClearLocalStorage();
        window.location.href = `/EditWell?id=${well_id}&wellcode=${wellcode}&wellName=${wellName}`;
      }
    }
  }

  return (
    <form id="submissionAlert">
      <h2>{wellName}: Class Lab</h2>
      <div>
        Conduct the classroom lab testing within 1 week of collecting the
        sample.
      </div>
      <div>
        When all lab results are final, enter and submit them in the field
        below.
      </div>
      <div className="requiredField">
        <br></br>
        <p>* = Required Field</p>
        <p>
          No punctuation or special characters, such as ,.[]();’/\!@#) in text
          fields.
        </p>
      </div>
      {classLabPrompts.map((prompt) => (
        <div key={prompt.id}>
          {renderField(prompt, classLab, updateClassLab)}
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
            value={classLab.dateentered}
            // value={sessionContinued ? moment(cachedData.Dateentered) : "hello"}
            // value={moment(cachedData.Dateentered)}
            // value = "04/09/2024, 4:36 pm"
            dateFormat="MM-DD-YYYY"
            timeFormat="hh:mm A"
            onChange={(val) => updateClassLab("dateentered", val)}
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
      <FormFooterReactElement
        submitForm={submitForm}
        backButton={backButton}
        cacheForm={cacheLabForm}
      />
    </form>
  );
}
