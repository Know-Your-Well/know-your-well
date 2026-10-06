import React, { useContext, useEffect, useState, useRef } from "react";
import { List } from "semantic-ui-react";
import countyOptions from "./resources/counties";
import nrdOptions from "./resources/nrds";
import { useNavigate } from "react-router-dom";
import Axios from "axios";
import WellFieldLabContext from "./reusable/WellFieldLabContext";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  AttributionControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import markerIconPng from "../components/images/wellIcon.png";
import { Icon } from "leaflet";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import "./css/wells.css";

function responseDataToHTMLList(responseData) {
  let HTMLList = [];
  try {
    for (const element of responseData) {
      HTMLList.push(
        <List.Item key={element.well_id}>
          <List.Content>
            <a
              href={`/EditWell?id=${element.well_id}&wellName=${element.wi_wellname}&wellcode=${element.wi_wellcode}`}
              style={{ width: "45%", height: "17%" }}
              className="btn btn-primary btn-lg btn-block"
            >
              {element.wi_wellcode}: {element.wi_wellname}{" "}
            </a>
          </List.Content>
          <br />
        </List.Item>
      );
    }
  } catch (e) {
    console.log("Error Parsing Data into HTML List.");
  }
  return HTMLList;
}

function responseDataToMarkerList(responseData) {
  let markerList = [];
  try {
    for (const element of responseData) {
      markerList.push(
        <Marker
          key={element.wi_wellcode}
          position={[element.wi_estlatitude, element.wi_estlongitude]}
          icon={
            new Icon({
              iconUrl: markerIconPng,
              iconSize: [40, 40],
              iconAnchor: [20, 40],
            })
          }
        >
          <Popup>
            <a
              href={`/EditWell?id=${element.well_id}&wellName=${element.wi_wellname}&wellcode=${element.wi_wellcode}`}
            >
              {element.wi_wellcode}
            </a>
            <br />
          </Popup>
        </Marker>
      );
    }
  } catch (e) {
    console.log("Error Parsing Data into Marker List.");
  }
  return markerList;
}

