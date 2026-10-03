using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;
using UnityEngine;

namespace WhisperingWilds.Editor.Geography
{
    /// <summary>
    /// Minimal dependency-free JSON/GeoJSON reader for the offline map import pipeline.
    /// Editor-only. Exists because Unity's JsonUtility cannot represent the deeply nested,
    /// arbitrarily-shaped coordinate arrays that GeoJSON uses.
    /// Parsed shapes: object -> Dictionary&lt;string,object&gt;, array -> List&lt;object&gt;,
    /// number -> double, string -> string, bool -> bool, null -> null.
    /// GeoJSON positions are [longitude, latitude] per RFC 7946.
    /// </summary>
    internal static class MiniJson
    {
        public static object Parse(string text)
        {
            int index = 0;
            var value = ParseValue(text, ref index);
            SkipWhitespace(text, ref index);
            return value;
        }

        // ---- features -----------------------------------------------------

        public static List<Dictionary<string, object>> Features(object root)
        {
            var result = new List<Dictionary<string, object>>();
            if (!(root is Dictionary<string, object> doc)) return result;
            if (!doc.TryGetValue("features", out object featuresObj)) return result;
            if (!(featuresObj is List<object> list)) return result;

            foreach (object item in list)
            {
                if (item is Dictionary<string, object> feature) result.Add(feature);
            }
            return result;
        }

        public static string PropertyString(Dictionary<string, object> feature, string key)
        {
            if (feature == null || !feature.TryGetValue("properties", out object propsObj)) return null;
            if (!(propsObj is Dictionary<string, object> props)) return null;
            return DictString(props, key);
        }

        /// <summary>Reads a string from an arbitrary dictionary. Used for geometry objects, which
        /// have no "properties" envelope.</summary>
        public static string DictString(Dictionary<string, object> dict, string key)
        {
            if (dict == null) return null;
            return dict.TryGetValue(key, out object value) ? value as string : null;
        }

        public static long PropertyLong(Dictionary<string, object> feature, string key)
        {
            if (feature == null || !feature.TryGetValue("properties", out object propsObj)) return 0;
            if (!(propsObj is Dictionary<string, object> props)) return 0;
            if (!props.TryGetValue(key, out object value)) return 0;
            if (value is double d) return (long)d;
            if (value is string s && double.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out double parsed))
                return (long)parsed;
            return 0;
        }

        // ---- geometry -----------------------------------------------------

        private static Dictionary<string, object> Geometry(Dictionary<string, object> feature)
        {
            if (feature != null && feature.TryGetValue("geometry", out object geom) && geom is Dictionary<string, object> g)
            {
                return g;
            }
            return null;
        }

        private static string GeometryType(Dictionary<string, object> feature)
        {
            var geom = Geometry(feature);
            return geom != null ? DictString(geom, "type") : null;
        }

        private static object GeometryCoordinates(Dictionary<string, object> feature)
        {
            var geom = Geometry(feature);
            return geom != null && geom.TryGetValue("coordinates", out object c) ? c : null;
        }

        public static bool TryGetPoint(Dictionary<string, object> feature, out double lon, out double lat)
        {
            lon = lat = 0;
            if (GeometryType(feature) != "Point") return false;
            if (!(GeometryCoordinates(feature) is List<object> pos) || pos.Count < 2) return false;
            if (!(pos[0] is double lo) || !(pos[1] is double la)) return false;
            lon = lo; lat = la;
            return true;
        }

        /// <summary>LineString / MultiLineString -> list of polylines in [lon, lat].</summary>
        public static List<List<Vector2>> LineStrings(Dictionary<string, object> feature)
        {
            var result = new List<List<Vector2>>();
            string type = GeometryType(feature);
            var coords = GeometryCoordinates(feature);

            if (type == "LineString")
            {
                var line = ReadLine(coords);
                if (line != null && line.Count > 1) result.Add(line);
            }
            else if (type == "MultiLineString")
            {
                if (coords is List<object> lines)
                {
                    foreach (object lineObj in lines)
                    {
                        var line = ReadLine(lineObj);
                        if (line != null && line.Count > 1) result.Add(line);
                    }
                }
            }
            return result;
        }

