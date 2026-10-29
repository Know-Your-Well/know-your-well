import React, {useEffect, useState} from "react";
import {List} from "semantic-ui-react";
import Axios from "axios";
import moment from "moment";
import useWellNavigation from "./reusable/useWellNavigation";
import {offlineGet} from "./offlineCache";


function generateListElements(previousImages, well_id, name, wellcode)
{
    console.log("knowyourwell/knowyourwell/ClientApp/src/components/previousimages.js --> generateListElements")
    let listElements = [];

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
    console.log("knowyourwell/knowyourwell/ClientApp/src/components/previousimages.js --> PreviousImages")
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

    const [images, setImages] = useState([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const list = (await offlineGet("/previousimages", { well_id })).data.ImageList;
                const results = await Promise.all(
                    list.map(async (img) => {
                        const g = await offlineGet("/GetImage", { image_id: img.image_id });
                        return { imageDate: img.im_datecollected, imageID: img.image_id, imageType: g.data.Image[0].im_type };
                    })
                );
                if (!cancelled) setImages(results);
            } catch (e) {
                console.warn(e);
            }
            if (!cancelled) setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [well_id]);

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
            {generateListElements(images, well_id, wellName, wellcode)}
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
