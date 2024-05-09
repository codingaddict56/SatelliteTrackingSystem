const exphbs  = require('express-handlebars');
const redis = require('redis');
const express = require('express');
const cors = require('cors');
const http = require('http');
const axios = require('axios');
const path = require('path');
const connectDB = require('./config/mongoosedatabase');
const SatelliteLocation = require('./models/SatelliteLocation');
const SatelliteHealth = require('./models/SatelliteHealth');
const Satellite = require('./models/Satellite');
const Collision = require('./models/Collision');
const socketIo = require('socket.io');
const { addSatellite, getAllSatellites,deleteAllSatellites, deleteSatellites, getSatellitesById, updateSatellites, relationalSatellites, collisionSatellites, getSatellitesByName, getAllcollisionSatellites } = require('./satellite_services');


const PORT = process.env.PORT || 8080;
const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

require('./crons')

const io = socketIo(server);



app.set('view engine', 'ejs');

let map_base_url = 'https://maps.googleapis.com/maps/api/elevation/json'

const redisClient = redis.createClient(6379,'127.0.0.1')

redisClient.connect()
connectDB()

redisClient.on('connect',(err)=>{
    console.log("Redis Database Connected")
})


let locationData = {}

let noradId = '59585'
let noradId1 = '25544'
let apiKey = 'QKG5P9-4CRWSH-EXCMYM-5951'

async function getTwoSatelliteInfo(){
    try {
        
        const apiUrl = `https://api.n2yo.com/rest/v1/satellite/positions/${noradId}/${locationData?.latitude}/${locationData?.longitude}/${locationData?.altitude}/1/&apiKey=${apiKey}`;
        const apiUrl1 = `https://api.n2yo.com/rest/v1/satellite/positions/${noradId1}/${locationData?.latitude}/${locationData?.longitude}/${locationData?.altitude}/1/&apiKey=${apiKey}`;
        const response = await axios.get(apiUrl);
        const response1 = await axios.get(apiUrl1);

        let data = response.data
        let data1 = response1.data

        if(data.info !== null){
        let key = data?.info?.satname + new Date().getTime()

        let passData = {
            
            name:data?.info?.satname,
            norad_id:data?.info?.satid,
            type:'satellite',
            orbit_type:"NA",
            international_designator:"NA",
            launch_date:"NA",
            orbital_elements:{
                semi_major_axis_km:"",
                eccentricity:"",
                inclination_deg:"",
                argument_of_periapsis_deg:"",
                longitude_of_ascending_node_deg:"",
                mean_anomaly_deg:"",
            },
            position:{
                x:10000,
                y:0,
                z:0,
                satlatitude:data?.positions[0]?.satlatitude,
                satlongitude:data?.positions[0]?.satlongitude,
                sataltitude:data?.positions[0]?.sataltitude,
                azimuth:data?.positions[0]?.azimuth,
                elevation:data?.positions[0]?.elevation,
                ra:data?.positions[0]?.ra,
                dec:data?.positions[0]?.dec,
                timestamp:new Date(data?.positions[0]?.timestamp).toISOString(),
                eclipsed:data?.positions[0]?.eclipsed,
            }
        }

        let passData1 = {
            
            name:data1?.info?.satname,
            norad_id:data1?.info?.satid,
            type:'satellite',
            orbit_type:"NA",
            international_designator:"NA",
            launch_date:"NA",
            orbital_elements:{
                semi_major_axis_km:"",
                eccentricity:"",
                inclination_deg:"",
                argument_of_periapsis_deg:"",
                longitude_of_ascending_node_deg:"",
                mean_anomaly_deg:"",
            },
            position:{
                x:13000,
                y:0,
                z:0,
                satlatitude:data1?.positions[0]?.satlatitude,
                satlongitude:data1?.positions[0]?.satlongitude,
                sataltitude:data1?.positions[0]?.sataltitude,
                azimuth:data1?.positions[0]?.azimuth,
                elevation:data1?.positions[0]?.elevation,
                ra:data1?.positions[0]?.ra,
                dec:data1?.positions[0]?.dec,
                timestamp:new Date(data1?.positions[0]?.timestamp).toISOString(),
                eclipsed:data1?.positions[0]?.eclipsed,
            },
            moment_enabled:true
        }


       let responseSatellite1 = await Satellite.create(passData)
       let responseSatellite2;
       if(responseSatellite1){
        passData1['relational_satellite'] = [responseSatellite1?._id]
        responseSatellite2 = await Satellite.create(passData1)
       }

        // SaveDataToRedis('satellite_data', passData)
        return [responseSatellite1,responseSatellite2];
       }else{
        console.log("Limit Exceeded")
        return {
            
        }
       }
    } catch (error) {
        return null;
    }
}

