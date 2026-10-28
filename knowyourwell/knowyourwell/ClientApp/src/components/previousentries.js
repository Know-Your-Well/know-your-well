import React, {useEffect, useState} from "react";
import {List} from "semantic-ui-react";
import {useSearchParams} from "react-router-dom";
import Axios from "axios";
import moment from "moment";
import {useNavigate} from "react-router-dom";
import {useUser} from "./usercontext";
import useWellNavigation from "./reusable/useWellNavigation";

var previousEntries = [];
var listElements = [];

function generateListElements(previousEntries, well_id, name, wellcode)
{
    for (var entry of previousEntries)
    {
        let key = 1;

        const classLabButtonClass =
            entry.labID === null
                ? "btn btn-primary btn-lg disabled"
                : "btn btn-primary btn-lg";
        const wslButtonClass =
            entry.wslID === null
                ? "btn btn-primary btn-lg disabled"
                : "btn btn-primary btn-lg";
        listElements.push(
            <>
                <List.Item>
                    <h4>
                        Field Activity Date:{" "}
                        {moment.utc(entry.fieldDate).format("MM-DD-YYYY hh:mm A")}
                    </h4>
                    <h5>
                        Class Lab Date:{" "}
                        {moment.utc(entry.labDate).format("MM-DD-YYYY hh:mm A")}
                    </h5>
                    <h5>
                        Water Science Lab Date:{" "}
                        {moment.utc(entry.wslDate).format("MM-DD-YYYY hh:mm A")}
                    </h5>
                </List.Item>
                <List.Item key={key}>
                    <List.Content>
                        <a
                            href={`/ViewField?fieldactivity_id=${entry.fieldID}&well_id=${well_id}&wellcode=${wellcode}&wellName=${name}`}
                            style={{width: "22.5%", height: "17%", margin: "8px"}}
                            className="btn btn-primary btn-lg"
                        >
                            Field (Field ID: {entry.fieldID})
                        </a>
                        <a
                            href={`/ViewClassLab?classlab_id=${entry.labID}&well_id=${well_id}&wellcode=${wellcode}&wellName=${name}`}
                            style={{width: "22.5%", height: "17%", margin: "8px"}}
                            className={classLabButtonClass}
                            aria-disabled={entry.labID === null}
                        >
                            Class Lab{" "}
                            {entry.labID !== null ? `(Lab ID: ${entry.labID})` : "(No Lab ID)"}
                        </a>
                        <a
                            href={`/ViewWaterScienceLab?watersciencelab_id=${entry.wslID}&well_id=${well_id}&wellcode=${wellcode}&wellName=${name}`} //replace with WSL link
                            style={{width: "22.5%", height: "17%"}}
                            className={wslButtonClass}
                            aria-disabled={entry.labID === null}
                        >
                            Water Science Lab{" "}
                            {entry.wslID !== null ? `(Lab ID: ${entry.wslID})` : "(No Lab ID)"}
                        </a>
                    </List.Content>
                    <hr style={{width: "80%", margin: "8px auto"}}/>
                    <br/>
                </List.Item>
            </>,
        );
        key++;
    }
    return listElements;
}

export default function PreviousEntries()
{
    const
        {
            well_id, // URLSearchParams
            wellName, // String
            wellcode, // String
            backButton // react element
        }
            =
            useWellNavigation();

    const [isLoading, setLoading] = useState(true);

    useEffect(() =>
    {
        Axios.get("/previousentriesWithWSL", {
            responseType: "json",
            params: {
                well_id: well_id,
            },
        }).then(function (response)
        {
            const fieldList = response.data.ExpandedFieldList;
            console.log(fieldList);
            console.log(response);
            var i;
            for (i = 0; i < fieldList.length; i++)
            {
                const fieldEntry = fieldList[i];
                const entry = {
                    fieldDate: fieldEntry.fa_datecollected,
                    fieldID: fieldEntry.fieldactivity_id,
                    labID: fieldEntry.classlab_id,
                    labDate: fieldEntry.cl_datecollected,
                    wslID: fieldEntry.watersciencelab_id,
                    wslDate: fieldEntry.wsl_dateentered
                };
                previousEntries.push(entry);
            }
            listElements = generateListElements(
                previousEntries,
                well_id,
                wellName,
                wellcode,
            );
            setLoading(false);
        });
    }, [wellName, well_id, wellcode]);

    if (isLoading)
    {
        return (
            <List style={{textAlign: "center"}}>
                <br/>
                <h1>Loading</h1>
                <br/>
                <List.Item>
                    <List.Content>
                        <br/>
                        <button
                            type="button"
                            style={{width: "130px", height: "17%"}}
                            className="btn btn-primary btn-lg"
                            onClick={backButton}
                        >
                            Back
                        </button>
                    </List.Content>
                </List.Item>
            </List>
        )
    }

    return (
        <List style={{textAlign: "center"}}>
            <br/>
            <h2>{wellName}: Previous Entries</h2>
            <br/>
            {listElements}
            <List.Item>
                <List.Content>
                    <br/>
                    <button
                        type="button"
                        style={{width: "130px", height: "17%"}}
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