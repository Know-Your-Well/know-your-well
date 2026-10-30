import React, {useEffect, useState} from "react";
import {List} from "semantic-ui-react";
import Axios from "axios";
import moment from "moment";
import useWellNavigation from "./reusable/useWellNavigation";
import {saveCache, loadCache, offlineGet} from "./offlineCache";

// TODO: replace with the real identifier of the logged-in user/school.
// It must change when a different user or school logs in.
function getCacheScope()
{
    return localStorage.getItem("userScope") || "unknown";
}

function mapEntries(fieldList)
{
    return fieldList.map((f) => ({
        fieldDate: f.fa_datecollected,
        fieldID: f.fieldactivity_id,
        labID: f.classlab_id,
        labDate: f.cl_datecollected,
        wslID: f.watersciencelab_id,
        wslDate: f.wsl_dateentered,
    }));
}

/**
 * you could do the ? mark thing instead. but that reads horribly for me.
 * @param value
 * @returns {string}
 */
function formatDate(value)
{
    console.log("knowyourwell/knowyourwell/ClientApp/src/components/previousentries.js --> formatDate")
    let returnValue = "N/A";

    if (value)
    {
        returnValue = moment.utc(value).format("MM-DD-YYYY hh:mm A")
    }

    return returnValue;
}

function generateListElements(entries, well_id, name, wellcode)
{
    console.log("knowyourwell/knowyourwell/ClientApp/src/components/previousentries.js --> generateListElements")
    return entries.map((entry) =>
    {
        const base = `well_id=${well_id}&wellcode=${wellcode}&wellName=${name}`;
        const btnStyle = {width: "22.5%", height: "17%", margin: "8px"};
        const labClass =
            entry.labID === null
                ? "btn btn-primary btn-lg disabled"
                : "btn btn-primary btn-lg";
        const wslClass =
            entry.wslID === null
                ? "btn btn-primary btn-lg disabled"
                : "btn btn-primary btn-lg";

        return (
            <React.Fragment key={entry.fieldID}>
                <List.Item>
                    <h4>Field Activity Date: {formatDate(entry.fieldDate)}</h4>
                    <h5>Class Lab Date: {formatDate(entry.labDate)}</h5>
                    <h5>Water Science Lab Date: {formatDate(entry.wslDate)}</h5>
                </List.Item>
                <List.Item>
                    <List.Content>
                        <a
                            href={`/ViewField?fieldactivity_id=${entry.fieldID}&${base}`}
                            style={btnStyle}
                            className="btn btn-primary btn-lg"
                        >
                            Field (Field ID: {entry.fieldID})
                        </a>
                        <a
                            href={`/ViewClassLab?classlab_id=${entry.labID}&${base}`}
                            style={btnStyle}
                            className={labClass}
                            aria-disabled={entry.labID === null}
                        >
                            Class Lab{" "}
                            {entry.labID !== null ? `(Lab ID: ${entry.labID})` : "(No Lab ID)"}
                        </a>
                        <a
                            href={`/ViewWaterScienceLab?watersciencelab_id=${entry.wslID}&${base}`}
                            style={{width: "22.5%", height: "17%"}}
                            className={wslClass}
                            aria-disabled={entry.wslID === null}
                        >
                            Water Science Lab{" "}
                            {entry.wslID !== null ? `(Lab ID: ${entry.wslID})` : "(No Lab ID)"}
                        </a>
                    </List.Content>
                    <hr style={{width: "80%", margin: "8px auto"}}/>
                    <br/>
                </List.Item>
            </React.Fragment>
        );
    });
}

export default function PreviousEntries()
{
    console.log("knowyourwell/knowyourwell/ClientApp/src/components/previousentries.js --> PreviousEntries");
    const {well_id, wellName, wellcode, backButton} = useWellNavigation();

    const [isLoading, setLoading] = useState(true);
    const [entries, setEntries] = useState([]);
    const [offlineInfo, setOfflineInfo] = useState(null); // {savedAt} when showing cached data
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        offlineGet("/previousentriesWithWSL", { well_id })
            .then((r) => {
                if (cancelled) return;
                setEntries(mapEntries(r.data.ExpandedFieldList));
                setOfflineInfo(r.fromCache ? { savedAt: Date.now() } : null);
                setLoading(false);
            })
            .catch(() => {
                if (cancelled) return;
                setError("Offline, and no saved data on this device yet. Log in once while online.");
                setLoading(false);
            });
        return () => { cancelled = true; };
    }, [well_id]);

    const backRow = (
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
    );

    if (isLoading)
    {
        return (
            <List style={{textAlign: "center"}}>
                <br/>
                <h1>Loading</h1>
                <br/>
                {backRow}
            </List>
        );
    }

    return (
        <List style={{textAlign: "center"}}>
            <br/>
            <h2>{wellName}: Previous Entries</h2>
            {offlineInfo && (
                <p>
                    Offline: showing entries saved on{" "}
                    {moment(offlineInfo.savedAt).format("MM-DD-YYYY hh:mm A")}
                </p>
            )}
            {error && <p>{error}</p>}
            <br/>
            {generateListElements(entries, well_id, wellName, wellcode)}
            {backRow}
        </List>
    );
}
