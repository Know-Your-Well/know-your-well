import React, { useEffect, useState } from "react";
import { List } from "semantic-ui-react";
import { useSearchParams } from "react-router-dom";
import Axios from "axios";
import moment from "moment";
import Wellselection from "./wellselection";

var fieldList = [];

function responseDataToHTMLList(responseData, well_id, wellName, wellcode) {
  let HTMLList = [];
  try {
    for (const element of responseData) {
      var fieldEntryDate = moment(element.fa_datecollected).format(
        "MMMM DD, YYYY",
      );
      HTMLList.push(
        <List.Item key={element.fieldactivity_id}>
          <List.Content>
            <a
              href={`/classlab?field_id=${element.fieldactivity_id}&dateCollected=${element.fa_datecollected}&well_id=${well_id}&wellName=${wellName}&wellcode=${wellcode}`}
              style={{ width: "45%", height: "17%" }}
              className="btn btn-primary btn-lg btn-block"
            >
              {fieldEntryDate} (Field ID: {element.fieldactivity_id}){" "}
            </a>
          </List.Content>
          <br />
        </List.Item>,
      );
    }
  } catch (e) {
    console.log(e);
  }
  return HTMLList;
}

export default function FieldSelection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const well_id = parseInt(searchParams.get("id"));
  const wellName = searchParams.get("wellName");
  const wellcode = searchParams.get("wellcode");

  const backButton = () => {
    window.location.href = `/EditWell?id=${well_id}&wellName=${wellName}&wellcode=${wellcode}`;
  };

  const [isLoading, setLoading] = useState(true);

  //credit to https://codewithnico.com/react-wait-axios-to-render/ for conditional rendering
  useEffect(() => {
    Axios.get("/previousentries", {
      responseType: "json",
      params: {
        well_id: well_id,
        newLab: "True",
      },
    }).then(function (response) {
      console.log(response);
      localStorage.setItem(
        "fieldListData" + well_id,
        JSON.stringify(response.data),
      );
      fieldList = responseDataToHTMLList(
        response.data.FieldList,
        well_id,
        wellName,
        wellcode,
      );
      setLoading(false);
    });
  }, []);

  if (isLoading) {
    const fieldCookie = localStorage.getItem("fieldListData" + well_id);
    if (fieldCookie) {
      try {
        const fieldData = JSON.parse(fieldCookie);
        fieldList = responseDataToHTMLList(
          fieldData.FieldList,
          well_id,
          wellName,
          wellcode,
        );
      } catch (e) {
        console.log("fieldData is Invalid JSON");
      }
    }
    if (fieldList.length > 0) {
      return (
        <List style={{ textAlign: "center" }}>
          <h2>
            {" "}
            <strong> Field List Selection from localStorage</strong>
          </h2>
          {fieldList}
          <List.Item>
            <List.Content>
              <br />
              <button
                type="button"
                style={{ width: "130px", height: "17%" }}
                className="btn btn-primary btn-lg"
                onClick={backButton}
              >
                Back
              </button>
            </List.Content>
          </List.Item>
        </List>
      );
    } else {
      return (
        <List style={{ textAlign: "center" }}>
          <h2>
            {" "}
            <strong>{wellName}: Field Selection for Class Lab</strong>
          </h2>
          <List.Item>
            <List.Content>
              <br />
              <button
                type="button"
                style={{ width: "130px", height: "17%" }}
                className="btn btn-primary btn-lg"
                onClick={backButton}
              >
                Back
              </button>
            </List.Content>
          </List.Item>
        </List>
      );
    }
  }

  return (
    <List style={{ textAlign: "center" }}>
      <h2>
        {" "}
        <strong>{wellName}: Field Selection for Class Lab</strong>
      </h2>
      {fieldList}
      <List.Item>
        <List.Content>
          <br />
          <button
            type="button"
            style={{ width: "130px", height: "17%" }}
            className="btn btn-primary btn-lg"
            onClick={backButton}
          >
            Back
          </button>
        </List.Content>
      </List.Item>
    </List>
  );
}
