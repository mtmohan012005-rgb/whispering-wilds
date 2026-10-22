using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace WhisperingWilds.Online
{
    /// <summary>
    /// Small dependency-free JSON reader/writer used by the Socket.IO transport.
    /// Produces Dictionary&lt;string, object&gt;, List&lt;object&gt;, string, double,
    /// bool and null. This is intentionally minimal and only handles the protocol
    /// payloads the backend emits.
    /// </summary>
    public static class MiniJson
    {
        public static object Deserialize(string json)
        {
            if (string.IsNullOrEmpty(json)) return null;
            int index = 0;
            try
            {
                return ParseValue(json, ref index);
            }
            catch (Exception)
            {
                return null;
            }
        }

        public static Dictionary<string, object> AsObject(object value)
        {
            return value as Dictionary<string, object>;
        }

        public static List<object> AsArray(object value)
        {
            return value as List<object>;
        }

        public static string GetString(Dictionary<string, object> obj, string key, string fallback = null)
        {
            if (obj == null || !obj.TryGetValue(key, out object value) || value == null) return fallback;
            return value as string ?? Convert.ToString(value, CultureInfo.InvariantCulture);
        }

        public static bool GetBool(Dictionary<string, object> obj, string key, bool fallback = false)
        {
            if (obj == null || !obj.TryGetValue(key, out object value) || value == null) return fallback;
            if (value is bool b) return b;
            return bool.TryParse(Convert.ToString(value, CultureInfo.InvariantCulture), out bool parsed) ? parsed : fallback;
        }

        public static double GetNumber(Dictionary<string, object> obj, string key, double fallback = 0)
        {
            if (obj == null || !obj.TryGetValue(key, out object value) || value == null) return fallback;
            if (value is double d) return d;
            if (value is float f) return f;
            if (value is int i) return i;
            if (value is long l) return l;
            return double.TryParse(Convert.ToString(value, CultureInfo.InvariantCulture),
                NumberStyles.Float, CultureInfo.InvariantCulture, out double parsed) ? parsed : fallback;
        }

        public static string Serialize(object value)
        {
            var sb = new StringBuilder();
            WriteValue(sb, value);
            return sb.ToString();
        }

        private static void WriteValue(StringBuilder sb, object value)
        {
            switch (value)
            {
                case null:
                    sb.Append("null");
                    break;
                case string s:
                    WriteString(sb, s);
                    break;
                case bool b:
                    sb.Append(b ? "true" : "false");
                    break;
                case int i:
                    sb.Append(i.ToString(CultureInfo.InvariantCulture));
                    break;
                case long l:
                    sb.Append(l.ToString(CultureInfo.InvariantCulture));
                    break;
                case float f:
                    sb.Append(f.ToString("R", CultureInfo.InvariantCulture));
                    break;
                case double d:
                    sb.Append(d.ToString("R", CultureInfo.InvariantCulture));
                    break;
                case IDictionary<string, object> dict:
                    sb.Append('{');
                    bool first = true;
                    foreach (var pair in dict)
                    {
                        if (!first) sb.Append(',');
                        first = false;
                        WriteString(sb, pair.Key);
                        sb.Append(':');
                        WriteValue(sb, pair.Value);
                    }
                    sb.Append('}');
                    break;
                case IDictionary legacyDict:
                    sb.Append('{');
                    bool firstLegacy = true;
                    foreach (DictionaryEntry entry in legacyDict)
                    {
                        if (!firstLegacy) sb.Append(',');
                        firstLegacy = false;
                        WriteString(sb, Convert.ToString(entry.Key, CultureInfo.InvariantCulture));
                        sb.Append(':');
                        WriteValue(sb, entry.Value);
                    }
                    sb.Append('}');
                    break;
                case IEnumerable enumerable:
                    sb.Append('[');
                    bool firstItem = true;
                    foreach (object item in enumerable)
                    {
                        if (!firstItem) sb.Append(',');
                        firstItem = false;
                        WriteValue(sb, item);
                    }
                    sb.Append(']');
                    break;
                default:
                    WriteString(sb, Convert.ToString(value, CultureInfo.InvariantCulture));
                    break;
            }
        }

        private static void WriteString(StringBuilder sb, string value)
        {
            sb.Append('"');
            foreach (char c in value)
            {
                switch (c)
                {
                    case '"': sb.Append("\\\""); break;
                    case '\\': sb.Append("\\\\"); break;
                    case '\b': sb.Append("\\b"); break;
                    case '\f': sb.Append("\\f"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default:
                        if (c < 32)
                        {
                            sb.Append("\\u");
                            sb.Append(((int)c).ToString("x4", CultureInfo.InvariantCulture));
                        }
                        else
                        {
                            sb.Append(c);
                        }
                        break;
                }
            }
            sb.Append('"');
        }

        private static object ParseValue(string json, ref int index)
        {
            SkipWhitespace(json, ref index);
            if (index >= json.Length) throw new FormatException("Unexpected end of JSON");

            char c = json[index];
            switch (c)
            {
                case '{': return ParseObject(json, ref index);
                case '[': return ParseArray(json, ref index);
                case '"': return ParseString(json, ref index);
                case 't': Expect(json, ref index, "true"); return true;
                case 'f': Expect(json, ref index, "false"); return false;
                case 'n': Expect(json, ref index, "null"); return null;
                default: return ParseNumber(json, ref index);
            }
        }

        private static Dictionary<string, object> ParseObject(string json, ref int index)
        {
            var result = new Dictionary<string, object>();
            index++; // {
            SkipWhitespace(json, ref index);
            if (index < json.Length && json[index] == '}')
            {
                index++;
                return result;
            }

            while (index < json.Length)
            {
                SkipWhitespace(json, ref index);
                if (json[index] != '"') throw new FormatException("Expected object key");
                string key = ParseString(json, ref index);
                SkipWhitespace(json, ref index);
                if (index >= json.Length || json[index] != ':') throw new FormatException("Expected ':'");
                index++;
                result[key] = ParseValue(json, ref index);
                SkipWhitespace(json, ref index);
                if (index >= json.Length) throw new FormatException("Unterminated object");
                if (json[index] == ',')
                {
                    index++;
                    continue;
                }
                if (json[index] == '}')
                {
                    index++;
                    return result;
                }
                throw new FormatException("Expected ',' or '}'");
            }
            throw new FormatException("Unterminated object");
        }

        private static List<object> ParseArray(string json, ref int index)
        {
            var result = new List<object>();
            index++; // [
            SkipWhitespace(json, ref index);
            if (index < json.Length && json[index] == ']')
            {
                index++;
                return result;
            }

            while (index < json.Length)
            {
                result.Add(ParseValue(json, ref index));
                SkipWhitespace(json, ref index);
                if (index >= json.Length) throw new FormatException("Unterminated array");
                if (json[index] == ',')
                {
                    index++;
                    continue;
                }
                if (json[index] == ']')
                {
                    index++;
                    return result;
                }
                throw new FormatException("Expected ',' or ']'");
            }
            throw new FormatException("Unterminated array");
        }

        private static string ParseString(string json, ref int index)
        {
            index++; // opening quote
            var sb = new StringBuilder();
            while (index < json.Length)
            {
                char c = json[index++];
                if (c == '"') return sb.ToString();
                if (c != '\\')
                {
                    sb.Append(c);
                    continue;
                }

                if (index >= json.Length) throw new FormatException("Unterminated escape");
                char escape = json[index++];
                switch (escape)
                {
                    case '"': sb.Append('"'); break;
                    case '\\': sb.Append('\\'); break;
                    case '/': sb.Append('/'); break;
                    case 'b': sb.Append('\b'); break;
                    case 'f': sb.Append('\f'); break;
                    case 'n': sb.Append('\n'); break;
                    case 'r': sb.Append('\r'); break;
                    case 't': sb.Append('\t'); break;
                    case 'u':
                        if (index + 4 > json.Length) throw new FormatException("Invalid unicode escape");
                        string hex = json.Substring(index, 4);
                        index += 4;
                        sb.Append((char)int.Parse(hex, NumberStyles.HexNumber, CultureInfo.InvariantCulture));
                        break;
                    default:
                        throw new FormatException("Invalid escape character");
                }
            }
            throw new FormatException("Unterminated string");
        }

        private static double ParseNumber(string json, ref int index)
        {
            int start = index;
            while (index < json.Length)
            {
                char c = json[index];
                if ((c >= '0' && c <= '9') || c == '-' || c == '+' || c == '.' || c == 'e' || c == 'E') index++;
                else break;
            }
            string token = json.Substring(start, index - start);
            return double.Parse(token, NumberStyles.Float, CultureInfo.InvariantCulture);
        }

        private static void Expect(string json, ref int index, string literal)
        {
            if (index + literal.Length > json.Length ||
                string.CompareOrdinal(json, index, literal, 0, literal.Length) != 0)
            {
                throw new FormatException($"Expected '{literal}'");
            }
            index += literal.Length;
        }

        private static void SkipWhitespace(string json, ref int index)
        {
            while (index < json.Length && char.IsWhiteSpace(json[index])) index++;
        }
    }
}
