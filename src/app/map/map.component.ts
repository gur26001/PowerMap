import { HttpClient } from '@angular/common/http';
import { Component,OnInit } from '@angular/core';
import * as L from 'leaflet';
import { GeoJSON, FeatureCollection, LineString } from 'geojson';//


@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})





export class MapComponent implements OnInit{

    private map!:L.Map;

    private minVol:number=-1;
    private maxVol:number=-2;
    
    private m_data:any;
    private m_geoJSONData:any;
     Voltages:number[]=[];//collections of all the voltages present in the data

     scaleRange:number=0;

    OverPassQueryGenerator(area:string,key:string,value:string){
      let query = `
      [out:json][timeout:90];
      area["name"="${area}"]->.searchArea;
        (
        way["${key}"="${value}"](area.searchArea);
      );
      out geom;
     `;
        return query;
  };

  

    private testCMD(){

      // image on particular
      L.imageOverlay('src/assests/mapImage.jpeg',[[51.5, -0.09],[51.49, -0.08]]).addTo(this.map);
      // point to region, below
      var circle = L.circle([51.508, -0.11], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 5
      }).addTo(this.map);


      // standlone popup:

      var popup = L.popup()
      .setLatLng([51.513, -0.09])
      .setContent("I am a standalone popup.")
      .openOn(this.map);
      
      // sample function
     
      function onMapClick(event:any) {
        alert("You clicked the map at " + event.latlng);
      }

      let popup2=L.popup();

      var onMapClick2=(event:any)=>{
        popup2.setLatLng(event.latlng).setContent("You clicked the map at" +  event.latlng.toString()).openOn(this.map);  //this is not working in normal map
      }
    
