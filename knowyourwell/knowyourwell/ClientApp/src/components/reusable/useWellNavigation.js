
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useUser } from "../usercontext";

/**
 This is used in
 1. previousentries.js
    a. default export previousEntries()
 2. previousimages.js
    a. default export previousImages()

 This is refactored because both of those functions used this code.

 no parameters.
 @returns well_id, wellName, wellCode, backButton
 */
export default function useWellNavigation()
{
    const [searchParams] = useSearchParams();

    const well_id = parseInt(searchParams.get("id"));
    const wellName = searchParams.get("wellName");
    const wellcode = searchParams.get("wellcode"); //TODO: call wellcode wellcode

    const navigate = useNavigate();
    const { user } = useUser();

    useEffect(() =>
    {
        if (user?.displayn === "")
        {
            alert("You are not yet logged in. Please log in.");
            navigate("/");
        }
    }, [navigate, user]);

    const backButton = () =>
    {
        window.location.href =
            `/EditWell?id=${well_id}&wellcode=${wellcode}&wellName=${wellName}`;
    };

    return {
        well_id,
        wellName,
        wellcode,
        backButton
    };
}