        /// <summary>Polygon / MultiPolygon -> list of rings (outer ring first, then holes).</summary>
        public static List<List<Vector2>> PolygonRings(Dictionary<string, object> feature)
        {
            var result = new List<List<Vector2>>();
            string type = GeometryType(feature);
            var coords = GeometryCoordinates(feature);

            if (type == "Polygon")
            {
                if (coords is List<object> rings)
                {
                    foreach (object ringObj in rings)
                    {
                        var ring = ReadLine(ringObj);
                        if (ring != null && ring.Count > 2) result.Add(ring);
                    }
                }
            }
            else if (type == "MultiPolygon")
            {
                if (coords is List<object> polys)
                {
                    foreach (object polyObj in polys)
                    {
                        if (!(polyObj is List<object> rings)) continue;
                        foreach (object ringObj in rings)
                        {
                            var ring = ReadLine(ringObj);
                            if (ring != null && ring.Count > 2) result.Add(ring);
                        }
                    }
                }
            }
            return result;
        }

        public static List<List<Vector2>> PolygonRingsFromFeatures(List<Dictionary<string, object>> features)
        {
            var result = new List<List<Vector2>>();
            foreach (var feature in features)
            {
                result.AddRange(PolygonRings(feature));
            }
            return result;
        }

        private static List<Vector2> ReadLine(object coordsObj)
        {
            if (!(coordsObj is List<object> positions)) return null;
            var line = new List<Vector2>(positions.Count);
            foreach (object p in positions)
            {
                if (p is List<object> pair && pair.Count >= 2 &&
                    pair[0] is double lon && pair[1] is double lat)
                {
                    line.Add(new Vector2((float)lon, (float)lat));
                }
            }
            return line;
        }

        // ---- parser -------------------------------------------------------

        private static object ParseValue(string s, ref int i)
        {
            SkipWhitespace(s, ref i);
            if (i >= s.Length) return null;

            char c = s[i];
            switch (c)
            {
                case '{': return ParseObject(s, ref i);
                case '[': return ParseArray(s, ref i);
                case '"': return ParseString(s, ref i);
                case 't':
                    i += 4; return true;
                case 'f':
                    i += 5; return false;
                case 'n':
                    i += 4; return null;
                default: return ParseNumber(s, ref i);
            }
        }

        private static Dictionary<string, object> ParseObject(string s, ref int i)
        {
            var dict = new Dictionary<string, object>();
            i++; // '{'
            SkipWhitespace(s, ref i);
            if (i < s.Length && s[i] == '}') { i++; return dict; }

            while (i < s.Length)
            {
                SkipWhitespace(s, ref i);
                if (i >= s.Length || s[i] != '"') break;
                string key = ParseString(s, ref i);
                SkipWhitespace(s, ref i);
                if (i < s.Length && s[i] == ':') i++;
                dict[key] = ParseValue(s, ref i);
                SkipWhitespace(s, ref i);
                if (i < s.Length && s[i] == ',') { i++; continue; }
                if (i < s.Length && s[i] == '}') { i++; break; }
                break;
            }
            return dict;
        }

        private static List<object> ParseArray(string s, ref int i)
        {
            var list = new List<object>();
            i++; // '['
            SkipWhitespace(s, ref i);
            if (i < s.Length && s[i] == ']') { i++; return list; }

            while (i < s.Length)
            {
                list.Add(ParseValue(s, ref i));
                SkipWhitespace(s, ref i);
                if (i < s.Length && s[i] == ',') { i++; continue; }
                if (i < s.Length && s[i] == ']') { i++; break; }
                break;
            }
            return list;
        }

        private static string ParseString(string s, ref int i)
        {
            var sb = new StringBuilder();
            i++; // opening quote
            while (i < s.Length)
            {
                char c = s[i++];
                if (c == '"') break;
                if (c != '\\')
                {
                    sb.Append(c);
                    continue;
                }
                if (i >= s.Length) break;
                char esc = s[i++];
                switch (esc)
                {
                    case 'n': sb.Append('\n'); break;
                    case 't': sb.Append('\t'); break;
                    case 'r': sb.Append('\r'); break;
                    case 'b': sb.Append('\b'); break;
                    case 'f': sb.Append('\f'); break;
                    case 'u':
                        if (i + 4 <= s.Length)
                        {
                            if (ushort.TryParse(s.Substring(i, 4), NumberStyles.HexNumber,
                                    CultureInfo.InvariantCulture, out ushort code))
                            {
                                sb.Append((char)code);
                            }
                            i += 4;
                        }
                        break;
                    default: sb.Append(esc); break;
                }
            }
            return sb.ToString();
        }

        private static double ParseNumber(string s, ref int i)
        {
            int start = i;
            while (i < s.Length && "+-0123456789.eE".IndexOf(s[i]) >= 0) i++;
            string slice = s.Substring(start, i - start);
            return double.TryParse(slice, NumberStyles.Float, CultureInfo.InvariantCulture, out double value)
                ? value
                : 0d;
        }

        private static void SkipWhitespace(string s, ref int i)
        {
            while (i < s.Length && char.IsWhiteSpace(s[i])) i++;
        }
    }
}