      this.map.on('click',onMapClick);
    
    
    
    }

  
    private initMap(){

      let centroid:L.LatLngExpression=[36,75];

      this.map=L.map('map',{
        center:centroid,
        zoom:13
      });

          // map base layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        attribution:'&copy; OpenStreetMap contributors'
      }).addTo(this.map);
    }
    

    private displayBoundary(element:any){
    
      const coordinates = element.members
      .filter((m: any) => m.geometry)
      .map((m: any) => m.geometry.map((point: any) => [point.lat, point.lon]));
    coordinates.forEach((poly: any) => {
      L.polygon(poly, { color: 'orange', weight: 6,fill:false }).addTo(this.map);
    });

    };
    // private geoJSONConverter(data:any):void{
        
    //   const geojson: FeatureCollection<LineString>= {
    //     type: 'FeatureCollection',
    //     features: data.elements.map((element: any) => {
    //       if (element.type === 'way' && element.tags['power'] === 'line') {
    //         return {
    //           type: 'Feature',
    //           properties: { type: 'tower', id: element.id, voltage:element.tags.voltage },
    //           geometry: {
    //             type: 'LineString',
    //             coordinates: [element.lon, element.lat]
    //           }
    //         };
    //       }
    //       return null;
    //     }).filter((feature: any) => feature !== null)
    //   };
        
    //   console.log("converted data",geojson);
    // }

    // private geoJSONDataDisplayer(geojson:any){
    //   L.geoJSON(geojson, {
    //     style: (feature) => {
    //       // Style for transmission line
    //       if (feature?.properties?.type === 'line') {
    //         return { color: 'blue', weight: 3 };
    //       }
    //       return {};
    //     },
    //     onEachFeature: (feature, layer) => {
    //       // Add popups or interactivity if needed
    //       const id = feature.properties?.id;
    //       layer.bindPopup(`ID: ${id}, Type: ${feature.properties?.type}, Voltage: ${feature.properties.voltage}`);
    //     }
    //   }).addTo(this.map);
    // }



      // Process and display Overpass API data on the map
   
   private chartTable(scale:number,minVolt:number,maxVolt:number){
        // Add a tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(this.map);
    
        // Add a custom control for descriptive board
        const infoControl = new L.Control({ position: 'topright' });
    
        infoControl.onAdd = function () {
          const div = L.DomUtil.create('div', 'info'); // Create a div element
          div.innerHTML = `
            <h4>Measurement Scale</h4>
            <table style="width: 200px; border: 1px solid black;">
              <tr>
                <th>Parameter</th>
                <th>Value</th>
              </tr>
              <tr>
                <td>Scale</td>
                <td>${scale}</td>
              </tr>
              <tr>
                <td>Minimum Voltage</td>
                <td>${minVolt}</td>
              </tr>
              <tr>
                <td>Maximum Voltage</td>
                <td>${maxVolt}</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
              </tr>
              tr>
                <td></td>
                <td></td>
              </tr>
            </table>
          `;
          return div;
        };
    
        infoControl.addTo(this.map); // Add the control to the map
   }
      private processOverpassData(data: any): void {

      // converting to geoJson data
        const geojson: FeatureCollection<LineString>= {
          type: 'FeatureCollection',
          features: data.elements.map((element: any) => {
            if (element.type === 'node' && element.tags['power'] === 'tower') {
              return {
                type: 'Feature',
                properties: { type: 'tower', id: element.id  },
                geometry: {
                  type: 'Point',
                  coordinates: [element.lon, element.lat]
                }
              };
            } else if (element.type === 'way' && element.tags['power'] === 'line') {
                
                if(element.tags?.voltage!= undefined){

                  let num= element.tags.voltage-0;
                  // console.log(typeof(num));

                  this.Voltages.push(num);     //extracting voltage property of each element into an array: ,after type conversioning from string to integer by -'0' from the value
                
                }
                

                return {
                  type: 'Feature',
                  properties: { type: 'line', id: element.id,"voltage":element.tags?.voltage },
                  geometry: {
                    type: 'LineString',
                    coordinates: element.geometry.map((point: any) => [point.lon, point.lat])
                  }
                };
            }
            else if (element.type === 'relation' && element.tags.boundary === 'administrative') {
   
              this.displayBoundary(element);
            }
            return null;

            }).filter((feature: any) => feature !== null)
          
        };

      console.log(geojson);//geojson data made
      
      this.m_geoJSONData=geojson;
      
      
      // this.Voltages.sort((a, b) => a - b); //arguments are required to be passed, else it will sort according to aplhabatically
    
      this.minVol= Math.min(...this.Voltages);
      this.maxVol= Math.max(...this.Voltages);

      // console.log(this.minVol,this.maxVol);

     //////////////////////////////////////////////////////////////////////////////////////////

      // Add GeoJSON to the map

      // we will add table in map for better representation
      
 
      this.scaleRange=100000;     //for range ,we are setting scale value


      L.geoJSON(geojson, {
        style: (feature) => {
          // Style for transmission line
          if (feature?.properties?.type === 'line') {
            // color for different slabs of voltage ranges
            
            // console.log(typeof(feature.properties.voltage));

            if(feature.properties.voltage!=undefined){


              let voltValue:number=feature.properties.voltage - 0;
              
              // console.log(typeof(voltValue) ,typeof(this.minVol) );

              // console.log(voltValue);
              if( (voltValue<(this.minVol + (1*this.scaleRange) ))  && (voltValue>=this.minVol) ){  //66000 to 166000
                // console.log("if");

                return { color: 'green', weight: 4 };
              }
              else if( (voltValue<(this.minVol + (2*this.scaleRange) )) && (voltValue>=(this.minVol + (1*this.scaleRange) ))  ){  //166000 to 266000
                // console.log("Elseif",1);
                return { color: 'yellow', weight: 4 };
              }
              else if( (voltValue<(this.minVol + (3*this.scaleRange) ))  && (voltValue>=(this.minVol + (2*this.scaleRange) ))  ){  //266000 to 366000
                // console.log("Elseif",2);
                return { color: 'orange', weight: 4 };
              }
              else if( (voltValue<(this.minVol + (4*this.scaleRange) )) && (voltValue>=(this.minVol + (3*this.scaleRange) ))  ){  //366000 to 466000
                // console.log("Elseif",3);
                return { color: 'red', weight: 4 };
              }
              else if((voltValue>(this.minVol + (4*this.scaleRange) ))){ //for out of range(more than range)
                return { color: 'skyblue', weight: 4 };
              }
            }
            
            return { color: 'blue', weight: 4}; //for minimal value(out of range)
          }
        
          return {};
        },
        pointToLayer: (feature, latlng) => {
          if (feature?.properties?.type === 'tower') {
            // Return the rectangle for towers
            return L.rectangle(
              [[latlng.lat - 0.001, latlng.lng - 0.001], [latlng.lat + 0.001, latlng.lng + 0.001]],
              { color: 'red', weight: 2, fillColor: 'yellow', fillOpacity: 0.5 }
            );
          }
          // Return `undefined` to skip non-tower features
          return L.marker(latlng, { opacity: 0 });
        },
        onEachFeature: (feature, layer) => {
          // Add popups or interactivity if needed

          const id = feature.properties?.id;
          layer.bindPopup(`ID: ${id}, Type: ${feature.properties?.type} ,Voltage : ${feature.properties?.voltage}`);
        }
      }).addTo(this.map);



      // showing chart table
      this.chartTable(this.scaleRange,this.minVol,this.maxVol);

    } 

    private async showData(){


      //representing towers as empty rectangles and trasmission line as blue line

      
      let area="Patiala";
      let key="power"; //for power line related queries
      let value="line"; //for exactly what we need related to power line 


      const overPassQuery= this.OverPassQueryGenerator(area,key,value);
      const overpassURL = 'https://overpass-api.de/api/interpreter';


      try {
        let result= await fetch(
          overpassURL,
          {
            method: "POST",
            body: "data="+ encodeURIComponent(
              `
                [out:json][timeout:90];
                area["name"="Patiala"]->.searchArea;
                  (
                  /*node["power"="tower"](area.searchArea);*/
                  way["power"="line"](area.searchArea);
                  relation["boundary"="administrative"]["admin_level"=5](area.searchArea);
                );
                out geom;
                `
            )
        }
        ).then((data)=>data.json());
  
        console.log(result);
        // console.log(JSON.stringify(result.elements,null,2));

        this.processOverpassData(result);

        // let geoJData=this.geoJSONConverter(result);

        // this.geoJSONDataDisplayer(geoJData);


        
        
      } catch (error) {
        console.log('Error in fetching Overpass API data : ',error);
      }



    }


    ngOnInit():void{
      this.initMap();    // creating map and showing it
 
     
      // this.testCMD();// test commands goes here on map
      this.showData(); // getting trasmission line data and representing it

    } 

}
