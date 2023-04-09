import React, { useEffect, useState } from 'react';
import { List } from 'semantic-ui-react'
import { useSearchParams } from "react-router-dom";
import Axios from 'axios'
import moment from 'moment'

var fieldList = [];

function responseDataToHTMLList(responseData) {
    let HTMLList = []
    try {
        for (const element of responseData) {
            var fieldEntryDate = moment(element.fa_datecollected).format("MMMM DD, YYYY");
            HTMLList.push(
                <List.Item key={element.fieldactivity_id}>
                    <List.Content>
                        <a href={`/classlab?field_id=${element.fieldactivity_id}&dateCollected=${element.fa_datecollected}`} style={{ width: "45%", height: "17%" }} className="btn btn-primary btn-lg btn-block">{fieldEntryDate} </a>
                    </List.Content>
                    <br />
                </List.Item>
            );
        }
    }
    catch (e) {
        console.log("Error Parsing Data into HTML List.")
    }
    return HTMLList
}

export default function FieldSelection() {

    const [searchParams, setSearchParams] = useSearchParams();
    const well_id = parseInt(searchParams.get("id"));

    const backButton = () => {
        window.location.href = "/editwell";
    }

    const [isLoading, setLoading] = useState(true);

    //credit to https://codewithnico.com/react-wait-axios-to-render/ for conditional rendering
    useEffect(() => {
        Axios
            .get("/FieldList", {
                responseType: "json",
                params: {
                    well_id: well_id
                }
            })
            .then(function (response) {
                console.log(response)
                localStorage.setItem("fieldListData", JSON.stringify(response.data))
                fieldList = responseDataToHTMLList(response.data.FieldList)
                setLoading(false);
            });
    }, []);

    if (isLoading) {
        const fieldCookie = localStorage.getItem("fieldListData");
        if (fieldCookie) {
            try {
                const fieldData = JSON.parse(fieldCookie)
                fieldList = responseDataToHTMLList(fieldData.FieldList);
            }
            catch (e) {
                console.log("fieldData is Invalid JSON")
            }
        }
        if (fieldList.length > 0) {
            return (
                <List style={{ textAlign: 'center' }}>
                    <h2> <strong> Field List Selection from localStorage</strong></h2>
                    {fieldList}
                    <List.Item>
                        <List.Content>
                            <button type="submit" onClick={backButton} >Back</button>
                        </List.Content>
                    </List.Item>
                </List>
            );
        }
        else {
            return (
                <List style={{ textAlign: 'center' }}>
                    <h2> <strong> Field Selection </strong></h2>
                    <List.Item>
                        <List.Content>
                            <button type="submit" onClick={backButton} >Back</button>
                        </List.Content>
                    </List.Item>
                </List>
            );
        }
    }

    return (
        <List style={{ textAlign: 'center' }}>
            <h2> <strong> Field Selection </strong></h2>
            {fieldList}
            <List.Item>
                <List.Content>
                    <button type="submit" onClick={backButton} >Back</button>
                </List.Content>
            </List.Item>
        </List>

    );
}
