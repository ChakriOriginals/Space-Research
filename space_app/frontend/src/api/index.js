import axios from "axios";
const BASE = "http://localhost:5000/api";
const api  = axios.create({ baseURL: BASE });

// Stats
export const getOverview          = () => api.get("/stats/overview");
export const getLaunchesByYear    = () => api.get("/stats/launches-by-year");
export const getSatellitesByOrbit = () => api.get("/stats/satellites-by-orbit");
export const getTopCompanies      = () => api.get("/stats/top-companies");
export const getLaunchesByStatus  = () => api.get("/stats/launches-by-status");
export const getSatsByPurpose     = () => api.get("/stats/satellites-by-purpose");

// Launches
export const getLaunches    = (p) => api.get("/launches", { params: p });
export const getLaunch      = (id) => api.get(`/launches/${id}`);
export const createLaunch   = (d)  => api.post("/launches", d);
export const updateLaunch   = (id, d) => api.put(`/launches/${id}`, d);
export const deleteLaunch   = (id) => api.delete(`/launches/${id}`);

// Satellites
export const getSatellites  = (p) => api.get("/satellites", { params: p });
export const getSatellite   = (id) => api.get(`/satellites/${id}`);
export const createSatellite = (d) => api.post("/satellites", d);
export const updateSatellite = (id, d) => api.put(`/satellites/${id}`, d);
export const deleteSatellite = (id) => api.delete(`/satellites/${id}`);

// Lookups
export const getCompanies   = () => api.get("/lookup/companies");
export const getRockets      = () => api.get("/lookup/rockets");
export const getSites        = () => api.get("/lookup/launch-sites");
export const getOrbits       = () => api.get("/lookup/orbit-types");
export const getOperators    = () => api.get("/lookup/operators");
export const getPurposes     = () => api.get("/lookup/purposes");
export const getContractors  = () => api.get("/lookup/contractors");
export const getVehicles     = () => api.get("/lookup/vehicles");
export const getCountries    = () => api.get("/lookup/countries");
