using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace WebTestApi.Controllers
{
    public class CountryController : ApiController
    {
        [HttpGet]
        public object List(/*string searchValue*/)
        {
            string connectionString = ConfigurationManager.ConnectionStrings["Vanguard"].ConnectionString;//"Data Source = localhost; Initial Catalog = ebs_DATADUMP; Integrated Security = True";
            
            string query =
                @"
                SELECT TOP (50) 
	                s.stationID, 
	                s.stationName, 
	                s.security
	                FROM staStations AS s
	                --WHERE (s.stationName LIKE '%' + @value + '%')
	                ORDER BY s.stationName
                ";
            SqlCommand cmd = new SqlCommand(query);
            cmd.Connection = new SqlConnection(connectionString);
            DataTable dt = new DataTable();
            SqlDataAdapter sda = new SqlDataAdapter(cmd);
            sda.Fill(dt);

            return dt.Rows.OfType<DataRow>().Select(row => row.ItemArray).ToArray();

            //return JsonConvert.SerializeObject(
            //    new
            //    {
            //        colunms = dt.Columns.OfType<DataColumn>().Select(column => column.ColumnName).ToArray(),
            //        dt = dt
            //    },
            //    new JsonSerializerSettings { StringEscapeHandling = StringEscapeHandling.EscapeNonAscii }
            //);
        }
    }
}
