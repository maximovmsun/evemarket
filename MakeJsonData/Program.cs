using System.Collections.Generic;
using System.Linq;
using System.Configuration;
using System.Data.SqlClient;
using System.Data;
using System.IO;
using YamlDotNet.Serialization;

namespace MakeJsonData
{
    class MarketType
    {
        public int TypeID;
        public string Name;
    }

    class MarketGroup
    {
        public string Name;
        public IEnumerable<MarketGroup> SubGroups;
        public IEnumerable<MarketType> MarketTypes;
    }

    class Program
    {
        static void Main(string[] args)
        {
            string outpuFolder = @"C:\Projects\evemarket\EveMarketForUcoz\Scripts\";
            Dictionary<int, Dictionary<string, object>> yamlObject = GetMarketTypesYaml();

            IEnumerable<MarketGroup> marketGroups = GetMarketGroups(yamlObject);
            IEnumerable<MarketType> marketTypes = GetMarketTypes(yamlObject);

            string marketGroupsJson = GetMarketGroupsJson(marketGroups);
            string marketTypesJson = GetMarketTypesJson(marketTypes);

            string MarketCatalogJs = "var marketCatalog=" + marketGroupsJson + ";\nvar marketTypes=" + marketTypesJson + ";";

            File.WriteAllText(outpuFolder + "MarketCatalogData.js", MarketCatalogJs);
        }

        private static IEnumerable<MarketGroup> GetMarketGroups(Dictionary<int, Dictionary<string, object>> yamlObject)
        {
            string connectionString = ConfigurationManager.ConnectionStrings["Vanguard"].ConnectionString;//"Data Source = localhost; Initial Catalog = ebs_DATADUMP; Integrated Security = True";

            string query =
                @"
                SELECT
	                mg.marketGroupID, 
	                mg.parentGroupID, 
	                mg.marketGroupName, 
	                mg.hasTypes
	                FROM invMarketGroups AS mg
	                ORDER BY 
		                mg.parentGroupID, 
		                mg.marketGroupName
                ";

            DataTable dt = new DataTable();
            SqlDataAdapter sda = new SqlDataAdapter(query, connectionString);
            sda.Fill(dt);

            IEnumerable<MarketGroup> MarketGroups = GetMarketSubGroups(dt, yamlObject, null);

            return MarketGroups;
        }

        private static Dictionary<int, Dictionary<string, object>> GetMarketTypesYaml()
        {
            Dictionary<int, Dictionary<string, object>> yamlObject;
            string inputFolder = @"C:\Backup\YC-118-3_1.0_117575\";
            using (TextReader file = new StreamReader(inputFolder + "typeIDs.yaml"))
            {
                var deserializer = new Deserializer();
                yamlObject = deserializer
                    .Deserialize<Dictionary<int, Dictionary<string, object>>>(file);

            }

            return yamlObject;
        }

        static string GetMarketGroupsJson(IEnumerable<MarketGroup> marketGroups)
        {
            string result = string.Join(",", marketGroups.Select(group => "[\"" + group.Name.Replace("\"", "\\\"") + "\"," + ((group.SubGroups == null) ? "" : GetMarketGroupsJson(group.SubGroups)) + ((group.MarketTypes == null) ? "" : "," + GetMarketTypesJson(group.MarketTypes)) + "]"));

            if (!string.IsNullOrEmpty(result))
            {
                result = "[" + result + "]";
            }

            return result;
        }

        static string GetMarketTypesJson(IEnumerable<MarketType> marketTypes)
        {
            string result = string.Join(",", marketTypes.OrderBy(marketType => marketType.Name).Select(marketType => "[" + marketType.TypeID + ",\"" + marketType.Name.Replace("\"", "\\\"") + "\"]"));

            if (!string.IsNullOrEmpty(result))
            {
                result = "[" + result + "]";
            }

            return result;
        }

        static IEnumerable<MarketGroup> GetMarketSubGroups(DataTable dt, Dictionary<int, Dictionary<string, object>> yamlObject, int? parentGroupID)
        {
            return dt.Rows.Cast<DataRow>()//.AsEnumerable()
                .Where(row => row.Field<int?>("parentGroupID") == parentGroupID)
                .Select(row => new MarketGroup
                {
                    Name = row.Field<string>("marketGroupName"),
                    SubGroups = row.Field<bool>("hasTypes") ? null : GetMarketSubGroups(dt, yamlObject, row.Field<int>("marketGroupID")),
                    MarketTypes = row.Field<bool>("hasTypes") ? GetMarketTypes(yamlObject, row.Field<int>("marketGroupID")) : null
                });
                //.ToArray();
        }

        static IEnumerable<MarketType> GetMarketTypes(Dictionary<int, Dictionary<string, object>> yamlObject, int marketGroupID)
        {
            return yamlObject
                .Where(item => item.Value.Keys.Contains("marketGroupID") && (string)item.Value["marketGroupID"] == marketGroupID.ToString())
                .Select(item => new MarketType { TypeID = item.Key, Name = ((Dictionary<object, object>)item.Value["name"])["en"].ToString() });
            //.ToArray();
        }

        static IEnumerable<MarketType> GetMarketTypes(Dictionary<int, Dictionary<string, object>> yamlObject)
        {
            return yamlObject
                .Where(item => item.Value.Keys.Contains("marketGroupID"))
                .Select(item => new MarketType { TypeID = item.Key, Name = ((Dictionary<object, object>)item.Value["name"])["en"].ToString() });
            //.ToArray();
        }
    }
}
