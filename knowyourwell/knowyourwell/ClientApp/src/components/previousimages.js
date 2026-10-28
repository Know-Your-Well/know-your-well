import React, {useEffect, useState} from "react";
import {List} from "semantic-ui-react";
import {useSearchParams} from "react-router-dom";
import Axios from "axios";
import moment from "moment";
import {useNavigate} from "react-router-dom";
import {useUser} from "./usercontext";
import useWellNavigation from "./reusable/useWellNavigation";

let previousImages = [];
let listElements = [];

function generateListElements(previousImages, well_id, name, wellcode)
{
    for (let [i, entry] of previousImages.entries())
    {
        listElements.push(
            <div key={i}>
                <List.Item>
                    <h4>
                        Image Date:{" "}
                        {moment.utc(entry.imageDate).format("MM-DD-YYYY hh:mm A")}
                    </h4>
                </List.Item>
                <List.Item>
                    <List.Content>
                        <a
                            href={`/ViewImage?image_id=${entry.imageID}&well_id=${well_id}&wellcode=${wellcode}&wellName=${name}`}
                            style={{width: "22.5%", height: "17%"}}
                            className="btn btn-primary btn-lg"
                        >
                            {entry.imageType}
                        </a>
                    </List.Content>
                    <br/>
                </List.Item>
            </div>,
        );
    }
    return listElements;
}

export default function PreviousImages()
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
        Axios.get("/previousimages", {
            responseType: "json",
            params: {
                well_id: well_id,
            },
        }).then(async (response) =>
        {
            const imageList = response.data.ImageList;
            let i;

            for (i = 0; i < imageList.length; i++)
            {
                const imageEntry = imageList[i];
                await Axios.get("/GetImage", {
                    responseType: "json",
                    params: {
                        image_id: imageEntry.image_id,
                    },
                }).then((response) =>
                {
                    const entry = {
                        imageDate: imageEntry.im_datecollected,
                        imageID: imageEntry.image_id,
                        imageType: response.data.Image[0].im_type,
                    };
                    previousImages.push(entry);
                });
            }
            listElements = generateListElements(
                previousImages,
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
            <h2>{wellName}: Previously Uploaded Images</h2>
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
