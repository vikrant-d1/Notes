
# Mapbox GL JS Interview Questions & Answers

Senior Full-Stack Web Engineer Interview Preparation

This README contains Mapbox GL JS interview questions and interview-ready answers focused on a map-centric, data-heavy application using React, TypeScript, Node.js, PostgreSQL/PostGIS, vector tiles, and spatial queries.

The question set is aligned with the uploaded Full-Stack Web Engineer job brief, which emphasizes Mapbox GL/map-centric frontends, large feature sets, spatial-query results, backend API design, Postgres persistence, and geospatial data.

---

## Table of Contents

1. [Mapbox GL Fundamentals](#1-mapbox-gl-fundamentals)
2. [Sources & Layers](#2-sources--layers)
3. [Performance](#3-performance)
4. [React + Mapbox](#4-react--mapbox)
5. [Map Interaction](#5-map-interaction)
6. [Geospatial Questions](#6-geospatial-questions)
7. [Architecture](#7-architecture)
8. [Practical Coding Questions](#8-practical-coding-questions)
9. [Top 10 Questions](#top-10-questions)
10. [Senior-Level Answer to Memorize](#senior-level-answer-to-memorize)

---

# 1. Mapbox GL Fundamentals

## 1. What is Mapbox GL JS and how does it work?

**Answer:**

Mapbox GL JS is a JavaScript library for creating interactive maps in web applications. It uses **WebGL** to render map data efficiently in the browser.

It supports:

- Vector tiles
- GeoJSON
- Multiple layer types
- Data-driven styling
- Map interactions
- Markers and popups
- Zoom, pan, rotation and pitch
- Feature selection

The important point is that Mapbox does not render every geographic feature as a DOM element. Its rendering engine uses WebGL, which makes it suitable for large datasets.

---

## 2. What is the difference between Mapbox GL JS and Leaflet?

**Answer:**

The major difference is their rendering approach and strengths.

| Mapbox GL JS | Leaflet |
|---|---|
| WebGL-based rendering | Primarily DOM/SVG-based |
| Excellent for large datasets | Excellent for simple maps |
| Strong vector-tile support | Plugin-based ecosystem |
| Advanced styling | Simpler styling |
| Better for data visualization | Lightweight and easy to learn |

For a map-centric, data-heavy application, I would generally prefer Mapbox GL because of its vector-tile and WebGL capabilities.

---

## 3. What is the difference between Mapbox GL JS and MapLibre GL JS?

**Answer:**

MapLibre GL JS is an open-source fork of the Mapbox GL JS project.

The main difference today is:

- **Mapbox GL JS** → Mapbox's commercial ecosystem and services.
- **MapLibre GL JS** → open-source community-driven project.

Both provide similar concepts such as:

```text
Map
Source
Layer
Feature
Vector tiles
Expressions
```

The exact API and supported features can differ by version, so I would always check the version-specific documentation before migrating.

---

## 4. Explain Map, Source, Layer and Feature.

**Answer:**

Think of them as four different responsibilities:

- **Map** → the map instance.
- **Source** → where the data comes from.
- **Layer** → how the data should be rendered.
- **Feature** → an individual geographic object.

```text
Map
 └── Source: cities
      └── Layer: city-points
           ├── Feature: Delhi
           ├── Feature: Mumbai
           └── Feature: Lucknow
```

---

## 5. What is a vector tile?

**Answer:**

A vector tile contains geographic vector data for a specific geographic area and zoom level.

Instead of downloading millions of features at once, the client requests only the tiles required for the current viewport.

This makes vector tiles very useful for large datasets.

---

## 6. Vector tiles vs GeoJSON?

**Answer:**

**GeoJSON** is usually easier to work with and is good for smaller datasets.

**Vector tiles** divide data into geographic tiles and zoom levels, allowing the browser to load only relevant data.

```text
Small dataset → GeoJSON

Millions of features → Vector Tiles
```

For a large map-centric application, vector tiles are especially useful for large feature sets.

---

## 7. What is GeoJSON? What are its geometry types?

**Answer:**

GeoJSON is a JSON format for representing geographic data.

Common geometry types are:

```text
Point
MultiPoint
LineString
MultiLineString
Polygon
MultiPolygon
GeometryCollection
```

Example:

```javascript
{
  type: "Point",
  coordinates: [77.5946, 12.9716]
}
```

Coordinates are generally:

```text
[longitude, latitude]
```

---

## 8. How do you initialize a Mapbox map in React?

**Answer:**

Use a `ref` for the DOM container and another ref for the Mapbox instance.

```javascript
const containerRef = useRef(null);
const mapRef = useRef(null);

useEffect(() => {
  if (!containerRef.current) return;

  mapRef.current = new mapboxgl.Map({
    container: containerRef.current,
    style: "mapbox://styles/...",
    center: [77.59, 12.97],
    zoom: 10
  });

  return () => {
    mapRef.current?.remove();
  };
}, []);
```

The key is to avoid recreating the map on every React render.

---

## 9. How do you add markers?

**Answer:**

For a small number of individual locations, use `Marker`.

```javascript
new mapboxgl.Marker()
  .setLngLat([77.59, 12.97])
  .addTo(map);
```

For thousands of points, I would not create thousands of DOM markers. I would use a `circle` layer, clustering, or vector tiles.

---

## 10. How do you change the map center, zoom, bearing and pitch?

**Answer:**

```javascript
map.flyTo({
  center: [77.59, 12.97],
  zoom: 12,
  bearing: 30,
  pitch: 45
});
```

Common methods include:

```javascript
map.setCenter(...)
map.setZoom(...)
map.setBearing(...)
map.setPitch(...)
map.flyTo(...)
map.easeTo(...)
```

---

# 2. Sources & Layers

## 11. What is the difference between Source and Layer?

**Answer:**

A source contains the data.

A layer determines how that data is visualized.

```javascript
map.addSource("places", {
  type: "geojson",
  data: places
});

map.addLayer({
  id: "places-layer",
  type: "circle",
  source: "places"
});
```

One source can be used by multiple layers.

---

## 12. What types of sources does Mapbox support?

**Answer:**

Common source types include:

- GeoJSON
- Vector
- Raster
- Raster-dem
- Image
- Video

For large geographic datasets, vector sources are particularly important.

---

## 13. How do you add a GeoJSON source?

**Answer:**

```javascript
map.addSource("locations", {
  type: "geojson",
  data: locations
});
```

Then:

```javascript
map.addLayer({
  id: "locations-layer",
  type: "circle",
  source: "locations"
});
```

---

## 14. How do you add a vector-tile source?

**Answer:**

Conceptually:

```javascript
map.addSource("roads", {
  type: "vector",
  tiles: [
    "https://example.com/tiles/{z}/{x}/{y}.pbf"
  ]
});
```

Then the layer references the source and specifies the relevant `source-layer`.

---

## 15. What is the difference between fill, line, circle, symbol and heatmap layers?

**Answer:**

- `fill` → polygons/areas
- `line` → roads, boundaries and routes
- `circle` → point visualization
- `symbol` → text and icons
- `heatmap` → density visualization

```text
Countries → fill
Roads     → line
Cities    → circle
Labels    → symbol
Density   → heatmap
```

---

## 16. How do you dynamically change the color of features?

**Answer:**

Use a data-driven expression:

```javascript
"circle-color": [
  "match",
  ["get", "status"],
  "active", "green",
  "inactive", "red",
  "gray"
]
```

This allows styling to be determined from feature properties.

---

## 17. How do you filter features in a Mapbox layer?

**Answer:**

Use a layer filter:

```javascript
map.setFilter("cities-layer", [
  "==",
  ["get", "country"],
  "India"
]);
```

This allows the visualization to show only matching features.

---

## 18. What are Mapbox expressions?

**Answer:**

Expressions are a JSON-based syntax used to dynamically calculate values for styling and behavior.

They can use:

- Feature properties
- Zoom level
- Conditional logic
- Interpolation
- Matching

Example:

```javascript
["get", "population"]
```

gets a property from the feature.

---

## 19. Explain match, case, interpolate and step.

**Answer:**

**`match`** is useful for categorical values:

```javascript
["match", ["get", "type"],
  "hospital", "red",
  "school", "blue",
  "gray"
]
```

**`case`** is conditional logic:

```javascript
["case",
  ["==", ["get", "status"], "active"],
  "green",
  "red"
]
```

**`interpolate`** creates smooth values based on a numeric input such as zoom.

**`step`** creates discrete ranges.

Example:

```text
zoom < 5  → small
zoom 5-10 → medium
zoom > 10 → large
```

---

## 20. How would you highlight a selected polygon?

**Answer:**

Maintain the selected feature ID in application state and use either:

- `feature-state`
- A dedicated highlight layer
- A filter

```text
click polygon
     ↓
feature.id
     ↓
selectedFeatureId
     ↓
highlight layer/filter
```

A separate highlight layer is often clean because the base visualization remains unchanged.

---

# 3. Performance

## 21. You have 1 million geographic features. How would you render them efficiently?

**Answer:**

I would not send all one million records as GeoJSON to the browser.

I would consider:

1. Vector tiles
2. Server-side spatial filtering
3. Clustering
4. Zoom-level aggregation
5. Viewport-based queries
6. Mapbox layers instead of DOM markers
7. Backend spatial indexing

Architecture:

```text
PostGIS
   ↓
Vector Tile API
   ↓
Mapbox GL
   ↓
WebGL rendering
```

---

## 22. Why are vector tiles better than loading a huge GeoJSON file?

**Answer:**

Because the browser does not need the entire dataset.

If the user sees only one city, there is no reason to download geographic data for the entire country.

```text
Viewport
   ↓
Required tiles
   ↓
Required features
```

This reduces network transfer, memory usage, parsing and rendering cost.

---

## 23. How would you optimize Mapbox rendering performance?

**Answer:**

I would focus on:

- Vector tiles
- Clustering
- Appropriate zoom levels
- Server-side filtering
- Efficient layer styling
- Avoiding excessive layers
- Avoiding DOM markers for large datasets
- Debouncing map events
- Avoiding unnecessary React renders
- Caching
- Spatial indexes
- Loading only relevant data

---

## 24. What happens if you load a 100 MB GeoJSON file into the browser?

**Answer:**

The browser needs to:

```text
Download
   ↓
Parse JSON
   ↓
Create objects
   ↓
Process geographic data
   ↓
Render
```

This can cause high memory usage, slow parsing, UI blocking and poor performance.

For large production datasets, I would move toward vector tiles or server-side filtering.

---

## 25. How would you implement clustering?

**Answer:**

Clustering combines nearby points into a single cluster at lower zoom levels.

```text
Zoom out:

       ●●●
      ●●●●●
       ●●

        ↓

        ●  12,450
```

As the user zooms in, clusters break into individual points.

For client-side GeoJSON, Mapbox provides clustering support on GeoJSON sources. For very large datasets, I would consider server-side or tile-based clustering.

---

## 26. How would you implement pagination for map data?

**Answer:**

Separate **map visualization** from **table pagination**.

For the map:

```text
viewport + zoom + filters
```

For the table:

```text
page + pageSize + filters
```

For millions of records, I would avoid traditional offset pagination where possible and consider cursor/keyset pagination.

---

## 27. How would you load only the data visible in the current viewport?

**Answer:**

Use:

```javascript
const bounds = map.getBounds();
```

Then send:

```text
minLng
minLat
maxLng
maxLat
zoom
filters
```

to the backend.

The backend performs a spatial query and returns only relevant features.

---

## 28. How would you handle thousands of markers?

**Answer:**

I would not create thousands of:

```javascript
new mapboxgl.Marker()
```

Instead I would use:

- `circle` layer
- Clustering
- Vector tiles
- Server-side aggregation

DOM markers are useful for a small number of highly interactive locations.

---

## 29. When would you use server-side spatial filtering instead of client-side filtering?

**Answer:**

Use server-side filtering when:

- Dataset is large
- Data is private
- Query is computationally expensive
- We need PostGIS spatial operations
- We need authorization
- Browser memory is limited

Example:

```text
10 million records
       ↓
bbox + filters
       ↓
PostGIS
       ↓
500 relevant records
       ↓
Browser
```

---

## 30. How would you prevent unnecessary React re-renders from affecting Mapbox performance?

**Answer:**

Keep the Mapbox instance in `useRef` rather than React state.

Also:

- Memoize expensive components
- Avoid putting high-frequency map events directly into React state
- Debounce events
- Keep map-specific state outside React where appropriate
- Use selectors with Redux/Zustand
- Avoid recreating source/layer definitions unnecessarily

---

# 4. React + Mapbox

## 31. How do you integrate Mapbox GL JS with React?

**Answer:**

Use:

```text
useRef → map container
useRef → map instance
useEffect → initialize map
cleanup → remove map
```

React controls application state, while Mapbox manages imperative map rendering.

---

## 32. Should you recreate the Mapbox instance whenever React state changes?

**Answer:**

**No.**

The map should normally be initialized once.

When state changes, update the relevant Mapbox source, layer, filter or map property.

Bad:

```text
state change → destroy map → create map
```

Better:

```text
state change → update source/filter/layer
```

---

## 33. How would you use useEffect with Mapbox?

**Answer:**

For initialization:

```javascript
useEffect(() => {
  // initialize map

  return () => {
    // cleanup
  };
}, []);
```

Other effects can respond to specific state changes:

```javascript
useEffect(() => {
  mapRef.current?.setFilter(
    "places",
    filter
  );
}, [filter]);
```

---

## 34. How would you clean up a Mapbox instance when a React component unmounts?

**Answer:**

Call:

```javascript
mapRef.current?.remove();
```

Also remove custom event listeners when appropriate.

Cleanup prevents:

- Memory leaks
- Duplicate events
- Multiple map instances
- Unnecessary network activity

---

## 35. How do you synchronize React state with map state?

**Answer:**

Distinguish application state from map state.

```text
React:
selectedFeature
filters
searchTerm

Mapbox:
zoom
center
bearing
pitch
rendering
```

Events can synchronize them:

```javascript
map.on("moveend", () => {
  const center = map.getCenter();
  // update application state if needed
});
```

Avoid updating React state on every `mousemove` unless absolutely necessary.

---

## 36. How would you avoid excessive setState calls during move or mousemove?

**Answer:**

I would not update React state for every event.

Instead:

- Use `moveend` instead of `move`
- Debounce
- Throttle
- Use `requestAnimationFrame`
- Keep transient state inside Mapbox

For API requests, `moveend + debounce` is often sufficient.

---

## 37. How would you implement a reusable `<Map />` component?

**Answer:**

Keep the component API focused:

```jsx
<Map
  center={center}
  zoom={zoom}
  source={source}
  filters={filters}
  onFeatureClick={handleFeatureClick}
/>
```

Internally it handles:

```text
Map initialization
Source management
Layer management
Events
Cleanup
```

The parent should not need to know Mapbox implementation details.

---

## 38. How would you communicate selected map features to other React components?

**Answer:**

Lift selected feature state to a common parent or use a global store.

```text
             App State
                 |
       ┌─────────┴─────────┐
       ↓                   ↓
    Mapbox               Details
                          Panel
```

The map updates:

```javascript
setSelectedFeature(feature)
```

and the details panel consumes it.

---

## 39. How would you implement map interaction using Context/Redux/Zustand?

**Answer:**

I would avoid putting the entire Mapbox object into global state.

Global state can contain:

```javascript
{
  selectedFeatureId,
  filters,
  search,
  mapViewport
}
```

The Mapbox instance can remain in a `ref`.

For a large application, Zustand or Redux can be useful depending on the team's architecture.

---

## 40. What problems can occur if Mapbox event listeners are registered repeatedly?

**Answer:**

You can get:

- Duplicate callbacks
- Multiple API requests
- Memory leaks
- Unexpected UI updates
- Performance degradation

For example:

```javascript
map.on("click", handler);
```

registered repeatedly without cleanup can cause the same click to trigger multiple handlers.

---

# 5. Map Interaction

## 41. How do you detect a click on a feature?

**Answer:**

```javascript
map.on("click", "places-layer", (event) => {
  const feature = event.features?.[0];

  if (feature) {
    console.log(feature.properties);
  }
});
```

---

## 42. How do you detect hover over a polygon?

**Answer:**

```javascript
map.on("mouseenter", "polygon-layer", () => {
  map.getCanvas().style.cursor = "pointer";
});

map.on("mouseleave", "polygon-layer", () => {
  map.getCanvas().style.cursor = "";
});
```

For visual highlighting, use feature state or another layer/filter.

---

## 43. How would you display a popup when a feature is clicked?

**Answer:**

```javascript
const popup = new mapboxgl.Popup()
  .setLngLat(coordinates)
  .setHTML("<h3>Location</h3>")
  .addTo(map);
```

In production, be careful with `setHTML` and avoid injecting untrusted content to prevent XSS.

---

## 44. How would you change the cursor when hovering over a feature?

**Answer:**

```javascript
map.on("mouseenter", "places", () => {
  map.getCanvas().style.cursor = "pointer";
});

map.on("mouseleave", "places", () => {
  map.getCanvas().style.cursor = "";
});
```

---

## 45. How do you select multiple features?

**Answer:**

Maintain a collection of selected IDs:

```javascript
const [selectedIds, setSelectedIds] = useState([]);
```

On click:

```text
feature ID
   ↓
add/remove from selectedIds
   ↓
highlight selected features
```

For advanced selection, use a dedicated selection/highlight layer.

---

## 46. How would you implement drawing polygons on the map?

**Answer:**

Use a drawing interaction library compatible with the Mapbox/MapLibre ecosystem.

Workflow:

```text
User draws polygon
       ↓
Drawing event
       ↓
GeoJSON geometry
       ↓
React/API
       ↓
Spatial query
```

The polygon can then be sent to PostGIS to find features intersecting it.

---

## 47. How would you implement a bounding-box selection?

**Answer:**

The user defines:

```text
minLng
minLat
maxLng
maxLat
```

Then query:

```text
GET /features?bbox=...
```

The backend performs a spatial query and returns matching records.

---

## 48. How do you get the current map bounds?

**Answer:**

```javascript
const bounds = map.getBounds();

const northEast = bounds.getNorthEast();
const southWest = bounds.getSouthWest();
```

Then construct:

```text
[minLng, minLat, maxLng, maxLat]
```

---

## 49. How would you trigger an API request when the map viewport changes?

**Answer:**

Prefer `moveend` rather than calling the API on every `move` event.

```javascript
map.on("moveend", () => {
  const bounds = map.getBounds();
  const zoom = map.getZoom();

  fetchFeatures({
    bounds,
    zoom
  });
});
```

Then debounce if necessary.

---

## 50. How would you debounce map movement before making an API request?

**Answer:**

Conceptually:

```text
moveend
   ↓
wait 300ms
   ↓
check latest bounds
   ↓
API call
```

I would also use `AbortController` to cancel the previous request when a new query supersedes it.

---

# 6. Geospatial Questions

## 51. What is latitude and longitude?

**Answer:**

Latitude represents the north-south position.

Longitude represents the east-west position.

Example:

```text
[77.5946, 12.9716]
 longitude   latitude
```

In GeoJSON, the order is generally:

**longitude, latitude**.

---

## 52. What is GeoJSON?

**Answer:**

GeoJSON is a JSON-based format for representing geographic objects.

Example:

```javascript
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [77.59, 12.97]
  },
  "properties": {
    "name": "Bangalore"
  }
}
```

---

## 53. What is the difference between Point, LineString, Polygon and MultiPolygon?

**Answer:**

**Point**

```text
City
```

**LineString**

```text
Road / route
```

**Polygon**

```text
Building / district
```

**MultiPolygon**

```text
A geographic entity made of multiple separate polygons
```

For example, a country with separated territories can be represented as a MultiPolygon.

---

## 54. What is a bounding box?

**Answer:**

A bounding box is a rectangular geographic area defined by minimum and maximum latitude/longitude.

```text
minLng
minLat
maxLng
maxLat
```

It is commonly used for viewport-based spatial queries.

---

## 55. What is spatial indexing?

**Answer:**

Spatial indexing allows a database to efficiently find geographic objects based on location.

Without an appropriate spatial index:

```text
Millions of rows
      ↓
Scan everything
```

With a spatial index:

```text
Spatial index
      ↓
Candidate geographic objects
      ↓
Exact spatial filter
```

This is important for large PostGIS datasets.

---

## 56. What is a spatial query?

**Answer:**

A spatial query uses geographic relationships.

Examples:

- Within distance
- Intersects
- Contains
- Within polygon
- Nearest feature
- Inside bounding box

Example requirement:

> Find all restaurants within 5 km of a user.

That is a spatial query.

---

## 57. What is PostGIS?

**Answer:**

PostGIS extends PostgreSQL with geospatial capabilities.

It allows PostgreSQL to store and query geographic data and provides spatial functions and indexes.

Common architecture:

```text
Node.js
   ↓
PostgreSQL + PostGIS
   ↓
Spatial query
   ↓
Mapbox
```

---

## 58. How would you find all points within 5 km of a location?

**Answer:**

Perform the calculation in PostGIS rather than retrieving every point to Node.js.

Conceptually:

```sql
SELECT *
FROM locations
WHERE ST_DWithin(
  geography,
  user_location,
  5000
);
```

The exact implementation depends on whether the column uses `geometry` or `geography` and its coordinate system.

---

## 59. What is the difference between geometry and geography in PostGIS?

**Answer:**

**Geometry** generally works on a planar coordinate system.

**Geography** is designed for geographic coordinates on the Earth's surface and is useful for distance calculations in meters.

For:

> Find locations within 5 km.

`geography` can be convenient because distance is expressed in meters.

The choice depends on coordinate system, accuracy requirements and query workload.

---

## 60. How would you display the result of a spatial database query on Mapbox?

**Answer:**

Flow:

```text
PostGIS
   ↓
Node API
   ↓
GeoJSON / vector tile
   ↓
Mapbox source
   ↓
Mapbox layer
```

If the API returns GeoJSON:

```javascript
map.getSource("results")
   .setData(response);
```

The table can consume the same API result separately.

---

# 7. Architecture — Senior Level

## 61. Design a map application that displays 10 million geographic records.

**Answer:**

I would not send 10 million records to the browser.

Architecture:

```text
                    React
                      |
              ┌───────┴───────┐
              ↓               ↓
          Mapbox GL        Data Table
              |
        Vector Tiles
              |
          Node.js API
              |
        Postgres/PostGIS
              |
        Spatial Index
```

For visualization:

- Vector tiles
- Zoom-level aggregation
- Clustering
- Viewport filtering

For tables:

- Server-side pagination
- Filtering
- Sorting

For backend:

- PostGIS
- Spatial indexes
- Caching

---

## 62. Explain this architecture.

```text
React
   ↓
Mapbox GL
   ↓
API
   ↓
Node.js
   ↓
Postgres/PostGIS
```

**Answer:**

React provides the application UI.

Mapbox GL renders geographic visualization.

Node.js provides APIs and business logic.

Postgres/PostGIS stores and queries spatial data.

Example flow:

```text
User pans map
      ↓
Mapbox detects new viewport
      ↓
React/API layer gets bounds
      ↓
Node API
      ↓
PostGIS spatial query
      ↓
Relevant features
      ↓
Mapbox source
      ↓
Map rendering
```

---

## 63. Would you return GeoJSON directly from your API or use vector tiles? Why?

**Answer:**

It depends on dataset size.

**Small dataset:**

```text
API → GeoJSON → Mapbox
```

**Large dataset:**

```text
API/Tile service → Vector Tiles → Mapbox
```

For millions of records, I would strongly consider vector tiles because the client receives only relevant tiles.

---

## 64. How would you design an API for GET /features with bbox, zoom and filters?

**Answer:**

I might design:

```text
GET /features
```

Query parameters:

```text
bbox
zoom
category
status
search
```

Example:

```text
GET /features?
bbox=77.1,28.4,77.4,28.8
&zoom=10
&category=hospital
&status=active
```

Backend flow:

```text
Request
 ↓
Authentication
 ↓
Validate parameters
 ↓
Authorization
 ↓
Build spatial query
 ↓
Apply filters
 ↓
Use spatial index
 ↓
Return GeoJSON/vector tile
```

---

## 65. How would you implement server-side clustering?

**Answer:**

Instead of sending every point:

```text
1,000,000 points
```

the backend groups nearby points based on:

- Geographic location
- Zoom level
- Tile/bounding area

Response:

```text
Cluster A → 50,000 points
Cluster B → 12,000 points
Cluster C → 8,000 points
```

As the user zooms in, the backend returns more detailed clusters or individual features.

For very large datasets, tile-based clustering/aggregation is preferable to loading everything into Node memory.

---

## 66. How would you cache map data?

**Answer:**

Possible layers:

```text
Browser cache
      ↓
CDN
      ↓
Redis
      ↓
PostGIS
```

For vector tiles, CDN caching is particularly useful because the same tile URLs can be requested repeatedly.

I would also consider cache invalidation when geographic data changes.

---

## 67. How would you handle millions of records without sending everything to the browser?

**Answer:**

Use:

- Vector tiles
- Bounding-box queries
- Zoom-based aggregation
- Clustering
- Server-side filtering
- Spatial indexes
- Pagination for tables
- CDN caching

Principle:

> Process and reduce data as close to the source as possible.

---

## 68. How would you design a vector tile service?

**Answer:**

Expose something like:

```text
/tiles/{z}/{x}/{y}.pbf
```

Architecture:

```text
Mapbox
   ↓
Tile request
   ↓
CDN/cache
   ↓
Tile service
   ↓
PostGIS
   ↓
Vector tile generation
   ↓
PBF response
```

Optimize for:

- Spatial indexing
- Tile generation
- Caching
- Compression
- Appropriate zoom-level detail

---

## 69. How would you handle authentication/authorization for geographic datasets?

**Answer:**

Authorization must happen on the backend.

I would never rely on hiding features in Mapbox as a security mechanism.

```text
User
 ↓
JWT/session
 ↓
Node API
 ↓
Authorization
 ↓
PostGIS query
 ↓
Only authorized records
```

---

## 70. How would you prevent a user from accessing geographic data they are not authorized to see?

**Answer:**

Enforce authorization at the API/database layer.

```text
Request
  ↓
Authenticate user
  ↓
Determine permissions
  ↓
Apply tenant/user/geographic restrictions
  ↓
PostGIS query
  ↓
Return authorized data
```

Key principle:

> **Frontend filtering is not security. Backend authorization is security.**

---

# 8. Practical Coding Questions

## Coding Question 1: Build a React Mapbox component that loads GeoJSON and displays polygons.

### Answer

```javascript
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

function Map() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/your-style",
      center: [77.59, 12.97],
      zoom: 10
    });

    mapRef.current = map;

    map.on("load", () => {
      map.addSource("polygons", {
        type: "geojson",
        data: "/data/polygons.geojson"
      });

      map.addLayer({
        id: "polygon-layer",
        type: "fill",
        source: "polygons",
        paint: {
          "fill-opacity": 0.5
        }
      });
    });

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height: "500px" }}
    />
  );
}

export default Map;
```

### What the interviewer is testing

- React lifecycle
- `useRef`
- `useEffect`
- Map initialization
- Source
- Layer
- Cleanup

---

## Coding Question 2: When the user clicks a polygon, show its properties in a side panel.

### Answer

```javascript
map.on("click", "polygon-layer", (event) => {
  const feature = event.features?.[0];

  if (!feature) return;

  setSelectedFeature({
    id: feature.id,
    properties: feature.properties
  });
});
```

Then React can render:

```jsx
{selectedFeature && (
  <aside>
    <h3>
      {selectedFeature.properties.name}
    </h3>

    <p>
      {selectedFeature.properties.type}
    </p>
  </aside>
)}
```

Architecture:

```text
Mapbox click
     ↓
Feature
     ↓
React state
     ↓
Side panel
```

---

## Coding Question 3: Highlight a polygon on hover and restore its style on mouse leave.

### Answer

One approach is `feature-state`.

```javascript
map.on("mouseenter", "polygon-layer", (event) => {
  const feature = event.features?.[0];

  if (!feature) return;

  map.setFeatureState(
    {
      source: "polygons",
      id: feature.id
    },
    {
      hover: true
    }
  );
});
```

Then use an expression:

```javascript
"fill-opacity": [
  "case",
  ["boolean", ["feature-state", "hover"], false],
  0.8,
  0.4
]
```

On `mouseleave`, clear the feature state.

Key concept:

> I don't need to recreate the layer. I can update the feature state and let Mapbox's expression system control the rendering.

---

## Coding Question 4: Implement viewport-based API loading.

### Answer

Architecture:

```text
Map movement
     ↓
moveend
     ↓
debounce
     ↓
getBounds()
     ↓
API request
     ↓
Abort previous request
     ↓
Update source
```

Example:

```javascript
map.on("moveend", async () => {
  const bounds = map.getBounds();
  const zoom = map.getZoom();

  const bbox = [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth()
  ].join(",");

  const response = await fetch(
    `/api/features?bbox=${bbox}&zoom=${zoom}`
  );

  const data = await response.json();

  map.getSource("features")?.setData(data);
});
```

For production, add:

- Debouncing
- `AbortController`
- Error handling
- Loading state
- Caching
- Request deduplication

---

## Coding Question 5: Given 500,000 points, design an efficient Mapbox implementation.

### Strong interview answer

> "I wouldn't create 500,000 DOM markers or put 500,000 objects into React state. I'd first determine the access pattern and whether the data changes frequently. For a large relatively static dataset, I'd use vector tiles and Mapbox layers. For point visualization, I'd use clustering at lower zoom levels. I'd use server-side spatial filtering and zoom-level aggregation where appropriate. PostGIS would store the data with a spatial index, and the tile/API layer would return only the data needed for the current viewport. React would manage application state such as filters and selected features, while the Mapbox instance would remain in a ref."

Architecture:

```text
                 React
                   |
          Filters / Selection
                   |
                Mapbox
                   |
            Vector Tiles
                   |
              Node API
                   |
          Postgres + PostGIS
                   |
            Spatial Index
```

---

# Top 10 Questions

Given the Full-Stack Web Engineer role, prioritize these questions:

1. **How would you render 1 million features?**
2. **GeoJSON vs vector tiles?**
3. **Source vs Layer?**
4. **How does Mapbox integrate with React?**
5. **How would you optimize Mapbox performance?**
6. **How would you implement viewport-based loading?**
7. **How would you design Mapbox + Node.js + PostGIS architecture?**
8. **How would you implement spatial queries?**
9. **How would you synchronize a map with a data table?**
10. **Design a map application handling 10 million records.**

---

# Senior-Level Answer to Memorize

If the interviewer asks:

> **"How would you build a scalable map application?"**

Use this answer:

> "I would keep React responsible for application state and UI, and Mapbox responsible for map rendering. For small datasets I can use GeoJSON, but for millions of features I would use vector tiles. The backend would expose APIs backed by Node.js and Postgres/PostGIS. I would use spatial indexes and bounding-box queries to avoid scanning or transferring unnecessary data. On the frontend I would use Mapbox layers instead of thousands of DOM markers, clustering where appropriate, debounce viewport changes, and avoid putting the Mapbox instance into React state. For the table, I would use server-side filtering, sorting and pagination. Authentication and authorization would be enforced on the backend rather than relying on frontend filtering."

This demonstrates:

```text
React
  +
Mapbox GL
  +
Performance
  +
Vector Tiles
  +
Node.js
  +
PostGIS
  +
Spatial Queries
  +
Architecture
  +
Security
```

---

# Quick Revision Cheat Sheet

```text
Mapbox GL JS
    ↓
WebGL rendering

Map
    ↓
Source
    ↓
Layer
    ↓
Feature

Small data
    ↓
GeoJSON

Large data
    ↓
Vector Tiles

Millions of points
    ↓
Clustering
    ↓
Vector Tiles
    ↓
Viewport filtering

React
    ↓
useRef → Map instance
    ↓
useEffect → Initialization/Cleanup

Map movement
    ↓
moveend
    ↓
Debounce
    ↓
getBounds()
    ↓
API
    ↓
PostGIS
    ↓
Spatial Query
    ↓
Mapbox

Security
    ↓
Backend Authorization
    ↓
PostGIS
    ↓
Authorized Data
```

---

## Interview Formula

For almost every senior Mapbox question, structure your answer as:

**1. What it is → 2. Why it matters → 3. How you implement it → 4. Performance consideration → 5. Production example**

For example:

> **"For millions of features, I wouldn't use DOM markers or send a huge GeoJSON payload. I'd use vector tiles, Mapbox layers, viewport/zoom-based loading, clustering where appropriate, and PostGIS spatial indexing on the backend. This reduces network transfer, browser memory usage and rendering cost."**
