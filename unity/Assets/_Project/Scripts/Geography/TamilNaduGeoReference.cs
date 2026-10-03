using System;
using UnityEngine;

namespace WhisperingWilds.Geography
{
    /// <summary>
    /// Authoritative geographic coordinate system for Tamil Nadu.
    ///
    /// Convention (see unity/MapData/SOURCES_AND_LICENSES.md):
    ///   * Source data is WGS84 latitude/longitude in degrees (RFC 7946 GeoJSON order is [lon, lat]).
    ///   * Game space uses an equirectangular projection anchored at a local origin placed near
    ///     the centre of Tamil Nadu, so no game coordinate is ever a huge absolute number.
    ///     This is what keeps float32 precision acceptable at state scale.
    ///   * Unity mapping: +X = east, +Z = north, +Y = elevation.
    ///   * Distances are metres in the source; `unitsPerMetre` scales them into scene units.
    ///     The default of 0.001 makes 1 scene unit = 1 km, so the state outline spans roughly
    ///     450 units east-west by 607 units north-south (Tamil Nadu's real extent at ~10.8N,
    ///     where a degree of longitude is about 109 km, not 111 km).
    ///     Verified against the imported Natural Earth outline: extent X 225.1, Z 303.5.
    /// </summary>
    [Serializable]
    public class TamilNaduGeoReference : ScriptableObject
    {
        [Tooltip("Latitude of the local origin, in degrees north.")]
        public double originLatitude = 10.79;

        [Tooltip("Longitude of the local origin, in degrees east.")]
        public double originLongitude = 78.37;

        [Tooltip("Scene units per metre. 0.001 => 1 scene unit == 1 km.")]
        public double unitsPerMetre = 0.001;

        [Tooltip("Ground radius in metres (WGS84 equatorial).")]
        public double earthRadiusMetres = 6378137.0;

        public const double DegreesToRadians = Math.PI / 180.0;

        public double MetresPerDegreeLatitude =>
            earthRadiusMetres * DegreesToRadians;

        public double MetresPerDegreeLongitude =>
            MetresPerDegreeLatitude * Math.Cos(originLatitude * DegreesToRadians);

        public Vector3 OriginWorld => new Vector3(0f, 0f, 0f);

        public double OriginLatitudeSafe => originLatitude;
        public double OriginLongitudeSafe => originLongitude;

        public static TamilNaduGeoReference Default
        {
            get
            {
                var instance = CreateInstance<TamilNaduGeoReference>();
                instance.name = "TamilNaduGeoReference (Default)";
                return instance;
            }
        }

        public Vector3 LatLonToLocal(double latitude, double longitude, double elevationMetres = 0.0)
        {
            double eastMetres = (longitude - originLongitude) * MetresPerDegreeLongitude;
            double northMetres = (latitude - originLatitude) * MetresPerDegreeLatitude;

            return new Vector3(
                (float)(eastMetres * unitsPerMetre),
                (float)(elevationMetres * unitsPerMetre),
                (float)(northMetres * unitsPerMetre));
        }

        public void LatLonToLocal(double latitude, double longitude, out Vector3 position)
        {
            position = LatLonToLocal(latitude, longitude);
        }

        public double LocalToLatitude(Vector3 local)
        {
            return originLatitude + (local.z / unitsPerMetre) / MetresPerDegreeLatitude;
        }

        public double LocalToLongitude(Vector3 local)
        {
            return originLongitude + (local.x / unitsPerMetre) / MetresPerDegreeLongitude;
        }

        public double LocalToElevationMetres(Vector3 local)
        {
            return local.y / unitsPerMetre;
        }

        public void LocalToLatLon(Vector3 local, out double latitude, out double longitude)
        {
            latitude = LocalToLatitude(local);
            longitude = LocalToLongitude(local);
        }

        /// <summary>Metres per scene unit. Inverse of <see cref="unitsPerMetre"/>.</summary>
        public double MetresPerUnit => 1.0 / unitsPerMetre;

        public float DistanceUnits(double metres) => (float)(metres * unitsPerMetre);

        public double DistanceMetres(float units) => units * MetresPerUnit;
    }
}