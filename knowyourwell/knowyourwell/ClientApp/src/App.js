import { Routes, Route } from "react-router-dom";
import React from "react";
import "./components/css/custom.css";
import "./components/css/style.css";
import Axios from "axios";
import pullAt from "lodash/pullAt";
import Login from "./components/login";
import NavMenu from "./components/navmenu";
import Wellselection from "./components/wellselection";
import EditWell from "./components/editwell";
import WellInfo, { generateWellcode } from "./components/wellinfo";
import Field from "./components/field";
import ClassLab from "./components/classlab";
import PreviousEntries from "./components/previousentries";
import AboutProject from "./components/aboutproject";
import ViewField from "./components/viewfield";
import ViewClassLab from "./components/viewclasslab";
import ViewWell from "./components/viewwell";
import FieldSelection from "./components/fieldselection";
import FormSubmission from "./components/formsubmission";
import WellFieldLabContext from "./components/reusable/WellFieldLabContext";
import WaterScienceLab from "./components/watersciencelab";
import Images from "./components/images";
import PreviousImages from "./components/previousimages";
import ExportPage from "./components/export";
import { useState, useEffect } from "react";
import { UserProvider } from "./components/usercontext";
import ViewImage from "./components/viewImage";
import uploadPhoto from "./components/reusable/photoUpload";
import { deleteFromDB, getAllFromDB, idbName } from "./setupIndexedDB";