const Wellselection = () => {
  const [isLoading, setLoading] = useState(true);
  const [isSortDropdownVisible, setSortDropdownVisibility] = useState(false);
  const [isFilterDropdownVisible, setFilterDropdownVisibility] =
    useState(false);
  // const [isCountyDropdownVisible, setCountyDropdownVisibility] = useState(false)
  const [filter, setFilter] = useState({});
  const [sort, setSort] = useState("well_id");
  const [wellList, setWells] = useState([]);
  const { coords } = useContext(WellFieldLabContext);

  const containerRef = useRef(null);
  const navigate = useNavigate();
  // const [schoolid, setSchoolid] = useState("")

  const [tabIndex, setTabIndex] = useState(() => {
    const tab = Number.parseInt(sessionStorage.getItem("tabIndex"));
    if (tab === 0 || tab === 1) {
      return tab;
    }
    return 1;
  });
  const [showSatellite, setShowSatellite] = useState(() => {
    const satellite = sessionStorage.getItem("showSatellite");
    if (satellite === "false") {
      return false;
    } else {
      //either "true" or null, which should default to true
      return true;
    }
  });
  const [mapHeight, setMapHeight] = useState(0);

  //credit to https://codewithnico.com/react-wait-axios-to-render/ for conditional rendering
  useEffect(() => {
    const queryParams = {};
    if (filter) {
      // The filter is now an object that maps each of the filter types to the value, so we need to parse it into something that can be used in the queryParams
      queryParams.filterBy = filter;
    }
    if (sort) {
      queryParams.sortBy = sort;
    }
    Axios.get("/Wells", {
      params: queryParams,
      responseType: "json",
    })
      .then(function (response) {
        localStorage.setItem("wellData", JSON.stringify(response.data));
        setWells(responseDataToHTMLList(response.data.Wells));
        setLoading(false);
      })
      .catch(function (error) {
        console.error("An error occurred while fetching the wells:", error);
        setLoading(true);
      });
  }, [filter, sort]);

  const handleBlur = (event) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.relatedTarget)
    ) {
      setFilterDropdownVisibility(false);
    }
  };

  const mapRef = useRef();

  const resizeMap = (mapRef) => {
    const resizeObserver = new ResizeObserver(() => {
      const element = document.getElementById('map-container');
      if (element) {
        setMapHeight(
          document.body.getBoundingClientRect().bottom -
            element.getBoundingClientRect().top
        );
      }
      mapRef.current?.invalidateSize();
    });
    const container = document.getElementById("map-container");
    if (container) {
      resizeObserver.observe(container);
    }
  };

  function calculateDistance(wellLatitude, wellLongitude) {
    var R = 3959; // Radius of earth in miles
    var dLat =
      (coords.latitude * Math.PI) / 180 - (wellLatitude * Math.PI) / 180;
    var dLon =
      (coords.longitude * Math.PI) / 180 - (wellLongitude * Math.PI) / 180;
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coords.latitude * Math.PI) / 180) *
        Math.cos((wellLatitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in miles
    return d;
  }

  const filterWellsByDistance = async (distance) => {
    await Axios.get("/Wells", {
      params: {},
      responseType: "json",
    })
      .then(function (response) {
        localStorage.setItem("wellData", JSON.stringify(response.data));
      })
      .catch(function (error) {
        console.error("An error occurred while fetching the wells:", error);
      });
    if (distance === "") {
      // field was cleared so set filter to always true
      setFilter({ ...filter, byDistance: "1=1" });
      return;
    }
    const allWells = JSON.parse(localStorage.getItem("wellData"))?.Wells;
    if (allWells.length === 0) {
      return [];
    }
    if (!coords?.latitude || !coords?.longitude) {
      return allWells;
    }
    const filteredWells = allWells.filter((well) => {
      const wellLat = well.wi_estlatitude;
      const wellLong = well.wi_estlongitude;
      const distanceBetween = calculateDistance(wellLat, wellLong);
      return distanceBetween <= distance;
    });
    if (filteredWells.length === 0) {
      // no wells within distance so set filter to impossible value
      setFilter({ ...filter, byDistance: "0=1" });
      return;
    }
    const extractedIDs = filteredWells.map((well) => well.well_id);
    const sqlString = "well_id IN (" + extractedIDs.join(", ") + ")";
    setFilter({ ...filter, byDistance: sqlString });
  };

  // function getUserMarker() {
  //   console.log("updating user marker");
  //   if (navigator.geolocation) {
  //     navigator.geolocation.getCurrentPosition(function (position) {
  //       sessionStorage.setItem("lat", position.coords.latitude);
  //       sessionStorage.setItem("long", position.coords.longitude);
  //     }, function (error) {
  //       console.log("Error getting location: ", error);
  //     }, { enableHighAccuracy: false, maximumAge: 15000 });
  //   }
  //   const userLat = sessionStorage.getItem("lat");
  //   const userLong = sessionStorage.getItem("long");
  //   if (userLat === null || userLong === null) {
  //     return
  //   }
  //   setUserMarker(<Marker position={[userLat, userLong]} icon={new Icon({ iconUrl: magicBlueDot, iconSize: [15, 15] })} />)
  // }

  // setInterval(() => {
  //   getUserMarker();
  // }, 15000);

  const getFilters = () => {
    return (
      <>
        <button
          className="btn btn-primary"
          style={{ margin: "0.5em" }}
          onClick={() => {
            document.getElementById("distanceFilter").value = "";
            setFilter({ county_id: -1, nrd_id: -1 });
          }}
        >
          Clear Filters
        </button>
        <div className="filter-container">
          <div className="filter-column">
            <div className="filter-column-content">
              <p>County: </p>
              <select
                value={filter.county_id}
                onChange={(e) =>
                  setFilter({ ...filter, county_id: e.target.value })
                }
              >
                {[{ key: -1, value: "" }, ...countyOptions].map((county, index) => (
                  <option key={index} value={county.key}>
                    {county.value}
                  </option>
                ))}
              </select>
              <p>Natural Resource District: </p>
              <select
                value={filter.nrd_id}
                onChange={(e) => setFilter({ ...filter, nrd_id: e.target.value })}
              >
                {[{ key: -1, value: "" }, ...nrdOptions].map((nrd, index) => (
                  <option key={index} value={nrd.key}>
                    {nrd.value}
                  </option>
                ))}
              </select>
              <p>Search: </p>
              <input
                type="text"
                placeholder="Search by well name"
                value={filter.search || ""}
                onChange={(e) => {
                  const sanitizedValue = e.target.value.replace(
                    /['"!@#$%^&*(),.?":{}|<>]/g,
                    ""
                  );
                  setFilter({ ...filter, search: sanitizedValue });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
              />
            </div>
          </div>
          
          <div className="filter-column">
            <div className="filter-column-content">
              <p>Latitude: </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  marginLeft: "10px",
                }}
              >
                <input
                  type="text"
                  maxLength="5"
                  placeholder="40 to 43"
                  value={filter.minLat || ""}
                  onChange={(e) => setFilter({ ...filter, minLat: e.target.value })}
                />
                <p>to</p>
                <input
                  type="text"
                  maxLength="5"
                  placeholder="40 to 43"
                  value={filter.maxLat || ""}
                  onChange={(e) => setFilter({ ...filter, maxLat: e.target.value })}
                />
              </div>
              <p>Longitude: </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  marginLeft: "10px",
                }}
              >
                <input
                  type="text"
                  maxLength="7"
                  placeholder="-104 to -95.417"
                  value={filter.minLon || ""}
                  onChange={(e) => setFilter({ ...filter, minLon: e.target.value })}
                />
                <p>to</p>
                <input
                  type="text"
                  maxLength="7"
                  placeholder="-104 to -95.417"
                  value={filter.maxLon || ""}
                  onChange={(e) => setFilter({ ...filter, maxLon: e.target.value })}
                />
              </div>
              <p>Wells in a ___ mile radius.</p>
              <input
                id="distanceFilter"
                type={!coords?.latitude || !coords?.longitude ? "text" : "number"}
                disabled={!coords?.latitude || !coords?.longitude}
                placeholder={
                  !coords?.latitude || !coords?.longitude
                    ? "Geolocation is currently unavailable"
                    : null
                }
                onChange={(e) => filterWellsByDistance(e.target.value)}
              />
            </div>
          </div>
        </div>
      </>
    );
  };

  const getMapView = () => {
    const hasActiveFilters = Object.entries(filter).some(
      ([, value]) =>
        value !== "" &&
        value !== -1 &&
        value !== "-1" &&
        value !== undefined &&
        value !== null
    );
    return (
      <>
        <div>
          <button
            onClick={() => {
              setFilterDropdownVisibility(!isFilterDropdownVisible);
            }}
            className="btn btn-primary"
            style={{
              height: "38px",
              marginTop: "10px",
              marginRight: "10px",
              width: "5em",
              position: "absolute",
              zIndex: "1000",
              right: "0",
            }}
          >
            Filters
            {hasActiveFilters && (
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  width: "13px",
                  height: "13px",
                  background: "red",
                  borderRadius: "60%",
                }}
              ></span>
            )}
          </button>
          <a
            href={`/WellInfo`}
            className="btn btn-light btn-block"
            style={{
              height: "38px",
              width: "10em",
              border: "dashed",
              marginTop: "10px",
              marginRight: "10px",
              position: "absolute",
              zIndex: "1000",
              right: "6em",
            }}
          >
            Create New Well
          </a>
          <div
            style={{
              height: "38px",
              position: "absolute",
              zIndex: "1000",
              display: "flex",
              alignItems: "center",
              alignContent: "center",
              justifyContent: "space-between",
              marginTop: "10px",
              top: `${document.body.getBoundingClientRect().bottom - mapHeight + 48}px`, // This places it 48px below the top of the map, which should be exactly at the bottom of the create new well and filter buttons.
              right: "0",
              background: "rgba(255,255,255,0.5)",
              padding: "0.5em",
            }}
          >
            <label
              for="satelliteToggle"
              style={{
                fontSize: "1em",
                margin: "0px 5px",
                color: "black",
                width: "12em",
              }}
            >
              Show Satellite Layer
            </label>
            <input
              type="checkbox"
              id="satelliteToggle"
              name="satelliteToggle"
              checked={showSatellite}
              onChange={() => {
                sessionStorage.setItem(
                  "showSatellite",
                  (!showSatellite).toString()
                );
                setShowSatellite(!showSatellite);
              }}
              style={{
                height: "24px",
                padding: "0",
                margin: "0",
                width: "3em",
              }}
            />
          </div>
          {isFilterDropdownVisible && (
            <div
              style={{
                border: "1px solid #ccc",
                marginTop: "10px",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                boxSizing: "border-box",
                overflow: "auto",
                maxHeight: "150px",
                zIndex: "500",
                position: "absolute",
                top:
                  document.body.getBoundingClientRect().bottom - mapHeight + 96, // Places it below the show satellite layer checkbox
                background: "rgba(255,255,255,0.5)",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignContent: "center",
                alignItems: "center",
                overscrollBehavior: "contain",
              }}
            >
              {getFilters()}
            </div>
          )}
        </div>
        <MapContainer
          id="map-container"
          attributionControl={false}
          ref={mapRef}
          whenReady={() => resizeMap(mapRef)}
          center={
            coords.latitude && coords.longitude
              ? [coords.latitude, coords.longitude]
              : [40.8202, -96.7005]
          }
          zoom={7}
          maxZoom={12}
          scrollWheelZoom={true}
          doubleClickZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <AttributionControl prefix={false} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {showSatellite && (
            <TileLayer
              attribution="&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              opacity={0.5}
            />
          )}
          {responseDataToMarkerList(
            JSON.parse(localStorage.getItem("wellData"))?.Wells
          )}
          {/* {userMarker} */}
        </MapContainer>
      </>
    );
  };

  const getListView = () => {
    const wellsData = JSON.parse(localStorage.getItem("wellData"))?.Wells || [];
    const filteredWells = filter.search
      ? wellsData.filter((well) =>
          well.wi_wellname.toLowerCase().includes(filter.search.toLowerCase())
        )
      : wellsData;
    const hasActiveFilters = Object.entries(filter).some(
      ([, value]) =>
        value !== "" &&
        value !== -1 &&
        value !== "-1" &&
        value !== undefined &&
        value !== null
    );

    return (
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ flex: 30, textAlign: "center" }}>
          <div ref={containerRef}>
            <button
              onClick={() => {
                setSortDropdownVisibility(!isSortDropdownVisible);
              }}
              className="btn btn-primary"
              style={{ margin: "0.5em", width: "5em" }}
            >
              Sort
            </button>
            <button
              onClick={() => {
                setFilterDropdownVisibility(!isFilterDropdownVisible);
              }}
              className="btn btn-primary"
              style={{ margin: "0.5em", width: "5em", position: "relative" }}
            >
              Filters
              {hasActiveFilters && (
                <span
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    width: "13px",
                    height: "13px",
                    background: "red",
                    borderRadius: "60%",
                  }}
                ></span>
              )}
            </button>
            {isSortDropdownVisible && (
              <div
                style={{
                  border: "1px solid #ccc",
                  marginTop: "10px",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                  boxSizing: "border-box",
                }}
              >
                <button
                  onClick={() => setSort("well_id")}
                  style={{
                    backgroundColor:
                      sort === "well_id" ? "lightblue" : "transparent",
                  }}
                  className="dropdown-item"
                >
                  Oldest First
                </button>
                <button
                  onClick={() => setSort("well_id DESC")}
                  style={{
                    backgroundColor:
                      sort === "well_id DESC" ? "lightblue" : "transparent",
                  }}
                  className="dropdown-item"
                >
                  Newest First
                </button>
                <button
                  onClick={() => setSort("wi_wellname")}
                  style={{
                    backgroundColor:
                      sort === "wi_wellname" ? "lightblue" : "transparent",
                  }}
                  className="dropdown-item"
                >
                  Well Name A-Z
                </button>
                <button
                  onClick={() => setSort("wi_wellname DESC")}
                  style={{
                    backgroundColor:
                      sort === "wi_wellname DESC" ? "lightblue" : "transparent",
                  }}
                  className="dropdown-item"
                >
                  Well Name Z-A
                </button>
                <button
                  onClick={() => setSort("field_activity")}
                  style={{
                    backgroundColor:
                      sort === "field_activity" ? "lightblue" : "transparent",
                  }}
                  className="dropdown-item"
                >
                  Most Recent Field Entry
                </button>
              </div>
            )}
            {isFilterDropdownVisible && (
              <div
                style={{
                  border: "1px solid #ccc",
                  marginTop: "10px",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                  boxSizing: "border-box",
                  maxHeight: "150px",
                  overflow: "auto",
                }}
              >
                {getFilters()}
              </div>
            )}
          </div>
          <List>
            <h2>
              Wells
            </h2>
            <List.Item key={-1}>
              <List.Content>
                <a
                  href={`/WellInfo`}
                  style={{ width: "45%", height: "17%", border: "dashed" }}
                  className="btn btn-light btn-lg btn-block"
                >
                  Create New Well
                </a>
              </List.Content>
              <br />
            </List.Item>
            {responseDataToHTMLList(
              JSON.parse(localStorage.getItem("wellData"))?.Wells
            )}
          </List>
        </div>
      </div>
    );
  };

  if (isLoading && JSON.parse(localStorage.getItem("wellData")) === null) {
    return <h1>Loading</h1>;
  } else if (isLoading) {
    return (
      <List style={{ textAlign: "center" }}>
        <h2>
          Cached Wells
        </h2>
        <List.Item key={-1}>
          <List.Content>
            <a
              href={`/WellInfo`}
              style={{ width: "45%", height: "17%", border: "dashed" }}
              className="btn btn-light btn-lg btn-block"
            >
              Create New Well
            </a>
          </List.Content>
          <br />
        </List.Item>
        {responseDataToHTMLList(
          JSON.parse(localStorage.getItem("wellData")).Wells
        )}
      </List>
    );
  } else {
    return (
      <Tabs
        selectedIndex={tabIndex}
        onSelect={(index) => {
          setTabIndex(index);
          sessionStorage.setItem("tabIndex", index.toString());
        }}
        style={{ height: `${mapHeight}px` }}
      >
        <TabList>
          <Tab>Map View</Tab>
          <Tab>List View</Tab>
        </TabList>

        <TabPanel style={{ height: "100%" }}>{getMapView()}</TabPanel>
        <TabPanel>{getListView()}</TabPanel>
      </Tabs>
    );
  }
};

export default Wellselection;