async function getCurrentPosition() {
    try {
        
        const apiUrl = `https://api.n2yo.com/rest/v1/satellite/positions/${noradId}/${locationData?.latitude}/${locationData?.longitude}/${locationData?.altitude}/1/&apiKey=${apiKey}`;
        const response = await axios.get(apiUrl);

        let data = response.data

        if(data.info !== null){
        let key = data?.info?.satname + new Date().getTime()

        let passData = {
            info:{
                satname:data?.info?.satname,
                satid:data?.info?.satid,
                transactionscount:data?.info?.transactionscount,
            },
            positions:{
                satlatitude:data?.positions[0]?.satlatitude,
                satlongitude:data?.positions[0]?.satlongitude,
                sataltitude:data?.positions[0]?.sataltitude,
                azimuth:data?.positions[0]?.azimuth,
                elevation:data?.positions[0]?.elevation,
                ra:data?.positions[0]?.ra,
                dec:data?.positions[0]?.dec,
                timestamp:new Date(data?.positions[0]?.timestamp).toISOString(),
                eclipsed:data?.positions[0]?.eclipsed,
            },
            user_location:{
                ...locationData
            }
        }


        await SatelliteLocation.create(passData)
        redisClient.set(key,JSON.stringify(passData))
        redisClient.set("recent_data",key)
        // SaveDataToRedis('satellite_data', passData)
        return passData;
       }else{
        console.log("Limit Exceeded")
        return {
            
        }
       }
    } catch (error) {
        return null;
    }
}  
// satellite position
app.get('/satellite_position_detail',async(req, res, next) => {
    try{
        console.log()
       let key = await redisClient.get("recent_data")
       let data = await redisClient.get(key)
       console.log("data here",JSON.parse(data))
       res.render('satellite_position_detail',JSON.parse(data))
          
    }
    catch(e){
        console.log("err anna",e)
    }
})

app.get('/satellite_position_home',async(req, res, next) => {
    try{
        await  axios.get("http://ipinfo.io/json")
        .then(async(response) => {
          let data = response.data
          const { loc } = response.data;
          const [latitude, longitude] = loc.split(",");
          return await axios.get(`${map_base_url}?locations=${latitude},${longitude}&key=AIzaSyBmoP0njHe6YMjbWNaPHZDWWdRpWhJAjIw`)
          .then(response => {
              const altitude = response.data.results[0].elevation;
              let sendData = {latitude:latitude,longitude:longitude,altitude:altitude,...data}
              locationData = sendData
              getCurrentPosition()
              res.render('satellite_position_home',sendData)
            })
          .catch(error => {
          });
        })
        .catch(error => {
        });
    }
    catch(e){
        console.log("err anna",e)
    }
})

// satellite health
app.use('/satellites_health_home',async(req, res, next) => {
    res.render('satellite_health_home')
})

app.use('/satellites_health_search/:search_text',async(req, res, next) => {
    let search = req.params.search_text
    console.log("search",search)
    const response = await SatelliteHealth.find({"info.satname": {$regex: search, '$options': 'i'}})
    console.log("response",response)
    res.render('search',{response});
})

// satellite object visualization and analysis 
app.post('/satellites', async (req, res) => {
    try {
      let response = await addSatellite(req.body);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add satellite' });
    }
});
  
app.delete('/satellites/:id', async (req, res) => {
    try {
    let response = await deleteSatellites(req.params.id);
    res.json(response);
    } catch (error) {
    console.error('Error deleteing satellite:', error);
    res.status(500).json({ error: 'Failed to delete satellite' });
    }
});

app.put('/satellites/:id', async (req, res) => {
    try {
    let response = await updateSatellites(req.params.id,req.body);
    res.json(response);
    } catch (error) {
    console.error('Error updating satellite:', error);
    res.status(500).json({ error: 'Failed to update satellite' });
    }
});  

app.get('/get_satellites', async (req, res) => {
    try {
        let response = await getAllSatellites();
        res.json(response);
    } catch (error) {
        console.error('Error getting satellite:', error);
        res.status(500).json({ error: 'Failed to get satellite' });
    }
});

app.get('/satellites/:search_text', async (req, res) => {
try {
    let search = req.params.search_text
    let response = await getSatellitesByName(search);
    res.render('object_visulization_search',{response})
    } catch (error) {
    console.error('Error getting satellite:', error);
    res.status(500).json({ error: 'Failed to get satellite' });
    }
});

app.get('/related_satellites', async (req, res) => {
    try {
        let response = await relationalSatellites();
        res.json(response);
    } catch (error) {
        console.error('Error getting satellite:', error);
        res.status(500).json({ error: 'Failed to get satellite' });
    }
});