export default function App() {
  const [coords, setCoords] = useState(() => {
    // Try to update coords
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        if (position?.coords) {
          setLocalCoords(position.coords);
        }
      },
        (error) => {
          // If there's an error getting new coords, don't change the value so we can use the cached one.
          console.log(error);
        });
    }
    const storedCoords = localStorage.getItem("coords");
    return storedCoords && storedCoords !== "undefined"
      ? JSON.parse(storedCoords)
      : {};
  })

  const setLocalCoords = (newValue) => {
    setCoords(newValue);
    localStorage.setItem("coords", JSON.stringify(newValue));
  }

  const [fieldQueue, setFieldQueue] = useState(() => {
    const storedQueue = localStorage.getItem("fieldQueue");
    return storedQueue && storedQueue !== "undefined"
      ? JSON.parse(storedQueue)
      : [];
  });

  const setLocalFieldQueue = (newValue) => {
    setFieldQueue(newValue);
    localStorage.setItem("fieldQueue", JSON.stringify(newValue));
  };

  const [wellInfoQueue, setWellInfoQueue] = useState(() => {
    const storedQueue = localStorage.getItem("wellInfoQueue");
    return storedQueue && storedQueue !== "undefined"
      ? JSON.parse(storedQueue)
      : [];
  });

  const setLocalWellInfoQueue = (newValue) => {
    setWellInfoQueue(newValue);
    localStorage.setItem("wellInfoQueue", JSON.stringify(newValue));
  };

  const [imageDataQueue, setImageDataQueue] = useState(() => {
    const storedQueue = localStorage.getItem("imageDataQueue");
    return storedQueue && storedQueue !== "undefined"
      ? JSON.parse(storedQueue)
      : [];
  });

  const setLocalImageDataQueue = (newValue) => {
    setImageDataQueue(newValue);
    localStorage.setItem("imageDataQueue", JSON.stringify(newValue));
  };

  const handleOnline = async () => {
    let wellInfoQueue = JSON.parse(localStorage.getItem("wellInfoQueue")) || [];
    let fieldQueue = JSON.parse(localStorage.getItem("fieldQueue")) || [];
    let imageQueue = await getAllFromDB(idbName, "imageUploadQueue") || [];
    let imageDataQueue = JSON.parse(localStorage.getItem("imageDataQueue")) || [];

    const wellInfoUpdated = wellInfoQueue.length !== 0;
    let uploadedIndexes = [];
    let allDataUploaded = true;

    const markIndexUploaded = (i) => {
      uploadedIndexes.push(i);
    }
    const errorUploading = () => {
      allDataUploaded = false;
    }

    for (const [i, wellInfo] of wellInfoQueue.entries()) {
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
        school_id: wellInfo.schoolid,
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
      }).then(markIndexUploaded(i))
      .catch(errorUploading);
    }
    // Remove any elements that were successfully uploaded.
    pullAt(wellInfoQueue, uploadedIndexes);
    setLocalWellInfoQueue(wellInfoQueue || []);
    uploadedIndexes = [];
    if (!allDataUploaded) {
      return [wellInfoUpdated, allDataUploaded];
    }

    for (const [i, field] of fieldQueue.entries()) {
      await Axios.post("/api/insert", {
        well_id: field.well_id,
        fa_latitude: field.fa_latitude,
        fa_longitude: field.fa_longitude,
        fa_genlatitude: field.fa_genlatitude,
        fa_genlongitude: field.fa_genlongitude,
        weather: field.conditions,
        wellcovercondition: field.wellcover,
        wellcoverdescription: field.wellcoverdescription,
        topography: field.topography,
        surfacerunoff: field.evidence,
        pooling: field.pooling,
        groundwatertemp: field.temp,
        ph: field.ph,
        conductivity: field.conductivity,
        name: field.name,
        observations: field.observations,
        datecollected: field.dateentered,
      }).then(markIndexUploaded(i))
      .catch(errorUploading);
    }
    pullAt(fieldQueue, uploadedIndexes);
    setLocalFieldQueue(fieldQueue || []);
    uploadedIndexes = [];
    if (!allDataUploaded) {
      return [wellInfoUpdated, allDataUploaded];
    }

    for (const [i, image] of imageQueue.entries()) {
      await uploadPhoto(
        image.file,
        image.containerName,
        image.blobName,
        image.metadata,
      ).then(deleteFromDB(idbName, "imageUploadQueue", image.id))
      .catch(errorUploading);
    }
    if (!allDataUploaded) {
      return [wellInfoUpdated, allDataUploaded];
    }

    for (const [i, imageData] of imageDataQueue.entries()) {
      await Axios.post("/createimage", {
        well_id: imageData.well_id,
        im_type: imageData.type,
        im_latitude: imageData.im_latitude ?? 0,
        im_longitude: imageData.im_longitude ?? 0,
        im_genlatitude: imageData.im_latitude ?? 0,
        im_genlongitude: imageData.im_longitude ?? 0,
        name: imageData.name,
        observations: imageData.observations,
        im_filename: imageData.blobName,
        datecollected: imageData.dateentered,
      }).then(markIndexUploaded(i))
      .catch(errorUploading);
    }
    pullAt(imageDataQueue, uploadedIndexes);
    setLocalImageDataQueue(imageDataQueue || []);
    // I know this part is unnecessary, but I think it helps readability to keep it consistent.
    uploadedIndexes = [];
    if (!allDataUploaded) {
      return [wellInfoUpdated, allDataUploaded];
    }

    return [wellInfoUpdated, allDataUploaded];
  };

  useEffect(() => {
    if (!sessionStorage.getItem("pageInitialized")) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          setLocalCoords(position.coords);
        },
          (error) => {
            console.log(error);
            setLocalCoords({});
            alert("There was an issue retrieving your location. Geolocation capabilities in the app are not availible for the current session.");
          });
      }
      // Setting this item in the session storage will prevent any further attempts to use geolocation until the page is closed and re-opened.
      sessionStorage.setItem("pageInitialized", "true");
    }

    setInterval(() => {
      // Check if the server can be reached every 15 seconds
      Axios.get(`/heartbeat?timestamp=${Date.now()}`)
        .then(async () => {
          if (fieldQueue.length > 0 || wellInfoQueue.length > 0 || (await getAllFromDB(idbName, "imageUploadQueue")).length > 0 || imageDataQueue.length > 0) {
            const [wellInfoUpdated, allDataUploaded] = await handleOnline();
            if (allDataUploaded) {
              alert("Your connection was restored and your data was successfully submitted!");
            } else {
              alert("There was an issue uploading your data. The app will try again if it has a connection to the server.");
            }
            if (wellInfoUpdated && window.location.pathname.toLowerCase() === "/well") {
              window.location.reload();
            }
          }
        })
        .catch(() => {
          // Do nothing since the user is offline
          return;
        });
    }, 15000);
    // We only want this useEffect to run once per refresh, so we pass an empty dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  return (
    <>
      <UserProvider>
        <NavMenu />
        <WellFieldLabContext.Provider
          value={{
            coords,
            setLocalCoords,
            wellInfoQueue,
            setLocalWellInfoQueue,
            fieldQueue,
            setLocalFieldQueue,
            imageDataQueue,
            setLocalImageDataQueue,
          }}
        >
          <Routes>
            <Route exact path="/" element={<Login />} />
            <Route exact path="/well" element={<Wellselection />} />
            <Route exact path="/editwell" element={<EditWell />} />
            <Route exact path="/wellinfo" element={<WellInfo />} />
            <Route exact path="/field" element={<Field />} />
            <Route exact path="/classlab" element={<ClassLab />} />
            <Route exact path="/previousentries" element={<PreviousEntries />} />
            <Route exact path="/aboutproject" element={<AboutProject />} />
            <Route exact path="/viewfield" element={<ViewField />} />
            <Route exact path="/viewclasslab" element={<ViewClassLab />} />
            <Route exact path="/viewwell" element={<ViewWell />} />
            <Route exact path="/fieldselection" element={<FieldSelection />} />
            <Route exact path="/formsubmission" element={<FormSubmission />} />
            <Route exact path="/images" element={<Images />} />
            <Route exact path="/previousimages" element={<PreviousImages />} />
            <Route exact path="/viewimage" element={<ViewImage />} />
            <Route exact path="/viewwatersciencelab" element={<WaterScienceLab />} />
            <Route exact path="/export" element={<ExportPage />} />
          </Routes>
        </WellFieldLabContext.Provider>
      </UserProvider>
    </>
  );
}

const CachedPreviousEntries = () => {
  const [cachedData, setCachedData] = useState(null);

  useEffect(() => {
    const getCachedData = async () => {
      const cache = await caches.open("previous-entries");
      const cachedResponse = await cache.match("/previousentries");

      if (cachedResponse) {
        const data = await cachedResponse.json();
        setCachedData(data);
      }
    };

    getCachedData();
  }, []);

  return (
    <div>
      <h2>Previous Entries (Cached)</h2>
      {cachedData && (
        <ul>
          {cachedData.map((entry, index) => (
            <li key={index}>{entry}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
