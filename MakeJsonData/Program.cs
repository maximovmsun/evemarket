using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
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
        public MarketGroup[] SubGroups;
        public MarketType[] MarketTypes;
    }

    class Program
    {
        
        static void Main(string[] args)
        {
            string inputFolder = @"E:\Backup\Eve-Market\Vanguard_1.0_114986_db\";
            string outpuFolder = @"F:\Projects\EveMarket\EveMarketForUcoz\Scripts\";
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


            Dictionary<int, Dictionary<string, object>> yamlObject;
            using (TextReader file = new StreamReader(inputFolder + "typeIDs.yaml"))
            {
                var deserializer = new Deserializer();
                yamlObject = deserializer
                    .Deserialize<Dictionary<int, Dictionary<string, object>>>(file);

            }

            //var marketYamlObject = yamlObject
            //    .Where(item => item.Value.Keys.Contains("marketGroupID"))
            //    .ToArray();

            DataTable dt = new DataTable();
            SqlDataAdapter sda = new SqlDataAdapter(query, connectionString);
            sda.Fill(dt);

            MarketGroup[] MarketGroups = GetMarketGroups(dt, yamlObject, null);
            string MarketCatalogJs = "var marketCatalog=" + GetMarketGroupsJson(MarketGroups) + ";";

            File.WriteAllText(outpuFolder + "MarketCatalogData.js", MarketCatalogJs);
        }

        static string GetMarketGroupsJson(MarketGroup[] marketGroups)
        {
            string result = string.Join(",", marketGroups.Select(group => "[\"" + group.Name.Replace("\"", "\\\"") + "\"," + ((group.SubGroups == null) ? "" : GetMarketGroupsJson(group.SubGroups)) + ((group.MarketTypes == null) ? "" : "," + GetMarketTypesJson(group.MarketTypes)) + "]"));

            if (!string.IsNullOrEmpty(result))
            {
                result = "[" + result + "]";
            }

            return result;
        }

        static string GetMarketTypesJson(MarketType[] marketTypes)
        {
            string result = string.Join(",", marketTypes.OrderBy(marketType => marketType.Name).Select(marketType => "[" + marketType.TypeID + ",\"" + marketType.Name.Replace("\"", "\\\"") + "\"]"));

            if (!string.IsNullOrEmpty(result))
            {
                result = "[" + result + "]";
            }

            return result;
        }

        static MarketGroup[] GetMarketGroups(DataTable dt, Dictionary<int, Dictionary<string, object>> yamlObject, int? parentGroupID)
        {
            return dt.AsEnumerable()
                .Where(row => row.Field<int?>("parentGroupID") == parentGroupID)
                .Select(row => new MarketGroup
                    {
                        Name = row.Field<string>("marketGroupName"),
                        SubGroups = row.Field<bool>("hasTypes") ? null : GetMarketGroups(dt, yamlObject, row.Field<int>("marketGroupID")),
                        MarketTypes = row.Field<bool>("hasTypes") ? GetMarketTypes(yamlObject, row.Field<int>("marketGroupID")) : null
                    }
                )
                .ToArray();
        }

        static MarketType[] GetMarketTypes(Dictionary<int, Dictionary<string, object>> yamlObject, int marketGroupID)
        {
            return yamlObject
                .Where(item => item.Value.Keys.Contains("marketGroupID") && (string)item.Value["marketGroupID"] == marketGroupID.ToString())
                .Select(item => new MarketType { TypeID = item.Key, Name = ((Dictionary<object, object>)item.Value["name"])["en"].ToString() })
                .ToArray();
        }
    }
}