app.get('/collision_satellites', async (req, res) => {
    try {
        let response = await collisionSatellites();
        res.json(response);
    } catch (error) {
        console.error('Error getting satellite:', error);
        res.status(500).json({ error: 'Failed to get satellite' });
    }
});

app.use('/related_satellites_list',async (req, res) => {
    try {
        let response = await relationalSatellites();
        res.render('relational',{response})
    } catch (error) {
        console.error('Error getting satellite:', error);
        res.status(500).json({ error: 'Failed to get satellite' });
    }
})

app.use('/collision_satellites_list',async (req, res) => {
    try {
        let response = await getAllcollisionSatellites();
        res.render('object_visulization_collision',{response})
    } catch (error) {
        console.error('Error getting satellite:', error);
        res.status(500).json({ error: 'Failed to get satellite' });
    }
})
  
app.use('/create',async (req, res) => {
      try {
          let response = await getAllSatellites();
          res.render('create',{response})
        } catch (error) {
          console.error('Error getting satellite:', error);
          res.status(500).json({ error: 'Failed to get satellite' });
        }
})
  
app.use('/update/:id',async (req, res) => {
      try {
          let response = await getSatellitesById(req.params.id);
          let response1 = await getAllSatellites();
          res.render('update',{response,response1})
        } catch (error) {
          console.error('Error getting satellite:', error);
          res.status(500).json({ error: 'Failed to get satellite' });
        }
})
  
app.use('/satellites_object_visualization_analysis',async (req, res) => {
      try { 
          let response1 = await deleteAllSatellites()
          let response = await getTwoSatelliteInfo();
          res.render('object_visualization_home',{response})
        } catch (error) {
          console.error('Error getting satellite:', error);
          res.status(500).json({ error: 'Failed to get satellite' });
        }
})

app.use('',async(req, res, next) => {
    res.render('home')
})

function calculateDistance(point1, point2) {

    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = point1.z - point2.z;
   
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }

    io.on('connection', async(socket) => {
        console.log('A client connected');
        
        // logic for satellite position 
        socket.on('satellite_position_update_connection',async()=>{
        setInterval(async() => {
        let response = await getCurrentPosition()
            io.emit('satellite_location',response)
        }, 1000);
        })

        // logic for satellite health
        socket.on('satellite_health_update_connection',async()=>{
            await axios.get('http://localhost:3000/datas').
            then(async(response)=>{
            //  console.log("response",response.data)
            let datas = response.data
            let i = 0
        
        
            for (let i = 0; i < datas.length; i += 1) {
                const sectionData = datas[i];
                let savedData = await SatelliteHealth.create(sectionData)
                io.emit('satellite_health_update', savedData);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Adjust delay as needed
            }
            })  
        })

        // logic for collision analysis
        socket.on('satellite_collision_connection', function(data) {
        console.log("triggered") 
            setInterval(async() => {
                let satellite = await Satellite.aggregate([
                
                    { 
                        $match:{
                            moment_enabled:true
                        }
                    },
                    {
                        $lookup:{
                        from:'satellites',
                        localField:'relational_satellite',
                        foreignField:'_id',
                        as:'relational_satellite'
                        }
                    },
                    {
                        $unwind:{
                        path:"$relational_satellite",
                        preserveNullAndEmptyArrays:true
                        },
                    }
                ])

            
                const collisionThreshold = 1000;
            
                const collisionSatellitesArr = []
                satellite.forEach(async(s)=>{
                    const distance = calculateDistance(s?.position, s.relational_satellite.position);  
                    if(distance < collisionThreshold){
                        let priority = ['High','Low','Medium']
                        let selectedPriority = ''
                        if(distance <= 1000){
                        
                            if(distance > 850){
                                selectedPriority = priority[1]
                            }else if(distance > 500 && distance < 850){
                                selectedPriority = priority[2]
                            }else{
                                selectedPriority = priority[0]
                                await Satellite.findByIdAndUpdate(s?._id,{moment_enabled:false})
                            }
            
            
                            let obj = {satellite1:s?._id,satellite2:s?.relational_satellite?._id,distance:distance,selectedPriority,createdAt:new Date().toISOString()}
                            let obj1 = {satellite1:s,satellite2:s?.relational_satellite,distance:distance,selectedPriority,createdAt:new Date().toISOString()}
            
                            // console.log("obj",obj)
                            await Collision.create(obj)
                            io.emit('satellite_collision',obj1)
            
                            collisionSatellitesArr.push(obj)
                        }        
                    }
                })
                }, 10000);
        })   
    
        
    });



server.listen(PORT, () => {
    console.log(`Server is connected on ${PORT}`)
});

