import Axios from "axios";

const SAS_TOKEN =
    "sv=2022-11-02&ss=b&srt=o&sp=r&se=3000-01-01T00:25:47Z&st=2022-01-01T16:25:47Z&spr=https&sig=Y4R081nDtDn2wdhA5G5ryp6BPzxBQq1gUMS5S7FiEH4%3D";

export const azureImageUrl = (well_id, filename) =>
    `https://knowyourwell.blob.core.windows.net/well-images-${well_id}/${filename}?${SAS_TOKEN}`;

// ---------- tiny IndexedDB wrapper ----------
function openDb()
{
    console.log("knowyourwell/knowyourwell/ClientApp/src/components/offlineCache.js --> OpenDb");
    return new Promise((resolve, reject) =>
    {
        const req = indexedDB.open("kyw-offline", 1);
        req.onupgradeneeded = () => req.result.createObjectStore("kv");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function idb(mode, fn)
{
    console.log("knowyourwell/knowyourwell/ClientApp/src/components/offlineCache.js --> idb");
    const db = await openDb();
    return new Promise((resolve, reject) =>
    {
        const tx = db.transaction("kv", mode);
        const req = fn(tx.objectStore("kv"));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error);
    });
}

const idbGet = (key) => idb("readonly", (s) => s.get(key));
const idbSet = (key, val) => idb("readwrite", (s) => s.put(val, key));

// Scope = the logged-in school (kywmem), read from the saved user.
function getScope()
{
    console.log("knowyourwell/knowyourwell/ClientApp/src/components/offlineCache.js --> getScope");
    try
    {
        return JSON.parse(localStorage.getItem("user"))?.kywmem || null;
    } catch (e)
    {
        return null;
    }
}

// Call on logout so nothing stays behind on shared computers.
export async function clearOfflineData()
{
    console.log("knowyourwell/knowyourwell/ClientApp/src/components/offlineCache.js --> clearOfflineData");
    try
    {
        await idb("readwrite", (s) => s.clear());
    } catch (e)
    {
    }
    localStorage.removeItem("wellData");
}

// ---------- download the whole school once ----------
export async function syncSnapshot()
{
    console.log("knowyourwell/knowyourwell/ClientApp/src/components/offlineCache.js --> syncSnapshot");
    const scope = getScope();
    if (!scope || !navigator.onLine) return;

    const old = await idbGet(`${scope}:snapshot`);
    if (old && Date.now() - old.savedAt < 60 * 60 * 1000) return; // fresh enough (1 hour)

    const {data} = await Axios.get("/offlineSnapshot", {timeout: 60000});
    await idbSet(`${scope}:snapshot`, {savedAt: Date.now(), data});

    // Image files: only fetch ones we don't already have.
    for (const img of data.Images)
    {
        const key = `${scope}:img:${img.well_id}/${img.im_filename}`;
        if (await idbGet(key)) continue;
        try
        {
            const resp = await fetch(azureImageUrl(img.well_id, img.im_filename));
            if (resp.ok) await idbSet(key, await resp.blob());
        } catch (e)
        {
            console.warn("Could not cache image", img.im_filename, e); // e.g. CORS
        }
    }
}

// ---------- image source: cached copy first, Azure otherwise ----------
export async function getImageSrc(well_id, filename)
{
    console.log("knowyourwell/knowyourwell/ClientApp/src/components/offlineCache.js --> getImageSrc");
    const scope = getScope();
    const blob = scope && (await idbGet(`${scope}:img:${well_id}/${filename}`));
    return blob ? URL.createObjectURL(blob) : azureImageUrl(well_id, filename);
}

// ---------- offline answers, same shapes as your real endpoints ----------
const by = (rows, k, v) => rows.filter((r) => String(r[k]) === String(v));

const handlers = {
    "/Wells": (s) => ({Wells: s.Wells}),
    "/GetWellInfo": (s, p) => ({WellInfo: by(s.Wells, "well_id", p.well_id)}),
    "/GetFieldEntry": (s, p) => ({FieldActivity: by(s.FieldActivities, "fieldactivity_id", p.fieldactivity_id)}),
    "/GetLabEntry": (s, p) => ({ClassLabEntry: by(s.ClassLabs, "classlab_id", p.classlab_id)}),
    "/GetClassLabEntryByFieldActivity": (s, p) => ({ClassLabEntries: by(s.ClassLabs, "fieldactivity_id", p.fieldactivity_id)}),
    "/GetWaterScienceLabEntry": (s, p) => ({WaterScienceLabEntry: by(s.WaterScienceLabs, "watersciencelab_id", p.watersciencelab_id)}),
    "/GetWaterScienceLabEntryByFieldActivity": (s, p) => ({WaterScienceLabEntries: by(s.WaterScienceLabs, "fieldactivity_id", p.fieldactivity_id)}),
    "/GetImage": (s, p) => ({Image: by(s.Images, "image_id", p.image_id)}),
    "/previousimages": (s, p) => ({
        ImageList: by(s.Images, "well_id", p.well_id).map((i) => ({
            image_id: i.image_id,
            im_datecollected: i.im_datecollected
        })),
    }),
    "/previousentriesWithWSL": (s, p) =>
    {
        const rows = [];
        for (const fa of by(s.FieldActivities, "well_id", p.well_id))
        {
            const cls = by(s.ClassLabs, "fieldactivity_id", fa.fieldactivity_id);
            const wsls = by(s.WaterScienceLabs, "fieldactivity_id", fa.fieldactivity_id);
            const n = Math.max(cls.length, wsls.length, 1); // mimics the LEFT JOINs
            for (let i = 0; i < n; i++)
            {
                rows.push({
                    fieldactivity_id: fa.fieldactivity_id,
                    fa_datecollected: fa.fa_datecollected,
                    classlab_id: cls[i]?.classlab_id ?? null,
                    cl_datecollected: cls[i]?.cl_datecollected ?? null,
                    watersciencelab_id: wsls[i]?.watersciencelab_id ?? null,
                    wsl_dateentered: wsls[i]?.wsl_dateentered ?? null,
                });
            }
        }
        return {ExpandedFieldList: rows};
    },
};

// Drop-in replacement for Axios.get(url, {params}).
// Returns {data, fromCache}. Only falls back when offline or the network fails,
// never when the server answered with an error.
export async function offlineGet(url, params = {})
{
    console.log("knowyourwell/knowyourwell/ClientApp/src/components/offlineCache.js --> offlineGet");
    try
    {
        console.log("knowyourwell/knowyourwell/ClientApp/src/components/offlineCache.js --> offlineGet --> try success branch start");
        console.log("1");
        if (!navigator.onLine) throw new Error("offline");
        console.log("2");
        const resp = await Axios.get(url, {params, responseType: "json", timeout: 8000});
        console.log("3");
        let returnValue = {data: resp.data, fromCache: false};
        console.log("knowyourwell/knowyourwell/ClientApp/src/components/offlineCache.js --> offlineGet --> try success branch end");
        return returnValue;
    } catch (err)
    {
        console.log("knowyourwell/knowyourwell/ClientApp/src/components/offlineCache.js --> offlineGet --> try failure branch start");
        console.log("1");
        // 502/503/504 = server unreachable (proxy/gateway), so treat like offline.
        if (err.response && ![502, 503, 504].includes(err.response.status)) throw err;
        console.log("2");
        const scope = getScope();
        console.log("3");
        const snap = scope && (await idbGet(`${scope}:snapshot`));
        console.log("4");
        if (!snap || !handlers[url]) throw err;
        console.log("5");
        let returnValue = {data: handlers[url](snap.data, params), fromCache: true};
        console.log("knowyourwell/knowyourwell/ClientApp/src/components/offlineCache.js --> offlineGet --> try failure branch end");
        return returnValue;
    }
}